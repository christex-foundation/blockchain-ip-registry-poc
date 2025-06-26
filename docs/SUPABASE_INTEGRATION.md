# Supabase Integration - IP OnChain Platform

## Overview

We have successfully integrated Supabase as the off-chain data storage solution for the IP OnChain platform. This integration provides a robust database foundation while maintaining the on-chain operations for NFT minting and royalty distribution.

## Database Schema

The platform uses the following database structure in the `ip-onchain` Supabase project:

### Tables

#### `users`

- `id` (UUID, Primary Key)
- `privy_user_id` (VARCHAR, Unique) - Links to Privy authentication
- `email` (VARCHAR, Nullable)
- `embedded_wallet_address` (VARCHAR, Nullable) - Solana wallet address from Privy
- `created_at` (TIMESTAMP)

#### `works`

- `id` (UUID, Primary Key)
- `title` (VARCHAR, Required) - Name of the IP work
- `isrc` (VARCHAR, Unique, Nullable) - International Standard Recording Code
- `total_shares` (INTEGER, Default: 100) - Total percentage shares
- `nft_mint_address` (VARCHAR, Nullable) - Solana NFT mint address
- `metadata_uri` (TEXT, Nullable) - Metadata URI (can be IPFS or API endpoint)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

#### `contributors`

- `id` (UUID, Primary Key)
- `work_id` (UUID, Foreign Key → works.id)
- `name` (VARCHAR, Required) - Contributor name
- `wallet_address` (VARCHAR, Required) - Solana wallet address
- `royalty_share` (INTEGER, Required) - Percentage share (0-100)
- `created_at` (TIMESTAMP)

#### `royalty_distributions`

- `id` (UUID, Primary Key)
- `work_id` (UUID, Foreign Key → works.id)
- `total_amount` (BIGINT, Required) - Amount in lamports
- `transaction_signature` (VARCHAR, Nullable) - Solana transaction signature
- `status` (VARCHAR, Default: 'pending') - pending, processing, completed, failed
- `created_at` (TIMESTAMP)

## Implementation Details

### Repository Layer (SOLID Principles)

Following the Single Responsibility Principle, we created focused repository classes:

#### `UserRepository` (`src/lib/repositories/user-repository.ts`)

- User CRUD operations
- Privy user ID management
- Wallet address updates

#### `WorkRepository` (`src/lib/repositories/work-repository.ts`)

- Work registration and management
- ISRC validation
- NFT mint address tracking
- Metadata URI management
- Join queries with contributors

#### `ContributorRepository` (`src/lib/repositories/contributor-repository.ts`)

- Contributor management per work
- Royalty share validation
- Bulk contributor creation

#### `RoyaltyRepository` (`src/lib/repositories/royalty-repository.ts`)

- Royalty distribution tracking
- Status management
- Transaction signature storage
- Distribution analytics

### API Integration

Updated all API routes to use Supabase:

#### `/api/works/register` (POST)

- Creates work record in database
- Validates ISRC uniqueness
- Creates multiple contributors
- Uploads metadata to IPFS
- Returns structured work data with contributors

#### `/api/works/list` (GET)

- Fetches all works with contributors
- Returns formatted data for UI consumption
- Includes mint status and metadata

#### `/api/royalties/distribute` (POST)

- Validates work existence and contributor shares
- Creates distribution record
- Calculates per-contributor amounts
- Simulates transaction execution
- Updates distribution status

### Configuration

#### Supabase Client (`src/lib/supabase.ts`)

- Client-side and server-side Supabase clients
- TypeScript database type definitions
- Environment-based configuration

#### Connection Details

- **Project URL**: `https://opfemzybpukvzeznvhph.supabase.co`
- **Project ID**: `opfemzybpukvzeznvhph`
- **Region**: `sa-east-1` (South America - Brazil)
- **Database Version**: PostgreSQL 17.4.1.043
- **Organization**: Christex Foundation
- **Status**: Active & Healthy

## Data Flow

### Work Registration Flow

1. User submits work registration form
2. API validates user authentication via Privy
3. System checks ISRC uniqueness
4. Work record created in `works` table
5. Contributors created in `contributors` table
6. Metadata uploaded to IPFS
7. Work updated with metadata URI
8. Response includes complete work data

### Royalty Distribution Flow

1. User selects work and amount for distribution
2. API fetches work with contributors from database
3. System validates contributor shares (must total 100%)
4. Distribution record created with 'processing' status
5. Per-contributor amounts calculated based on shares
6. Transaction simulated (future: actual Solana execution)
7. Distribution marked as 'completed' with transaction signature

### Works Listing Flow

1. API fetches all works with contributors via join query
2. Data transformed to UI-friendly format
3. Status determined based on NFT mint address presence

## Current Database State

### Active Data in Production

#### Works (4 records)

1. **"My Work for Barry"** (ISRC: 34324nfns)
   - NFT Mint Address: `HdFUYggmcPLy9hsRajgAALVk7AE4s4K26xhreAUMwXZc`
   - Complex metadata URI with full NFT metadata and on-chain attributes
   - Contributors: og (40%), fndn (60%)

2. **"this is my work"** (ISRC: jfsdfo2342)
   - NFT Mint Address: `C7jhBFmdUXuyDr3ABSeA4jfYmCD5LAtpcXm5cPth9zWq`
   - Contributors: ogo (38%), owo (62%)

3. **"Sample Track #1"** (ISRC: USRC12345678)
   - No NFT mint address (test data)
   - Contributors: Artist One (60%), Producer (40%)

4. **"Collaborative Beat"** (ISRC: USRC87654321)
   - No NFT mint address (test data)
   - Contributors: Artist Two (50%), Co-writer (50%)

#### Contributors (8 records)

Active contributors with various royalty share percentages, demonstrating the flexible royalty distribution system.

#### Users (1 record)

One active user record with Privy integration.

#### Royalty Distributions (0 records)

No distributions executed yet, ready for testing.

## Integration Benefits

1. **Data Persistence**: All work and contributor data persisted in reliable database
2. **Relational Integrity**: Foreign key constraints ensure data consistency
3. **ACID Compliance**: Reliable transaction handling for complex operations
4. **Scalability**: Supabase provides auto-scaling database infrastructure
5. **Real-time Capabilities**: Built-in real-time subscriptions (future enhancement)
6. **Type Safety**: Full TypeScript support with generated types

## Next Steps

1. **Real NFT Minting**: Replace simulation with actual Metaplex Core minting
2. **Privy Wallet Integration**: Implement server-side transaction signing
3. **IPFS Implementation**: Replace mock IPFS with actual NFT.Storage integration
4. **User Management**: Enhanced user profile and wallet management
5. **Analytics**: Distribution history and royalty analytics
6. **Real-time Updates**: WebSocket integration for live status updates

## Environment Variables

Add to your `.env.local`:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://opfemzybpukvzeznvhph.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

The integration provides a solid foundation for the IP registration platform with proper separation of on-chain and off-chain concerns.
