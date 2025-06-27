import { generateSigner, publicKey as toUmiPublicKey } from '@metaplex-foundation/umi'
import { 
  fetchAsset, 
  AssetV1, 
  pluginAuthorityPair, 
  createV1, 
  Attribute 
} from '@metaplex-foundation/mpl-core'
import { createUmiInstance, SERVER_KEYPAIR } from './solana-config'
import { createOnChainAttributes, storeMetadataInDatabase } from './metadata'

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