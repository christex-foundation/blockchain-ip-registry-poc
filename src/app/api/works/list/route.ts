import { NextRequest, NextResponse } from 'next/server'
import { verifyPrivyToken } from '@/lib/privy-server'

// Define Work interface
interface Work {
  id: string
  title: string
  isrc?: string
  contributors: Array<{
    name: string
    wallet: string
    share: number
  }>
  metadataUri: string
  createdAt: string
  status: string
}

// Mock data store - in production, you'd use a database
const mockWorks = new Map<string, Work[]>()

export async function GET(request: NextRequest) {
  try {
    // Get access token from Authorization header
    const authHeader = request.headers.get('authorization')
    const accessToken = authHeader?.replace('Bearer ', '')

    if (!accessToken) {
      return NextResponse.json({ error: 'Access token is required' }, { status: 401 })
    }

    // Verify the token
    const verifiedClaims = await verifyPrivyToken(accessToken)
    if (!verifiedClaims) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 })
    }

    // Get user's works from mock storage
    const userWorks = mockWorks.get(verifiedClaims.userId) || []

    // Add some mock data for demonstration
    if (userWorks.length === 0) {
      const mockData: Work[] = [
        {
          id: 'work_demo_1',
          title: 'Sample Track #1',
          isrc: 'USRC12345678',
          contributors: [
            { name: 'Artist One', wallet: '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM', share: 60 },
            { name: 'Producer', wallet: 'ByT7spdPJyxfLYD7bGhRZwXzGhWAhYWzXHJ7qJGbGqmH', share: 40 },
          ],
          metadataUri: 'https://ipfs.io/ipfs/QmExampleDemo1',
          createdAt: new Date('2024-01-15').toISOString(),
          status: 'minted',
        },
        {
          id: 'work_demo_2',
          title: 'Collaborative Beat',
          isrc: 'USRC87654321',
          contributors: [
            { name: 'Artist Two', wallet: '3kJKXfNKKfXHXYjHQqbKxKvXHXYjHQqbKxKvXHXYjHQq', share: 50 },
            { name: 'Co-writer', wallet: '4mLLYgOLLgYHYkIIRrcLyLwYHYkIIRrcLyLwYHYkIIRr', share: 50 },
          ],
          metadataUri: 'https://ipfs.io/ipfs/QmExampleDemo2',
          createdAt: new Date('2024-01-20').toISOString(),
          status: 'minted',
        },
      ]
      mockWorks.set(verifiedClaims.userId, mockData)
    }

    return NextResponse.json({
      success: true,
      works: mockWorks.get(verifiedClaims.userId) || [],
    })
  } catch (error) {
    console.error('Works list error:', error)
    return NextResponse.json({ error: 'Failed to fetch works' }, { status: 500 })
  }
}
