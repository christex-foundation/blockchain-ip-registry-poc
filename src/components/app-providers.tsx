'use client'

import { ThemeProvider } from '@/components/theme-provider'
import { ReactQueryProvider } from './react-query-provider'
import { PrivyAppProvider } from '@/components/privy/privy-provider'
import { Toaster } from '@/components/ui/sonner'
import React from 'react'

export function AppProviders({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <ReactQueryProvider>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
        <PrivyAppProvider>
          {children}
          <Toaster />
        </PrivyAppProvider>
      </ThemeProvider>
    </ReactQueryProvider>
  )
}
