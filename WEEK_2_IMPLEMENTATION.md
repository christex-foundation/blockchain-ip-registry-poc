# Week 2 Implementation: Work Registration & NFT Minting

## Overview

This implementation focuses on Week 2 of the project guide, delivering a comprehensive work registration system with NFT minting using the latest Metaplex Core standard. The solution uses server-side minting, hybrid metadata storage, and Privy wallet abstraction.

## Key Features Implemented

### ✅ Work Registration UI

- **React Hook Form Integration**: Professional form handling with validation
- **Dynamic Contributors Management**: Add/remove contributors with automatic share validation
- **Real-time Validation**: Ensures shares total exactly 100%
- **Responsive Design**: Mobile-friendly interface with proper error handling

### ✅ Server-Side NFT Minting

- **Metaplex Core Integration**: Using the latest MPL Core standard for NFTs
- **Server Wallet Signing**: Abstracts wallet complexity from users
- **On-Chain Metadata**: Hybrid approach storing core data on Solana blockchain
- **Automatic Asset Creation**: Creates Core Assets with proper ownership

### ✅ Hybrid Metadata Storage

- **On-Chain Core Data**: Essential metadata stored directly on Solana
- **Off-Chain Extended Data**: Detailed metadata accessible via API endpoint
- **Metadata Linking**: Links on-chain NFTs to off-chain detailed information
- **CORS-Enabled API**: Metadata accessible by external applications

## Architecture Decisions

### 1. Server-Side Minting Approach

**Why Server-Side?**

- Eliminates user wallet signing complexity
- Enables gas fee abstraction
- Provides consistent minting experience
- Allows for enterprise-grade error handling

**Implementation:**

```typescript
// Server keypair for signing transactions
const SERVER_KEYPAIR = process.env.SERVER_WALLET_PRIVATE_KEY
  ? Keypair.fromSecretKey(new Uint8Array(JSON.parse(process.env.SERVER_WALLET_PRIVATE_KEY)))
  : null

// UMI instance with server identity
export function createUmiInstance(): Umi {
  const umi = createUmi(SOLANA_RPC_URL).use(mplCore())

  if (SERVER_KEYPAIR) {
    const umiKeypair = fromWeb3JsKeypair(SERVER_KEYPAIR)
    umi.use(keypairIdentity(umiKeypair))
  }

  return umi
}
```

### 2. Hybrid Metadata Storage

**On-Chain Data (Core NFT):**

- Work title
- Metadata URI reference
- Owner address
- Asset ID

**Off-Chain Data (API Endpoint):**

- Detailed work information
- Contributor details and shares
- ISRC and copyright information
- Royalty distribution data

**Benefits:**

- Cost-effective (minimal on-chain storage)
- Flexible metadata structure
- Easy updates and queries
- Standards compliant

### 3. Metaplex Core vs Legacy Token Metadata

**Why Metaplex Core?**

- Single account design (more efficient)
- Native plugins support
- Reduced complexity vs Token Metadata Program
- Better performance and lower costs
- Future-proof architecture

**Implementation Comparison:**

```typescript
// Old Token Metadata approach (complex)
// - Mint Account
// - Token Account
// - Metadata Account
// - Master Edition Account

// New Core approach (simple)
const createInstruction = create(umi, {
  asset,
  name: metadata.name,
  uri: metadataUri,
  owner: toUmiPublicKey(ownerAddress),
})
```

## Component Architecture

### 1. Registration Form (`/app/register-work/page.tsx`)

**Features:**

- Zod schema validation
- Dynamic contributor management
- Real-time share calculation
- Comprehensive error handling
- Success state management

**Key Validations:**

```typescript
const workRegistrationSchema = z
  .object({
    title: z.string().min(1, 'Work title is required'),
    isrc: z.string().optional(),
    contributors: z.array(contributorSchema).min(1, 'At least one contributor is required'),
  })
  .refine(
    (data) => {
      const totalShares = data.contributors.reduce((sum, contributor) => sum + contributor.share, 0)
      return Math.abs(totalShares - 100) < 0.01
    },
    {
      message: 'Total contributor shares must equal 100%',
      path: ['contributors'],
    },
  )
```

### 2. Registration API (`/api/works/register/route.ts`)

**Flow:**

1. Token verification via Privy
2. User wallet retrieval
3. Data validation
4. Database record creation
5. Metadata generation
6. NFT minting
7. Database updates
8. Response with transaction details

**Error Handling:**

