'use client'

import { Button } from '@/components/ui/button'
import { Menu, Shield, Zap, Users } from 'lucide-react'
import Link from 'next/link'

export function LandingPage() {
  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background Image with Overlay */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1541599468348-e96984315921?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D')`,
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-black/70"></div>
      </div>

      {/* Content Overlay */}
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Navigation */}
        <nav className="w-full px-8 py-6">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <span className="text-2xl font-light text-white tracking-wide">volcano</span>
            </div>

            {/* Menu Button */}
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/10">
              <Menu className="h-6 w-6" />
            </Button>
          </div>
        </nav>

        {/* Main Content Grid */}
        <div className="flex-1 flex items-center justify-center px-8 py-12">
          <div className="max-w-7xl mx-auto w-full">
            {/* Bento Grid Layout */}
            <div className="grid grid-cols-12 grid-rows-8 gap-4 h-[80vh] max-h-[800px]">
              
              {/* Main Hero - Large center piece */}
              <div className="col-span-12 md:col-span-8 md:col-start-3 row-span-5 flex flex-col items-center justify-center text-center space-y-8">
                <h1 className="text-6xl md:text-8xl lg:text-9xl font-extralight text-white leading-none tracking-tight">
                  volcano
                </h1>
                
                <div className="space-y-6">
                  <h2 className="text-xl md:text-2xl lg:text-3xl font-light text-white/90">
                    How is intellectual property protected?
                  </h2>
                  <p className="text-base md:text-lg text-white/70 max-w-2xl mx-auto font-light leading-relaxed">
                    Volcano creates immutable records of your creative works on the blockchain, 
                    automatically distributing royalties to all contributors.
                  </p>
                </div>

                <Link href="/auth/login">
                  <Button 
                    size="lg" 
                    className="bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white border border-white/20 px-8 py-4 text-lg font-light tracking-wide transition-all duration-300"
                  >
                    Learn More!
                  </Button>
                </Link>
              </div>

              {/* Feature Cards - Minimal bento boxes */}
              <div className="col-span-4 md:col-span-2 row-span-2 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6 flex flex-col justify-center items-center text-center">
                <Shield className="h-8 w-8 text-white/70 mb-3" />
                <span className="text-sm font-light text-white/80">Secure</span>
                <span className="text-xs text-white/60 mt-1">Blockchain verified</span>
              </div>

              <div className="col-span-4 md:col-span-2 row-span-2 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6 flex flex-col justify-center items-center text-center">
                <Zap className="h-8 w-8 text-white/70 mb-3" />
                <span className="text-sm font-light text-white/80">Instant</span>
                <span className="text-xs text-white/60 mt-1">Auto royalties</span>
              </div>

              <div className="col-span-4 md:col-span-2 row-span-2 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6 flex flex-col justify-center items-center text-center">
                <Users className="h-8 w-8 text-white/70 mb-3" />
                <span className="text-sm font-light text-white/80">Collaborative</span>
                <span className="text-xs text-white/60 mt-1">Fair distribution</span>
              </div>

              {/* Stats Cards */}
              <div className="col-span-6 md:col-span-3 row-span-1 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-4 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-2xl font-light text-white">10K+</div>
                  <div className="text-xs text-white/60">Works Protected</div>
                </div>
              </div>

              <div className="col-span-6 md:col-span-3 row-span-1 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-4 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-2xl font-light text-white">$2M+</div>
                  <div className="text-xs text-white/60">Royalties Paid</div>
                </div>
              </div>

              <div className="col-span-6 md:col-span-3 row-span-1 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-4 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-2xl font-light text-white">500+</div>
                  <div className="text-xs text-white/60">Creators</div>
                </div>
              </div>

              <div className="col-span-6 md:col-span-3 row-span-1 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-4 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-2xl font-light text-white">24/7</div>
                  <div className="text-xs text-white/60">Protection</div>
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="w-full px-8 py-6">
          <div className="flex items-center justify-between text-white/60 text-sm">
            <div>© 2024 Volcano</div>
            <div className="flex items-center space-x-6">
              <span className="hover:text-white/80 cursor-pointer transition-colors">FB</span>
              <span className="hover:text-white/80 cursor-pointer transition-colors">INS</span>
              <span className="hover:text-white/80 cursor-pointer transition-colors">LIN</span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  )
} 
