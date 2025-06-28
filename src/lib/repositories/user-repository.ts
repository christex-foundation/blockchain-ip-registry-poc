import { createServerSupabaseClient, Database } from '../supabase'

type User = Database['public']['Tables']['users']['Row']
type UserInsert = Database['public']['Tables']['users']['Insert']
type UserUpdate = Database['public']['Tables']['users']['Update']

export class UserRepository {
  private static getSupabaseClient() {
    return createServerSupabaseClient()
  }

  static async findByPrivyUserId(privyUserId: string): Promise<User | null> {
    const supabase = this.getSupabaseClient()

    const { data, error } = await supabase.from('users').select('*').eq('privy_user_id', privyUserId).single()

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows returned
        return null
      }
      throw new Error(`Failed to find user by Privy ID: ${error.message}`)
    }

    return data
  }

  static async findById(id: string): Promise<User | null> {
    const supabase = this.getSupabaseClient()

    const { data, error } = await supabase.from('users').select('*').eq('id', id).single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null
      }
      throw new Error(`Failed to find user by ID: ${error.message}`)
    }

    return data
  }

  static async createUser(userData: UserInsert): Promise<User> {
    const supabase = this.getSupabaseClient()

    const { data, error } = await supabase.from('users').insert(userData).select().single()

    if (error) {
      throw new Error(`Failed to create user: ${error.message}`)
    }

    return data
  }

  static async updateUser(id: string, updates: UserUpdate): Promise<User> {
    const supabase = this.getSupabaseClient()

    const { data, error } = await supabase.from('users').update(updates).eq('id', id).select().single()

    if (error) {
      throw new Error(`Failed to update user: ${error.message}`)
    }

    return data
  }

  static async upsertUserByPrivyId(userData: UserInsert): Promise<User> {
    const supabase = this.getSupabaseClient()

    const { data, error } = await supabase
      .from('users')
      .upsert(userData, {
        onConflict: 'privy_user_id',
      })
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to upsert user: ${error.message}`)
    }

    return data
  }
}
