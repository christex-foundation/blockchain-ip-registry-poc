# Testing Strategy for IP OnChain Next.js

## Overview

This document outlines our testing strategy for the IP OnChain platform, focusing on testing critical functionality without aiming for 100% coverage. Our tests ensure that the most important parts of the application work correctly.

## Test Setup

### Technology Stack

- **Test Runner**: Vitest (faster than Jest, better TypeScript support)
- **Testing Library**: @testing-library/react for component tests
- **Mocking**: Vitest's built-in mocking capabilities
- **Environment**: jsdom for DOM simulation

### Configuration Files

- `vitest.config.ts` - Main Vitest configuration
- `src/test/setup.ts` - Global test setup and mocks

## Test Categories

### 1. Unit Tests ✅

**Location**: `src/lib/__tests__/`

#### Utility Functions (`utils.test.ts`)

- **validateISRC**: Comprehensive ISRC format validation with edge cases
- **validateRoyaltyShares**: Ensures contributor shares total exactly 100%
- **validateWalletAddress**: Solana wallet address validation with security checks
- **calculateTotalShares**: Sum calculation for royalty distribution
- **Security Testing**: Malicious input validation (XSS, SQL injection, unicode)
- **Edge Cases**: Null/undefined inputs, type coercion, floating point precision

**Coverage**: 19/19 tests passing

#### Repository Layer (`repositories/__tests__/`)

**WorkRepository** (`work-repository.test.ts`):

- Work creation with proper data validation
- ISRC uniqueness checking
- NFT mint address updates
- Fetching works with contributor relationships

**ContributorRepository** (`contributor-repository.test.ts`):

- Multiple contributor creation
- Royalty share validation (must total 100%)
- Contributor queries by work ID and wallet address
- Share calculation utilities

**Coverage**: 21/21 tests passing

### 2. Integration Tests ✅

**Location**: `src/lib/__tests__/`

#### API Client (`api-client.test.ts`)

Tests the **real ApiClient class** from `src/lib/api-client.ts`:

- **Constructor behavior**: Default and custom baseUrl configurations
- **verifyAuth**: Authentication token validation with error handling
- **registerWork**: Work registration with proper data structure and authorization
- **getWorks**: Fetching works with authentication headers
- **distributeRoyalties**: Royalty distribution with proper request formatting
- **Error handling**: Network failures and malformed responses

**Coverage**: 12/12 tests passing

#### Workflow Integration (`integration.test.ts`)

Tests **cross-component workflows**:

- **Work Registration Workflow**: Complete validation pipeline
- **Royalty Distribution Workflow**: Multi-contributor calculations
- **Data Validation Pipeline**: Batch validation processing
- **Business Logic Integration**: Real-world scenario testing

**Coverage**: 6/6 tests passing

#### API Route Validation (`src/app/api/works/register/__tests__/`)

Tests business logic validation:

- ISRC format and uniqueness validation
- Royalty share totaling 100% requirement
- Basic input validation

**Coverage**: 3/3 tests passing

### 3. E2E Tests ✅

#### Anchor Program (`anchor/tests/`)

**Solana Program Testing**:

- Basic program deployment and initialization
- Smart contract interaction testing

**Coverage**: 1/1 test passing

## Test Scripts

```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test

# Run tests once (CI mode)
npm run test:run

# Run with UI (if vitest UI is installed)
npm run test:ui

# Run with coverage (requires coverage package)
npm run test:coverage
```

## Critical Test Areas

### 1. Data Validation ✅

- **ISRC Format**: Comprehensive format validation with security checks
- **Royalty Shares**: Must total exactly 100% with floating point precision handling
- **Wallet Addresses**: Solana format validation with known address whitelist

### 2. Business Logic ✅

- **Work Registration**: Complete flow validation with cross-component integration
- **Contributor Management**: Multiple contributors with share validation
- **Royalty Distribution**: Accurate calculation and distribution workflows

### 3. Database Operations ✅

- **CRUD Operations**: Create, read, update for works and contributors
- **Relationship Queries**: Works with contributors joins
- **Error Handling**: Proper error responses for failures

### 4. API Integration ✅

- **Real API Client Testing**: Tests actual `ApiClient` class, not mock functions
- **Request/Response Handling**: Proper HTTP status codes and headers
- **Error Propagation**: Client receives server errors correctly
- **Authentication**: Bearer token handling and validation

## Mock Strategy

### Global Mocks (`src/test/setup.ts`)

- **Next.js Router**: Navigation mocking
- **Privy Authentication**: User authentication state
- **Supabase Client**: Database operation mocking
- **Environment Variables**: Test-specific configuration

### Test-Specific Mocks

