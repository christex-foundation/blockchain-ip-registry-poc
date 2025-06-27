import { generateSigner, publicKey as toUmiPublicKey } from '@metaplex-foundation/umi'
import { 
  fetchCollection,
  CollectionV1,
  pluginAuthorityPair, 
  createV1,
  createCollectionV1,
  updateCollectionPluginV1,
  Attribute 
} from '@metaplex-foundation/mpl-core'
import { createUmiInstance, SERVER_KEYPAIR } from './solana-config'
import { createMetadataReference, storeMetadataInDatabase, createOnChainAttributes } from './metadata'

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