'use client'

import { usePathname } from 'next/navigation'
import { LandingLayout } from './landing-layout'
import { AppLayout } from './app-layout'

const dashboardLinks = [
  { label: 'Dashboard', path: '/dashboard' },
  { label: 'Register Work', path: '/register-work' },
  { label: 'Account', path: '/account' },
]

export function AppLayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  
  // Use landing layout for home page
  if (pathname === '/') {
    return <LandingLayout>{children}</LandingLayout>
  }
  
  // Use landing layout for auth pages
  if (pathname.startsWith('/auth')) {
    return <LandingLayout>{children}</LandingLayout>
  }
  
  // Use app layout for dashboard and other authenticated pages
  return <AppLayout links={dashboardLinks}>{children}</AppLayout>
} 
