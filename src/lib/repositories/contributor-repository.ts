import { createServerSupabaseClient, Database } from '../supabase'

type Contributor = Database['public']['Tables']['contributors']['Row']
type ContributorInsert = Database['public']['Tables']['contributors']['Insert']
type ContributorUpdate = Database['public']['Tables']['contributors']['Update']

export class ContributorRepository {
  private static getSupabaseClient() {
    return createServerSupabaseClient()
  }

  static async findById(id: string): Promise<Contributor | null> {
    const supabase = this.getSupabaseClient()

    const { data, error } = await supabase.from('contributors').select('*').eq('id', id).single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null
      }
      throw new Error(`Failed to find contributor by ID: ${error.message}`)
    }

    return data
  }

  static async findByWorkId(workId: string): Promise<Contributor[]> {
    const supabase = this.getSupabaseClient()

    const { data, error } = await supabase
      .from('contributors')
      .select('*')
      .eq('work_id', workId)
      .order('royalty_share', { ascending: false })

    if (error) {
      throw new Error(`Failed to find contributors by work ID: ${error.message}`)
    }

    return data || []
  }

  static async findByWalletAddress(walletAddress: string): Promise<Contributor[]> {
    const supabase = this.getSupabaseClient()

    const { data, error } = await supabase.from('contributors').select('*').eq('wallet_address', walletAddress)

    if (error) {
      throw new Error(`Failed to find contributors by wallet address: ${error.message}`)
    }

    return data || []
  }

  static async createContributor(contributorData: ContributorInsert): Promise<Contributor> {
    const supabase = this.getSupabaseClient()

    const { data, error } = await supabase.from('contributors').insert(contributorData).select().single()

    if (error) {
      throw new Error(`Failed to create contributor: ${error.message}`)
    }

    return data
  }

  static async createMultipleContributors(contributorsData: ContributorInsert[]): Promise<Contributor[]> {
    const supabase = this.getSupabaseClient()

    const { data, error } = await supabase.from('contributors').insert(contributorsData).select()

    if (error) {
      throw new Error(`Failed to create contributors: ${error.message}`)
    }

    return data || []
  }

  static async updateContributor(id: string, updates: ContributorUpdate): Promise<Contributor> {
    const supabase = this.getSupabaseClient()

    const { data, error } = await supabase.from('contributors').update(updates).eq('id', id).select().single()

    if (error) {
      throw new Error(`Failed to update contributor: ${error.message}`)
    }

    return data
  }

  static async deleteContributor(id: string): Promise<void> {
    const supabase = this.getSupabaseClient()

    const { error } = await supabase.from('contributors').delete().eq('id', id)

    if (error) {
      throw new Error(`Failed to delete contributor: ${error.message}`)
    }
  }

  static async deleteContributorsByWorkId(workId: string): Promise<void> {
    const supabase = this.getSupabaseClient()

    const { error } = await supabase.from('contributors').delete().eq('work_id', workId)

    if (error) {
      throw new Error(`Failed to delete contributors by work ID: ${error.message}`)
    }
  }

  static async validateRoyaltySharesTotal(workId: string): Promise<boolean> {
    const contributors = await this.findByWorkId(workId)
    const totalShares = contributors.reduce((sum, contributor) => sum + contributor.royalty_share, 0)
    return totalShares === 100
  }

  static async getTotalRoyaltyShares(workId: string): Promise<number> {
    const contributors = await this.findByWorkId(workId)
    return contributors.reduce((sum, contributor) => sum + contributor.royalty_share, 0)
  }
}
