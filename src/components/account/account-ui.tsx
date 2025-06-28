import { RefreshCw } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { ExplorerLink } from '@/components/cluster/cluster-ui'
import { ellipsify } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { AppAlert } from '@/components/app-alert'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { AppModal } from '@/components/app-modal'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useWalletUi } from '@wallet-ui/react'
import { address, Address, Lamports, lamportsToSol } from 'gill'
import { ErrorBoundary } from 'next/dist/client/components/error-boundary'
import {
  useGetBalanceQuery,
  useGetSignaturesQuery,
  useGetTokenAccountsQuery,
  useRequestAirdropMutation,
  useTransferSolMutation,
} from './account-data-access'

export function AccountBalance({ address }: { address: Address }) {
  const query = useGetBalanceQuery({ address })

  return (
    <div className="group">
      <div className="flex items-center gap-3 mb-2">
        <h1 className="text-4xl md:text-5xl font-bold text-foreground cursor-pointer hover:text-primary transition-colors" onClick={() => query.refetch()}>
          {query.data?.value ? <BalanceSol balance={query.data?.value} /> : '...'}
        </h1>
        <span className="text-2xl md:text-3xl font-semibold text-muted-foreground">SOL</span>
        {query.isLoading && (
          <div className="w-6 h-6 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
        )}
      </div>
      <p className="text-sm text-muted-foreground">Click to refresh balance</p>
    </div>
  )
}

export function AccountChecker() {
  const { account } = useWalletUi()
  if (!account) {
    return null
  }
  return <AccountBalanceCheck address={address(account.address)} />
}

export function AccountBalanceCheck({ address }: { address: Address }) {
  const { cluster } = useWalletUi()
  const mutation = useRequestAirdropMutation({ address })
  const query = useGetBalanceQuery({ address })

  if (query.isLoading) {
    return null
  }
  if (query.isError || !query.data?.value) {
    return (
      <AppAlert
        action={
          <Button variant="outline" onClick={() => mutation.mutateAsync(1).catch((err) => console.log(err))}>
            Request Airdrop
          </Button>
        }
      >
        You are connected to <strong>{cluster.label}</strong> but your account is not found on this cluster.
      </AppAlert>
    )
  }
  return null
}

export function AccountButtons({ address }: { address: Address }) {
  const { cluster } = useWalletUi()

  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-lg font-semibold text-foreground mb-2">Quick Actions</h3>
      <div className="flex flex-col sm:flex-row gap-3">
        {cluster.id === 'solana:mainnet' ? null : <ModalAirdrop address={address} />}
        <ErrorBoundary errorComponent={() => null}>
          <ModalSend address={address} />
        </ErrorBoundary>
        <ModalReceive address={address} />
      </div>
    </div>
  )
}

