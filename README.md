# IP OnChain - Intellectual Property Management Platform

A comprehensive Next.js application for registering, managing, and distributing intellectual property rights on the Solana blockchain.

## Features

- **🎵 IP Work Registration**: Register musical works and other intellectual property as NFTs
- **🏢 Organization Management**: Create and manage publishing companies and artist collectives
- **⛓️ Blockchain Native**: Built on Solana using Metaplex Core for efficient on-chain operations
- **👥 Collaborative Workflow**: Multi-user organizations with role-based permissions
- **💰 Royalty Distribution**: Automated royalty distribution to contributors
- **🔐 Secure Authentication**: Privy-based wallet authentication and user management
- **📊 Dual Storage**: Optimized hybrid on-chain/off-chain metadata storage

## Architecture

- **Frontend**: Next.js 15 with TypeScript and Tailwind CSS
- **Blockchain**: Solana with Metaplex Core NFT standard
- **Database**: Supabase for off-chain data and caching
- **Authentication**: Privy for seamless wallet integration
- **Testing**: Vitest with comprehensive test coverage

## Getting Started

### Installation

#### Download the template

```shell
pnpm create solana-dapp@latest -t gh:solana-developers/solana-templates/templates/ip-onchain-next
```

#### Install Dependencies

```shell
pnpm install
```

## Apps

### anchor

This is a Solana program written in Rust using the Anchor framework.

#### Commands

You can use any normal anchor commands. Either move to the `anchor` directory and run the `anchor` command or prefix the command with `pnpm`, eg: `pnpm anchor`.

#### Sync the program id:

Running this command will create a new keypair in the `anchor/target/deploy` directory and save the address to the Anchor config file and update the `declare_id!` macro in the `./src/lib.rs` file of the program. This will also update the constant in `anchor/src/basic-exports.ts` file.

```shell
pnpm run setup
```

#### Build the program:

```shell
pnpm anchor-build
```

#### Start the test validator with the program deployed:

```shell
pnpm anchor-localnet
```

#### Run the tests

```shell
pnpm anchor-test
```

#### Deploy to Devnet

```shell
pnpm anchor deploy --provider.cluster devnet
```

### web

The main IP OnChain application built with Next.js, featuring:

- **Dashboard**: Overview of registered works and organizations
- **Work Registration**: Register intellectual property with contributor management
- **Organizations**: Create and manage publishing companies or artist collectives
- **Member Management**: Add/remove organization members with role-based permissions

#### Commands

Start the development server:

```shell
pnpm dev
```

Build the application:

```shell
pnpm build
```

Run tests:

```shell
pnpm test
```

Run tests with coverage:

```shell
pnpm test:coverage
```

## Usage

### Getting Started

1. **Connect Your Wallet**: Use the Privy authentication to connect your Solana wallet
2. **Register a Work**: Navigate to "Register Work" to create your first IP registration
3. **Create Organization**: Set up a publishing company or artist collective
4. **Invite Members**: Add team members with appropriate permissions
5. **Manage IP Portfolio**: View and manage your intellectual property assets

### Organization Types

- **Publishing Company**: For music labels and publishing houses
- **Individual Artist**: For solo artists and small collectives

### Member Roles

- **Owner**: Full control over organization and members
- **Admin**: Can manage members and register works  
- **Member**: Can register works under the organization

## Documentation

For detailed implementation information, see:

- [`/docs/AUTHENTICATION_FLOW.md`](./docs/AUTHENTICATION_FLOW.md) - Authentication system
- [`/docs/DUAL_STORAGE_IMPLEMENTATION.md`](./docs/DUAL_STORAGE_IMPLEMENTATION.md) - Data storage architecture
- [`/docs/SUPABASE_INTEGRATION.md`](./docs/SUPABASE_INTEGRATION.md) - Database integration
- [`/docs/TESTING_STRATEGY.md`](./docs/TESTING_STRATEGY.md) - Testing approach
- [`IMPLEMENTATION_PROGRESS.md`](./IMPLEMENTATION_PROGRESS.md) - Organization feature details
