// Client-side API utilities
export class ApiClient {
  private baseUrl: string

  constructor(baseUrl = '') {
    this.baseUrl = baseUrl
  }

  private async makeRequest(endpoint: string, options: RequestInit & { accessToken?: string } = {}) {
    const { accessToken, ...fetchOptions } = options

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(fetchOptions.headers as Record<string, string>),
    }

    if (accessToken) {
      headers.Authorization = `Bearer ${accessToken}`
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...fetchOptions,
      headers,
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Request failed' }))
      throw new Error(error.error || `Request failed with status ${response.status}`)
    }

    return response.json()
  }

  // Verify authentication token
  async verifyAuth(accessToken: string) {
    return this.makeRequest('/api/auth/verify', {
      method: 'POST',
      body: JSON.stringify({ accessToken }),
    })
  }

  // Register a new work
  async registerWork(
    workData: {
      title: string
      isrc?: string
      contributors: Array<{
        name: string
        walletAddress: string
        share: number
      }>
      description?: string
      imageUrl?: string
    },
    accessToken: string,
  ) {
    return this.makeRequest('/api/works/register', {
      method: 'POST',
      body: JSON.stringify(workData),
      accessToken,
    })
  }

  // Get list of user's works
  async getWorks(accessToken: string) {
    return this.makeRequest('/api/works/list', {
      method: 'GET',
      accessToken,
    })
  }

  // Distribute royalties for a work
  async distributeRoyalties(workId: string, amount: number, accessToken: string) {
    return this.makeRequest('/api/royalties/distribute', {
      method: 'POST',
      body: JSON.stringify({ workId, amount }),
      accessToken,
    })
  }
}

// Export a singleton instance
export const apiClient = new ApiClient()
