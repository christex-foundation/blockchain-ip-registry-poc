// Simple test data generator without external dependencies
const generateId = () => crypto.randomUUID()
const generateName = () => `Test Organization ${Math.floor(Math.random() * 1000)}`
const generateCompanyName = () => `${generateName()} Publishing`
const generatePersonName = () => `Test User ${Math.floor(Math.random() * 1000)}`
const generateAddress = () => Math.random().toString(36).substring(2, 46)

export interface OrganizationData {
  id: string
  name: string
  collection_address: string | null
  created_at: string
  updated_at: string
}

export interface OrganizationMemberData {
  id: string
  organization_id: string
  user_id: string
  role: 'owner' | 'admin' | 'member'
  created_at: string
}

export interface OrganizationInsertData {
  name: string
  collection_address: string | null
}

export interface OrganizationMemberInsertData {
  organization_id: string
  user_id: string
  role: 'owner' | 'admin' | 'member'
}

export class OrganizationBuilder {
  private data: Partial<OrganizationData> = {}

  static create(): OrganizationBuilder {
    return new OrganizationBuilder()
  }

  static publishing(): OrganizationBuilder {
    return new OrganizationBuilder()
      .withName(generateCompanyName())
      .withCollectionAddress(generateAddress())
  }

  static artist(): OrganizationBuilder {
    return new OrganizationBuilder()
      .withName(generatePersonName())
      .withCollectionAddress(generateAddress())
  }

  static withoutCollection(): OrganizationBuilder {
    return new OrganizationBuilder()
      .withName(generateName())
      .withCollectionAddress(null)
  }

  withId(id: string): OrganizationBuilder {
    this.data.id = id
    return this
  }

  withName(name: string): OrganizationBuilder {
    this.data.name = name
    return this
  }

  withCollectionAddress(address: string | null): OrganizationBuilder {
    this.data.collection_address = address
    return this
  }

  withCreatedAt(date: string): OrganizationBuilder {
    this.data.created_at = date
    return this
  }

  withUpdatedAt(date: string): OrganizationBuilder {
    this.data.updated_at = date
    return this
  }

  build(): OrganizationData {
    const now = new Date().toISOString()
    
    return {
      id: this.data.id || generateId(),
      name: this.data.name || generateName(),
      collection_address: this.data.collection_address === undefined ? generateAddress() : this.data.collection_address,
      created_at: this.data.created_at || now,
      updated_at: this.data.updated_at || now,
    }
  }

  buildInsert(): OrganizationInsertData {
    return {
      name: this.data.name || generateName(),
      collection_address: this.data.collection_address || null,
    }
  }
}

export class OrganizationMemberBuilder {
  private data: Partial<OrganizationMemberData> = {}

  static create(): OrganizationMemberBuilder {
    return new OrganizationMemberBuilder()
  }

  static owner(organizationId: string, userId: string): OrganizationMemberBuilder {
    return new OrganizationMemberBuilder()
      .withOrganizationId(organizationId)
      .withUserId(userId)
      .withRole('owner')
  }

  static admin(organizationId: string, userId: string): OrganizationMemberBuilder {
    return new OrganizationMemberBuilder()
      .withOrganizationId(organizationId)
      .withUserId(userId)
      .withRole('admin')
  }

  static member(organizationId: string, userId: string): OrganizationMemberBuilder {
    return new OrganizationMemberBuilder()
      .withOrganizationId(organizationId)
      .withUserId(userId)
      .withRole('member')
  }

  withId(id: string): OrganizationMemberBuilder {
    this.data.id = id
    return this
  }

  withOrganizationId(organizationId: string): OrganizationMemberBuilder {
    this.data.organization_id = organizationId
    return this
  }

  withUserId(userId: string): OrganizationMemberBuilder {
    this.data.user_id = userId
    return this
  }

  withRole(role: 'owner' | 'admin' | 'member'): OrganizationMemberBuilder {
    this.data.role = role
    return this
  }

  withCreatedAt(date: string): OrganizationMemberBuilder {
    this.data.created_at = date
    return this
  }

  build(): OrganizationMemberData {
    const now = new Date().toISOString()
    
    return {
      id: this.data.id || generateId(),
      organization_id: this.data.organization_id || generateId(),
      user_id: this.data.user_id || generateId(),
      role: this.data.role || 'member',
      created_at: this.data.created_at || now,
    }
  }

  buildInsert(): OrganizationMemberInsertData {
    return {
      organization_id: this.data.organization_id || generateId(),
      user_id: this.data.user_id || generateId(),
      role: this.data.role || 'member',
    }
  }
}

export class OrganizationTestData {
  static validOrganizationData() {
    return {
      name: 'Test Music Publishing',
      type: 'publishing_company' as const,
      description: 'A test publishing company for IP management',
      imageUrl: 'https://example.com/logo.png',
    }
  }

  static validArtistData() {
    return {
      name: 'John Doe Music',
      type: 'individual_artist' as const,
      description: 'Independent artist collective',
      imageUrl: 'https://example.com/artist.jpg',
    }
  }

  static invalidOrganizationData() {
    return [
      { ...this.validOrganizationData(), name: '' }, // Missing name
      { ...this.validOrganizationData(), type: 'invalid' }, // Invalid type
      { ...this.validOrganizationData(), name: 'a'.repeat(256) }, // Name too long
      { ...this.validOrganizationData(), imageUrl: 'not-a-url' }, // Invalid URL
    ]
  }

  static privyUserIds() {
    return [
      'did:privy:cm123abc456def789',
      'did:privy:cm456def789abc123',
      'did:privy:cm789abc123def456',
    ]
  }

  static solanaCollectionAddresses() {
    return [
      '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
      'So11111111111111111111111111111111111111112',
      'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
    ]
  }

  static memberRoles() {
    return ['owner', 'admin', 'member'] as const
  }

  static organizationTypes() {
    return ['publishing_company', 'individual_artist'] as const
  }
}