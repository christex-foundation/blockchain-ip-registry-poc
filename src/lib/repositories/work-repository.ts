import { createServerSupabaseClient, Database } from '../supabase'
import { mintWorkNFT, getAssetData, getAssetAttributes } from '../onchain'

type Work = Database['public']['Tables']['works']['Row']
type WorkInsert = Database['public']['Tables']['works']['Insert']
type WorkUpdate = Database['public']['Tables']['works']['Update']
type Contributor = Database['public']['Tables']['contributors']['Row']

export interface WorkWithContributors extends Work {
  contributors: Contributor[]
}

export class WorkRepository {
  private static getSupabaseClient() {
    return createServerSupabaseClient()
  }

  static async findById(id: string): Promise<Work | null> {
    const supabase = this.getSupabaseClient()

    const { data, error } = await supabase.from('works').select('*').eq('id', id).single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null
      }
      throw new Error(`Failed to find work by ID: ${error.message}`)
    }

    return data
  }

  static async findByIdWithContributors(id: string): Promise<WorkWithContributors | null> {
    const supabase = this.getSupabaseClient()

    const { data, error } = await supabase
      .from('works')
      .select(
        `
        *,
        contributors (*)
      `,
      )
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null
      }
      throw new Error(`Failed to find work with contributors: ${error.message}`)
    }

    return data as WorkWithContributors
  }

  static async findAllWithContributors(): Promise<WorkWithContributors[]> {
    const supabase = this.getSupabaseClient()

    const { data, error } = await supabase
      .from('works')
      .select(
        `
        *,
        contributors (*)
      `,
      )
      .order('created_at', { ascending: false })

    if (error) {
      throw new Error(`Failed to find works with contributors: ${error.message}`)
    }

    return (data || []) as WorkWithContributors[]
  }

  static async findByISRC(isrc: string): Promise<Work | null> {
    const supabase = this.getSupabaseClient()

    const { data, error } = await supabase.from('works').select('*').eq('isrc', isrc).single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null
      }
      throw new Error(`Failed to find work by ISRC: ${error.message}`)
    }

    return data
  }

  static async createWork(workData: WorkInsert): Promise<Work> {
    const supabase = this.getSupabaseClient()

    const { data, error } = await supabase.from('works').insert(workData).select().single()

    if (error) {
      throw new Error(`Failed to create work: ${error.message}`)
    }

    return data
  }

  static async updateWork(id: string, updates: WorkUpdate): Promise<Work> {
    const supabase = this.getSupabaseClient()

    const { data, error } = await supabase.from('works').update(updates).eq('id', id).select().single()

    if (error) {
      throw new Error(`Failed to update work: ${error.message}`)
    }

    return data
  }

  static async updateNftMintAddress(id: string, mintAddress: string): Promise<Work> {
    return this.updateWork(id, { nft_mint_address: mintAddress })
  }

  static async updateMetadataUri(id: string, metadataUri: string): Promise<Work> {
    return this.updateWork(id, { metadata_uri: metadataUri })
  }

  static async deleteWork(id: string): Promise<void> {
    const supabase = this.getSupabaseClient()

    const { error } = await supabase.from('works').delete().eq('id', id)

    if (error) {
      throw new Error(`Failed to delete work: ${error.message}`)
    }
  }

  static async getWorkCount(): Promise<number> {
    const supabase = this.getSupabaseClient()

    const { count, error } = await supabase.from('works').select('*', { count: 'exact', head: true })

    if (error) {
      throw new Error(`Failed to get work count: ${error.message}`)
    }

    return count || 0
  }

  /**
   * Mint work as NFT and update database record
   * Delegates to onchain module for blockchain operations
   */
  static async mintWorkNFT(params: {
    workId: string
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
  }) {
    // Mint the NFT using onchain module
    const result = await mintWorkNFT(params)
    
    // Update database with blockchain information
    await this.updateNftMintAddress(params.workId, result.assetId)
    await this.updateMetadataUri(params.workId, params.metadata.uri)
    
    return result
  }

  /**
   * Get work's blockchain asset data
   * Delegates to onchain module for asset fetching
   */
  static async getWorkAssetData(workId: string) {
    const work = await this.findById(workId)
    if (!work?.nft_mint_address) {
      return null
    }
    
    return getAssetData(work.nft_mint_address)
  }

  /**
   * Get work's on-chain attributes
   * Delegates to onchain module for attribute fetching
   */
  static async getWorkOnChainAttributes(workId: string) {
    const work = await this.findById(workId)
    if (!work?.nft_mint_address) {
      return null
    }
    
    return getAssetAttributes(work.nft_mint_address)
  }
}
