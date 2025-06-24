import type { Metadata } from 'next'
import './globals.css'
import { AppProviders } from '@/components/app-providers'
import { LandingLayout } from '@/components/landing-layout'
import React from 'react'

export const metadata: Metadata = {
  title: 'IP OnChain - Intellectual Property on Blockchain',
  description: 'The blockchain platform for intellectual property registration and royalty management',
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`antialiased`}>
        <AppProviders>
          <LandingLayout>{children}</LandingLayout>
        </AppProviders>
      </body>
    </html>
  )
}

declare global {
  interface BigInt {
    toJSON(): string
  }
}

BigInt.prototype.toJSON = function () {
  return this.toString()
}
