import { ReactNode } from 'react'
import { useWalletUi } from '@wallet-ui/react'
import { WalletButton } from '@/components/solana/solana-provider'
import { Wallet, Shield, Zap } from 'lucide-react'

export default function AccountFeatureIndex({ redirect }: { redirect: (path: string) => ReactNode }) {
  const { account } = useWalletUi()

  if (account) {
    return redirect(`/account/${account.address.toString()}`)
  }

  return (
    <div className="min-h-[80vh] bg-gradient-to-br from-background via-background to-accent/5">
      <div className="max-w-4xl mx-auto px-6 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-primary/10 rounded-full mb-8">
            <Wallet className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6 text-balance">
            Connect Your Wallet
          </h1>
          <p className="text-xl text-muted-foreground mb-8 text-balance max-w-2xl mx-auto">
            Access your account dashboard to manage your assets, view transaction history, and interact with the blockchain
          </p>
          <WalletButton />
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
          <div className="bg-card rounded-xl p-8 shadow-soft border border-border/50 hover:shadow-medium transition-all duration-200">
            <div className="flex items-center justify-center w-12 h-12 bg-primary/10 rounded-lg mb-6">
              <Shield className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-3">Secure Access</h3>
            <p className="text-muted-foreground">
              Your wallet provides secure access to your account with industry-standard encryption and safety measures.
            </p>
          </div>

          <div className="bg-card rounded-xl p-8 shadow-soft border border-border/50 hover:shadow-medium transition-all duration-200">
            <div className="flex items-center justify-center w-12 h-12 bg-primary/10 rounded-lg mb-6">
              <Zap className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-3">Real-time Data</h3>
            <p className="text-muted-foreground">
              View live balance updates, transaction history, and token holdings with real-time blockchain data.
            </p>
          </div>

          <div className="bg-card rounded-xl p-8 shadow-soft border border-border/50 hover:shadow-medium transition-all duration-200">
            <div className="flex items-center justify-center w-12 h-12 bg-primary/10 rounded-lg mb-6">
              <Wallet className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-3">Asset Management</h3>
            <p className="text-muted-foreground">
              Send, receive, and manage your digital assets with an intuitive and professional interface.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
