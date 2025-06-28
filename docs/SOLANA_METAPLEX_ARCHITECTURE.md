# Solana/Metaplex Integration Architecture

## NFT Minting & Blockchain Integration

This diagram details the Solana blockchain integration using Metaplex Core for NFT creation with hybrid metadata storage.

```mermaid
flowchart TD
    A[API Route: mintWorkNFT/createOrganizationAsset] --> B[Initialize UMI Instance]
    B --> C{Check Server Wallet}
    C -->|Configured| D[Create UMI with Server Keypair]
    C -->|Missing| E[Throw Configuration Error]
    
    D --> F[Generate Asset Signer]
    F --> G[Create On-Chain Attributes]
    
    G --> H{Work Type?}
    H -->|Individual| I[Create Standalone Asset]
    H -->|Organization| J[Create Collection Asset]
    
    subgraph "On-Chain Attribute Creation"
        G --> G1[Process Work Data]
        G1 --> G2[Create Core Attributes]
        G2 --> G3[JSON Encode Contributors]
        G3 --> G4[Create Royalty Distribution]
        G4 --> G5[Add Metadata Fields]
    end
    
    subgraph "Individual Asset Path"
        I --> I1[createV1 Instruction]
        I1 --> I2[Set Owner Address]
        I2 --> I3[Add Attributes Plugin]
        I3 --> I4[Sign with Server Wallet]
        I4 --> I5[Send Transaction]
    end
    
    subgraph "Organization Collection Path"
        J --> J1[Fetch Collection Data]
        J1 --> J2[Verify Collection Exists]
        J2 --> J3[createV1 with Collection]
        J3 --> J4[Add Collection Context]
        J4 --> J5[Include Organization Attributes]
        J5 --> J6[Sign & Send Transaction]
    end
    
    I5 --> K[Transaction Confirmation]
    J6 --> K
    K --> L[Store Metadata in Database]
    L --> M[Return Asset Details]
    
    subgraph "Hybrid Metadata Storage"
        N[Core Metadata] --> N1[On-Chain via Attributes Plugin]
        N1 --> N2[Stored in Asset Attributes]
        
        O[Extended Metadata] --> O1[Off-Chain via URI Reference]
        O1 --> O2[API Endpoint /api/metadata/workId]
        O2 --> O3[Backup in Database JSON Field]
        
        P[Database Storage] --> P1[Full Work Details]
        P1 --> P2[Contributor Relationships]
        P2 --> P3[Organization Relationships]
        P3 --> P4[Query Optimization]
    end
    
    style I1 fill:#e1f5fe
    style J3 fill:#e8f5e8
    style N1 fill:#fff3e0
    style O1 fill:#f3e5f5
    style P1 fill:#e0f2f1
```

## Detailed Component Analysis

### 1. UMI Instance Configuration
```typescript
// Located in: src/lib/solana-server.ts:38-47
export function createUmiInstance(): Umi {
  const umi = createUmi(SOLANA_RPC_URL).use(mplCore())
  
  if (SERVER_KEYPAIR) {
    const umiKeypair = fromWeb3JsKeypair(SERVER_KEYPAIR)
    umi.use(keypairIdentity(umiKeypair))
  }
  
  return umi
}
```

### 2. On-Chain Attribute Structure
```typescript
// Located in: src/lib/solana-server.ts:52-97
export function createOnChainAttributes(workData: {
  title: string
  isrc?: string
  contributors: Array<{name: string, wallet: string, share: number}>
  workId: string
  description?: string
}): Attribute[] {
  return [
    { key: 'title', value: workData.title },
    { key: 'isrc', value: workData.isrc || 'Not specified' },
    { key: 'work_id', value: workData.workId },
    { key: 'contributors_count', value: workData.contributors.length.toString() },
    { key: 'total_shares', value: '100' },
    { key: 'type', value: 'Intellectual Property' },
    { key: 'category', value: 'Music' },
    { key: 'contributors_data', value: JSON.stringify(workData.contributors) },
    { key: 'royalty_distribution', value: JSON.stringify(/* royalty data */) }
  ]
}
```

