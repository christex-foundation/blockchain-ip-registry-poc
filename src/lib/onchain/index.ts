/**
 * OnChain Operations - Clean Public API
 * 
 * This module provides organized exports for all blockchain operations
 * including Solana/Metaplex Core functionality for IP management.
 */

// Core Configuration
export { 
  connection, 
  createUmiInstance, 
  SERVER_KEYPAIR 
} from './solana-config'

// Utility Functions
export { 
  lamportsToSol, 
  solToLamports 
} from './conversion-utils'

// Wallet Operations
export { 
  getUserSolanaWalletFromPrivy 
} from './wallet-utils'

// Metadata Operations
export { 
  createOnChainAttributes, 
  createWorkMetadata, 
  createMetadataReference, 
  storeMetadataInDatabase,
  storeMetadataOnChain 
} from './metadata'

// NFT Operations
export { 
  mintWorkNFT, 
  getAssetData, 
  getAssetAttributes 
} from './nft-operations'

// Collection Operations
export { 
  createOrganizationAttributes,
  createOrganizationCollection,
  addOrganizationMember,
  checkOrganizationMembership,
  getOrganizationMembers,
  createOrganizationAsset,
  getCollectionData,
  getCollectionAttributes
} from './collections'

// Royalty Operations
export { 
  distributeRoyalties 
} from './royalties'

// Re-export key Metaplex types for convenience
export type { 
  AssetV1, 
  CollectionV1,
  Attribute 
} from '@metaplex-foundation/mpl-core'

export type { Umi } from '@metaplex-foundation/umi'