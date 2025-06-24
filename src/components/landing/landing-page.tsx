'use client'

import { Button } from '@/components/ui/button'

const navigationItems = [
  { label: 'FOR ARTISTS', href: '#artists' },
  { label: 'OUR STORY', href: '#story' },
  { label: 'LEARN', href: '#learn' },
]

const socialLinks = [
  { label: 'Instagram', href: '#', icon: '📷' },
  { label: 'Twitter', href: '#', icon: '🐦' },
  { label: 'LinkedIn', href: '#', icon: '💼' },
]

const features = [
  {
    number: '1',
    title: 'FREEDOM',
    description: 'Freedom to raise funds anytime you need from the music you own.',
  },
  {
    number: '2',
    title: 'COMMUNITY',
    description: 'An engaged community of fans that are closer to you than ever before.',
  },
  {
    number: '3',
    title: 'CONTROL',
    description: 'Let fans get involved in your songs&apos; governance without losing control. Veto any decision they take.',
  },
]

const howItWorks = [
  {
    number: '1',
    title: 'REGISTER',
    description: 'Register your creative works and establish ownership on the blockchain.',
  },
  {
    number: '2',
    title: 'MINT',
    description: 'Mint NFTs that represent ownership shares in your intellectual property.',
  },
  {
    number: '3',
    title: 'DISTRIBUTE',
    description: 'Automate royalty distributions to contributors and stakeholders.',
  },
]

export function LandingPage() {

  return (
    <div className="min-h-screen bg-background text-foreground overflow-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 glass">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                <div className="w-4 h-4 bg-white rounded-sm"></div>
              </div>
              <span className="text-xl font-bold">IP ONCHAIN</span>
            </div>

            {/* Navigation Items */}
            <div className="hidden md:flex items-center space-x-8">
              {navigationItems.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  className="text-sm font-medium hover:text-purple-400 transition-colors"
                >
                  {item.label}
                </a>
              ))}
            </div>

            {/* Social Links & CTA */}
            <div className="flex items-center space-x-4">
              <div className="hidden md:flex items-center space-x-3">
                {socialLinks.map((social) => (
                  <a
                    key={social.label}
                    href={social.href}
                    className="text-lg hover:text-purple-400 transition-colors"
                  >
                    {social.icon}
                  </a>
                ))}
              </div>
              <Button className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-6 py-2 rounded-full font-medium glow">
                Join
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="space-y-6">
                <h1 className="text-6xl lg:text-7xl font-bold leading-tight">
                  INTELLECTUAL
                  <br />
                  <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                    PROPERTY
                  </span>
                  <br />
                  ON-CHAIN
                </h1>
                <p className="text-xl text-muted-foreground max-w-lg">
                  The blockchain platform for those who create and own intellectual property.
                </p>
              </div>
              <Button className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-8 py-4 rounded-full text-lg font-medium glow">
                Early Access
              </Button>
            </div>

            {/* 3D Illustration Placeholder */}
            <div className="relative">
              <div className="glass rounded-3xl p-8 float">
                <div className="aspect-square bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-2xl flex items-center justify-center">
                  <div className="text-center space-y-4">
                    <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl mx-auto flex items-center justify-center">
                      <div className="w-8 h-8 bg-white rounded-lg"></div>
                    </div>
                    <div className="space-y-2">
                      <div className="text-2xl font-bold">$420.69</div>
                      <div className="text-sm text-muted-foreground">Portfolio Value</div>
                    </div>
                  </div>
                </div>
              </div>
              {/* Floating elements */}
              <div className="absolute -top-4 -right-4 w-8 h-8 bg-purple-500 rounded-full sparkle"></div>
              <div className="absolute -bottom-4 -left-4 w-6 h-6 bg-pink-500 rounded-full sparkle"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8">
              <h2 className="text-4xl font-bold">
                WHAT YOU'LL UNLOCK WITH{' '}
                <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                  IP ONCHAIN
                </span>
              </h2>
              <div className="space-y-8">
                {features.map((feature) => (
                  <div key={feature.number} className="flex space-x-6">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold">
                        {feature.number}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-2xl font-bold">{feature.title}</h3>
                      <p className="text-muted-foreground">{feature.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Illustration */}
            <div className="relative">
              <div className="glass rounded-3xl p-8 float">
                <div className="aspect-square bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-2xl flex items-center justify-center">
                  <div className="text-center space-y-6">
                    <div className="relative">
                      <div className="w-32 h-32 bg-gradient-to-br from-purple-500/30 to-pink-500/30 rounded-3xl mx-auto"></div>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl"></div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="text-lg font-semibold">Creative Freedom</div>
                      <div className="text-sm text-muted-foreground">Unlock new possibilities</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Illustration */}
            <div className="relative order-2 lg:order-1">
              <div className="glass rounded-3xl p-8 float">
                <div className="aspect-square bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-2xl flex items-center justify-center">
                  <div className="text-center space-y-6">
                    <div className="relative">
                      <div className="w-24 h-24 bg-gradient-to-br from-purple-500/30 to-pink-500/30 rounded-full mx-auto flex items-center justify-center">
                        <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"></div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="text-lg font-semibold">Automated Process</div>
                      <div className="text-sm text-muted-foreground">Seamless workflow</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-8 order-1 lg:order-2">
              <h2 className="text-4xl font-bold">
                HOW IT{' '}
                <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                  WORKS
                </span>
              </h2>
              <div className="space-y-8">
                {howItWorks.map((step) => (
                  <div key={step.number} className="flex space-x-6">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold">
                        {step.number}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-2xl font-bold">{step.title}</h3>
                      <p className="text-muted-foreground">{step.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <h2 className="text-5xl font-bold">
            Ready to{' '}
            <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Transform
            </span>{' '}
            Your IP?
          </h2>
          <p className="text-xl text-muted-foreground">
            Join the future of intellectual property management on the blockchain.
          </p>
          <Button className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-12 py-4 rounded-full text-lg font-medium glow">
            Get Started Today
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-border/50">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                <div className="w-4 h-4 bg-white rounded-sm"></div>
              </div>
              <span className="text-lg font-bold">IP ONCHAIN</span>
            </div>
            <div className="text-sm text-muted-foreground">
              © 2024 IP OnChain. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
} 
