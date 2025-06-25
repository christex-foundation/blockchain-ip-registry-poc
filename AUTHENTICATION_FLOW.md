# Authentication Flow - IP OnChain Platform

## Overview

The platform uses Privy for user authentication and wallet management. Wallet provisioning is handled automatically by Privy's dashboard settings, simplifying the user experience.

## Architecture

### Authentication Components

#### 1. Privy Integration (`src/components/privy/use-privy-auth.tsx`)

Custom hook that wraps Privy's authentication:

```typescript
const {
  ready, // Privy initialization status
  authenticated, // User authentication status
  user, // User object
  getAccessToken, // JWT token for API calls
  userEmail, // User's email address
  userId, // User's unique ID
} = usePrivyAuth()
```

#### 2. Authentication Guard (`src/components/privy/auth-guard.tsx`)

Protects routes requiring authentication:

```typescript
<AuthGuard>
  <YourProtectedComponent />
</AuthGuard>
```

### Server-Side Utilities (`src/lib/privy-server.ts`)

Server-side functions for token verification and user data retrieval:

- `verifyPrivyToken(accessToken)` - Verifies JWT tokens from client
- `getPrivyUser(userId)` - Retrieves user data from Privy
- `getUserSolanaWallet(user)` - Extracts Solana wallet from user data
- `getUserSolanaWalletFromPrivy(userId)` - Gets user's wallet by ID

## User Flow

### 1. User Registration/Login

1. User visits protected route
2. AuthGuard redirects to `/auth/login` if not authenticated
3. User completes Privy authentication flow
4. Wallet automatically provisioned by Privy (if enabled)
5. User redirected to original destination

### 2. API Authentication

1. Client calls `getAccessToken()` from usePrivyAuth hook
2. JWT token passed in Authorization header
3. Server verifies token using `verifyPrivyToken()`
4. API operations proceed with verified user context

## Protected Routes

### Current Implementation

- **Dashboard** (`/dashboard`): Requires authentication
- **Register Work** (`/register-work`): Requires authentication
- **Work Details** (`/works/[id]`): Requires authentication

### Usage Example

```typescript
// Simple authentication requirement
<AuthGuard>
  <DashboardContent />
</AuthGuard>

// Custom redirect path
<AuthGuard redirectTo="/custom-login">
  <ProtectedContent />
</AuthGuard>
```

## API Integration

### Client-Side API Calls

```typescript
const { getAccessToken } = usePrivyAuth()

const makeAPICall = async () => {
  const accessToken = await getAccessToken()

  const response = await fetch('/api/endpoint', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  })
}
```

### Server-Side Token Verification

```typescript
import { verifyPrivyToken } from '@/lib/privy-server'

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  const accessToken = authHeader?.replace('Bearer ', '')

  const verifiedClaims = await verifyPrivyToken(accessToken)
  if (!verifiedClaims) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Proceed with authenticated user context
  const userId = verifiedClaims.userId
}
```

## Environment Configuration

Required environment variables:

```env
# Privy Configuration
NEXT_PUBLIC_PRIVY_APP_ID=your_privy_app_id
NEXT_PRIVATE_PRIVY_APP_SECRET=your_privy_app_secret
```

## Wallet Management

- **Automatic Provisioning**: Handled by Privy dashboard settings
- **Multi-Chain Support**: Configurable through Privy dashboard
- **Wallet Access**: Available through `user.linkedAccounts` array
- **Server-Side Wallet Queries**: Use `getUserSolanaWallet()` helper

## Security Features

- **JWT Token Authentication**: Secure API access
- **Server-Side Verification**: All tokens verified server-side
- **Automatic Token Refresh**: Handled by Privy client
- **Protected Route Guards**: Prevent unauthorized access
- **CORS Protection**: Secure cross-origin requests

## Benefits of Current Architecture

### User Experience

- **Seamless Authentication**: One-click login with multiple methods
- **Automatic Wallet Setup**: No manual wallet management
- **Persistent Sessions**: Stay logged in across sessions
- **Mobile Friendly**: Works across all devices

### Developer Experience

- **Simple Integration**: Easy-to-use hooks and components
- **Type Safety**: Full TypeScript support
- **Error Handling**: Comprehensive error boundaries
- **Scalable Architecture**: Easy to extend and modify

### Security

- **Enterprise Grade**: Privy's production security infrastructure
- **Compliance Ready**: SOC 2 Type II certified
- **Regular Updates**: Automatically updated security features
- **Audit Trail**: Complete authentication logs

This simplified architecture provides robust authentication while reducing complexity and maintenance overhead.
