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
    <header className="relative z-50 border-b border-slate-800/50 bg-slate-950/80 backdrop-blur-xl">
      <div className="mx-auto max-w-7xl px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link 
            className="flex items-center space-x-2 text-white hover:text-blue-400 transition-colors" 
            href="/dashboard"
          >
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-400">
              <Zap className="h-4 w-4 text-white" />
            </div>
            <span className="text-xl font-bold">IP OnChain</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1">
            {links.map(({ label, path }) => {
              const Icon = iconMap[label as keyof typeof iconMap]
              const active = isActive(path)
              
              return (
                <Link
                  key={path}
                  href={path}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    active
                      ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
                  }`}
                >
                  {Icon && <Icon className="h-4 w-4" />}
                  <span>{label}</span>
                </Link>
              )
            })}
          </nav>

          {/* User Menu */}
          <div className="hidden md:flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-sm">
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center">
                <span className="text-xs font-bold text-white">
                  {userEmail?.[0]?.toUpperCase() || 'U'}
                </span>
              </div>
              <span className="text-slate-300">{userEmail || 'User'}</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={logout}
              className="border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800/50 hover:border-slate-600"
            >
              Sign Out
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <Button 
            variant="ghost" 
            size="icon" 
            className="md:hidden text-slate-300 hover:text-white hover:bg-slate-800/50" 
            onClick={() => setShowMenu(!showMenu)}
          >
            {showMenu ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>

        {/* Mobile Menu */}
        {showMenu && (
          <div className="md:hidden mt-4 pb-4 border-t border-slate-800/50">
            <nav className="flex flex-col space-y-2 pt-4">
              {links.map(({ label, path }) => {
                const Icon = iconMap[label as keyof typeof iconMap]
                const active = isActive(path)
                
                return (
                  <Link
                    key={path}
                    href={path}
                    onClick={() => setShowMenu(false)}
                    className={`flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                      active
                        ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
                    }`}
                  >
                    {Icon && <Icon className="h-4 w-4" />}
                    <span>{label}</span>
                  </Link>
                )
              })}
              
              <div className="pt-4 mt-4 border-t border-slate-800/50">
                <div className="flex items-center space-x-3 px-4 py-2 mb-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center">
                    <span className="text-sm font-bold text-white">
                      {userEmail?.[0]?.toUpperCase() || 'U'}
                    </span>
                  </div>
                  <span className="text-slate-300">{userEmail || 'User'}</span>
                </div>
                <Button
                  variant="outline"
                  onClick={logout}
                  className="w-full border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800/50 hover:border-slate-600"
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
