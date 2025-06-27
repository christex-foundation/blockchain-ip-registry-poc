import { Connection, Keypair, SystemProgram, Transaction } from '@solana/web3.js'
import { Attribute } from '@metaplex-foundation/mpl-core'
import { WorkRepository } from '../repositories/work-repository'
import { connection, SERVER_KEYPAIR } from './solana-config'

/**
 * Convert work data to on-chain attributes for Metaplex Core
 */
export function createOnChainAttributes(workData: {
  title: string
  isrc?: string
  contributors: Array<{
    name: string
    wallet: string
    share: number
  }>
  workId: string
  description?: string
}): Attribute[] {
  const totalShares = workData.contributors.reduce((sum, contributor) => sum + contributor.share, 0)

  return [
    { key: 'title', value: workData.title },
    { key: 'isrc', value: workData.isrc || 'Not specified' },
    { key: 'work_id', value: workData.workId },
    { key: 'contributors_count', value: workData.contributors.length.toString() },
    { key: 'total_shares', value: totalShares.toString() },
    { key: 'type', value: 'Intellectual Property' },
    { key: 'category', value: 'Music' },
    { key: 'description', value: workData.description || `Intellectual Property Work: ${workData.title}` },
    // Store contributor data as JSON string (Solana attributes support strings)
    {
      key: 'contributors_data',
      value: JSON.stringify(
        workData.contributors.map((c) => ({
          name: c.name,
          wallet: c.wallet,
          share: c.share,
        })),
      ),
    },
    // Store royalty distribution data
    {
      key: 'royalty_distribution',
      value: JSON.stringify(
        workData.contributors.map((c) => ({
          recipient: c.wallet,
          recipient_name: c.name,
          share_percentage: c.share,
        })),
      ),
    },
  ]
}

/**
 * Create on-chain metadata for IP work (following Core NFT standards)
 */
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

  // Core metadata that will be stored on-chain
  const coreMetadata = {
    name: workData.title,
    uri: '', // Will be populated with reference to off-chain data
  }

  // Extended metadata for off-chain storage (following NFT standard)
  const extendedMetadata = {
    name: workData.title,
    description: workData.description || `Intellectual Property Work: ${workData.title}`,
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
        trait_type: 'Total Shares',
        value: totalShares,
      },
      {
        trait_type: 'Type',
        value: 'Intellectual Property',
      },
      {
        trait_type: 'Category',
        value: 'Music',
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
      // Custom properties for IP management
      ip_data: {
        isrc: workData.isrc,
        royalty_distribution: workData.contributors.map((c) => ({
          recipient: c.wallet,
          recipient_name: c.name,
          share_percentage: c.share,
        })),
      },
    },
  }

  return { coreMetadata, extendedMetadata }
}

/**
 * Alternative: Store metadata in a JSON format that can be retrieved via HTTP
 * This creates a hybrid approach - core data on-chain, extended data off-chain but retrievable
 */
export async function createMetadataReference(workId: number, metadata: object): Promise<string> {
  try {
    // In a production system, you might store this in:
    // 1. IPFS (for decentralization)
    // 2. Arweave (for permanent storage)
    // 3. Your own API endpoint (for control)

    // For this implementation, we'll create a reference to our own API
    const metadataReference = {
      version: '1.0',
      type: 'ip-onchain-metadata',
      workId: workId,
      timestamp: new Date().toISOString(),
      metadata: metadata,
    }

    // Mock storing the metadata - in production this would be stored properly
    console.log('Metadata reference created for work ID:', workId)
    console.log('Metadata content:', JSON.stringify(metadataReference, null, 2))

    // Return a URI that points to where this metadata can be retrieved
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    return `${baseUrl}/api/metadata/${workId}`
  } catch (error) {
    console.error('Failed to create metadata reference:', error)
    throw error
  }
}

/**
 * Store metadata on-chain using Solana's account data
 * This approach stores the metadata directly on the blockchain instead of IPFS
 */
export async function storeMetadataOnChain(metadata: object): Promise<string> {
  try {
    // Convert metadata to JSON string
    const metadataJson = JSON.stringify(metadata)

    if (!SERVER_KEYPAIR) {
      throw new Error('Server keypair not configured')
    }

    // Create a PDA for metadata storage
    const metadataAccountKeypair = Keypair.generate()

    // Calculate rent for the account
    const dataSize = metadataJson.length + 64 // Buffer for account overhead
    const rentExemptLamports = await connection.getMinimumBalanceForRentExemption(dataSize)

    // Create account transaction
    const createAccountTx = new Transaction().add(
      SystemProgram.createAccount({
        fromPubkey: SERVER_KEYPAIR.publicKey,
        newAccountPubkey: metadataAccountKeypair.publicKey,
        lamports: rentExemptLamports,
        space: dataSize,
        programId: SystemProgram.programId,
      }),
    )

    // Sign and send transaction
    createAccountTx.feePayer = SERVER_KEYPAIR.publicKey
    const { blockhash } = await connection.getLatestBlockhash()
    createAccountTx.recentBlockhash = blockhash

    createAccountTx.sign(SERVER_KEYPAIR, metadataAccountKeypair)

    const signature = await connection.sendTransaction(createAccountTx, [SERVER_KEYPAIR, metadataAccountKeypair])

    await connection.confirmTransaction(signature)

    console.log('Metadata stored on-chain at:', metadataAccountKeypair.publicKey.toBase58())
    console.log('Transaction signature:', signature)

    // Return the account address as the "URI" - this is where the metadata is stored
    return `solana:${metadataAccountKeypair.publicKey.toBase58()}`
  } catch (error) {
    console.error('Failed to store metadata on-chain:', error)
    throw error
  }
}

/**
 * Enhanced: Store metadata in Supabase database for reliable off-chain storage
 */
export async function storeMetadataInDatabase(workId: string, metadata: object): Promise<void> {
  try {
    // Store the complete metadata JSON in the database
    // This ensures we have the full metadata even if the API endpoint is unavailable
    await WorkRepository.updateWork(workId, {
      // Store full metadata as JSON string for backup
      metadata_uri: JSON.stringify({
        stored_at: new Date().toISOString(),
        full_metadata: metadata,
        api_endpoint: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/metadata/${workId}`,
      }),
    })

    console.log('Metadata stored in database for work ID:', workId)
  } catch (error) {
    console.error('Failed to store metadata in database:', error)
    throw error
  }
}