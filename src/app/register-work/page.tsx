'use client'

import { useState } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { usePrivy } from '@privy-io/react-auth'
import { toast } from 'sonner'
import { Plus, Minus, Loader2, Music, Users, FileText } from 'lucide-react'
import { AuthGuard } from '@/components/privy/auth-guard'

// Validation schema
const contributorSchema = z.object({
  name: z.string().min(1, 'Contributor name is required'),
  walletAddress: z.string().min(32, 'Valid Solana wallet address is required'),
  share: z.number().min(0.1, 'Share must be at least 0.1%').max(100, 'Share cannot exceed 100%'),
})

const workRegistrationSchema = z.object({
  title: z.string().min(1, 'Work title is required'),
  isrc: z.string().optional(),
  description: z.string().optional(),
  imageUrl: z.string().url().optional().or(z.literal('')),
  contributors: z.array(contributorSchema).min(1, 'At least one contributor is required'),
}).refine((data) => {
  const totalShares = data.contributors.reduce((sum, contributor) => sum + contributor.share, 0)
  return Math.abs(totalShares - 100) < 0.01 // Allow for small floating point errors
}, {
  message: 'Total contributor shares must equal 100%',
  path: ['contributors'],
})

type WorkRegistrationForm = z.infer<typeof workRegistrationSchema>

interface MintResult {
  success: boolean
  work: {
    id: number
    title: string
    isrc?: string
    contributors: Array<{
      id: number
      name: string
      walletAddress: string
      share: number
    }>
    metadataUri: string
    mintAddress?: string
    createdAt: string
    createdBy: string
  }
  nft?: {
    assetId: string
    signature: string
    explorerUrl: string
  }
  warning?: string
  error?: string
}

