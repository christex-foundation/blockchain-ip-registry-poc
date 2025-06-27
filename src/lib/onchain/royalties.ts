import { PublicKey, SystemProgram, Transaction } from '@solana/web3.js'
import { connection, SERVER_KEYPAIR } from './solana-config'

/**
 * Distribute royalties to contributors (implementation for Week 3)
 */
export async function distributeRoyalties(params: {
  fromWalletId: string
  distributions: Array<{
    toAddress: string
    amount: number // in lamports
    recipient: string
  }>
}) {
  try {
    if (!SERVER_KEYPAIR) {
      throw new Error('Server keypair not configured for royalty distribution')
    }

    const transactions: Transaction[] = []

    for (const distribution of params.distributions) {
      const transferTx = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: SERVER_KEYPAIR.publicKey,
          toPubkey: new PublicKey(distribution.toAddress),
          lamports: distribution.amount,
        }),
      )
      transactions.push(transferTx)
    }

    // Sign and send all transactions
    const signatures: string[] = []

    for (const tx of transactions) {
      tx.feePayer = SERVER_KEYPAIR.publicKey
      const { blockhash } = await connection.getLatestBlockhash()
      tx.recentBlockhash = blockhash

      tx.sign(SERVER_KEYPAIR)

      const signature = await connection.sendTransaction(tx, [SERVER_KEYPAIR])
      await connection.confirmTransaction(signature)
      signatures.push(signature)
    }

    return {
      success: true,
      distributions: params.distributions.map((dist, index) => ({
        ...dist,
        signature: signatures[index],
      })),
    }
  } catch (error) {
    console.error('Failed to distribute royalties:', error)
    throw error
  }
}