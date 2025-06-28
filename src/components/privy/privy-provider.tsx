'use client'

import { PrivyProvider } from '@privy-io/react-auth'
import { ReactNode } from 'react'

interface PrivyAppProviderProps {
  children: ReactNode
}

export function PrivyAppProvider({ children }: PrivyAppProviderProps) {
  const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID

  if (!appId) {
    throw new Error('NEXT_PUBLIC_PRIVY_APP_ID is required')
  }

  return (
    <PrivyProvider
      appId={appId}
      config={{
        // Customize Privy's appearance and behavior
        appearance: {
          theme: 'light',
          accentColor: '#7073d1',
          logo: '/logo.png', // Add your logo here
        },
        // Configure embedded wallets
        embeddedWallets: {
          createOnLogin: 'users-without-wallets',
          requireUserPasswordOnCreate: false,
        },
        // Configure login methods
        loginMethods: ['email', 'wallet'],
        // Configure supported chains
        supportedChains: [
          {
            id: 103, // Solana Devnet
            name: 'Solana Devnet',
            network: 'solana-devnet',
            nativeCurrency: {
              name: 'SOL',
              symbol: 'SOL',
              decimals: 9,
            },
            rpcUrls: {
              default: {
                http: ['https://api.devnet.solana.com'],
              },
            },
          },
        ],
      }}
    >
      {children}
    </PrivyProvider>
  )
} 