export function AccountTokens({ address }: { address: Address }) {
  const [showAll, setShowAll] = useState(false)
  const query = useGetTokenAccountsQuery({ address })
  const client = useQueryClient()
  const items = useMemo(() => {
    if (showAll) return query.data
    return query.data?.slice(0, 6)
  }, [query.data, showAll])

  return (
    <div className="bg-card rounded-2xl p-6 shadow-soft border border-border/50">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-foreground mb-1">Token Holdings</h2>
          <p className="text-sm text-muted-foreground">
            {query.data?.length || 0} token{(query.data?.length || 0) !== 1 ? 's' : ''} found
          </p>
        </div>
        <div className="flex items-center gap-2">
          {query.isLoading ? (
            <div className="w-5 h-5 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                await query.refetch()
                await client.invalidateQueries({
                  queryKey: ['getTokenAccountBalance'],
                })
              }}
              className="gap-2"
            >
              <RefreshCw size={14} />
              Refresh
            </Button>
          )}
        </div>
      </div>

      {query.isError && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 mb-4">
          <p className="text-destructive text-sm font-medium">Error loading token accounts</p>
          <p className="text-destructive/80 text-sm mt-1">{query.error?.message.toString()}</p>
        </div>
      )}

      {query.isSuccess && (
        <div>
          {query.data.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-muted/50 rounded-full flex items-center justify-center mx-auto mb-4">
                <RefreshCw className="w-6 h-6 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">No Token Accounts</h3>
              <p className="text-muted-foreground">This account doesn't hold any tokens yet.</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                {items?.map(({ account, pubkey }) => (
                  <div
                    key={pubkey.toString()}
                    className="bg-background rounded-lg p-4 border border-border/50 hover:shadow-medium transition-all duration-200 group"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                            <span className="text-xs font-bold text-primary">T</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">Token Account</p>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Account</p>
                            <ExplorerLink label={ellipsify(pubkey.toString(), 8)} address={pubkey.toString()}>
                              <span className="font-mono text-xs text-foreground hover:text-primary transition-colors cursor-pointer">
                                {ellipsify(pubkey.toString(), 8)}
                              </span>
                            </ExplorerLink>
                          </div>
                          
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Mint</p>
                            <ExplorerLink
                              label={ellipsify(account.data.parsed.info.mint, 8)}
                              address={account.data.parsed.info.mint.toString()}
                            >
                              <span className="font-mono text-xs text-foreground hover:text-primary transition-colors cursor-pointer">
                                {ellipsify(account.data.parsed.info.mint, 8)}
                              </span>
                            </ExplorerLink>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="border-t border-border/50 pt-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">Balance</span>
                        <span className="font-mono text-sm font-semibold text-foreground">
                          {account.data.parsed.info.tokenAmount.uiAmount}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {(query.data?.length ?? 0) > 6 && (
                <div className="text-center border-t border-border/50 pt-4">
                  <Button variant="outline" onClick={() => setShowAll(!showAll)} className="gap-2">
                    {showAll ? 'Show Less' : `Show All ${query.data?.length} Tokens`}
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}

export function AccountTransactions({ address }: { address: Address }) {
  const query = useGetSignaturesQuery({ address })
  const [showAll, setShowAll] = useState(false)

  const items = useMemo(() => {
    if (showAll) return query.data
    return query.data?.slice(0, 5)
  }, [query.data, showAll])

  return (
    <div className="space-y-2">
      <div className="flex justify-between">
        <h2 className="text-2xl font-bold">Transaction History</h2>
        <div className="space-x-2">
          {query.isLoading ? (
            <span className="loading loading-spinner"></span>
          ) : (
            <Button variant="outline" onClick={() => query.refetch()}>
              <RefreshCw size={16} />
            </Button>
          )}
        </div>
      </div>
      {query.isError && <pre className="alert alert-error">Error: {query.error?.message.toString()}</pre>}
      {query.isSuccess && (
        <div>
          {query.data.length === 0 ? (
            <div>No transactions found.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Signature</TableHead>
                  <TableHead className="text-right">Slot</TableHead>
                  <TableHead>Block Time</TableHead>
                  <TableHead className="text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items?.map((item) => (
                  <TableRow key={item.signature}>
                    <TableHead className="font-mono">
                      <ExplorerLink transaction={item.signature} label={ellipsify(item.signature, 8)} />
                    </TableHead>
                    <TableCell className="font-mono text-right">
                      <ExplorerLink block={item.slot.toString()} label={item.slot.toString()} />
                    </TableCell>
                    <TableCell>{new Date((Number(item.blockTime) ?? 0) * 1000).toISOString()}</TableCell>
                    <TableCell className="text-right">
                      {item.err ? (
                        <span className="text-red-500" title={JSON.stringify(item.err)}>
                          Failed
                        </span>
                      ) : (
                        <span className="text-green-500">Success</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {(query.data?.length ?? 0) > 5 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center">
                      <Button variant="outline" onClick={() => setShowAll(!showAll)}>
                        {showAll ? 'Show Less' : 'Show All'}
                      </Button>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </div>
      )}
    </div>
  )
}

function BalanceSol({ balance }: { balance: Lamports }) {
  return <span>{lamportsToSol(balance)}</span>
}

function ModalReceive({ address }: { address: Address }) {
  return (
    <AppModal title="Receive">
      <p>Receive assets by sending them to your public key:</p>
      <code>{address.toString()}</code>
    </AppModal>
  )
}

function ModalAirdrop({ address }: { address: Address }) {
  const mutation = useRequestAirdropMutation({ address })
  const [amount, setAmount] = useState('2')

  return (
    <AppModal
      title="Airdrop"
      submitDisabled={!amount || mutation.isPending}
      submitLabel="Request Airdrop"
      submit={() => mutation.mutateAsync(parseFloat(amount))}
    >
      <Label htmlFor="amount">Amount</Label>
      <Input
        disabled={mutation.isPending}
        id="amount"
        min="1"
        onChange={(e) => setAmount(e.target.value)}
        placeholder="Amount"
        step="any"
        type="number"
        value={amount}
      />
    </AppModal>
  )
}

function ModalSend(props: { address: Address }) {
  const mutation = useTransferSolMutation({ address: props.address })
  const [destination, setDestination] = useState('')
  const [amount, setAmount] = useState('1')

  if (!props.address) {
    return <div>Wallet not connected</div>
  }

  return (
    <AppModal
      title="Send"
      submitDisabled={!destination || !amount || mutation.isPending}
      submitLabel="Send"
      submit={async () => {
        await mutation.mutateAsync({
          destination: address(destination),
          amount: parseFloat(amount),
        })
      }}
    >
      <Label htmlFor="destination">Destination</Label>
      <Input
        disabled={mutation.isPending}
        id="destination"
        onChange={(e) => setDestination(e.target.value)}
        placeholder="Destination"
        type="text"
        value={destination}
      />
      <Label htmlFor="amount">Amount</Label>
      <Input
        disabled={mutation.isPending}
        id="amount"
        min="1"
        onChange={(e) => setAmount(e.target.value)}
        placeholder="Amount"
        step="any"
        type="number"
        value={amount}
      />
    </AppModal>
  )
}
