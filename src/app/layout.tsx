import type { Metadata } from 'next'
import './globals.css'
import { AppProviders } from '@/components/app-providers'
import { AppLayoutWrapper } from '@/components/app-layout-wrapper'
import React from 'react'

export const metadata: Metadata = {
  title: 'Volcano - Protect Your Intellectual Property',
  description: 'Volcano creates immutable records of your creative works on the blockchain, automatically distributing royalties to all contributors.',
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`antialiased`}>
        <AppProviders>
          <AppLayoutWrapper>{children}</AppLayoutWrapper>
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
