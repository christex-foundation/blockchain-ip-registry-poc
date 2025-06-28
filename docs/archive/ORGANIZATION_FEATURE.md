# Organization Feature - IP OnChain Platform

## Overview

The Organization Feature enables multi-user collaboration for intellectual property management on the IP OnChain platform. Organizations can represent publishing companies, record labels, artist collectives, or any entity that manages IP works collectively.

## Architecture

### Hybrid On-Chain/Off-Chain Design

The organization feature uses a sophisticated hybrid architecture:

- **On-Chain**: Metaplex Core Collections with Attributes Plugin for membership and metadata
- **Off-Chain**: Supabase database for fast queries and caching
- **Synchronization**: Dual-write operations ensure data consistency

### Key Components

1. **Organizations**: Core entities representing publishing companies or artist collectives
2. **Members**: Users with roles (Owner, Admin, Member) within organizations
3. **Collections**: On-chain Solana collections for grouping organization works
4. **Works**: IP registrations that can be associated with organizations

## Database Schema

### Organizations Table

```sql
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  collection_address VARCHAR(255) UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Organization Members Table

```sql
CREATE TABLE organization_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(50) NOT NULL CHECK (role IN ('owner', 'admin', 'member')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(organization_id, user_id)
);
```

### Updated Works Table

```sql
ALTER TABLE works 
ADD COLUMN organization_id UUID REFERENCES organizations(id),
ADD COLUMN created_by_user_id UUID REFERENCES users(id);
```

## On-Chain Structure

### Metaplex Core Collections

Each organization creates a Metaplex Core Collection with the following attributes:

```typescript
{
  "org_type": "publishing_company" | "individual_artist",
  "org_name": "Organization Name",
  "owner_id": "privy_user_id",
  "created_at": "timestamp",
  "member_[userId]_role": "owner" | "admin" | "member",
  "member_[userId]_joined": "timestamp",
  "member_[userId]_name": "display_name"
}
```

### Collection Ownership

- All collections are owned by the server wallet
- Membership and permissions are managed through collection attributes
- This approach eliminates key management complexity while maintaining security

## API Endpoints

### Organization Management

#### `GET /api/organizations`
Lists all organizations for the authenticated user.

**Response:**
```json
{
  "organizations": [
    {
      "id": "uuid",
      "name": "Organization Name",
      "collection_address": "solana_address",
      "created_at": "timestamp",
      "updated_at": "timestamp"
    }
  ]
}
```

#### `POST /api/organizations`
Creates a new organization with on-chain collection.

**Request:**
```json
{
  "name": "Organization Name",
  "type": "publishing_company" | "individual_artist",
  "description": "Optional description",
  "imageUrl": "Optional image URL"
}
```

**Response:**
```json
{
  "organization": { /* organization object */ },
  "collection": {
    "address": "collection_address",
    "signature": "transaction_signature",
    "attributes": [/* on-chain attributes */]
  }
}
```

#### `GET /api/organizations/[id]`
Retrieves organization details with on-chain collection data.

#### `GET /api/organizations/[id]/members`
Lists organization members from both database and on-chain sources.

#### `POST /api/organizations/[id]/members`
Adds a new member to the organization (requires admin/owner permissions).

**Request:**
```json
{
  "userId": "privy_user_id",
  "role": "admin" | "member"
}
```

## Frontend Components

### OrganizationSelector
Dropdown component for selecting organizations during work registration.

**Features:**
- Lists user's organizations
- Shows on-chain status badges
- Option to create new organizations
- Personal work vs organization work selection

**Usage:**
```tsx
<OrganizationSelector
  value={selectedOrganization}
  onValueChange={setSelectedOrganization}
  showCreateOption={true}
  onCreateClick={() => setShowCreateDialog(true)}
