interface UserData {
  privy_user_id: string
  email?: string
  embedded_wallet_address?: string
  created_at?: string
}

interface AuthData {
  userId: string
  accessToken: string
  linked_accounts?: Array<{
    type: string
    chain_type?: string
    address: string
  }>
}

export class UserBuilder {
  private user: UserData = {
    privy_user_id: 'privy-user-123',
    email: 'test@example.com',
    embedded_wallet_address: 'DjVE6JNiYqPL2QXyCbqkKKXo8PiW3uYwVLwxjyeo8jqV',
    created_at: '2024-01-01T00:00:00Z',
  }

  static create(): UserBuilder {
    return new UserBuilder()
  }

  withPrivyUserId(id: string): UserBuilder {
    this.user.privy_user_id = id
    return this
  }

  withEmail(email: string): UserBuilder {
    this.user.email = email
    return this
  }

  withWalletAddress(address: string): UserBuilder {
    this.user.embedded_wallet_address = address
    return this
  }

  withCreatedAt(date: string): UserBuilder {
    this.user.created_at = date
    return this
  }

  build(): UserData {
    return { ...this.user }
  }

  buildForDatabase() {
    return {
      id: 'user-123',
      ...this.user,
    }
  }
}

export class AuthBuilder {
  private auth: AuthData = {
    userId: 'privy-user-123',
    accessToken: 'test-access-token',
    linked_accounts: [
      {
        type: 'wallet',
        chain_type: 'solana',
        address: 'DjVE6JNiYqPL2QXyCbqkKKXo8PiW3uYwVLwxjyeo8jqV',
      },
    ],
  }

  static create(): AuthBuilder {
    return new AuthBuilder()
  }

  withUserId(id: string): AuthBuilder {
    this.auth.userId = id
    return this
  }

  withAccessToken(token: string): AuthBuilder {
    this.auth.accessToken = token
    return this
  }

  withSolanaWallet(address: string): AuthBuilder {
    this.auth.linked_accounts = [
      {
        type: 'wallet',
        chain_type: 'solana',
        address,
      },
    ]
    return this
  }

  withMultipleWallets(addresses: string[]): AuthBuilder {
    this.auth.linked_accounts = addresses.map(address => ({
      type: 'wallet',
      chain_type: 'solana',
      address,
    }))
    return this
  }

  withoutWallets(): AuthBuilder {
    this.auth.linked_accounts = []
    return this
  }

  build(): AuthData {
    return { ...this.auth }
  }

  buildPrivyUser() {
    return {
      id: this.auth.userId,
      linked_accounts: this.auth.linked_accounts || [],
    }
  }
}

// Predefined auth scenarios
export const AuthScenarios = {
  validUser: () => AuthBuilder.create(),
  
  userWithoutWallet: () => AuthBuilder.create().withoutWallets(),
  
  userWithMultipleWallets: () =>
    AuthBuilder.create().withMultipleWallets([
      'DjVE6JNiYqPL2QXyCbqkKKXo8PiW3uYwVLwxjyeo8jqV',
      'BrG44HdsEhzapvs8bEqzvkq4egwevS3fRE6ze2ENo6S8',
    ]),
  
  expiredToken: () => AuthBuilder.create().withAccessToken('expired-token'),
}