- **HTTP Requests**: Fetch API mocking for API client tests
- **External Services**: IPFS, blockchain interactions
- **Database Responses**: Controlled test data scenarios

## Current Test Results Summary

```
✅ Total Test Files: 7 passed
✅ Total Tests: 62 passed

Breakdown:
✅ Utility Functions: 19/19 passing
✅ API Client (Real Class): 12/12 passing
✅ Integration Workflows: 6/6 passing
✅ Repository Tests: 21/21 passing
✅ Route Validation: 3/3 passing
✅ Anchor Program: 1/1 passing

Overall Success Rate: 100% (62/62)
```

## Key Testing Principles

### 1. Test Real Functionality

- **No Mock Functions**: Tests validate actual implementations, not inline test functions
- **Real API Client**: Tests the actual `ApiClient` class from production code
- **Integration Workflows**: Tests how components work together, not in isolation

### 2. Comprehensive Edge Cases

- **Security Testing**: XSS, SQL injection, malicious input validation
- **Type Safety**: Null, undefined, and incorrect type handling
- **Business Rules**: Floating point precision, boundary conditions

### 3. Mock External Dependencies Only

- Database connections (Supabase)
- Authentication services (Privy)

## Dual Storage Testing Strategy (NEW)

### Overview

With the implementation of dual storage (on-chain + off-chain) for NFT metadata, we need comprehensive testing to ensure data consistency and reliability between Solana blockchain storage and Supabase database storage.

### Test Categories for Dual Storage

#### 1. On-Chain Attribute Tests

```typescript
// Test on-chain attribute creation
describe('createOnChainAttributes', () => {
  it('should create proper attributes from work and contributors')
  it('should handle missing ISRC gracefully')
  it('should handle empty contributors array')
  it('should convert numeric values to strings for on-chain storage')
})
```

#### 2. Off-Chain Metadata Tests

```typescript
// Test off-chain metadata structure
describe('createWorkMetadata', () => {
  it('should create compliant NFT metadata structure')
  it('should include all required fields')
  it('should properly format contributor information')
  it('should handle missing optional fields')
})
```

#### 3. Dual Storage Consistency Tests

```typescript
// Test data consistency between storage methods
describe('Dual Storage Consistency', () => {
  it('should maintain data consistency between on-chain and off-chain')
  it('should handle partial failures gracefully')
  it('should validate metadata schema compliance')
  it('should ensure attribute key-value pairs match across storage')
})
```

#### 4. Enhanced API Endpoint Tests

```typescript
// Test metadata API endpoint with dual storage
describe('Metadata API Route', () => {
  it('should return both on-chain and off-chain metadata')
  it('should handle missing NFT mint address')
  it('should handle on-chain fetch errors gracefully')
  it('should validate metadata consistency in response')
  it('should return proper error responses')
  it('should expose database fields for debugging')
})
```

#### 5. NFT Minting Integration Tests

```typescript
// Test complete minting workflow with dual storage
describe('NFT Minting with Dual Storage', () => {
  it('should mint NFT with on-chain attributes using Metaplex Core')
  it('should store metadata reference off-chain in Supabase')
  it('should update work record with mint address')
  it('should handle minting failures gracefully')
  it('should validate attribute plugin creation')
  it('should ensure consistent data between storages')
})
```

### New Test Files to Create

#### 1. Solana Server Tests

**Location**: `src/lib/__tests__/solana-server.test.ts`

- Test on-chain attribute creation
- Test metadata storage functions
- Test asset attribute retrieval
- Test error handling for blockchain operations

#### 2. Metadata API Tests

**Location**: `src/app/api/metadata/[workId]/__tests__/route.test.ts`

- Test complete metadata retrieval flow
- Test on-chain and off-chain data combination
- Test error scenarios and graceful degradation
- Test data consistency validation

#### 3. Work Registration Enhanced Tests

**Location**: `src/app/api/works/register/__tests__/route.test.ts` (enhance existing)

- Test dual storage during work registration
- Test NFT minting with attributes
- Test rollback scenarios on failures

### Testing Data Consistency

#### Key Consistency Checks

```typescript
// Validate that on-chain and off-chain data match
const validateConsistency = (offChainMetadata, onChainAttributes) => {
  const offChainTitle = offChainMetadata.name
  const onChainTitle = onChainAttributes.find((attr) => attr.key === 'title')?.value
  expect(offChainTitle).toBe(onChainTitle)

  const offChainIsrc = offChainMetadata.properties.ip_data.isrc
  const onChainIsrc = onChainAttributes.find((attr) => attr.key === 'isrc')?.value
  expect(offChainIsrc).toBe(onChainIsrc)

  const offChainShares = offChainMetadata.properties.ip_data.total_shares
  const onChainShares = parseInt(onChainAttributes.find((attr) => attr.key === 'total_shares')?.value || '0')
  expect(offChainShares).toBe(onChainShares)
}
```