function RegisterWorkContent() {
  const { authenticated, getAccessToken } = usePrivy()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [result, setResult] = useState<MintResult | null>(null)

  const {
    register,
    control,
    handleSubmit,
    watch,
    formState: { errors },
    reset,
  } = useForm<WorkRegistrationForm>({
    resolver: zodResolver(workRegistrationSchema),
    defaultValues: {
      title: '',
      isrc: '',
      description: '',
      imageUrl: '',
      contributors: [
        {
          name: '',
          walletAddress: '',
          share: 100,
        },
      ],
    },
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'contributors',
  })

  const contributors = watch('contributors')
  const totalShares = contributors?.reduce((sum, contributor) => sum + (contributor.share || 0), 0) || 0

  const onSubmit = async (data: WorkRegistrationForm) => {
    if (!authenticated) {
      toast.error('Please connect your wallet first')
      return
    }

    try {
      setIsSubmitting(true)
      setResult(null)

      const accessToken = await getAccessToken()
      if (!accessToken) {
        throw new Error('Failed to get access token')
      }

      const response = await fetch('/api/works/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify(data),
      })

      const result: MintResult = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Registration failed')
      }

      setResult(result)
      toast.success('Work registered and NFT minted successfully!')
      
      // Reset form for next registration
      reset()

    } catch (error) {
      console.error('Registration error:', error)
      toast.error(error instanceof Error ? error.message : 'Registration failed')
    } finally {
      setIsSubmitting(false)
    }
  }

  const addContributor = () => {
    append({
      name: '',
      walletAddress: '',
      share: 0,
    })
  }

  const removeContributor = (index: number) => {
    if (fields.length > 1) {
      remove(index)
    }
  }



  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
          <Music className="h-8 w-8" />
          Register IP Work
        </h1>
        <p className="text-muted-foreground">
          Register your intellectual property work and mint an NFT to establish ownership on the blockchain
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Registration Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Work Details
            </CardTitle>
            <CardDescription>
              Enter the details of your intellectual property work
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="title">Work Title *</Label>
                  <Input
                    id="title"
                    {...register('title')}
                    placeholder="Enter the title of your work"
                    className={errors.title ? 'border-red-500' : ''}
                  />
                  {errors.title && (
                    <p className="text-sm text-red-500 mt-1">{errors.title.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="isrc">ISRC (Optional)</Label>
                  <Input
                    id="isrc"
                    {...register('isrc')}
                    placeholder="International Standard Recording Code"
                  />
                  {errors.isrc && (
                    <p className="text-sm text-red-500 mt-1">{errors.isrc.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="description">Description (Optional)</Label>
                  <Textarea
                    id="description"
                    {...register('description')}
                    placeholder="Describe your work..."
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="imageUrl">Image URL (Optional)</Label>
                  <Input
                    id="imageUrl"
                    {...register('imageUrl')}
                    placeholder="https://example.com/image.jpg"
                    type="url"
                  />
                  {errors.imageUrl && (
                    <p className="text-sm text-red-500 mt-1">{errors.imageUrl.message}</p>
                  )}
                </div>
              </div>

              {/* Contributors Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-semibold flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Contributors & Royalty Shares
                  </Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addContributor}
                    className="flex items-center gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Add Contributor
                  </Button>
                </div>

                {fields.map((field, index) => (
                  <Card key={field.id} className="p-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <Label htmlFor={`contributors.${index}.name`}>Name *</Label>
                        <Input
                          {...register(`contributors.${index}.name`)}
                          placeholder="Contributor name"
                          className={errors.contributors?.[index]?.name ? 'border-red-500' : ''}
                        />
                        {errors.contributors?.[index]?.name && (
                          <p className="text-sm text-red-500 mt-1">
                            {errors.contributors[index]?.name?.message}
                          </p>
                        )}
                      </div>

                      <div>
                        <Label htmlFor={`contributors.${index}.walletAddress`}>Wallet Address *</Label>
                        <Input
                          {...register(`contributors.${index}.walletAddress`)}
                          placeholder="Solana wallet address"
                          className={errors.contributors?.[index]?.walletAddress ? 'border-red-500' : ''}
                        />
                        {errors.contributors?.[index]?.walletAddress && (
                          <p className="text-sm text-red-500 mt-1">
                            {errors.contributors[index]?.walletAddress?.message}
                          </p>
                        )}
                      </div>

                      <div>
                        <Label htmlFor={`contributors.${index}.share`}>Royalty Share (%) *</Label>
                        <Input
                          {...register(`contributors.${index}.share`, { valueAsNumber: true })}
                          type="number"
                          step="0.1"
                          min="0"
                          max="100"
                          placeholder="0.0"
                          className={errors.contributors?.[index]?.share ? 'border-red-500' : ''}
                        />
                        {errors.contributors?.[index]?.share && (
                          <p className="text-sm text-red-500 mt-1">
                            {errors.contributors[index]?.share?.message}
                          </p>
                        )}
                      </div>

                      <div className="flex items-end">
                        {fields.length > 1 && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => removeContributor(index)}
                            className="w-full"
                          >
                            <Minus className="h-4 w-4 mr-2" />
                            Remove
                          </Button>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}

                {/* Total Shares Display */}
                <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                  <span className="font-medium">Total Shares:</span>
                  <span className={`font-bold ${Math.abs(totalShares - 100) < 0.01 ? 'text-green-600' : 'text-red-500'}`}>
                    {totalShares.toFixed(1)}%
                  </span>
                </div>

                {errors.contributors && typeof errors.contributors.message === 'string' && (
                  <p className="text-sm text-red-500">{errors.contributors.message}</p>
                )}
              </div>

              <Button 
                type="submit" 
                className="w-full" 
                disabled={isSubmitting}
                size="lg"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Registering & Minting NFT...
                  </>
                ) : (
                  'Register Work & Mint NFT'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Result Display */}
        {result && (
          <Card>
            <CardHeader>
              <CardTitle className="text-green-600">Registration Successful!</CardTitle>
              <CardDescription>
                Your intellectual property work has been registered
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="font-semibold">Work Details</Label>
                <div className="mt-2 space-y-2 text-sm">
                  <p><strong>Title:</strong> {result.work.title}</p>
                  {result.work.isrc && <p><strong>ISRC:</strong> {result.work.isrc}</p>}
                  <p><strong>Contributors:</strong> {result.work.contributors.length}</p>
                </div>
              </div>

              {result.nft && (
                <div>
                  <Label className="font-semibold">NFT Details</Label>
                  <div className="mt-2 space-y-2 text-sm">
                    <p><strong>Asset ID:</strong> 
                      <code className="ml-2 text-xs bg-muted px-2 py-1 rounded">
                        {result.nft.assetId}
                      </code>
                    </p>
                    <p><strong>Transaction:</strong>
                      <code className="ml-2 text-xs bg-muted px-2 py-1 rounded">
                        {result.nft.signature}
                      </code>
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-2"
                      onClick={() => window.open(result.nft!.explorerUrl, '_blank')}
                    >
                      View on Solana Explorer
                    </Button>
                  </div>
                </div>
              )}

              {result.warning && (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-yellow-800 text-sm">{result.warning}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

export default function RegisterWorkPage() {
  return (
    <AuthGuard>
      <RegisterWorkContent />
    </AuthGuard>
  )
}
