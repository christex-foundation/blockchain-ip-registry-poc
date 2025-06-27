import { PublicKey, SystemProgram, Transaction } from '@solana/web3.js'
import { generateSigner, Umi, publicKey as toUmiPublicKey } from '@metaplex-foundation/umi'
import { 
  mplCore, 
  fetchAsset, 
  fetchCollection,
  AssetV1, 
  CollectionV1,
  pluginAuthorityPair, 
  createV1, 
  createCollectionV1,
  addCollectionPluginV1,
  removeCollectionPluginV1,
  updateCollectionPluginV1,
  Attribute 
} from '@metaplex-foundation/mpl-core'
import { privyServer } from './privy-server'
import { WorkRepository } from './repositories/work-repository'
import { connection, SERVER_KEYPAIR, createUmiInstance } from './onchain/solana-config'

// Re-export for backward compatibility
export { connection, createUmiInstance }

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

// Re-export utility functions
export { lamportsToSol, solToLamports } from './onchain/conversion-utils'

/**
 * Create organization collection attributes
 */
export function createOrganizationAttributes(params: {
  orgType: 'publishing_company' | 'individual_artist'
  orgName: string
  ownerId: string
  ownerName?: string
}): Attribute[] {
  const now = Date.now().toString()
  
  return [
    { key: 'org_type', value: params.orgType },
    { key: 'org_name', value: params.orgName },
    { key: 'owner_id', value: params.ownerId },
    { key: 'created_at', value: now },
    // Add initial member (owner)
    { key: `member_${params.ownerId}_role`, value: 'owner' },
    { key: `member_${params.ownerId}_joined`, value: now },
    { key: `member_${params.ownerId}_name`, value: params.ownerName || 'Owner' },
  ]
}

/**
 * Create a Core collection for an organization
 */
export async function createOrganizationCollection(params: {
  name: string
  type: 'publishing_company' | 'individual_artist'
  ownerId: string
  ownerName?: string
  description?: string
  imageUrl?: string
}): Promise<{
  success: boolean
  collectionId: string
  signature: string
  attributes: Attribute[]
}> {
  try {
    if (!SERVER_KEYPAIR) {
      throw new Error('Server keypair not configured for collection creation')
    }

    const umi = createUmiInstance()
    const collection = generateSigner(umi)
    
    // Create collection metadata
    const metadata = {
      name: params.name,
      description: params.description || `${params.type === 'publishing_company' ? 'Publishing Company' : 'Artist'} Collection`,
      image: params.imageUrl || '',
      external_url: '',
      properties: {
        category: 'collection',
        type: params.type,
      },
    }
    
    // Create metadata reference
    const uri = await createMetadataReference(Date.now(), metadata)
    
    // Create collection attributes
    const attributes = createOrganizationAttributes({
      orgType: params.type,
      orgName: params.name,
      ownerId: params.ownerId,
      ownerName: params.ownerName,
    })
    
    console.log('Creating organization collection:', collection.publicKey)
    console.log('Collection metadata:', metadata)
    console.log('Collection attributes:', attributes)
    
    // Create the collection with attributes plugin
    const createInstruction = createCollectionV1(umi, {
      collection,
      name: params.name,
      uri,
      plugins: [
        pluginAuthorityPair({
          type: 'Attributes',
          data: {
            attributeList: attributes,
          },
        }),
      ],
    })
    
    // Send and confirm transaction
    const result = await createInstruction.sendAndConfirm(umi, {
      send: { commitment: 'confirmed' },
    })
    
    console.log('Collection created successfully!')
    console.log('Collection ID:', collection.publicKey)
    console.log('Transaction signature:', result.signature)
    
    return {
      success: true,
      collectionId: collection.publicKey,
      signature: result.signature.toString(),
      attributes,
    }
  } catch (error) {
    console.error('Failed to create organization collection:', error)
    throw error
  }
}

/**
 * Add member to organization collection
 */
export async function addOrganizationMember(params: {
  collectionAddress: string
  userId: string
  userName: string
  role: 'admin' | 'member'
}): Promise<{
  success: boolean
  signature: string
}> {
  try {
    if (!SERVER_KEYPAIR) {
      throw new Error('Server keypair not configured')
    }

    const umi = createUmiInstance()
    const collection = await fetchCollection(umi, toUmiPublicKey(params.collectionAddress))
    
    // Get existing attributes
    const existingAttributes = collection.attributes?.attributeList || []
    
    // Add new member attributes
    const now = Date.now().toString()
    const newAttributes: Attribute[] = [
      ...existingAttributes,
      { key: `member_${params.userId}_role`, value: params.role },
      { key: `member_${params.userId}_joined`, value: now },
      { key: `member_${params.userId}_name`, value: params.userName },
    ]
    
    // Update collection attributes
    const updateInstruction = updateCollectionPluginV1(umi, {
      collection: toUmiPublicKey(params.collectionAddress),
      plugin: {
        type: 'Attributes',
        data: {
          attributeList: newAttributes,
        },
      },
    })
    
    const result = await updateInstruction.sendAndConfirm(umi, {
      send: { commitment: 'confirmed' },
    })
    
    console.log('Member added to collection successfully!')
    console.log('Transaction signature:', result.signature)
    
    return {
      success: true,
      signature: result.signature.toString(),
    }
  } catch (error) {
    console.error('Failed to add organization member:', error)
    throw error
  }
}

