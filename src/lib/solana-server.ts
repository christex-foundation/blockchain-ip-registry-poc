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
import { getUserSolanaWalletFromPrivy } from './onchain/wallet-utils'
import { 
  createOnChainAttributes, 
  createWorkMetadata, 
  createMetadataReference, 
  storeMetadataInDatabase 
} from './onchain/metadata'
import { mintWorkNFT, getAssetData, getAssetAttributes } from './onchain/nft-operations'
import { distributeRoyalties } from './onchain/royalties'
import { 
  createOrganizationAttributes,
  createOrganizationCollection,
  addOrganizationMember,
  checkOrganizationMembership,
  getOrganizationMembers,
  createOrganizationAsset,
  getCollectionData,
  getCollectionAttributes
} from './onchain/collections'
import { WorkRepository } from './repositories/work-repository'
import { connection, SERVER_KEYPAIR, createUmiInstance } from './onchain/solana-config'

// Re-export for backward compatibility
export { connection, createUmiInstance }

// Re-export metadata functions
export { 
  createOnChainAttributes, 
  createWorkMetadata, 
  createMetadataReference, 
  storeMetadataInDatabase,
  storeMetadataOnChain 
} from './onchain/metadata'

// Re-export wallet utilities
export { getUserSolanaWalletFromPrivy } from './onchain/wallet-utils'

// Re-export NFT operations
export { mintWorkNFT, getAssetData, getAssetAttributes } from './onchain/nft-operations'

// Re-export royalty functions
export { distributeRoyalties } from './onchain/royalties'

// Re-export collection functions
export { 
  createOrganizationAttributes,
  createOrganizationCollection,
  addOrganizationMember,
  checkOrganizationMembership,
  getOrganizationMembers,
  createOrganizationAsset,
  getCollectionData,
  getCollectionAttributes
} from './onchain/collections'





// Re-export utility functions
export { lamportsToSol, solToLamports } from './onchain/conversion-utils'

