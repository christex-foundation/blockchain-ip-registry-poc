import { PrivyClient } from '@privy-io/server-auth'

if (!process.env.NEXT_PRIVATE_PRIVY_APP_SECRET) {
  throw new Error('NEXT_PRIVATE_PRIVY_APP_SECRET is required')
}

// Initialize Privy server client
export const privyServer = new PrivyClient(
  process.env.NEXT_PUBLIC_PRIVY_APP_ID!,
  process.env.NEXT_PRIVATE_PRIVY_APP_SECRET!,
)

// Types for Privy user data
interface PrivyLinkedAccount {
  type: string
  chain_type?: string
  address?: string
  wallet_id?: string
}

interface PrivyUser {
  linked_accounts?: PrivyLinkedAccount[]
  linkedAccounts?: PrivyLinkedAccount[]
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
export async function getPrivyUser(userId: string): Promise<PrivyUser | null> {
  try {
    const user = await privyServer.getUser(userId)
    return user as PrivyUser
  } catch (error) {
    console.error('Failed to get user:', error)
    return null
  }
}

// Get user's Solana wallet
export function getUserSolanaWallet(user: PrivyUser): string | null {
  const accounts = user?.linked_accounts || user?.linkedAccounts
  if (!accounts) return null

  const solanaWallet = accounts.find(
    (account: PrivyLinkedAccount) => account.type === 'wallet' && account.chain_type === 'solana',
  )

  return solanaWallet?.address || null
}

// Get user's Solana wallet from Privy by user ID
export async function getUserSolanaWalletFromPrivy(userId: string) {
  const user = await getPrivyUser(userId)
  if (!user) {
    throw new Error('User not found')
  }

  const walletAddress = getUserSolanaWallet(user)
  if (!walletAddress) {
    throw new Error('User does not have a Solana wallet')
  }

  return { address: walletAddress }
}
