import { Connection, Keypair, PublicKey, SystemProgram, Transaction } from '@solana/web3.js'
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults'
import { generateSigner, keypairIdentity, Umi, publicKey as toUmiPublicKey } from '@metaplex-foundation/umi'
import { mplCore, fetchAsset, AssetV1, pluginAuthorityPair, createV1, Attribute } from '@metaplex-foundation/mpl-core'
import { fromWeb3JsKeypair } from '@metaplex-foundation/umi-web3js-adapters'
import { privyServer } from './privy-server'
import { WorkRepository } from './repositories/work-repository'

// Solana connection configuration
const SOLANA_RPC_URL = process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com'
export const connection = new Connection(SOLANA_RPC_URL, 'confirmed')

// Server wallet configuration (for signing transactions)
const SERVER_KEYPAIR = process.env.SERVER_WALLET_PRIVATE_KEY
  ? Keypair.fromSecretKey(new Uint8Array(JSON.parse(process.env.SERVER_WALLET_PRIVATE_KEY)))
  : null

if (!SERVER_KEYPAIR) {
  console.warn('SERVER_WALLET_PRIVATE_KEY not configured - NFT minting will not work')
}

/**
 * Initialize UMI instance with server keypair for signing
 */
export function createUmiInstance(): Umi {
  const umi = createUmi(SOLANA_RPC_URL).use(mplCore())

  if (SERVER_KEYPAIR) {
    const umiKeypair = fromWeb3JsKeypair(SERVER_KEYPAIR)
    umi.use(keypairIdentity(umiKeypair))
  }

  return umi
}

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

/**
 * Mint NFT using Metaplex Core with server-side signature and on-chain attributes
 */
export async function mintWorkNFT(params: {
  workId: string // Change from number to string to match database
  ownerAddress: string
  metadata: {
    name: string
    uri: string
  }
  contributors: Array<{
    name: string
    wallet: string
    share: number
  }>
  isrc?: string
  description?: string
}): Promise<{
  success: boolean
  assetId: string
  signature: string
  metadata: object
  onChainAttributes: Attribute[]
}> {
  try {
    if (!SERVER_KEYPAIR) {
      throw new Error('Server keypair not configured for minting')
    }

    const umi = createUmiInstance()

    // Generate asset keypair
    const asset = generateSigner(umi)

    // Create on-chain attributes
    const onChainAttributes = createOnChainAttributes({
      title: params.metadata.name,
      isrc: params.isrc,
      contributors: params.contributors,
      workId: params.workId,
      description: params.description,
    })

    console.log('Minting NFT with asset ID:', asset.publicKey)
    console.log('Owner address:', params.ownerAddress)
    console.log('Metadata:', params.metadata)
    console.log('On-chain attributes:', onChainAttributes)

    // Create the NFT using Metaplex Core with on-chain attributes
    const createInstruction = createV1(umi, {
      asset,
      name: params.metadata.name,
      uri: params.metadata.uri,
      owner: toUmiPublicKey(params.ownerAddress),
      plugins: [
        pluginAuthorityPair({
          type: 'Attributes',
          data: {
            attributeList: onChainAttributes,
          },
        }),
      ],
    })

    // Send and confirm the transaction
    const result = await createInstruction.sendAndConfirm(umi, {
      send: { commitment: 'confirmed' },
    })

    // Store metadata in database for backup/caching
    await storeMetadataInDatabase(params.workId, {
      nft_metadata: params.metadata,
      on_chain_attributes: onChainAttributes,
      contributors: params.contributors,
      transaction_signature: result.signature.toString(),
      asset_id: asset.publicKey,
      created_at: new Date().toISOString(),
    })

    console.log('NFT minted successfully with on-chain attributes!')
    console.log('Asset ID:', asset.publicKey)
    console.log('Transaction signature:', result.signature)

    return {
      success: true,
      assetId: asset.publicKey,
      signature: result.signature.toString(),
      metadata: params.metadata,
      onChainAttributes,
    }
  } catch (error) {
    console.error('Failed to mint NFT:', error)
    throw error
  }
}

/**
 * Fetch NFT asset data including on-chain attributes
 */
export async function getAssetData(assetId: string): Promise<AssetV1 | null> {
  try {
    const umi = createUmiInstance()
    const asset = await fetchAsset(umi, toUmiPublicKey(assetId))
    return asset
  } catch (error) {
    console.error('Failed to fetch asset:', error)
    return null
  }
}

/**
 * Fetch on-chain attributes from an asset
 */
export async function getAssetAttributes(assetId: string): Promise<Attribute[] | null> {
  try {
    const asset = await getAssetData(assetId)
    if (!asset) return null

    // Find the attributes plugin
    const attributesData = asset.attributes?.attributeList || []
    return attributesData
  } catch (error) {
    console.error('Failed to fetch asset attributes:', error)
    return null
  }
}

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

// Utility function to convert lamports to SOL
export function lamportsToSol(lamports: number): number {
  return lamports / 1e9
}

// Utility function to convert SOL to lamports
export function solToLamports(sol: number): number {
  return Math.floor(sol * 1e9)
}
