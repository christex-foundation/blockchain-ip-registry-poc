interface WorkData {
  title: string
  isrc?: string
  description?: string
  total_shares?: number
  nft_mint_address?: string | null
  metadata_uri?: string | null
  contributors: ContributorData[]
}

interface ContributorData {
  name: string
  wallet_address: string
  royalty_share: number
}

export class WorkBuilder {
  private work: WorkData = {
    title: 'Test Song',
    isrc: 'USRC17607834',
    description: 'A test song for validation',
    total_shares: 100,
    nft_mint_address: null,
    metadata_uri: null,
    contributors: [],
  }

  static create(): WorkBuilder {
    return new WorkBuilder()
  }

  withTitle(title: string): WorkBuilder {
    this.work.title = title
    return this
  }

  withISRC(isrc: string): WorkBuilder {
    this.work.isrc = isrc
    return this
  }

  withDescription(description: string): WorkBuilder {
    this.work.description = description
    return this
  }

  withNftMintAddress(address: string | null): WorkBuilder {
    this.work.nft_mint_address = address
    return this
  }

  withMetadataUri(uri: string | null): WorkBuilder {
    this.work.metadata_uri = uri
    return this
  }

  withContributors(...contributors: ContributorData[]): WorkBuilder {
    this.work.contributors = contributors
    this.work.total_shares = contributors.reduce((sum, c) => sum + c.royalty_share, 0)
    return this
  }

  withValidShareDistribution(): WorkBuilder {
    this.work.contributors = [
      ContributorBuilder.create().withName('Lead Artist').withShare(60).build(),
      ContributorBuilder.create().withName('Producer').withShare(40).build(),
    ]
    this.work.total_shares = 100
    return this
  }

  withComplexShareDistribution(): WorkBuilder {
    this.work.contributors = [
      ContributorBuilder.create().withName('Lead Artist').withShare(35).build(),
      ContributorBuilder.create().withName('Featured Artist').withShare(25).build(),
      ContributorBuilder.create().withName('Producer').withShare(20).build(),
      ContributorBuilder.create().withName('Songwriter').withShare(20).build(),
    ]
    this.work.total_shares = 100
    return this
  }

  withInvalidShareDistribution(): WorkBuilder {
    this.work.contributors = [
      ContributorBuilder.create().withName('Artist').withShare(60).build(),
      ContributorBuilder.create().withName('Producer').withShare(30).build(),
    ]
    this.work.total_shares = 90
    return this
  }

  build(): WorkData {
    return { ...this.work }
  }

  buildForDatabase() {
    const { contributors, ...workData } = this.work
    return workData
  }

  buildForAPI() {
    return {
      title: this.work.title,
      isrc: this.work.isrc,
      description: this.work.description,
      contributors: this.work.contributors.map(c => ({
        name: c.name,
        walletAddress: c.wallet_address,
        share: c.royalty_share,
      })),
    }
  }
}

export class ContributorBuilder {
  private contributor: ContributorData = {
    name: 'Test Artist',
    wallet_address: 'DjVE6JNiYqPL2QXyCbqkKKXo8PiW3uYwVLwxjyeo8jqV',
    royalty_share: 50,
  }

  static create(): ContributorBuilder {
    return new ContributorBuilder()
  }

  withName(name: string): ContributorBuilder {
    this.contributor.name = name
    return this
  }

  withWalletAddress(address: string): ContributorBuilder {
    this.contributor.wallet_address = address
    return this
  }

  withShare(share: number): ContributorBuilder {
    this.contributor.royalty_share = share
    return this
  }

  asArtist(): ContributorBuilder {
    this.contributor.name = 'Lead Artist'
    this.contributor.wallet_address = '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM'
    return this
  }

  asProducer(): ContributorBuilder {
    this.contributor.name = 'Producer'
    this.contributor.wallet_address = 'ByT7spdPJyxfLYD7bGhRZwXzGhWAhYWzXHJ7qJGbGqmH'
    return this
  }

