import { Connection, PublicKey, SystemProgram, Transaction } from '@solana/web3.js'
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults'
import { generateSigner } from '@metaplex-foundation/umi'
import { createV1, mplCore } from '@metaplex-foundation/mpl-core'
import { privyServer } from './privy-server'

// Types for Privy linked accounts
interface PrivyLinkedAccount {
  type: string
  chain_type?: string
  address?: string
  wallet_id?: string
  id?: string
}

interface PrivyUserWithAccounts {
  linked_accounts?: PrivyLinkedAccount[]
}

// Solana connection
const SOLANA_RPC_URL = process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com'
export const connection = new Connection(SOLANA_RPC_URL, 'confirmed')

// Initialize UMI for Metaplex Core operations
export function createUmiInstance() {
  return createUmi(SOLANA_RPC_URL).use(mplCore())
}

// Get user's Solana wallet from Privy
export async function getUserSolanaWalletFromPrivy(userId: string) {
  try {
    const user = (await privyServer.getUser(userId)) as PrivyUserWithAccounts

    if (!user?.linked_accounts) {
      throw new Error('User has no linked accounts')
    }

    const solanaWallet = user.linked_accounts.find(
      (account: PrivyLinkedAccount) => account.type === 'wallet' && account.chain_type === 'solana',
    )

    if (!solanaWallet?.address) {
      throw new Error('User has no Solana wallet')
    }

    return {
      address: solanaWallet.address,
      walletId: solanaWallet.wallet_id || solanaWallet.id,
    }
  } catch (error) {
    console.error('Failed to get user Solana wallet:', error)
    throw error
  }
}

// Sign transaction using Privy's server wallet API
export async function signTransactionWithPrivy(walletId: string, transaction: Transaction) {
  try {
    // This would use Privy's server wallet signing capabilities
    // For now, we'll implement a placeholder that shows the structure
    const signedTransaction = await privyServer.walletApi.signTransaction({
      walletId,
      transaction: transaction.serialize({ requireAllSignatures: false }),
    })

    return signedTransaction
  } catch (error) {
    console.error('Failed to sign transaction with Privy:', error)
    throw error
  }
}

// Create metadata for IP work
export function createWorkMetadata(workData: {
  title: string
  isrc?: string
  contributors: Array<{
    name: string
    wallet: string
    share: number
  }>
  description?: string
  imageUrl?: string
}) {
  const totalShares = workData.contributors.reduce((sum, contributor) => sum + contributor.share, 0)

  if (totalShares !== 100) {
    throw new Error('Contributor shares must total 100%')
  }

  return {
    name: workData.title,
    description: workData.description || `IP Work: ${workData.title}`,
    image: workData.imageUrl || '',
    external_url: '',
    attributes: [
      {
        trait_type: 'ISRC',
        value: workData.isrc || 'Not specified',
      },
      {
        trait_type: 'Contributors Count',
        value: workData.contributors.length,
      },
      {
        trait_type: 'Type',
        value: 'Intellectual Property',
      },
    ],
    properties: {
      category: 'music',
      files: [],
      creators: workData.contributors.map((contributor) => ({
        address: contributor.wallet,
        share: contributor.share,
        name: contributor.name,
      })),
    },
  }
}

// Upload metadata to IPFS (placeholder - you can implement with NFT.Storage or similar)
export async function uploadMetadataToIPFS(metadata: object): Promise<string> {
  // This is a placeholder implementation
  // In a real implementation, you would upload to IPFS using a service like NFT.Storage

  try {
    // For demo purposes, we'll return a mock CID
    // Replace this with actual IPFS upload logic
    const mockCid = `QmExample${Date.now()}`
    console.log('Metadata to upload:', JSON.stringify(metadata, null, 2))

    // Simulate upload delay
    await new Promise((resolve) => setTimeout(resolve, 1000))

    return `https://ipfs.io/ipfs/${mockCid}`
  } catch (error) {
    console.error('Failed to upload metadata to IPFS:', error)
    throw error
  }
}

// Type for metadata object
interface WorkMetadata {
  name: string
  description: string
  image: string
  external_url: string
  attributes: Array<{
    trait_type: string
    value: string | number
  }>
  properties: {
    category: string
    files: unknown[]
    creators: Array<{
      address: string
      share: number
      name: string
    }>
  }
}

// Mint NFT using Metaplex Core
export async function mintWorkNFT(params: {
  walletId: string
  userAddress: string
  metadata: WorkMetadata
  metadataUri: string
}) {
  try {
    const umi = createUmiInstance()

    // Create a keypair for the NFT asset
    const asset = generateSigner(umi)

    // For server-side operations, we need to handle the signing through Privy
    // This is a simplified version - in production you'd need to integrate with Privy's signing

    const instruction = createV1(umi, {
      asset,
      name: params.metadata.name,
      uri: params.metadataUri,
    })

    // Build the transaction
    const transaction = await instruction.buildAndSign(umi)

    // Here you would sign the transaction using Privy's server wallet
    // For now, we'll return the transaction data

    return {
      success: true,
      assetId: asset.publicKey,
      transaction: transaction,
      metadata: params.metadata,
      metadataUri: params.metadataUri,
    }
  } catch (error) {
    console.error('Failed to mint NFT:', error)
    throw error
  }
}

// Transfer SOL for royalty distribution
export async function distributeRoyalties(params: {
  fromWalletId: string
  distributions: Array<{
    toAddress: string
    amount: number // in lamports
    recipient: string
  }>
}) {
  try {
    const transactions = []

    for (const distribution of params.distributions) {
      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: new PublicKey(params.fromWalletId), // This would be the actual wallet address
          toPubkey: new PublicKey(distribution.toAddress),
          lamports: distribution.amount,
        }),
      )

      transactions.push({
        transaction,
        recipient: distribution.recipient,
        amount: distribution.amount,
      })
    }

    // Sign and send transactions using Privy
    const results = []
    for (const { transaction, recipient, amount } of transactions) {
      const signedTx = await signTransactionWithPrivy(params.fromWalletId, transaction)
      results.push({
        recipient,
        amount,
        signature: signedTx,
      })
    }

    return {
      success: true,
      distributions: results,
    }
  } catch (error) {
    console.error('Failed to distribute royalties:', error)
    throw error
  }
}
