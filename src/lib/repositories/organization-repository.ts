import { createServerSupabaseClient, Database } from '../supabase'
import { UserRepository } from './user-repository'

type Organization = Database['public']['Tables']['organizations']['Row']
type OrganizationInsert = Database['public']['Tables']['organizations']['Insert']
type OrganizationUpdate = Database['public']['Tables']['organizations']['Update']
type OrganizationMember = Database['public']['Tables']['organization_members']['Row']
type OrganizationMemberInsert = Database['public']['Tables']['organization_members']['Insert']

export interface OrganizationWithMembers extends Organization {
  members?: OrganizationMember[]
}

export class OrganizationRepository {
  private static getSupabaseClient() {
    return createServerSupabaseClient()
  }

  static async findById(id: string): Promise<Organization | null> {
    const supabase = this.getSupabaseClient()

    const { data, error } = await supabase.from('organizations').select('*').eq('id', id).single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null
      }
      throw new Error(`Failed to find organization by ID: ${error.message}`)
    }

    return data
  }

  static async findByIdWithMembers(id: string): Promise<OrganizationWithMembers | null> {
    const supabase = this.getSupabaseClient()

    const { data, error } = await supabase
      .from('organizations')
      .select(
        `
        *,
        organization_members (*)
      `,
      )
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null
      }
      throw new Error(`Failed to find organization with members: ${error.message}`)
    }

    return data as OrganizationWithMembers
  }

  static async findByCollectionAddress(collectionAddress: string): Promise<Organization | null> {
    const supabase = this.getSupabaseClient()

    const { data, error } = await supabase
      .from('organizations')
      .select('*')
      .eq('collection_address', collectionAddress)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null
      }
      throw new Error(`Failed to find organization by collection address: ${error.message}`)
    }

    return data
  }

  static async findUserOrganizations(privyUserId: string): Promise<Organization[]> {
    const supabase = this.getSupabaseClient()

    // First, find the internal user ID from the Privy user ID
    const user = await UserRepository.findByPrivyUserId(privyUserId)
    if (!user) {
      // If user doesn't exist in our database, return empty array
      return []
    }

    const { data, error } = await supabase
      .from('organizations')
      .select(
        `
        *,
        organization_members!inner (
          user_id,
          role
        )
      `,
      )
      .eq('organization_members.user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      throw new Error(`Failed to find user organizations: ${error.message}`)
    }

    return (data || []) as Organization[]
  }

  static async createOrganization(organizationData: OrganizationInsert): Promise<Organization> {
    const supabase = this.getSupabaseClient()

    const { data, error } = await supabase.from('organizations').insert(organizationData).select().single()

    if (error) {
      throw new Error(`Failed to create organization: ${error.message}`)
    }

    return data
  }

  static async updateOrganization(id: string, updates: OrganizationUpdate): Promise<Organization> {
    const supabase = this.getSupabaseClient()

    const { data, error } = await supabase.from('organizations').update(updates).eq('id', id).select().single()

    if (error) {
      throw new Error(`Failed to update organization: ${error.message}`)
    }

    return data
  }

  static async updateCollectionAddress(id: string, collectionAddress: string): Promise<Organization> {
    return this.updateOrganization(id, { collection_address: collectionAddress })
  }

  static async addMember(memberData: OrganizationMemberInsert): Promise<OrganizationMember> {
    const supabase = this.getSupabaseClient()

    const { data, error } = await supabase.from('organization_members').insert(memberData).select().single()

    if (error) {
      if (error.code === '23505') {
        // Unique violation
        throw new Error('User is already a member of this organization')
      }
      throw new Error(`Failed to add organization member: ${error.message}`)
    }

    return data
  }

  static async updateMemberRole(organizationId: string, userId: string, role: 'owner' | 'admin' | 'member'): Promise<OrganizationMember> {
    const supabase = this.getSupabaseClient()

    const { data, error } = await supabase
      .from('organization_members')
      .update({ role })
      .eq('organization_id', organizationId)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to update member role: ${error.message}`)
    }

    return data
  }

  static async removeMember(organizationId: string, userId: string): Promise<void> {
    const supabase = this.getSupabaseClient()

    const { error } = await supabase
      .from('organization_members')
      .delete()
      .eq('organization_id', organizationId)
      .eq('user_id', userId)

    if (error) {
      throw new Error(`Failed to remove organization member: ${error.message}`)
    }
  }

  static async getMemberRole(organizationId: string, privyUserId: string): Promise<string | null> {
    const supabase = this.getSupabaseClient()

    // First, find the internal user ID from the Privy user ID
    const user = await UserRepository.findByPrivyUserId(privyUserId)
    if (!user) {
      return null
    }

    const { data, error } = await supabase
      .from('organization_members')
      .select('role')
      .eq('organization_id', organizationId)
      .eq('user_id', user.id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null
      }
      throw new Error(`Failed to get member role: ${error.message}`)
    }

    return data.role
  }

  static async isMember(organizationId: string, privyUserId: string): Promise<boolean> {
    const role = await this.getMemberRole(organizationId, privyUserId)
    return role !== null
  }

  static async hasPermission(organizationId: string, privyUserId: string, requiredRoles: string[]): Promise<boolean> {
    const role = await this.getMemberRole(organizationId, privyUserId)
    return role !== null && requiredRoles.includes(role)
  }
}