'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Link from 'next/link'

interface Contributor {
  name: string
  wallet: string
  share: number
}

export default function RegisterWorkPage() {
  const [workTitle, setWorkTitle] = useState('')
  const [isrc, setIsrc] = useState('')
  const [contributors, setContributors] = useState<Contributor[]>([
    { name: '', wallet: '', share: 0 }
  ])
  const [isSubmitting, setIsSubmitting] = useState(false)

  const addContributor = () => {
    setContributors([...contributors, { name: '', wallet: '', share: 0 }])
  }

  const removeContributor = (index: number) => {
    if (contributors.length > 1) {
      setContributors(contributors.filter((_, i) => i !== index))
    }
  }

  const updateContributor = (index: number, field: keyof Contributor, value: string | number) => {
    const updated = contributors.map((contributor, i) => 
      i === index ? { ...contributor, [field]: value } : contributor
    )
    setContributors(updated)
  }

  const getTotalShares = () => {
    return contributors.reduce((sum, contributor) => sum + contributor.share, 0)
  }

  const validateForm = () => {
    if (!workTitle.trim()) return false
    if (!isrc.trim()) return false
    if (contributors.some(c => !c.name.trim() || !c.wallet.trim() || c.share <= 0)) return false
    if (getTotalShares() !== 100) return false
    return true
  }

  const handleSubmit = async () => {
    if (!validateForm()) return

    setIsSubmitting(true)
    
    // TODO: Implement actual work registration with Metaplex NFT minting
    console.log('Registering work:', {
      title: workTitle,
      isrc,
      contributors,
      metadata: {
        name: workTitle,
        symbol: 'IPOC',
        description: `IP OnChain registration for ${workTitle}`,
        attributes: [
          { trait_type: 'ISRC', value: isrc },
          { trait_type: 'Contributors', value: contributors.length },
          { trait_type: 'Registration Date', value: new Date().toISOString() }
        ]
      }
    })

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    setIsSubmitting(false)
    
    // TODO: Navigate to dashboard or show success message
    alert('Work registered successfully! (Mock implementation)')
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold">Register New Work</h1>
            <p className="text-muted-foreground mt-2">
              Register your intellectual property on the blockchain
            </p>
          </div>
          <Link href="/dashboard">
            <Button variant="outline">
              Back to Dashboard
            </Button>
          </Link>
        </div>

        {/* Registration Form */}
        <Card className="glass">
          <CardHeader>
            <CardTitle>Work Information</CardTitle>
            <CardDescription>
              Provide details about your creative work and contributor information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="title">Work Title *</Label>
                <Input
                  id="title"
                  placeholder="e.g., Midnight Dreams"
                  value={workTitle}
                  onChange={(e) => setWorkTitle(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="isrc">ISRC Code *</Label>
                <Input
                  id="isrc"
                  placeholder="e.g., USUM71234567"
                  value={isrc}
                  onChange={(e) => setIsrc(e.target.value)}
                />
              </div>
            </div>

            {/* Contributors Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-lg">Contributors & Royalty Shares</Label>
                  <p className="text-sm text-muted-foreground">
                    Add all contributors and their royalty share percentages
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={addContributor}
                  className="text-sm"
                >
                  Add Contributor
                </Button>
              </div>

              {contributors.map((contributor, index) => (
                <Card key={index} className="p-4 bg-secondary/10">
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                    <div className="md:col-span-4 space-y-2">
                      <Label>Contributor Name</Label>
                      <Input
                        placeholder="e.g., Artist Name"
                        value={contributor.name}
                        onChange={(e) => updateContributor(index, 'name', e.target.value)}
                      />
                    </div>
                    <div className="md:col-span-5 space-y-2">
                      <Label>Solana Wallet Address</Label>
                      <Input
                        placeholder="e.g., 9WzDXwBbTzgTHzgTXzgT..."
                        value={contributor.wallet}
                        onChange={(e) => updateContributor(index, 'wallet', e.target.value)}
                      />
                    </div>
                    <div className="md:col-span-2 space-y-2">
                      <Label>Share (%)</Label>
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        placeholder="50"
                        value={contributor.share || ''}
                        onChange={(e) => updateContributor(index, 'share', parseInt(e.target.value) || 0)}
                      />
                    </div>
                    <div className="md:col-span-1">
                      {contributors.length > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeContributor(index)}
                          className="text-red-500 hover:text-red-600"
                        >
                          ✕
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              ))}

              {/* Share Validation */}
              <div className="flex items-center justify-between p-4 bg-secondary/5 rounded-lg">
                <span className="text-sm font-medium">Total Shares:</span>
                <span className={`text-lg font-bold ${
                  getTotalShares() === 100 ? 'text-green-500' : 'text-red-500'
                }`}>
                  {getTotalShares()}%
                </span>
              </div>
              {getTotalShares() !== 100 && (
                <p className="text-sm text-red-500">
                  ⚠️ Total shares must equal 100%
                </p>
              )}
            </div>

            {/* Submit Button */}
            <div className="flex justify-end space-x-4 pt-6">
              <Link href="/dashboard">
                <Button variant="outline">
                  Cancel
                </Button>
              </Link>
              <Button
                onClick={handleSubmit}
                disabled={!validateForm() || isSubmitting}
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white glow"
              >
                {isSubmitting ? 'Registering...' : 'Register Work'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Development Notice */}
        <div className="text-center text-sm text-muted-foreground glass rounded-lg p-4">
          <p>🚧 Development Mode</p>
          <p>Metaplex NFT minting and IPFS metadata upload will be implemented in Week 2</p>
        </div>
      </div>
    </div>
  )
} 
