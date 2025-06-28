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
      works: {
        Row: {
          id: string
          title: string
          isrc: string | null
          total_shares: number | null
          nft_mint_address: string | null
          metadata_uri: string | null
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
    }
  }
}
