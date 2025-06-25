import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ApiClient } from '../api-client'

// Mock fetch globally
const mockFetch = vi.fn()
global.fetch = mockFetch

describe('ApiClient', () => {
  let apiClient: ApiClient

  beforeEach(() => {
    vi.clearAllMocks()
    apiClient = new ApiClient('http://localhost:3000')
  })

  describe('constructor', () => {
    it('should create instance with default baseUrl', () => {
      const client = new ApiClient()
      expect(client).toBeInstanceOf(ApiClient)
    })

    it('should create instance with custom baseUrl', () => {
      const client = new ApiClient('https://api.example.com')
      expect(client).toBeInstanceOf(ApiClient)
    })
  })

  describe('verifyAuth', () => {
    it('should verify authentication token successfully', async () => {
      const mockResponse = { valid: true, user: { id: 'user-123' } }
      const accessToken = 'test-token'

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      })

      const result = await apiClient.verifyAuth(accessToken)

      expect(mockFetch).toHaveBeenCalledWith('http://localhost:3000/api/auth/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ accessToken }),
      })

      expect(result).toEqual(mockResponse)
    })

    it('should throw error on invalid token', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: () => Promise.resolve({ error: 'Invalid token' }),
      })

      await expect(apiClient.verifyAuth('invalid-token')).rejects.toThrow('Invalid token')
    })
  })

  describe('registerWork', () => {
    it('should register a work successfully', async () => {
      const workData = {
        title: 'Test Song',
        isrc: 'USRC12345678',
        contributors: [
          {
            name: 'Artist',
            walletAddress: 'DjVE6JNiYqPL2QXyCbqkKKXo8PiW3uYwVLwxjyeo8jqV',
            share: 60,
          },
          {
            name: 'Producer',
            walletAddress: 'BrG44HdsEhzapvs8bEqzvkq4egwevS3fRE6ze2ENo6S8',
            share: 40,
          },
        ],
        description: 'A test song',
        imageUrl: 'https://example.com/image.jpg',
      }

      const mockResponse = {
        success: true,
        data: {
          id: 'work-123',
          title: workData.title,
          isrc: workData.isrc,
        },
      }

      const accessToken = 'test-token'

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      })

      const result = await apiClient.registerWork(workData, accessToken)

      expect(mockFetch).toHaveBeenCalledWith('http://localhost:3000/api/works/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer test-token',
        },
        body: JSON.stringify(workData),
      })

      expect(result).toEqual(mockResponse)
    })

    it('should handle registration failure', async () => {
      const workData = {
        title: 'Test Song',
        contributors: [
          {
            name: 'Artist',
            walletAddress: 'invalid-wallet',
            share: 100,
          },
        ],
      }

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: () => Promise.resolve({ error: 'Invalid wallet address' }),
      })

      await expect(apiClient.registerWork(workData, 'test-token')).rejects.toThrow('Invalid wallet address')
    })
  })

  describe('getWorks', () => {
    it('should fetch works list successfully', async () => {
      const mockResponse = {
        success: true,
        data: [
          {
            id: 'work-123',
            title: 'Test Song',
            isrc: 'USRC12345678',
            status: 'pending',
          },
        ],
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      })

      const result = await apiClient.getWorks('test-token')

      expect(mockFetch).toHaveBeenCalledWith('http://localhost:3000/api/works/list', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer test-token',
        },
      })

      expect(result).toEqual(mockResponse)
    })

    it('should handle unauthorized access', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: () => Promise.resolve({ error: 'Unauthorized' }),
      })

      await expect(apiClient.getWorks('invalid-token')).rejects.toThrow('Unauthorized')
    })
  })

  describe('distributeRoyalties', () => {
    it('should distribute royalties successfully', async () => {
      const workId = 'work-123'
      const amount = 1000
      const accessToken = 'test-token'

      const mockResponse = {
        success: true,
        data: {
          distributionId: 'dist-123',
          workId,
          totalAmount: amount,
          distributions: [
            {
              contributorId: 'contrib-1',
              amount: 600,
              walletAddress: 'DjVE6JNiYqPL2QXyCbqkKKXo8PiW3uYwVLwxjyeo8jqV',
            },
            {
              contributorId: 'contrib-2',
              amount: 400,
              walletAddress: 'BrG44HdsEhzapvs8bEqzvkq4egwevS3fRE6ze2ENo6S8',
            },
          ],
        },
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      })

      const result = await apiClient.distributeRoyalties(workId, amount, accessToken)

      expect(mockFetch).toHaveBeenCalledWith('http://localhost:3000/api/royalties/distribute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer test-token',
        },
        body: JSON.stringify({ workId, amount }),
      })

      expect(result).toEqual(mockResponse)
    })

    it('should handle distribution failure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: () => Promise.resolve({ error: 'Invalid work ID' }),
      })

      await expect(apiClient.distributeRoyalties('invalid-id', 1000, 'test-token')).rejects.toThrow('Invalid work ID')
    })
  })

  describe('error handling', () => {
    it('should handle network errors gracefully', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      await expect(apiClient.verifyAuth('test-token')).rejects.toThrow('Network error')
    })

    it('should handle malformed JSON responses', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: () => Promise.reject(new Error('Invalid JSON')),
      })

      await expect(apiClient.verifyAuth('test-token')).rejects.toThrow('Request failed')
    })
  })
})
