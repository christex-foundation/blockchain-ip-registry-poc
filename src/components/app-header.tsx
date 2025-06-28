'use client'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Menu, X, Zap, User, FileText, BarChart3 } from 'lucide-react'
import { usePrivyAuth } from '@/components/privy/use-privy-auth'

const iconMap = {
  'Dashboard': BarChart3,
  'Register Work': FileText,
  'Account': User,
}

export function AppHeader({ links = [] }: { links: { label: string; path: string }[] }) {
  const pathname = usePathname()
  const [showMenu, setShowMenu] = useState(false)
  const { logout, userEmail } = usePrivyAuth()

  function isActive(path: string) {
    return path === '/' ? pathname === '/' : pathname.startsWith(path)
  }

  return (
    <header className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-xl border-b border-gray-100 shadow-soft">
      <div className="mx-auto max-w-7xl px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link 
            className="flex items-center space-x-3 text-secondary hover:text-primary transition-colors duration-200" 
            href="/dashboard"
          >
            <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-primary shadow-medium">
              <Zap className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight">IP OnChain</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-2">
            {links.map(({ label, path }) => {
              const Icon = iconMap[label as keyof typeof iconMap]
              const active = isActive(path)
              
              return (
                <Link
                  key={path}
                  href={path}
                  className={`group flex items-center space-x-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                    active
                      ? 'bg-[#dcddff] text-[#7073d1] shadow-soft'
                      : 'text-[#202020] hover:text-[#7073d1] hover:bg-gray-50'
                  }`}
                >
                  {Icon && (
                    <Icon className={`h-4 w-4 transition-colors ${
                      active ? 'text-[#7073d1]' : 'text-gray-600 group-hover:text-[#7073d1]'
                    }`} />
                  )}
                  <span>{label}</span>
                </Link>
              )
            })}
          </nav>

          {/* User Menu */}
          <div className="hidden md:flex items-center space-x-4">
            <div className="flex items-center space-x-3 px-3 py-2 rounded-xl bg-gray-50 border">
              <div className="w-8 h-8 rounded-full bg-[#7073d1] flex items-center justify-center shadow-soft">
                <span className="text-sm font-bold text-white">
                  {userEmail?.[0]?.toUpperCase() || 'U'}
                </span>
              </div>
              <span className="text-sm font-medium text-[#202020] max-w-[120px] truncate">
                {userEmail || 'User'}
              </span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={logout}
              className="border-gray-200 text-[#202020] hover:text-[#7073d1] hover:bg-[#dcddff]/50 hover:border-[#7073d1]/30 transition-all duration-200 shadow-soft"
            >
              Sign Out
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <Button 
            variant="ghost" 
            size="icon" 
            className="md:hidden text-[#202020] hover:text-[#7073d1] hover:bg-gray-50 rounded-xl" 
            onClick={() => setShowMenu(!showMenu)}
          >
            {showMenu ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>

        {/* Mobile Menu */}
        {showMenu && (
          <div className="md:hidden mt-6 pb-4 border-t border-gray-100">
            <nav className="flex flex-col space-y-2 pt-6">
              {links.map(({ label, path }) => {
                const Icon = iconMap[label as keyof typeof iconMap]
                const active = isActive(path)
                
                return (
                  <Link
                    key={path}
                    href={path}
                    onClick={() => setShowMenu(false)}
                    className={`group flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                      active
                        ? 'bg-[#dcddff] text-[#7073d1] shadow-soft'
                        : 'text-[#202020] hover:text-[#7073d1] hover:bg-gray-50'
                    }`}
                  >
                    {Icon && (
                      <Icon className={`h-4 w-4 transition-colors ${
                        active ? 'text-[#7073d1]' : 'text-gray-600 group-hover:text-[#7073d1]'
                      }`} />
                    )}
                    <span>{label}</span>
                  </Link>
                )
              })}
              
              <div className="pt-6 mt-4 border-t border-gray-100">
                <div className="flex items-center space-x-3 px-4 py-3 mb-4 bg-gray-50 rounded-xl border">
                  <div className="w-10 h-10 rounded-full bg-[#7073d1] flex items-center justify-center shadow-soft">
                    <span className="text-sm font-bold text-white">
                      {userEmail?.[0]?.toUpperCase() || 'U'}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="block text-sm font-medium text-[#202020] truncate">
                      {userEmail || 'User'}
                    </span>
                  </div>
                </div>
                <Button
                  variant="outline"
                  onClick={logout}
                  className="w-full border-gray-200 text-[#202020] hover:text-[#7073d1] hover:bg-[#dcddff]/50 hover:border-[#7073d1]/30 transition-all duration-200 shadow-soft"
                >
                  Sign Out
                </Button>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  )
}
