# IP OnChain - Register Work Flow Architecture

## Complete Register Work Flow Architecture

This diagram shows the end-to-end flow of registering intellectual property works as NFTs with hybrid on-chain/off-chain storage.

```mermaid
sequenceDiagram
    participant User as User Interface
    participant Auth as Privy Auth
    participant API as API Route (/api/works/register)
    participant Repo as Repository Layer
    participant DB as Supabase Database
    participant Solana as Solana/Metaplex
    participant IPFS as Metadata Storage

    Note over User,IPFS: 1. User Registration Form Submission
    User->>API: POST work registration data
    Note right of User: {title, isrc, contributors[], <br/>description, imageUrl, organizationId}

    Note over User,IPFS: 2. Authentication & Authorization
    API->>Auth: Verify Bearer token
    Auth-->>API: Verified user claims
    API->>Auth: Get user Solana wallet
    Auth-->>API: User wallet address

    Note over User,IPFS: 3. User Database Operations
    API->>Repo: UserRepository.upsertUserByPrivyId()
    Repo->>DB: Upsert user record
    DB-->>Repo: Database user with UUID
    Note right of DB: Converts Privy ID to UUID<br/>for database operations

    Note over User,IPFS: 4. Validation Layer
    API->>API: Validate ISRC format
    API->>API: Validate contributor shares = 100%
    API->>API: Validate wallet addresses
    API->>Repo: Check ISRC uniqueness
    Repo->>DB: Query existing works
    DB-->>API: ISRC availability

    Note over User,IPFS: 5. Organization Validation (if applicable)
    alt Organization Work
        API->>Repo: OrganizationRepository.findById()
        Repo->>DB: Query organization
        DB-->>Repo: Organization data
        API->>Repo: Check user membership
        Repo->>DB: Query organization_members
        DB-->>API: Membership confirmed
    end

    Note over User,IPFS: 6. Database Work Creation
    API->>Repo: WorkRepository.createWork()
    Repo->>DB: INSERT work record
    DB-->>Repo: Work with generated ID
    API->>Repo: ContributorRepository.createMultipleContributors()
    Repo->>DB: INSERT contributors
    DB-->>API: Contributors created

    Note over User,IPFS: 7. Metadata Preparation
    API->>API: createWorkMetadata()
    Note right of API: Splits metadata:<br/>- Core (on-chain)<br/>- Extended (off-chain)
    API->>IPFS: createMetadataReference()
    IPFS-->>API: Metadata URI
    API->>Repo: Update work with metadata URI
    Repo->>DB: UPDATE works.metadata_uri

    Note over User,IPFS: 8. NFT Minting Decision
    alt Organization Collection
        API->>Solana: createOrganizationAsset()
        Note right of Solana: Mint as part of<br/>organization collection
    else Individual Work
        API->>Solana: mintWorkNFT()
        Note right of Solana: Mint as standalone asset
    end

    Note over User,IPFS: 9. Blockchain Transaction
    Solana->>Solana: Generate UMI instance
    Solana->>Solana: Create on-chain attributes
    Solana->>Solana: Create Metaplex Core asset
    Solana-->>API: Asset ID & transaction signature

    Note over User,IPFS: 10. Final Database Update
    API->>Repo: Update work with NFT mint address
    Repo->>DB: UPDATE works.nft_mint_address
    DB-->>API: Updated work record

    Note over User,IPFS: 11. Response to User
    API-->>User: Success response with work & NFT data
    Note right of User: {work: {...}, nft: {assetId, signature, <br/>explorerUrl, onChainAttributes}}
```

## Key Architecture Components

### 1. Hybrid Storage Strategy
- **On-Chain**: Core metadata (title, ISRC, contributors) via Metaplex Core Attributes Plugin
- **Off-Chain**: Extended metadata (description, images) via metadata URI pointing to API endpoint
- **Database**: Full work details, relationships, and caching for fast queries

### 2. Authentication Flow
- Privy JWT token verification in API routes
- Critical user ID conversion: `Privy ID (did:privy:...) → Database UUID`
- Organization membership validation for collaborative works

### 3. Data Validation Layers
- **Client-side**: React Hook Form with Zod schema validation
- **API-side**: ISRC format, contributor shares totaling 100%, wallet address validation
- **Database-side**: Foreign key constraints, unique indexes

### 4. NFT Minting Paths
- **Individual Works**: Direct Metaplex Core asset creation
- **Organization Works**: Asset creation within organization collection
- **Server-side Signing**: All transactions signed by server wallet for simplified UX

## Data Flow Highlights

### On-Chain Data (Stored in NFT Attributes)
```typescript
// Example on-chain attributes stored in Metaplex Core
{
  title: "Song Title",
  isrc: "USRC17607839",
  work_id: "uuid-work-id",
  contributors_count: "2",
  contributors_data: '[{"name":"Artist","wallet":"...","share":60}]',
  royalty_distribution: '[{"recipient":"...","share_percentage":60}]',
  type: "Intellectual Property",
  category: "Music"
}
```

### Off-Chain Data (Database + Metadata URI)
- Work relationships (organization_id, created_by_user_id)
- Extended metadata (descriptions, images, external URLs)
- Query optimization indexes for fast dashboard loading
- Audit trails and timestamps

## Error Handling Strategy

1. **Graceful Degradation**: Work is saved to database even if NFT minting fails
2. **Retry Capability**: Users can retry NFT minting for saved works
3. **Transaction Atomicity**: Database operations are wrapped in transactions
4. **User Feedback**: Clear error messages with actionable steps

## Security Considerations

- Server wallet private key secured via environment variables
- All database operations use parameterized queries
- Organization membership verified before allowing work registration
- ISRC uniqueness enforced at database level