/**
 * Check if user is member of organization collection
 */
export async function checkOrganizationMembership(params: {
  collectionAddress: string
  userId: string
}): Promise<{
  isMember: boolean
  role?: string
}> {
  try {
    const umi = createUmiInstance()
    const collection = await fetchCollection(umi, toUmiPublicKey(params.collectionAddress))
    
    // Get attributes
    const attributes = collection.attributes?.attributeList || []
    
    // Look for member role attribute
    const roleAttribute = attributes.find(attr => attr.key === `member_${params.userId}_role`)
    
    if (roleAttribute) {
      return {
        isMember: true,
        role: roleAttribute.value,
      }
    }
    
    return {
      isMember: false,
    }
  } catch (error) {
    console.error('Failed to check organization membership:', error)
    return {
      isMember: false,
    }
  }
}

/**
 * Get all members of an organization collection
 */
export async function getOrganizationMembers(collectionAddress: string): Promise<Array<{
  userId: string
  role: string
  joined: string
  name: string
}>> {
  try {
    const umi = createUmiInstance()
    const collection = await fetchCollection(umi, toUmiPublicKey(collectionAddress))
    
    // Get attributes
    const attributes = collection.attributes?.attributeList || []
    
    // Extract member data from attributes
    const members: Map<string, any> = new Map()
    
    attributes.forEach(attr => {
      const memberMatch = attr.key.match(/^member_([^_]+)_(.+)$/)
      if (memberMatch) {
        const [, userId, field] = memberMatch
        if (!members.has(userId)) {
          members.set(userId, { userId })
        }
        members.get(userId)[field] = attr.value
      }
    })
    
    return Array.from(members.values())
  } catch (error) {
    console.error('Failed to get organization members:', error)
    return []
  }
}

/**
 * Create Core asset in organization collection
 */
export async function createOrganizationAsset(params: {
  collectionAddress: string
  ownerAddress: string
  metadata: {
    name: string
    uri: string
  }
  workId: string
  contributors: Array<{
    name: string
    wallet: string
    share: number
  }>
  isrc?: string
  description?: string
  createdByUserId: string
  createdByUserName?: string
}): Promise<{
  success: boolean
  assetId: string
  signature: string
  onChainAttributes: Attribute[]
}> {
  try {
    if (!SERVER_KEYPAIR) {
      throw new Error('Server keypair not configured')
    }

    const umi = createUmiInstance()
    const asset = generateSigner(umi)
    
    // Fetch collection to verify it exists
    const collection = await fetchCollection(umi, toUmiPublicKey(params.collectionAddress))
    
    // Create on-chain attributes (existing work attributes + org context)
    const workAttributes = createOnChainAttributes({
      title: params.metadata.name,
      isrc: params.isrc,
      contributors: params.contributors,
      workId: params.workId,
      description: params.description,
    })
    
    // Add organization context attributes
    const fullAttributes: Attribute[] = [
      ...workAttributes,
      { key: 'created_by', value: params.createdByUserId },
      { key: 'created_by_name', value: params.createdByUserName || 'Unknown' },
    ]
    
    console.log('Creating asset in organization collection:', asset.publicKey)
    console.log('Collection:', params.collectionAddress)
    console.log('Owner:', params.ownerAddress)
    
    // Create the asset with collection reference
    const createInstruction = createV1(umi, {
      asset,
      collection: collection.publicKey,
      name: params.metadata.name,
      uri: params.metadata.uri,
      owner: toUmiPublicKey(params.ownerAddress),
      plugins: [
        pluginAuthorityPair({
          type: 'Attributes',
          data: {
            attributeList: fullAttributes,
          },
        }),
      ],
    })
    
    const result = await createInstruction.sendAndConfirm(umi, {
      send: { commitment: 'confirmed' },
    })
    
    // Store metadata in database
    await storeMetadataInDatabase(params.workId, {
      nft_metadata: params.metadata,
      on_chain_attributes: fullAttributes,
      contributors: params.contributors,
      transaction_signature: result.signature.toString(),
      asset_id: asset.publicKey,
      collection_address: params.collectionAddress,
      created_at: new Date().toISOString(),
    })
    
    console.log('Asset created in collection successfully!')
    console.log('Asset ID:', asset.publicKey)
    console.log('Transaction signature:', result.signature)
    
    return {
      success: true,
      assetId: asset.publicKey,
      signature: result.signature.toString(),
      onChainAttributes: fullAttributes,
    }
  } catch (error) {
    console.error('Failed to create asset in collection:', error)
    throw error
  }
}

/**
 * Get collection data including attributes
 */
export async function getCollectionData(collectionAddress: string): Promise<CollectionV1 | null> {
  try {
    const umi = createUmiInstance()
    const collection = await fetchCollection(umi, toUmiPublicKey(collectionAddress))
    return collection
  } catch (error) {
    console.error('Failed to fetch collection:', error)
    return null
  }
}

/**
 * Get collection attributes
 */
export async function getCollectionAttributes(collectionAddress: string): Promise<Attribute[] | null> {
  try {
    const collection = await getCollectionData(collectionAddress)
    if (!collection) return null
    
    return collection.attributes?.attributeList || []
  } catch (error) {
    console.error('Failed to fetch collection attributes:', error)
    return null
  }
}