/>
```

### OrganizationList
Grid view of user's organizations with management options.

**Features:**
- Organization cards with metadata
- Collection status indicators
- Direct links to Metaplex Core Explorer
- Create organization button

### OrganizationDetail
Detailed organization view with member management.

**Features:**
- Organization information display
- On-chain collection status
- Member list with roles
- Add member functionality
- Permission-based UI

### CreateOrganizationDialog
Modal form for creating new organizations.

**Features:**
- Form validation with Zod
- Organization type selection
- Optional description and image
- On-chain collection creation

### AddMemberDialog
Modal form for adding members to organizations.

**Features:**
- Privy user ID input
- Role selection (admin/member)
- Dual database/on-chain operations

## User Workflows

### Creating an Organization

1. Navigate to `/organizations`
2. Click "Create Organization"
3. Fill out organization details
4. System creates:
   - Database record in `organizations`
   - Membership record with 'owner' role
   - On-chain Metaplex Core collection
   - Collection attributes with organization metadata

### Adding Members

1. Access organization detail page
2. Click "Add Member" (admin/owner only)
3. Enter Privy user ID and select role
4. System creates:
   - Database record in `organization_members`
   - On-chain collection attribute for membership

### Registering Works

1. Go to "Register Work"
2. Select organization (optional)
3. Fill work details
4. System creates:
   - Work record linked to organization
   - NFT as part of organization collection (if selected)
   - On-chain asset with organization context

## Security Considerations

### Permission System

- **Owner**: Full control, can add/remove members, delete organization
- **Admin**: Can add/remove members, register works
- **Member**: Can register works under the organization

### Data Validation

- User ID conversion from Privy ID to database UUID
- Organization membership verification before work registration
- Role-based access control for all operations
- Unique constraints on organization membership

### Key Management

- Server wallet owns all collections
- No need for individual key management
- Membership tracked via collection attributes
- Secure server-side transaction signing

## Testing Strategy

### Repository Tests
- CRUD operations with proper error handling
- User ID conversion logic
- Permission checking functionality

### API Tests
- Authentication requirements
- Input validation
- Error scenarios (user not found, insufficient permissions)
- Successful workflows

### Integration Tests
- End-to-end organization creation
- Member addition workflow
- Work registration with organizations
- Data consistency validation

### Test Data Builders
- `OrganizationBuilder` for consistent test data
- `OrganizationMemberBuilder` for membership scenarios
- `OrganizationTestData` for common test cases

## Performance Considerations

### Database Optimization

- Indexes on frequently queried columns
- Efficient join queries for organization membership
- Minimal database roundtrips

### On-Chain Efficiency

- Single collection per organization
- Attribute-based membership (no separate accounts)
- Batch operations where possible

### Caching Strategy

- Database caching of on-chain data
- Optimistic UI updates
- Background synchronization

## Monitoring and Analytics

### Key Metrics

- Organization creation rate
- Member activity levels
- Work registration by organization
- On-chain operation success rates

### Error Tracking

- User ID conversion failures
- On-chain operation errors
- Permission violation attempts
- Data consistency issues

## Future Enhancements

### Planned Features

- Organization transfer functionality
- Advanced role permissions
- Bulk member operations
- Organization analytics dashboard
- Multi-signature operations for high-value transactions

### Scalability Considerations

- Pagination for large member lists
- Background processing for heavy operations
- Rate limiting for API endpoints
- Optimized queries for large organizations

## Troubleshooting

### Common Issues

1. **"User not found in database"**: User needs to register a work first
2. **"Invalid UUID format"**: Ensure Privy user ID conversion is working
3. **"Insufficient permissions"**: Check user role in organization
4. **"Collection creation failed"**: Verify server wallet configuration

### Debug Tools

- `/api/debug/db-check` endpoint for database validation
- Console logging in development mode
- Supabase dashboard for data inspection
- Metaplex Core Explorer for on-chain verification

## API Rate Limits

- Organization creation: 10 per hour per user
- Member addition: 50 per hour per organization
- List operations: 1000 per hour per user

## Conclusion

The Organization Feature provides a robust foundation for collaborative IP management while maintaining the security and transparency benefits of blockchain technology. The hybrid architecture ensures optimal performance while preserving data integrity across both on-chain and off-chain systems.