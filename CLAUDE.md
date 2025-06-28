# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

IP OnChain is a Next.js application for intellectual property management on Solana blockchain. It enables users to register musical works and other IP as NFTs, manage organizations (publishing companies/artist collectives), and distribute royalties. The architecture combines on-chain storage using Metaplex Core with off-chain Supabase database for optimal performance.

## Development Commands

### Essential Commands
```bash
# Development server with Turbopack
npm run dev

# Build application  
npm run build

# Run all tests (watch mode by default)
npm test

# Run single test file
npm test -- src/path/to/test.ts

# Linting and formatting
npm run lint
npm run format
npm run format:check

# Testing commands
npm test              # Run tests in watch mode (default)
npm run test:run      # Run tests once (CI mode)
npm run test:ui       # Run tests with UI
npm run test:coverage # Run tests with coverage report

# Build and CI
npm run ci            # Full CI pipeline: build, lint, format check, codama
```

### Anchor/Solana Commands
```bash
# Setup new program keypair and sync IDs
npm run setup

# Generate client code from IDL
npm run anchor-client

# Build Solana program
npm run anchor-build

# Start local validator with program
npm run anchor-localnet

# Run Anchor tests
npm run anchor-test

# Generate JavaScript client using Codama
npm run codama:js

# Deploy to devnet
npm run anchor deploy --provider.cluster devnet
```

## Architecture Overview

### Hybrid Storage Architecture
- **On-Chain**: Metaplex Core Collections and Assets with Attributes Plugin for metadata
- **Off-Chain**: Supabase PostgreSQL for fast queries, caching, and complex relationships
- **Synchronization**: Dual-write operations ensure data consistency between storage layers

### Key Data Models
- **Users**: Privy authentication with embedded wallets
- **Organizations**: Publishing companies/collectives with role-based membership (Owner/Admin/Member)
- **Works**: IP registrations that can be individual or organization-owned
- **Contributors**: Royalty share holders with wallet addresses

### Critical User ID Conversion Pattern
The application uses a critical conversion pattern between Privy user IDs (`did:privy:...`) and database UUIDs:

```typescript
// All repository methods must convert Privy IDs to database IDs
const user = await UserRepository.findByPrivyUserId(privyUserId)
if (!user) return [] // Handle gracefully
// Use user.id (UUID) for database operations, not privyUserId
```

This pattern is essential for organizations, works, and any user-related operations.

## Repository Layer Structure

Located in `src/lib/repositories/`, each repository follows consistent patterns:

### OrganizationRepository
- Handles user ID conversion from Privy to database UUIDs
- Manages role-based permissions (owner/admin/member)
- Creates on-chain collections via Metaplex Core
- Critical methods: `findUserOrganizations()`, `isMember()`, `hasPermission()`

### WorkRepository  
- Manages IP work registration with contributors
- Links works to organizations when applicable
- Handles ISRC validation and uniqueness
- Updates NFT mint addresses after on-chain creation

### UserRepository
- Manages Privy user ID to database UUID mapping
- Handles user upserts during authentication
- Critical for all user-related operations across the application

## Testing Strategy

### Test Structure
- **Unit Tests**: `src/lib/__tests__/` - utilities, repositories
- **Integration Tests**: `src/lib/__tests__/organization-integration.test.ts` - cross-component workflows
- **API Tests**: `src/app/api/*/route.test.ts` - endpoint behavior with auth
- **Builders**: `src/test/builders/` - consistent test data generation

### Key Testing Patterns
```typescript
// Use builders for consistent test data
const org = OrganizationBuilder.create().withName('Test Org').build()

// Mock Supabase with proper chaining
const mockSupabaseClient = { from: vi.fn() }
vi.mocked(createServerSupabaseClient).mockReturnValue(mockSupabaseClient as any)

// Test user ID conversion patterns
vi.mocked(UserRepository.findByPrivyUserId).mockResolvedValue(dbUser)
```

### Running Specific Tests
```bash
# Organization tests
npm test src/lib/repositories/__tests__/organization-repository.test.ts

# Integration workflows  
npm test src/lib/__tests__/organization-integration.test.ts

# API endpoint tests
npm test src/app/api/organizations/__tests__/route.test.ts
```

