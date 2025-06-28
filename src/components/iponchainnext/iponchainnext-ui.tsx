import { ellipsify } from '@wallet-ui/react'
import { Button } from '@/components/ui/button'
import { ExplorerLink } from '@/components/cluster/cluster-ui'
import { useIponchainnextProgramId, useGetProgramAccountQuery, useGreetMutation } from './iponchainnext-data-access'

export function IponchainnextProgramExplorerLink() {
  const programId = useIponchainnextProgramId()

  return <ExplorerLink address={programId.toString()} label={ellipsify(programId.toString())} />
}

export function IponchainnextCreate() {
  const greetMutation = useGreetMutation()

  return (
    <Button 
      onClick={() => greetMutation.mutateAsync()} 
      disabled={greetMutation.isPending}
      className="bg-primary hover:bg-primary/90 text-primary-foreground"
    >
      Run program{greetMutation.isPending && '...'}
    </Button>
  )
}

export function IponchainnextProgram() {
  const query = useGetProgramAccountQuery()

  if (query.isLoading) {
    return (
      <div className="flex justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }
  if (!query.data?.value) {
    return (
      <div className="bg-muted rounded-lg p-6 text-center shadow-soft">
        <p className="text-muted-foreground">
          Program account not found. Make sure you have deployed the program and are on the correct cluster.
        </p>
      </div>
    )
  }
  return (
    <div className="space-y-6">
      <div className="bg-card rounded-lg p-6 shadow-soft">
        <h3 className="text-lg font-semibold mb-4">Program Data</h3>
        <pre className="bg-muted p-4 rounded text-sm overflow-auto text-foreground">
          {JSON.stringify(query.data.value.data, null, 2)}
        </pre>
      </div>
    </div>
  )
}
