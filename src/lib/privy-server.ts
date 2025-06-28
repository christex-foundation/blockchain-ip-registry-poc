import { PrivyClient } from '@privy-io/server-auth'

if (!process.env.PRIVY_APP_SECRET) {
  throw new Error('PRIVY_APP_SECRET is required')
}

// Initialize Privy server client
export const privyServer = new PrivyClient(process.env.NEXT_PUBLIC_PRIVY_APP_ID!, process.env.PRIVY_APP_SECRET!)

// Types for Privy user data
interface PrivyLinkedAccount {
  type: string
  chain_type?: string
  address?: string
}

interface PrivyUser {
  linked_accounts?: PrivyLinkedAccount[]
}

// Verify and get user from access token
export async function verifyPrivyToken(accessToken: string) {
  try {
    const verifiedClaims = await privyServer.verifyAuthToken(accessToken)
    return verifiedClaims
  } catch (error) {
    console.error('Token verification failed:', error)
    return null
  }
}

// Get user by ID
export async function getPrivyUser(userId: string) {
  try {
    const user = await privyServer.getUser(userId)
    return user
  } catch (error) {
    console.error('Failed to get user:', error)
    return null
  }
}

// Get user's Solana wallet
export function getUserSolanaWallet(user: PrivyUser) {
  if (!user?.linked_accounts) return null

  const solanaWallet = user.linked_accounts.find(
    (account: PrivyLinkedAccount) => account.type === 'wallet' && account.chain_type === 'solana',
  )

  return solanaWallet?.address || null
}