  asSongwriter(): ContributorBuilder {
    this.contributor.name = 'Songwriter'
    this.contributor.wallet_address = '3kJKXfNKKfXHXYjHQqbKxKvXHXYjHQqbKxKvXHXYjHQq'
    return this
  }

  // Add real production data patterns
  asOgArtist(): ContributorBuilder {
    this.contributor.name = 'og'
    this.contributor.wallet_address = '7z7Q3UH4cMxSNDTATsQcC34rr4MVA9ydqpbeqnU4q7ba'
    return this
  }

  asFndnArtist(): ContributorBuilder {
    this.contributor.name = 'fndn'
    this.contributor.wallet_address = '3AqsxnVmsH3TyoeRFxMSDvDmHTsySoLnYtVAWMk7RYff'
    return this
  }

  build(): ContributorData {
    return { ...this.contributor }
  }

  buildForDatabase(workId: string) {
    return {
      work_id: workId,
      name: this.contributor.name,
      wallet_address: this.contributor.wallet_address,
      royalty_share: this.contributor.royalty_share,
    }
  }
}

// Predefined common test scenarios
export const TestScenarios = {
  validSingleArtist: () =>
    WorkBuilder.create()
      .withTitle('Solo Artist Song')
      .withContributors(ContributorBuilder.create().asArtist().withShare(100).build()),

  validDualArtist: () =>
    WorkBuilder.create()
      .withTitle('Collaboration Song')
      .withValidShareDistribution(),

  complexWork: () =>
    WorkBuilder.create()
      .withTitle('Complex Production')
      .withComplexShareDistribution(),

  invalidShares: () =>
    WorkBuilder.create()
      .withTitle('Invalid Work')
      .withInvalidShareDistribution(),

  minimalWork: () =>
    WorkBuilder.create()
      .withTitle('Minimal Work')
      .withISRC('')
      .withDescription('')
      .withContributors(ContributorBuilder.create().withShare(100).build()),

  workWithNFT: () =>
    WorkBuilder.create()
      .withTitle('Minted Work')
      .withNftMintAddress('HdFUYggmcPLy9hsRajgAALVk7AE4s4K26xhreAUMwXZc')
      .withMetadataUri('http://localhost:3000/api/metadata/713d022c-f03f-44d2-be5a-65b57478e091')
      .withValidShareDistribution(),

  // Real production scenarios based on database data
  realProductionWork: () =>
    WorkBuilder.create()
      .withTitle('My Work for Barry')
      .withISRC('34324nfns')
      .withNftMintAddress('HdFUYggmcPLy9hsRajgAALVk7AE4s4K26xhreAUMwXZc')
      .withContributors(
        ContributorBuilder.create().asOgArtist().withShare(40).build(),
        ContributorBuilder.create().asFndnArtist().withShare(60).build()
      ),

  realTestWork: () =>
    WorkBuilder.create()
      .withTitle('Sample Track #1')
      .withISRC('USRC12345678')
      .withMetadataUri('https://ipfs.io/ipfs/QmExampleDemo1')
      .withContributors(
        ContributorBuilder.create().asArtist().withShare(60).build(),
        ContributorBuilder.create().asProducer().withShare(40).build()
      ),

  // Edge case: non-standard royalty split
  realNonStandardSplit: () =>
    WorkBuilder.create()
      .withTitle('this is my work')
      .withISRC('jfsdfo2342')
      .withNftMintAddress('C7jhBFmdUXuyDr3ABSeA4jfYmCD5LAtpcXm5cPth9zWq')
      .withContributors(
        ContributorBuilder.create().withName('ogo').withWalletAddress('7z7Q3UH4cMxSNDTATsQcC34rr4MVA9ydqpbeqnU4q7ba').withShare(38).build(),
        ContributorBuilder.create().withName('owo').withWalletAddress('3AqsxnVmsH3TyoeRFxMSDvDmHTsySoLnYtVAWMk7RYff').withShare(62).build()
      ),
}