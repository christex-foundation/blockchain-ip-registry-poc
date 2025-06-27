import { Connection, Keypair } from '@solana/web3.js'
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults'
import { keypairIdentity, Umi } from '@metaplex-foundation/umi'
import { mplCore } from '@metaplex-foundation/mpl-core'
import { fromWeb3JsKeypair } from '@metaplex-foundation/umi-web3js-adapters'

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

export { SERVER_KEYPAIR }

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