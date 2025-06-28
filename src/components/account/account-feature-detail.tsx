import { assertIsAddress } from 'gill'
import { useMemo } from 'react'
import { useParams } from 'next/navigation'
import { ExplorerLink } from '@/components/cluster/cluster-ui'
import { ellipsify } from '@/lib/utils'
import { Copy, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'

import { AccountBalance, AccountButtons, AccountTokens, AccountTransactions } from './account-ui'

export default function AccountFeatureDetail() {
  const params = useParams()
  const address = useMemo(() => {
    if (!params.address || typeof params.address !== 'string') {
      return
    }
    assertIsAddress(params.address)
    return params.address
  }, [params])
  
  if (!address) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-foreground mb-2">Error Loading Account</h2>
          <p className="text-muted-foreground">Unable to load account information. Please check the address and try again.</p>
        </div>
      </div>
    )
  }

  const copyAddress = async () => {
    await navigator.clipboard.writeText(address.toString())
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Account Header */}
        <div className="bg-card rounded-2xl p-8 mb-8 shadow-soft border border-border/50">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
            {/* Balance Section */}
            <div className="lg:col-span-2">
              <div className="mb-4">
                <AccountBalance address={address} />
              </div>
              <div className="flex items-center gap-4 mb-6">
                <div className="flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-2">
                  <span className="font-mono text-sm text-muted-foreground">
                    {ellipsify(address.toString(), 12)}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={copyAddress}
                    className="h-6 w-6 p-0 hover:bg-accent"
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
                <ExplorerLink address={address.toString()}>
                  <Button variant="ghost" size="sm" className="gap-2">
                    <ExternalLink className="h-4 w-4" />
                    Explorer
                  </Button>
                </ExplorerLink>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="lg:col-span-1">
              <AccountButtons address={address} />
            </div>
          </div>
        </div>

        {/* Account Content Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
          {/* Main Content */}
          <div className="xl:col-span-8 space-y-8">
            <AccountTokens address={address} />
          </div>
          
          {/* Sidebar */}
          <div className="xl:col-span-4 space-y-8">
            <AccountTransactions address={address} />
          </div>
        </div>
      </div>
    </div>
  )
}