## API Route Patterns

### Authentication Flow
All protected API routes follow this pattern:
1. Extract Bearer token from Authorization header
2. Verify with Privy server using `privyServer.verifyAuthToken()`
3. Convert Privy user ID to database user with `UserRepository.findByPrivyUserId()`
4. Proceed with business logic

### Organization Permission Checks
```typescript
// Check organization membership
const isMember = await OrganizationRepository.isMember(orgId, privyUserId)

// Check specific permissions
const hasPermission = await OrganizationRepository.hasPermission(
  orgId, 
  privyUserId, 
  ['owner', 'admin']
)
```

## Solana Integration

### Metaplex Core Operations
- **Collections**: Represent organizations with attributes for membership
- **Assets**: Individual IP works, optionally part of organization collections
- **Attributes Plugin**: Stores metadata on-chain for both collections and assets

### Server Wallet Management
- All on-chain operations use server-managed wallet (`SERVER_WALLET_PRIVATE_KEY`)
- Eliminates complex key management for users
- Membership tracked via collection attributes rather than separate accounts

## Environment Configuration

### Required Environment Variables
```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Privy Authentication  
NEXT_PUBLIC_PRIVY_APP_ID=
NEXT_PRIVATE_PRIVY_APP_SECRET=

# Solana
SERVER_WALLET_PRIVATE_KEY=
SOLANA_RPC_URL=
NEXT_PUBLIC_SOLANA_RPC_URL=

# Application Configuration
NEXT_PUBLIC_APP_URL=
```

## Common Debugging Patterns

### User ID Issues
If seeing "invalid input syntax for type uuid" errors:
- Check that Privy user ID conversion is happening in repository methods
- Ensure `UserRepository.findByPrivyUserId()` is called before database operations
- Verify user exists in database before organization operations

### Organization Permission Issues
- Use `OrganizationRepository.hasPermission()` for admin/owner checks
- Check organization membership with `isMember()` before work registration
- Ensure proper role validation in API endpoints

### Test Failures
- Organization tests require proper user ID mocking patterns
- Supabase mock chaining must return correct objects for method chaining
- Use OrganizationBuilder with explicit null handling for collection addresses

## Architecture Governance

### Pre-Merge Requirements

Before merging any branch to main, ensure:

1. **Technical Specification Compliance**
   - Review changes against `/docs/TECHNICAL_SPECIFICATION.md`
   - Verify no architectural patterns have been violated
   - Check that new features align with existing system design

2. **Architecture Decision Records (ADRs)**
   - If implementation diverges from technical specification, create an ADR
   - Document the architectural decision in `/docs/adrs/YYYY-MM-DD-decision-title.md`
   - Include context, options considered, decision made, and consequences
   - Update TECHNICAL_SPECIFICATION.md to reflect approved changes

3. **ADR Template**
   Use `/docs/adrs/ADR-TEMPLATE.md` as the starting point for new ADRs

### Common Architecture Violations to Check

- User ID conversion patterns (Privy → Database UUID)
- Repository layer bypass (direct Supabase calls)
- On-chain operations without proper error handling
- API routes without authentication verification
- Database schema changes without migration files
- Inconsistent data storage between on-chain and off-chain systems

### Architecture Decision Process

1. **Identify Need**: When implementation must diverge from current architecture
2. **Create ADR**: Document the decision using the template
3. **Review**: Get team consensus on the architectural change
4. **Accept**: Mark ADR as accepted and update technical specification
5. **Implement**: Proceed with implementation following the decided approach

## Documentation References

- `/docs/TECHNICAL_SPECIFICATION.md` - Single source of truth for platform architecture
- `/docs/adrs/` - Architecture Decision Records for all architectural changes
- `/docs/archive/` - Archived individual documentation files
- `/docs/IP_DESIGN_SYSTEM.md` - UI/UX design guidelines
- `/docs/VOLCANO_DESIGN_SYSTEM.md` - Landing page design system