### 3. NFT Creation Flows

#### Individual Asset Creation
```mermaid
sequenceDiagram
    participant API as API Route
    participant UMI as UMI Instance
    participant MPL as Metaplex Core
    participant SOL as Solana Network

    API->>UMI: createV1 instruction
    UMI->>MPL: Configure asset parameters
    MPL->>MPL: Add Attributes Plugin
    MPL->>UMI: Generate transaction
    UMI->>SOL: Send transaction with server signature
    SOL-->>API: Asset ID & transaction signature
```

#### Organization Collection Asset
```mermaid
sequenceDiagram
    participant API as API Route
    participant UMI as UMI Instance
    participant MPL as Metaplex Core
    participant COL as Collection
    participant SOL as Solana Network

    API->>UMI: Fetch collection data
    UMI->>COL: Verify collection exists
    COL-->>UMI: Collection verified
    API->>UMI: createV1 with collection reference
    UMI->>MPL: Configure asset with collection
    MPL->>MPL: Add enhanced attributes
    MPL->>UMI: Generate transaction
    UMI->>SOL: Send transaction
    SOL-->>API: Asset ID in collection
```

## Hybrid Metadata Architecture

### On-Chain Storage (Metaplex Core Attributes)
**Advantages:**
- Permanent, immutable storage
- Direct blockchain verification
- No external dependencies
- Gas-efficient for core data

**Data Stored:**
- Work title and ISRC
- Contributor count and shares
- Work type and category
- Encoded contributor/royalty data

### Off-Chain Storage (API + Database)
**Advantages:**
- Large data capacity
- Fast query performance
- Updatable descriptions/images
- Complex relational data

**Data Stored:**
- Extended metadata (descriptions, images)
- Database relationships
- Caching and performance optimization
- Backup of on-chain data

## Transaction Flow Analysis

```mermaid
graph LR
    A[User Request] --> B[Server Validation]
    B --> C[UMI Setup]
    C --> D[Asset Generation]
    D --> E[Attribute Creation]
    E --> F[Transaction Building]
    F --> G[Server Signing]
    G --> H[Network Submission]
    H --> I[Confirmation Wait]
    I --> J[Database Update]
    J --> K[User Response]
    
    subgraph "On-Chain Operations"
        F
        G
        H
        I
    end
    
    subgraph "Off-Chain Operations"
        A
        B
        J
        K
    end
```

## Key Integration Points

### 1. Server Wallet Management
- **Security**: Private key stored in environment variables
- **Functionality**: Signs all transactions server-side
- **UX Benefit**: No user wallet interaction required
- **Location**: `src/lib/solana-server.ts:27-33`

### 2. Collection vs Asset Creation
- **Collections**: Represent organizations/publishers
- **Assets**: Individual IP works, optionally in collections
- **Membership**: Tracked via on-chain collection attributes
- **Location**: `src/lib/solana-server.ts:534-857`

### 3. Attribute Plugin Usage
- **Plugin Type**: Metaplex Core Attributes Plugin
- **Purpose**: Store structured metadata on-chain
- **Encoding**: JSON strings for complex data structures
- **Retrieval**: Direct blockchain queries or cached database

### 4. Error Handling & Recovery
- **Graceful Degradation**: Work saved even if minting fails
- **Retry Logic**: User can retry minting later
- **Database Backup**: Full metadata stored off-chain
- **Transaction Monitoring**: Confirmation waiting with timeouts

## Performance Considerations

### Transaction Costs
- **Asset Creation**: ~0.001-0.01 SOL per NFT
- **Attribute Storage**: Minimal additional cost
- **Collection Assets**: Similar to individual assets

### Network Efficiency
- **Batch Operations**: Multiple attributes in single transaction
- **Optimized RPC**: Configured for devnet/mainnet
- **Confirmation Strategy**: 'confirmed' commitment level

### Caching Strategy
- **Database Mirrors**: Full work data cached off-chain
- **API Endpoints**: Fast metadata retrieval
- **Asset Queries**: Cached collection membership