### Mock Strategy for Blockchain Testing

#### Metaplex Core Mocking

```typescript
vi.mock('@metaplex-foundation/mpl-core', () => ({
  mplCore: vi.fn(),
  fetchAsset: vi.fn(),
  createV1: vi.fn(),
  pluginAuthorityPair: vi.fn(),
}))
```

#### UMI Framework Mocking

```typescript
vi.mock('@metaplex-foundation/umi-bundle-defaults', () => ({
  createUmi: vi.fn(() => ({
    use: vi.fn().mockReturnThis(),
    identity: { publicKey: 'mock-public-key' },
  })),
}))
```

### Error Handling Scenarios

#### 1. Partial Storage Failures

- On-chain success, off-chain failure
- Off-chain success, on-chain failure
- Network connectivity issues
- Invalid data format errors

#### 2. Data Synchronization Issues

- Attribute count mismatches
- Value format inconsistencies
- Missing required fields
- Type conversion errors

### Performance Testing Considerations

#### 1. Metadata Retrieval Performance

- Test response times for combined metadata
- Validate caching mechanisms
- Test concurrent request handling

#### 2. Minting Performance

- Test NFT creation with attributes
- Validate transaction confirmation times
- Test batch operations efficiency

### Test Implementation Priority

#### Phase 1 (Immediate)

1. Basic on-chain attribute creation tests
2. Metadata API endpoint tests
3. Error handling tests

#### Phase 2 (Next Sprint)

1. Complete integration tests
2. Performance tests
3. Consistency validation tests

#### Phase 3 (Future)

1. Load testing with multiple concurrent operations
2. Stress testing with large attribute sets
3. Long-running consistency validation

### Expected Test Coverage Increase

With dual storage implementation:

- **New Test Files**: 2-3 additional test files
- **Additional Tests**: ~30-40 new test cases
- **Coverage Areas**: Blockchain integration, metadata consistency, error handling
- **Total Expected Tests**: ~90-100 tests (from current 62)

This enhanced testing strategy ensures that the dual storage functionality is robust, reliable, and maintains data consistency across both on-chain and off-chain storage systems.

- HTTP requests (fetch API)
- File storage (IPFS)

## Recent Improvements

### Issues Fixed ✅

1. **False Confidence in API Tests**
   - **Problem**: Tests were validating inline mock functions instead of real code
   - **Solution**: Restructured to test actual `ApiClient` class with proper mocking

2. **Test Duplication**
   - **Problem**: `utils.test.ts` and `integration.test.ts` had overlapping coverage
   - **Solution**: Separated unit tests from integration workflows

3. **Incomplete Edge Case Coverage**
   - **Problem**: Missing security and type safety tests
   - **Solution**: Added comprehensive validation for malicious inputs and edge cases

## Project Progress Assessment

Based on the project guide and current codebase state:

### ✅ Completed Components

1. **Environment Setup**: Next.js project with proper structure
2. **Privy Integration**: Authentication provider configured
3. **UI Components**: Work registration form with validation
4. **Database Schema**: Supabase integration with proper tables
5. **API Layer**: Work registration and listing endpoints
6. **Testing Infrastructure**: Comprehensive test suite

### 🚧 In Progress Components

1. **NFT Minting**: UI exists but Metaplex integration not complete
2. **Smart Contract**: Basic Anchor program exists but needs royalty logic
3. **Royalty Distribution**: API endpoint exists but blockchain integration pending

### ⏳ Pending Components

1. **IPFS Integration**: Metadata upload functionality
2. **Complete E2E Flow**: Full workflow from registration to distribution
3. **Dashboard Enhancements**: Real-time transaction status

## Next Steps

### Immediate (High Priority)

1. **Complete NFT Minting**: Integrate Metaplex Core for actual NFT creation
2. **Implement Royalty Smart Contract**: Add distribution logic to Anchor program
3. **IPFS Integration**: Add metadata upload to decentralized storage

### Future Enhancements

1. **E2E Testing**: Playwright tests for complete user workflows
2. **Performance Testing**: Database query optimization
3. **Security Auditing**: Smart contract security review

## Conclusion

Our testing strategy successfully validates critical functionality with 100% test pass rate. The test suite provides confidence in:

1. **Data validation accuracy** with comprehensive edge cases
2. **API communication reliability** testing real implementations
3. **Business logic correctness** through integration workflows
4. **Security robustness** against malicious inputs

The project is well-positioned for the next development phase focusing on blockchain integration and NFT minting functionality.
