import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
  }),
  useSearchParams: () => ({
    get: vi.fn(),
  }),
  usePathname: () => '/',
}))

// Mock Privy
vi.mock('@privy-io/react-auth', () => ({
  usePrivy: () => ({
    login: vi.fn(),
    logout: vi.fn(),
    user: null,
    authenticated: false,
    ready: true,
  }),
  PrivyProvider: ({ children }: { children: React.ReactNode }) => children,
}))

// Mock Supabase
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: null, error: null })),
        })),
      })),
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: {}, error: null })),
        })),
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({ data: {}, error: null })),
          })),
        })),
      })),
    })),
  },
  createServerSupabaseClient: vi.fn(),
}))

// Mock environment variables
process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://localhost:54321'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'

// Mock SERVER_WALLET_PRIVATE_KEY for Solana operations in tests
// This is a test-only keypair - not used in production
process.env.SERVER_WALLET_PRIVATE_KEY = JSON.stringify([
  127,104,46,101,168,190,190,18,17,114,108,42,38,101,39,137,6,248,41,102,255,136,230,9,74,136,154,179,167,151,245,120,253,96,252,38,15,23,178,120,212,21,23,160,137,91,17,233,208,83,19,51,43,67,207,96,146,91,171,174,105,34,173,24
])

// Mock other Solana-related environment variables
process.env.SOLANA_RPC_URL = 'https://api.devnet.solana.com'
process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000'
