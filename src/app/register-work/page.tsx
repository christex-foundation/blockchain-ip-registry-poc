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
import { Plus, Minus, Loader2, Music, Users, FileText, Shield, CheckCircle } from 'lucide-react'
import { AuthGuard } from '@/components/privy/auth-guard'
import { OrganizationSelector, CreateOrganizationDialog } from '@/components/organizations'

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
  organizationId: z.string().optional(),
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
  const [showCreateOrgDialog, setShowCreateOrgDialog] = useState(false)
  const [selectedOrganization, setSelectedOrganization] = useState<string | undefined>()

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
      organizationId: '',
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
        body: JSON.stringify({
          ...data,
          organizationId: selectedOrganization,
        }),
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
    <div className="min-h-screen bg-gray-50" style={{ fontFamily: 'Space Grotesk, system-ui, sans-serif' }}>
      {/* Hero Section */}
      <div className="bg-white shadow-soft">
        <div className="container mx-auto px-6 py-12 max-w-7xl">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-[#7073d1] to-[#5a5db8] mb-6 shadow-medium">
              <Shield className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-5xl font-bold mb-4 text-[#202020]" style={{ fontFamily: 'Futura, system-ui, sans-serif' }}>
              Register Your Work
            </h1>
            <p className="text-xl text-gray-600 leading-relaxed">
              Establish ownership and protect your intellectual property with blockchain-verified registration
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-12 max-w-7xl">
        {/* Process Steps */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="text-center p-6">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-[#dcddff] mb-4">
              <FileText className="h-6 w-6 text-[#7073d1]" />
            </div>
            <h3 className="font-semibold text-[#202020] mb-2">Enter Details</h3>
            <p className="text-gray-600 text-sm">Provide your work information and contributor details</p>
          </div>
          <div className="text-center p-6">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-[#dcddff] mb-4">
              <Users className="h-6 w-6 text-[#7073d1]" />
            </div>
            <h3 className="font-semibold text-[#202020] mb-2">Set Royalties</h3>
            <p className="text-gray-600 text-sm">Define contributor shares and ownership percentages</p>
          </div>
          <div className="text-center p-6">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-[#dcddff] mb-4">
              <CheckCircle className="h-6 w-6 text-[#7073d1]" />
            </div>
            <h3 className="font-semibold text-[#202020] mb-2">Mint NFT</h3>
            <p className="text-gray-600 text-sm">Create immutable proof of ownership on the blockchain</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Organization Selection */}
          <div className="lg:col-span-3 mb-8">
            <Card className="border-0 shadow-medium bg-white">
              <CardHeader className="pb-4">
                <CardTitle className="text-[#202020] text-lg font-semibold">Organization</CardTitle>
                <CardDescription className="text-gray-600">
                  Select or create an organization for this work registration
                </CardDescription>
              </CardHeader>
              <CardContent>
                <OrganizationSelector
                  value={selectedOrganization}
                  onValueChange={setSelectedOrganization}
                  showCreateOption={true}
                  onCreateClick={() => setShowCreateOrgDialog(true)}
                />
              </CardContent>
            </Card>
          </div>

          {/* Main Form */}
          <div className="lg:col-span-2">
            <Card className="border-0 shadow-medium bg-white">
              <CardHeader className="border-b border-gray-100 pb-6">
                <CardTitle className="text-[#202020] text-xl font-semibold flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#dcddff] flex items-center justify-center">
                    <Music className="h-5 w-5 text-[#7073d1]" />
                  </div>
                  Work Information
                </CardTitle>
                <CardDescription className="text-gray-600 mt-2">
                  Enter the essential details of your intellectual property work
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                  {/* Basic Information Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2">
                      <Label htmlFor="title" className="text-[#202020] font-medium mb-2 block">
                        Work Title *
                      </Label>
                      <Input
                        id="title"
                        {...register('title')}
                        placeholder="Enter the title of your work"
                        className={`h-12 bg-white text-[#202020] border-gray-200 focus:border-[#7073d1] focus:ring-[#7073d1]/20 ${
                          errors.title ? 'border-red-400 focus:border-red-400 focus:ring-red-100' : ''
                        }`}
                      />
                      {errors.title && (
                        <p className="text-sm text-red-500 mt-2 flex items-center gap-1">
                          {errors.title.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="isrc" className="text-[#202020] font-medium mb-2 block">
                        ISRC Code
                      </Label>
                      <Input
                        id="isrc"
                        {...register('isrc')}
                        placeholder="e.g. USRC17607839"
                        className="h-12 bg-white text-[#202020] border-gray-200 focus:border-[#7073d1] focus:ring-[#7073d1]/20"
                      />
                      <p className="text-xs text-gray-500 mt-1">International Standard Recording Code (optional)</p>
                    </div>

                    <div>
                      <Label htmlFor="imageUrl" className="text-[#202020] font-medium mb-2 block">
                        Cover Image URL
                      </Label>
                      <Input
                        id="imageUrl"
                        {...register('imageUrl')}
                        placeholder="https://example.com/image.jpg"
                        type="url"
                        className={`h-12 bg-white text-[#202020] border-gray-200 focus:border-[#7073d1] focus:ring-[#7073d1]/20 ${
                          errors.imageUrl ? 'border-red-400 focus:border-red-400 focus:ring-red-100' : ''
                        }`}
                      />
                      {errors.imageUrl && (
                        <p className="text-sm text-red-500 mt-2">{errors.imageUrl.message}</p>
                      )}
                    </div>

                    <div className="md:col-span-2">
                      <Label htmlFor="description" className="text-[#202020] font-medium mb-2 block">
                        Description
                      </Label>
                      <Textarea
                        id="description"
                        {...register('description')}
                        placeholder="Describe your work, its genre, inspiration, or any relevant details..."
                        rows={4}
                        className="bg-white text-[#202020] border-gray-200 focus:border-[#7073d1] focus:ring-[#7073d1]/20"
                      />
                      <p className="text-xs text-gray-500 mt-1">Optional but recommended for better work identification</p>
                    </div>
                  </div>

                  {/* Contributors Section */}
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-[#202020] text-lg font-semibold flex items-center gap-2">
                          <Users className="h-5 w-5 text-[#7073d1]" />
                          Contributors & Royalty Distribution
                        </h3>
                        <p className="text-gray-600 text-sm mt-1">
                          Define who contributed to this work and their ownership percentages
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={addContributor}
                        className="flex items-center gap-2 bg-white border-[#7073d1] text-[#7073d1] hover:bg-[#7073d1] hover:text-white transition-colors shadow-soft hover:shadow-medium"
                      >
                        <Plus className="h-4 w-4" />
                        Add Contributor
                      </Button>
                    </div>

                    <div className="space-y-4">
                      {fields.map((field, index) => (
                        <Card key={field.id} className="border border-gray-200 shadow-soft bg-white hover:shadow-medium transition-all duration-200">
                          <CardContent className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                              <div>
                                <Label className="text-[#202020] font-medium mb-2 block">
                                  Contributor Name *
                                </Label>
                                <Input
                                  {...register(`contributors.${index}.name`)}
                                  placeholder="Full name"
                                  className={`h-11 bg-white text-[#202020] border-gray-200 focus:border-[#7073d1] focus:ring-[#7073d1]/20 ${
                                    errors.contributors?.[index]?.name ? 'border-red-400' : ''
                                  }`}
                                />
                                {errors.contributors?.[index]?.name && (
                                  <p className="text-sm text-red-500 mt-1">
                                    {errors.contributors[index]?.name?.message}
                                  </p>
                                )}
                              </div>

                              <div>
                                <Label className="text-[#202020] font-medium mb-2 block">
                                  Wallet Address *
                                </Label>
                                <Input
                                  {...register(`contributors.${index}.walletAddress`)}
                                  placeholder="Solana wallet address"
                                  className={`h-11 bg-white text-[#202020] border-gray-200 focus:border-[#7073d1] focus:ring-[#7073d1]/20 font-mono text-sm ${
                                    errors.contributors?.[index]?.walletAddress ? 'border-red-400' : ''
                                  }`}
                                />
                                {errors.contributors?.[index]?.walletAddress && (
                                  <p className="text-sm text-red-500 mt-1">
                                    {errors.contributors[index]?.walletAddress?.message}
                                  </p>
                                )}
                              </div>

                              <div className="flex gap-2">
                                <div className="flex-1">
                                  <Label className="text-[#202020] font-medium mb-2 block">
                                    Royalty Share (%) *
                                  </Label>
                                  <Input
                                    {...register(`contributors.${index}.share`, { valueAsNumber: true })}
                                    type="number"
                                    step="0.1"
                                    min="0"
                                    max="100"
                                    placeholder="0.0"
                                    className={`h-11 bg-white text-[#202020] border-gray-200 focus:border-[#7073d1] focus:ring-[#7073d1]/20 ${
                                      errors.contributors?.[index]?.share ? 'border-red-400' : ''
                                    }`}
                                  />
                                  {errors.contributors?.[index]?.share && (
                                    <p className="text-sm text-red-500 mt-1">
                                      {errors.contributors[index]?.share?.message}
                                    </p>
                                  )}
                                </div>
                                {fields.length > 1 && (
                                  <div className="flex items-end">
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      onClick={() => removeContributor(index)}
                                      className="h-11 px-3 bg-white border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 shadow-soft hover:shadow-medium transition-all duration-200"
                                    >
                                      <Minus className="h-4 w-4" />
                                    </Button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}

                      {/* Total Shares Display */}
                      <div className="flex justify-between items-center p-4 bg-gray-50 rounded-xl border border-gray-200 shadow-soft">
                        <span className="font-semibold text-[#202020]">Total Ownership:</span>
                        <span className={`font-bold text-lg ${
                          Math.abs(totalShares - 100) < 0.01 
                            ? 'text-emerald-600' 
                            : 'text-red-500'
                        }`}>
                          {totalShares.toFixed(1)}%
                        </span>
                      </div>

                      {errors.contributors && typeof errors.contributors.message === 'string' && (
                        <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                          <p className="text-sm text-red-700">{errors.contributors.message}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full h-14 bg-gradient-to-r from-[#7073d1] to-[#5a5db8] hover:from-[#5a5db8] hover:to-[#4a4d9e] text-white font-semibold text-lg shadow-medium hover:shadow-strong transition-all duration-200 hover:-translate-y-0.5 border-0" 
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-5 w-5 mr-3 animate-spin" />
                        Registering & Minting NFT...
                      </>
                    ) : (
                      <>
                        <Shield className="h-5 w-5 mr-3" />
                        Register Work & Mint NFT
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Success Result */}
          {result && (
            <div className="lg:col-span-1">
              <Card className="border-0 shadow-strong bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200">
                <CardHeader className="pb-4">
                  <CardTitle className="text-emerald-800 flex items-center gap-2">
                    <CheckCircle className="h-6 w-6" />
                    Registration Successful!
                  </CardTitle>
                  <CardDescription className="text-emerald-700">
                    Your work has been registered and secured on the blockchain
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-3">
                    <h4 className="font-semibold text-emerald-800">Work Details</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-emerald-700">Title:</span>
                        <span className="font-medium text-emerald-900">{result.work.title}</span>
                      </div>
                      {result.work.isrc && (
                        <div className="flex justify-between">
                          <span className="text-emerald-700">ISRC:</span>
                          <span className="font-mono text-emerald-900">{result.work.isrc}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-emerald-700">Contributors:</span>
                        <span className="font-medium text-emerald-900">{result.work.contributors.length}</span>
                      </div>
                    </div>
                  </div>

                  {result.nft && (
                    <div className="space-y-3">
                      <h4 className="font-semibold text-emerald-800">NFT Certificate</h4>
                      <div className="space-y-3 text-sm">
                        <div>
                          <span className="text-emerald-700 block mb-1">Asset ID:</span>
                          <code className="block bg-white/60 px-3 py-2 rounded-lg text-xs font-mono text-emerald-900 break-all">
                            {result.nft.assetId}
                          </code>
                        </div>
                        <div>
                          <span className="text-emerald-700 block mb-1">Transaction:</span>
                          <code className="block bg-white/60 px-3 py-2 rounded-lg text-xs font-mono text-emerald-900 break-all">
                            {result.nft.signature}
                          </code>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full mt-3 border-emerald-300 text-emerald-700 hover:bg-emerald-100"
                          onClick={() => window.open(result.nft!.explorerUrl, '_blank')}
                        >
                          View on Solana Explorer
                        </Button>
                      </div>
                    </div>
                  )}

                  {result.warning && (
                    <div className="p-3 bg-amber-100 border border-amber-300 rounded-lg">
                      <p className="text-amber-800 text-sm">{result.warning}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>

      <CreateOrganizationDialog
        open={showCreateOrgDialog}
        onOpenChange={setShowCreateOrgDialog}
        onSuccess={(org) => {
          setSelectedOrganization(org.id)
          setShowCreateOrgDialog(false)
        }}
      />
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
