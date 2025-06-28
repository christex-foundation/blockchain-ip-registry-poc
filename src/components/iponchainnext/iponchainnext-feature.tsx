import { WalletButton } from '../solana/solana-provider'
import { IponchainnextCreate, IponchainnextProgram, IponchainnextProgramExplorerLink } from './iponchainnext-ui'
import { AppHero } from '../app-hero'
import { useWalletUi } from '@wallet-ui/react'

export default function IponchainnextFeature() {
  const { account } = useWalletUi()

  if (!account) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-card rounded-xl shadow-soft p-12 text-center">
          <h2 className="text-2xl font-bold text-foreground mb-4">Connect Your Wallet</h2>
          <p className="text-muted-foreground mb-6">Connect your wallet to interact with the IP OnChain program.</p>
          <WalletButton />
        </div>
      </div>
    )
  }

  return (
    <div>
      <AppHero title="Iponchainnext" subtitle={'Run the program by clicking the "Run program" button.'}>
        <p className="mb-6">
          <IponchainnextProgramExplorerLink />
        </p>
        <IponchainnextCreate />
      </AppHero>
      <IponchainnextProgram />
    </div>
  )
}
