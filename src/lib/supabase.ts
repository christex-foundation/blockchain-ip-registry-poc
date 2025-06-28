import { createClient } from '@supabase/supabase-js'

// Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

// Client-side Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Server-side Supabase client (for API routes)
export const createServerSupabaseClient = () => {
  return createClient(supabaseUrl, process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseAnonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

// Database types
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          privy_user_id: string
          email: string | null
          embedded_wallet_address: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          privy_user_id: string
          email?: string | null
          embedded_wallet_address?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          privy_user_id?: string
          email?: string | null
          embedded_wallet_address?: string | null
          created_at?: string | null
        }
      }
      organizations: {
        Row: {
          id: string
          name: string
          collection_address: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          name: string
          collection_address?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          collection_address?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      organization_members: {
        Row: {
          id: string
          organization_id: string
          user_id: string
          role: 'owner' | 'admin' | 'member'
          created_at: string | null
        }
        Insert: {
          id?: string
          organization_id: string
          user_id: string
          role: 'owner' | 'admin' | 'member'
          created_at?: string | null
        }
        Update: {
          id?: string
          organization_id?: string
          user_id?: string
          role?: 'owner' | 'admin' | 'member'
          created_at?: string | null
        }
      }
      works: {
        Row: {
          id: string
          title: string
          isrc: string | null
          total_shares: number | null
          nft_mint_address: string | null
          metadata_uri: string | null
          organization_id: string | null
          created_by_user_id: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          title: string
          isrc?: string | null
          total_shares?: number | null
          nft_mint_address?: string | null
          metadata_uri?: string | null
          organization_id?: string | null
          created_by_user_id?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          title?: string
          isrc?: string | null
          total_shares?: number | null
          nft_mint_address?: string | null
          metadata_uri?: string | null
          organization_id?: string | null
          created_by_user_id?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      contributors: {
        Row: {
          id: string
          work_id: string | null
          name: string
          wallet_address: string
          royalty_share: number
          created_at: string | null
        }
        Insert: {
          id?: string
          work_id?: string | null
          name: string
          wallet_address: string
          royalty_share: number
          created_at?: string | null
        }
        Update: {
          id?: string
          work_id?: string | null
          name?: string
          wallet_address?: string
          royalty_share?: number
          created_at?: string | null
        }
      }
      royalty_distributions: {
        Row: {
          id: string
          work_id: string | null
          total_amount: number
          transaction_signature: string | null
          status: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          work_id?: string | null
          total_amount: number
          transaction_signature?: string | null
          status?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          work_id?: string | null
          total_amount?: number
          transaction_signature?: string | null
          status?: string | null
          created_at?: string | null
        }
      }
      usage_events: {
        Row: {
          id: string
          work_id: string
          event_type: 'stream' | 'download' | 'radio' | 'sync'
          platform: string
          play_count: number | null
          unit_count: number | null
          revenue_amount: number
          currency: string | null
          period_start: string
          period_end: string
          reported_at: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          work_id: string
          event_type: 'stream' | 'download' | 'radio' | 'sync'
          platform: string
          play_count?: number | null
          unit_count?: number | null
          revenue_amount: number
          currency?: string | null
          period_start: string
          period_end: string
          reported_at?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          work_id?: string
          event_type?: 'stream' | 'download' | 'radio' | 'sync'
          platform?: string
          play_count?: number | null
          unit_count?: number | null
          revenue_amount?: number
          currency?: string | null
          period_start?: string
          period_end?: string
          reported_at?: string | null
          created_at?: string | null
        }
      }
      royalty_earnings: {
        Row: {
          id: string
          work_id: string
          total_earnings: number
          performance_earnings: number
          mechanical_earnings: number
          sync_earnings: number
          last_calculated_at: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          work_id: string
          total_earnings?: number
          performance_earnings?: number
          mechanical_earnings?: number
          sync_earnings?: number
          last_calculated_at?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          work_id?: string
          total_earnings?: number
          performance_earnings?: number
          mechanical_earnings?: number
          sync_earnings?: number
          last_calculated_at?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
    }
  }
}
