import { privyServer } from '../privy-server'

/**
 * Get user's Solana wallet from Privy
 */
export async function getUserSolanaWalletFromPrivy(userId: string) {
  try {
    const user = await privyServer.getUser(userId)
    console.log('user')
    console.table(user.linkedAccounts)
    if (!user?.linkedAccounts) {
      throw new Error('User has no linked accounts')
    }

    const solanaWallet = user.linkedAccounts.find(
      (account) => account.type === 'wallet' && account.chainType === 'solana',
    )

    if (!solanaWallet?.address) {
      throw new Error('User has no Solana wallet')
    }

    return {
      address: solanaWallet.address,
      walletId: solanaWallet.id,
    }
  } catch (error) {
    console.error('Failed to get user Solana wallet:', error)
    throw error
  }
}