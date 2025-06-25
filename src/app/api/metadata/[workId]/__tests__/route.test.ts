import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { NextRequest } from 'next/server'
import { GET } from '../route'

// Mock only the external dependencies (database and blockchain)
vi.mock('@/lib/repositories/work-repository', () => ({
  WorkRepository: {
    findById: vi.fn(),
  },
}))

vi.mock('@/lib/repositories/contributor-repository', () => ({
  ContributorRepository: {
    findByWorkId: vi.fn(),
  },
}))

vi.mock('@/lib/solana-server', () => ({
  getAssetAttributes: vi.fn(),
}))

import { WorkRepository } from '@/lib/repositories/work-repository'
import { ContributorRepository } from '@/lib/repositories/contributor-repository'
import { getAssetAttributes } from '@/lib/solana-server'

describe('Metadata API Route - Integration Tests', () => {
  // Use realistic test data that matches actual database schema
  const mockWork = {
    id: 'test-work-id',
    title: 'Test Song',
    isrc: 'TEST123456789',
    description: 'A test song description',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    total_shares: 100,
    nft_mint_address: 'test-mint-address',
    metadata_uri: 'https://example.com/metadata.json',
  }

  const mockContributors = [
    {
      id: 'contributor-1',
      name: 'Lead Artist',
      wallet_address: 'artist-wallet-address',
      royalty_share: 60,
      work_id: 'test-work-id',
      created_at: '2024-01-01T00:00:00Z',
    },
    {
      id: 'contributor-2',
      name: 'Producer',
      wallet_address: 'producer-wallet-address',
      royalty_share: 40,
      work_id: 'test-work-id',
      created_at: '2024-01-01T00:00:00Z',
    },
  ]

  const mockOnChainAttributes = [
    { key: 'title', value: 'Test Song' },
    { key: 'isrc', value: 'TEST123456789' },
    { key: 'total_shares', value: '100' },
    { key: 'contributors_count', value: '2' },
    { key: 'type', value: 'Intellectual Property' },
    { key: 'category', value: 'Music' },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    // Set environment variable for tests
    process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000'
  })

  afterEach(() => {
    delete process.env.NEXT_PUBLIC_APP_URL
  })

  describe('Successful Metadata Retrieval', () => {
    it('should return complete metadata with dual storage data', async () => {
      // Setup mocks with realistic data
      vi.mocked(WorkRepository.findById).mockResolvedValue(mockWork)
      vi.mocked(ContributorRepository.findByWorkId).mockResolvedValue(mockContributors)
      vi.mocked(getAssetAttributes).mockResolvedValue(mockOnChainAttributes)

      const request = new NextRequest('http://localhost:3000/api/metadata/test-work-id')
      const response = await GET(request, { params: { workId: 'test-work-id' } })
      const data = await response.json()

      // Test HTTP response
      expect(response.status).toBe(200)
      expect(response.headers.get('content-type')).toContain('application/json')

      // Test response structure
      expect(data).toHaveProperty('version', '1.0')
      expect(data).toHaveProperty('type', 'ip-onchain-metadata')
      expect(data).toHaveProperty('workId', 'test-work-id')
      expect(data).toHaveProperty('timestamp')
      expect(data).toHaveProperty('metadata')
      expect(data).toHaveProperty('database_fields')
      expect(data).toHaveProperty('on_chain_attributes')

      // Test metadata content
      expect(data.metadata.name).toBe('Test Song')
      expect(data.metadata.description).toBe('Intellectual Property Work: Test Song')
      expect(data.metadata.external_url).toBe('http://localhost:3000/works/test-work-id')

      // Test attributes structure
      expect(data.metadata.attributes).toBeInstanceOf(Array)
      expect(data.metadata.attributes.length).toBeGreaterThan(0)

      // Test creators mapping from contributors
      expect(data.metadata.properties.creators).toHaveLength(2)
      expect(data.metadata.properties.creators[0]).toEqual({
        address: 'artist-wallet-address',
        share: 60,
        name: 'Lead Artist',
      })

      // Test IP data structure
      expect(data.metadata.properties.ip_data.isrc).toBe('TEST123456789')
      expect(data.metadata.properties.ip_data.royalty_distribution).toHaveLength(2)

      // Test database fields exposure
      expect(data.database_fields.id).toBe('test-work-id')
      expect(data.database_fields.title).toBe('Test Song')
      expect(data.database_fields.nft_mint_address).toBe('test-mint-address')

      // Test on-chain attributes
      expect(data.on_chain_attributes).toEqual(mockOnChainAttributes)

      // Verify repository calls
      expect(WorkRepository.findById).toHaveBeenCalledWith('test-work-id')
      expect(ContributorRepository.findByWorkId).toHaveBeenCalledWith('test-work-id')
      expect(getAssetAttributes).toHaveBeenCalledWith('test-mint-address')
    })

    it('should handle work without NFT mint address', async () => {
      const workWithoutNft = { ...mockWork, nft_mint_address: null }

      vi.mocked(WorkRepository.findById).mockResolvedValue(workWithoutNft)
      vi.mocked(ContributorRepository.findByWorkId).mockResolvedValue(mockContributors)
      // getAssetAttributes should not be called

      const request = new NextRequest('http://localhost:3000/api/metadata/test-work-id')
      const response = await GET(request, { params: { workId: 'test-work-id' } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.database_fields.nft_mint_address).toBeNull()
      expect(data).not.toHaveProperty('on_chain_attributes')
      expect(getAssetAttributes).not.toHaveBeenCalled()
    })

    it('should include proper CORS headers', async () => {
      vi.mocked(WorkRepository.findById).mockResolvedValue(mockWork)
      vi.mocked(ContributorRepository.findByWorkId).mockResolvedValue(mockContributors)
      vi.mocked(getAssetAttributes).mockResolvedValue([])

      const request = new NextRequest('http://localhost:3000/api/metadata/test-work-id')
      const response = await GET(request, { params: { workId: 'test-work-id' } })

      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*')
      expect(response.headers.get('Access-Control-Allow-Methods')).toBe('GET')
      expect(response.headers.get('Cache-Control')).toBe('public, max-age=3600')
    })
  })

  describe('Error Handling', () => {
    it('should return 404 for non-existent work', async () => {
      vi.mocked(WorkRepository.findById).mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/metadata/nonexistent-id')
      const response = await GET(request, { params: { workId: 'nonexistent-id' } })
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('Work not found')
    })

    it('should return 400 for invalid work ID format', async () => {
      const request = new NextRequest('http://localhost:3000/api/metadata/invalid')
      const response = await GET(request, { params: { workId: 'invalid' } })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid work ID format')
    })

    it('should handle database errors gracefully', async () => {
      vi.mocked(WorkRepository.findById).mockRejectedValue(new Error('Database connection failed'))

      const request = new NextRequest('http://localhost:3000/api/metadata/test-work-id')
      const response = await GET(request, { params: { workId: 'test-work-id' } })
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to retrieve metadata')
      expect(data.details).toBe('Database connection failed')
    })

    it('should handle blockchain fetch errors gracefully', async () => {
      vi.mocked(WorkRepository.findById).mockResolvedValue(mockWork)
      vi.mocked(ContributorRepository.findByWorkId).mockResolvedValue(mockContributors)
      vi.mocked(getAssetAttributes).mockRejectedValue(new Error('Network error'))

      const request = new NextRequest('http://localhost:3000/api/metadata/test-work-id')
      const response = await GET(request, { params: { workId: 'test-work-id' } })
      const data = await response.json()

      // Should succeed with off-chain data only
      expect(response.status).toBe(200)
      expect(data).not.toHaveProperty('on_chain_attributes')
      expect(data.metadata.name).toBe('Test Song')
    })
  })

  describe('Business Logic Validation', () => {
    it('should calculate contributor shares correctly', async () => {
      const contributorsWithComplexShares = [
        {
          id: 'contributor-1',
          name: 'Lead Artist',
          wallet_address: 'artist-wallet',
          royalty_share: 35,
          work_id: 'test-work-id',
          created_at: '2024-01-01T00:00:00Z',
        },
        {
          id: 'contributor-2',
          name: 'Producer',
          wallet_address: 'producer-wallet',
          royalty_share: 25,
          work_id: 'test-work-id',
          created_at: '2024-01-01T00:00:00Z',
        },
        {
          id: 'contributor-3',
          name: 'Songwriter',
          wallet_address: 'songwriter-wallet',
          royalty_share: 40,
          work_id: 'test-work-id',
          created_at: '2024-01-01T00:00:00Z',
        },
      ]

      vi.mocked(WorkRepository.findById).mockResolvedValue(mockWork)
      vi.mocked(ContributorRepository.findByWorkId).mockResolvedValue(contributorsWithComplexShares)
      vi.mocked(getAssetAttributes).mockResolvedValue([])

      const request = new NextRequest('http://localhost:3000/api/metadata/test-work-id')
      const response = await GET(request, { params: { workId: 'test-work-id' } })
      const data = await response.json()

      expect(data.metadata.properties.creators).toHaveLength(3)
      expect(data.metadata.properties.ip_data.royalty_distribution).toHaveLength(3)

      // Verify total shares
      const totalShares = data.metadata.properties.creators.reduce(
        (sum: number, creator: any) => sum + creator.share,
        0,
      )
      expect(totalShares).toBe(100)

      // Verify contributor count attribute
      const contributorCountAttr = data.metadata.attributes.find(
        (attr: any) => attr.trait_type === 'Contributors Count',
      )
      expect(contributorCountAttr?.value).toBe(3)
    })

    it('should handle empty contributors gracefully', async () => {
      vi.mocked(WorkRepository.findById).mockResolvedValue(mockWork)
      vi.mocked(ContributorRepository.findByWorkId).mockResolvedValue([])
      vi.mocked(getAssetAttributes).mockResolvedValue([])

      const request = new NextRequest('http://localhost:3000/api/metadata/test-work-id')
      const response = await GET(request, { params: { workId: 'test-work-id' } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.metadata.properties.creators).toEqual([])
      expect(data.metadata.properties.ip_data.royalty_distribution).toEqual([])

      const contributorCountAttr = data.metadata.attributes.find(
        (attr: any) => attr.trait_type === 'Contributors Count',
      )
      expect(contributorCountAttr?.value).toBe(0)
    })

    it('should handle missing optional work fields', async () => {
      const minimalWork = {
        id: 'minimal-work-id',
        title: 'Minimal Work',
        isrc: null,
        description: null,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: null,
        total_shares: null,
        nft_mint_address: null,
        metadata_uri: null,
      }

      vi.mocked(WorkRepository.findById).mockResolvedValue(minimalWork)
      vi.mocked(ContributorRepository.findByWorkId).mockResolvedValue([])
      vi.mocked(getAssetAttributes).mockResolvedValue([])

      const request = new NextRequest('http://localhost:3000/api/metadata/minimal-work-id')
      const response = await GET(request, { params: { workId: 'minimal-work-id' } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.metadata.name).toBe('Minimal Work')
      expect(data.metadata.description).toBe('Intellectual Property Work: Minimal Work')

      // Check ISRC handling
      const isrcAttr = data.metadata.attributes.find((attr: any) => attr.trait_type === 'ISRC')
      expect(isrcAttr?.value).toBe('Not specified')

      // Check total shares default
      const sharesAttr = data.metadata.attributes.find((attr: any) => attr.trait_type === 'Total Shares')
      expect(sharesAttr?.value).toBe(100) // Default value from route logic
    })
  })

  describe('Data Consistency Validation', () => {
    it('should maintain consistency between on-chain and off-chain data', async () => {
      const onChainAttributes = [
        { key: 'title', value: 'Test Song' },
        { key: 'isrc', value: 'TEST123456789' },
        { key: 'contributors_count', value: '2' },
        { key: 'total_shares', value: '100' },
      ]

      vi.mocked(WorkRepository.findById).mockResolvedValue(mockWork)
      vi.mocked(ContributorRepository.findByWorkId).mockResolvedValue(mockContributors)
      vi.mocked(getAssetAttributes).mockResolvedValue(onChainAttributes)

      const request = new NextRequest('http://localhost:3000/api/metadata/test-work-id')
      const response = await GET(request, { params: { workId: 'test-work-id' } })
      const data = await response.json()

      // Verify consistency between sources
      expect(data.metadata.name).toBe('Test Song')
      expect(data.database_fields.title).toBe('Test Song')

      const onChainTitle = data.on_chain_attributes.find((attr: any) => attr.key === 'title')
      expect(onChainTitle?.value).toBe('Test Song')

      // Verify ISRC consistency
      expect(data.database_fields.isrc).toBe('TEST123456789')
      const isrcAttr = data.metadata.attributes.find((attr: any) => attr.trait_type === 'ISRC')
      expect(isrcAttr?.value).toBe('TEST123456789')

      const onChainIsrc = data.on_chain_attributes.find((attr: any) => attr.key === 'isrc')
      expect(onChainIsrc?.value).toBe('TEST123456789')
    })

    it('should set appropriate metadata headers based on data source', async () => {
      // Test with on-chain data
      vi.mocked(WorkRepository.findById).mockResolvedValue(mockWork)
      vi.mocked(ContributorRepository.findByWorkId).mockResolvedValue(mockContributors)
      vi.mocked(getAssetAttributes).mockResolvedValue(mockOnChainAttributes)

      const request1 = new NextRequest('http://localhost:3000/api/metadata/test-work-id')
      const response1 = await GET(request1, { params: { workId: 'test-work-id' } })

      expect(response1.headers.get('X-Metadata-Source')).toBe('hybrid-on-off-chain')

      // Test without on-chain data
      const workWithoutNft = { ...mockWork, nft_mint_address: null }
      vi.mocked(WorkRepository.findById).mockResolvedValue(workWithoutNft)

      const request2 = new NextRequest('http://localhost:3000/api/metadata/test-work-id')
      const response2 = await GET(request2, { params: { workId: 'test-work-id' } })

      expect(response2.headers.get('X-Metadata-Source')).toBe('off-chain-only')
    })
  })
})