- Graceful fallback if minting fails
- Work data preserved even on NFT failure
- Detailed error reporting
- Transaction retry capability

### 3. Metadata API (`/api/metadata/[workId]/route.ts`)

**Features:**

- Dynamic metadata generation
- CORS support for cross-origin access
- Caching headers for performance
- Standards-compliant JSON structure

## Environment Setup

### Required Environment Variables

```bash
# Solana Configuration
SOLANA_RPC_URL=https://api.devnet.solana.com

# Server Wallet (for signing transactions)
SERVER_WALLET_PRIVATE_KEY='[1,2,3,...]'  # Array format of private key

# Privy Configuration
NEXT_PUBLIC_PRIVY_APP_ID=your_privy_app_id
PRIVY_APP_SECRET=your_privy_app_secret

# Application Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Generating Server Wallet

```bash
# Generate new keypair
solana-keygen new --outfile server-wallet.json

# Convert to environment variable format
node -e "
const fs = require('fs');
const keypair = JSON.parse(fs.readFileSync('server-wallet.json'));
console.log(JSON.stringify(Array.from(keypair)));
"
```

## Database Schema Updates

The implementation works with the existing database schema but stores additional metadata references:

```sql
-- Works table stores metadata URI pointing to our API
UPDATE works SET
  metadata_uri = 'http://localhost:3000/api/metadata/123',
  nft_mint_address = 'asset_id_from_metaplex_core'
WHERE id = 123;
```

## API Endpoints

### POST `/api/works/register`

- Registers new IP work
- Mints Metaplex Core NFT
- Returns work and NFT details

**Request:**

```json
{
  "title": "My Song",
  "isrc": "USUM71234567",
  "description": "A beautiful song",
  "contributors": [
    {
      "name": "Artist",
      "walletAddress": "wallet_address_here",
      "share": 100
    }
  ]
}
```

**Response:**

```json
{
  "success": true,
  "work": {
    "id": 123,
    "title": "My Song",
    "mintAddress": "asset_id"
    // ... other fields
  },
  "nft": {
    "assetId": "asset_id",
    "signature": "transaction_signature",
    "explorerUrl": "https://explorer.solana.com/..."
  }
}
```

### GET `/api/metadata/[workId]`

- Returns detailed metadata for a work
- Used by NFT marketplaces and wallets
- CORS-enabled for external access

## Testing Strategy

### Unit Tests

- Form validation logic
- Metadata generation functions
- Server-side minting logic

### Integration Tests

- End-to-end registration flow
- API endpoint functionality
- Database operations

### Manual Testing

- Form interaction and validation
- NFT creation on devnet
- Metadata retrieval

## Future Enhancements

### Week 3 Preparation

- Royalty distribution implementation
- Smart contract integration
- Batch operations

### Additional Features

- Image upload and IPFS storage
- Multiple work types support
- Advanced royalty models
- Analytics and reporting

## Security Considerations

### Server Wallet Protection

- Private key stored securely
- Limited permissions
- Regular key rotation
- Access logging

### API Security

- Rate limiting implementation
- Input validation
- CORS configuration
- Error message sanitization

## Performance Optimizations

### Frontend

- Form validation debouncing
- Optimistic UI updates
- Error boundary implementation
- Loading state management

### Backend

- Connection pooling
- Transaction batching
- Metadata caching
- Database indexing

## Deployment Notes

### Devnet Deployment

1. Configure environment variables
2. Deploy to staging environment
3. Test all flows thoroughly
4. Monitor transaction success rates

### Mainnet Considerations

- Use mainnet RPC endpoints
- Implement proper error handling
- Set up monitoring and alerting
- Plan for gas fee management

## Troubleshooting

### Common Issues

**NFT Minting Fails:**

- Check server wallet balance
- Verify RPC endpoint connectivity
- Validate metadata format
- Review transaction logs

**Metadata API Issues:**

- Verify CORS configuration
- Check database connectivity
- Validate work ID format
- Review error logs

**Form Validation Problems:**

- Check share calculations
- Validate wallet addresses
- Verify required fields
- Test with different inputs

## Conclusion

This Week 2 implementation successfully delivers a production-ready work registration system with modern NFT minting capabilities. The hybrid metadata approach provides flexibility while maintaining blockchain immutability, and the server-side minting ensures a smooth user experience.

The architecture is designed to scale for Week 3's royalty distribution features while maintaining the security and performance characteristics required for a commercial IP management platform.
