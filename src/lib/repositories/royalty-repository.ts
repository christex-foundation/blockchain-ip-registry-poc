import { createServerSupabaseClient, Database } from '../supabase'
import { distributeRoyalties } from '../onchain'

type RoyaltyDistribution = Database['public']['Tables']['royalty_distributions']['Row']
type RoyaltyDistributionInsert = Database['public']['Tables']['royalty_distributions']['Insert']
type RoyaltyDistributionUpdate = Database['public']['Tables']['royalty_distributions']['Update']

export type RoyaltyStatus = 'pending' | 'processing' | 'completed' | 'failed'

export class RoyaltyRepository {
  private static getSupabaseClient() {
    return createServerSupabaseClient()
  }

  static async findById(id: string): Promise<RoyaltyDistribution | null> {
    const supabase = this.getSupabaseClient()

    const { data, error } = await supabase.from('royalty_distributions').select('*').eq('id', id).single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null
      }
      throw new Error(`Failed to find royalty distribution by ID: ${error.message}`)
    }

    return data
  }

  static async findByWorkId(workId: string): Promise<RoyaltyDistribution[]> {
    const supabase = this.getSupabaseClient()

    const { data, error } = await supabase
      .from('royalty_distributions')
      .select('*')
      .eq('work_id', workId)
      .order('created_at', { ascending: false })

    if (error) {
      throw new Error(`Failed to find royalty distributions by work ID: ${error.message}`)
    }

    return data || []
  }

  static async findByStatus(status: RoyaltyStatus): Promise<RoyaltyDistribution[]> {
    const supabase = this.getSupabaseClient()

    const { data, error } = await supabase
      .from('royalty_distributions')
      .select('*')
      .eq('status', status)
      .order('created_at', { ascending: false })

    if (error) {
      throw new Error(`Failed to find royalty distributions by status: ${error.message}`)
    }

    return data || []
  }

  static async findAll(): Promise<RoyaltyDistribution[]> {
    const supabase = this.getSupabaseClient()

    const { data, error } = await supabase
      .from('royalty_distributions')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      throw new Error(`Failed to find all royalty distributions: ${error.message}`)
    }

    return data || []
  }

  static async createRoyaltyDistribution(distributionData: RoyaltyDistributionInsert): Promise<RoyaltyDistribution> {
    const supabase = this.getSupabaseClient()

    const { data, error } = await supabase.from('royalty_distributions').insert(distributionData).select().single()

    if (error) {
      throw new Error(`Failed to create royalty distribution: ${error.message}`)
    }

    return data
  }

  static async updateRoyaltyDistribution(id: string, updates: RoyaltyDistributionUpdate): Promise<RoyaltyDistribution> {
    const supabase = this.getSupabaseClient()

    const { data, error } = await supabase.from('royalty_distributions').update(updates).eq('id', id).select().single()

    if (error) {
      throw new Error(`Failed to update royalty distribution: ${error.message}`)
    }

    return data
  }

  static async updateStatus(id: string, status: RoyaltyStatus): Promise<RoyaltyDistribution> {
    return this.updateRoyaltyDistribution(id, { status })
  }

  static async updateTransactionSignature(id: string, transactionSignature: string): Promise<RoyaltyDistribution> {
    return this.updateRoyaltyDistribution(id, {
      transaction_signature: transactionSignature,
      status: 'completed',
    })
  }

  static async markAsCompleted(id: string, transactionSignature: string): Promise<RoyaltyDistribution> {
    return this.updateRoyaltyDistribution(id, {
      status: 'completed',
      transaction_signature: transactionSignature,
    })
  }

  static async markAsFailed(id: string): Promise<RoyaltyDistribution> {
    return this.updateStatus(id, 'failed')
  }

  static async getTotalDistributedAmount(workId?: string): Promise<number> {
    const supabase = this.getSupabaseClient()

    let query = supabase.from('royalty_distributions').select('total_amount').eq('status', 'completed')

    if (workId) {
      query = query.eq('work_id', workId)
    }

    const { data, error } = await query

    if (error) {
      throw new Error(`Failed to get total distributed amount: ${error.message}`)
    }

    return (data || []).reduce((sum, distribution) => sum + distribution.total_amount, 0)
  }

  static async getDistributionCount(workId?: string): Promise<number> {
    const supabase = this.getSupabaseClient()

    let query = supabase.from('royalty_distributions').select('*', { count: 'exact', head: true })

    if (workId) {
      query = query.eq('work_id', workId)
    }

    const { count, error } = await query

    if (error) {
      throw new Error(`Failed to get distribution count: ${error.message}`)
    }

    return count || 0
  }

  /**
   * Execute royalty distribution and update database
   * Delegates to onchain module for blockchain operations
   */
  static async executeRoyaltyDistribution(distributionId: string, params: {
    fromWalletId: string
    distributions: Array<{
      toAddress: string
      amount: number // in lamports
      recipient: string
    }>
  }) {
    // Update status to processing
    await this.updateStatus(distributionId, 'processing')
    
    try {
      // Execute blockchain distribution
      const result = await distributeRoyalties(params)
      
      // Mark as completed with transaction signatures
      const signatures = result.distributions.map(d => d.signature).join(',')
      await this.markAsCompleted(distributionId, signatures)
      
      return result
    } catch (error) {
      // Mark as failed if distribution fails
      await this.markAsFailed(distributionId)
      throw error
    }
  }
}
