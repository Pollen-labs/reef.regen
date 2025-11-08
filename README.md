# Reef.Regen

Reef.Regen is a lightweight web application that empowers organizations, citizen scientists, and communities to create verifiable, blockchain-based records of their coral restoration activities. The platform provides impact makers with an accessible, permissionless method to document and showcase their conservation work.

## Overview

Reef.Regen enables marine researchers, NGOs, and community projects to record, verify, and publicly display coral restoration actions as on-chain attestations using the Ethereum Attestation Service (EAS). The platform combines a user-friendly web interface with blockchain-based verification, ensuring transparency and immutability of conservation efforts.

## Features

### Core Functionality

- **Interactive Map View**: Explore coral restoration sites worldwide with MapLibre GL, featuring:
  - Real-time location markers with attestation counts
  - Site detail panels with action breakdowns and species diversity
  - Mobile-optimized draggable bottom sheets
  - Multi-site disambiguation popovers

- **Attestation Wizard**: Multi-step form for creating verifiable restoration records:
  - Step 1: Select restoration action types (multi-select)
  - Step 2: Choose action date and site location
  - Step 3: Add summary and evidence file upload
  - Step 4: Record species diversity
  - Step 5: Credit contributors
  - Auto-save with local persistence
  - Leave warning to prevent data loss

- **Profile Management**: 
  - Public profiles with customizable handles
  - Organization name, description, and website
  - Onboarding flow for first-time users
  - Profile statistics and attestation history

- **Blockchain Integration**:
  - Delegated EAS attestations (gasless for users)
  - EIP-712 typed data signing
  - IPFS file storage via Filebase
  - On-chain verification via EAS Explorer

### Technical Features

- **Embedded Wallet Authentication**: Web3Auth integration for seamless social/email login
- **Responsive Design**: Mobile-first approach with optimized touch interactions
- **State Management**: Zustand with persistence for wizard state
- **Type Safety**: Full TypeScript coverage with Zod validation
- **Performance**: Optimized map rendering, lazy loading, and code splitting

## Architecture

Reef.Regen follows a modern full-stack architecture:

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (Next.js)                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │   React UI   │  │   Wagmi/Viem │  │  MapLibre GL │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────┘
                        │                    │
                        ▼                    ▼
        ┌──────────────────────┐  ┌──────────────────────┐
        │   Supabase (Backend)  │  │  Cloudflare Worker    │
        │  ┌─────────────────┐ │  │  ┌─────────────────┐ │
        │  │   PostgreSQL    │ │  │  │   EAS Relayer   │ │
        │  │   RLS Policies  │ │  │  │   Signature     │ │
        │  │   Edge Functions│ │  │  │   Verification  │ │
        │  └─────────────────┘ │  │  └─────────────────┘ │
        └──────────────────────┘  └──────────────────────┘
                        │                    │
                        └──────────┬─────────┘
                                   ▼
                        ┌──────────────────────┐
                        │  EAS (Blockchain)    │
                        │  Optimism Sepolia    │
                        └──────────────────────┘
```

### Component Layers

- **Frontend**: Next.js 16 (App Router) with React 18
- **Backend**: Supabase (PostgreSQL + Edge Functions)
- **Relayer**: Cloudflare Worker for gasless transactions
- **Blockchain**: Ethereum Attestation Service on Optimism Sepolia
- **Storage**: IPFS via Filebase for evidence files

## Tech Stack

### Frontend

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **UI Library**: React 18
- **Styling**: Tailwind CSS
- **State Management**: Zustand (with persistence)
- **Form Validation**: Zod
- **Maps**: MapLibre GL 3.6.2
- **Charts**: Chart.js + react-chartjs-2
- **Wallet Integration**: 
  - Web3Auth Modal (@web3auth/modal)
  - Wagmi v2 + Viem
  - EAS SDK (@ethereum-attestation-service/eas-sdk)

### Backend

- **Database**: Supabase (PostgreSQL with PostGIS)
- **Authentication**: Supabase Auth + Web3Auth
- **API**: Next.js API Routes + Supabase Edge Functions
- **File Storage**: AWS S3 (via @aws-sdk/client-s3) → IPFS (Filebase)

### Infrastructure

- **Relayer**: Cloudflare Worker (TypeScript)
- **Blockchain**: Optimism Sepolia (Chain ID: 11155420)
- **EAS Contract**: `0x4200000000000000000000000000000000000021`
- **Package Manager**: pnpm 9.11.0

## Getting Started

### Prerequisites

- Node.js 18+ 
- pnpm 9.11.0 (managed via Corepack)
- Supabase account and project
- Cloudflare Workers account (for relayer)
- Web3Auth account (for embedded wallets)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd reef.regen
   ```

2. **Install dependencies**
   ```bash
   # Enable Corepack (recommended)
   corepack enable
   
   # Ensure correct pnpm version
   corepack prepare pnpm@9.11.0 --activate
   
   # Install dependencies
   pnpm install
   ```

3. **Set up environment variables**
   
   Create a `.env.local` file in the root directory:
   ```bash
   # Supabase
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   
   # Web3Auth
   NEXT_PUBLIC_WEB3AUTH_CLIENT_ID=your_web3auth_client_id
   
   # EAS Configuration
   NEXT_PUBLIC_EAS_ADDRESS=0x4200000000000000000000000000000000000021
   NEXT_PUBLIC_EAS_VERSION=1.0.0
   NEXT_PUBLIC_CHAIN_ID=11155420
   NEXT_PUBLIC_DEFAULT_SCHEMA_UID=your_schema_uid
   
   # Relayer
   RELAYER_URL=your_cloudflare_worker_url
   RELAYER_INVOKE_KEY=your_supabase_anon_key
   
   # File Storage (Filebase/IPFS)
   NEXT_PUBLIC_FILEBASE_BUCKET=your_bucket_name
   FILEBASE_ACCESS_KEY=your_access_key
   FILEBASE_SECRET_KEY=your_secret_key
   FILEBASE_ENDPOINT=your_filebase_endpoint
   
   # Map Tiles (optional)
   NEXT_PUBLIC_OPENMAPTILES_KEY=your_maptiler_key
   ```

4. **Set up Supabase database**
   
   Run the SQL migrations in `supabase/sql/` to create the required tables:
   - `profiles`
   - `sites`
   - `attestations`
   - `regen_type`
   - `taxa`
   - Join tables and indexes

5. **Deploy Cloudflare Worker relayer**
   
   See `eas-relayer/` directory for the relayer implementation. Deploy to Cloudflare Workers with the following secrets:
   - `RELAYER_PRIVATE_KEY`: Funded wallet private key
   - `RPC_URL`: Optimism Sepolia RPC endpoint
   - `EAS_ADDRESS`: EAS contract address
   - `CHAIN_ID`: 11155420
   - `EAS_DOMAIN_VERSION`: 1.0.0
   - `ALLOWED_SCHEMA_UIDS`: Comma-separated schema UIDs
   - `ALLOWED_ORIGINS`: Comma-separated allowed origins

6. **Start development server**
   ```bash
   pnpm dev
   ```

   The application will be available at `http://localhost:3000`

## Project Structure

```
reef.regen/
├── app/                    # Next.js App Router pages
│   ├── api/                # API routes (Supabase proxies)
│   ├── map/               # Map page
│   ├── profile/           # Profile pages
│   ├── submit/            # Attestation wizard
│   └── page.tsx           # Landing page
├── components/            # React components
│   ├── map/              # Map-related components
│   ├── wizard/           # Wizard step components
│   ├── shared/           # Shared UI components
│   └── ui/               # Base UI components
├── lib/                   # Utilities and helpers
│   ├── eas.ts            # EAS SDK integration
│   ├── wizard/           # Wizard state management
│   └── validation.ts     # Zod schemas
├── hooks/                 # Custom React hooks
├── types/                 # TypeScript type definitions
├── supabase/              # Database migrations
│   └── sql/              # SQL migration files
└── docs/                  # Product specifications
```

## Key Components

### Map View (`components/map/MapView.tsx`)
- Full-screen interactive map with MapLibre GL
- Pin clustering and selection handling
- Multi-site disambiguation popovers
- Mobile-optimized positioning

### Location Pane (`components/map/LocationPane.tsx`)
- Site detail drawer with statistics
- Draggable bottom sheet on mobile
- Attestation list with detail modal
- Species diversity visualization

### Attestation Wizard (`app/submit/steps/[n]/page.tsx`)
- Multi-step form with progress tracking
- Local state persistence (Zustand)
- Leave warning guard
- File upload to IPFS

### Profile System (`app/profile/`)
- Public profile pages with handles
- Profile settings and onboarding
- Statistics and attestation history

## Development

### Available Scripts

- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm start` - Start production server

### Code Style

- TypeScript strict mode enabled
- ESLint configuration (if configured)
- Consistent component patterns (see existing components)
- Tailwind CSS for styling

### Testing

Currently uses manual testing. Consider adding:
- Unit tests for utilities (`lib/`)
- Integration tests for API routes
- E2E tests for critical flows

## Deployment

### Frontend (Vercel/Next.js)

1. Connect repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Backend (Supabase)

1. Run migrations via Supabase Dashboard SQL Editor
2. Configure RLS policies
3. Deploy Edge Functions (if used)

### Relayer (Cloudflare Workers)

1. Deploy via `wrangler deploy` or Cloudflare Dashboard
2. Set secrets in Cloudflare Dashboard
3. Verify relayer health endpoint

## Environment Variables Reference

### Frontend (Next.js)

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key | Yes |
| `NEXT_PUBLIC_WEB3AUTH_CLIENT_ID` | Web3Auth client ID | Yes |
| `NEXT_PUBLIC_EAS_ADDRESS` | EAS contract address | Yes |
| `NEXT_PUBLIC_EAS_VERSION` | EAS domain version (1.0.0) | Yes |
| `NEXT_PUBLIC_CHAIN_ID` | Chain ID (11155420 for OP Sepolia) | Yes |
| `NEXT_PUBLIC_DEFAULT_SCHEMA_UID` | Default EAS schema UID | Yes |
| `RELAYER_URL` | Cloudflare Worker relayer URL | Yes |
| `RELAYER_INVOKE_KEY` | Supabase anon key for relayer auth | Yes |
| `NEXT_PUBLIC_FILEBASE_BUCKET` | Filebase bucket name | Yes |
| `FILEBASE_ACCESS_KEY` | Filebase access key | Yes |
| `FILEBASE_SECRET_KEY` | Filebase secret key | Yes |
| `FILEBASE_ENDPOINT` | Filebase endpoint URL | Yes |
| `NEXT_PUBLIC_OPENMAPTILES_KEY` | MapTiler API key (optional) | No |

### Backend (Supabase Edge Functions)

| Variable | Description |
|----------|-------------|
| `RELAYER_PRIVATE_KEY` | Funded wallet private key |
| `RPC_URL` | Optimism Sepolia RPC endpoint |
| `EAS_ADDRESS` | EAS contract address |
| `CHAIN_ID` | 11155420 |
| `EAS_DOMAIN_VERSION` | 1.0.0 |
| `ALLOWED_SCHEMA_UIDS` | Comma-separated schema UIDs |
| `ALLOWED_ORIGINS` | Comma-separated allowed origins |

## Documentation

Comprehensive product specifications and technical documentation are available in the `docs/` directory:

- `0.7-map.md` - Map page implementation spec
- `1.0-EAS-schema-update.md` - EAS schema definition
- `1.2-onboarding.md` - Onboarding flow specification
- `1.3.1-attest-step.md` through `1.3.6-attest-review.md` - Attestation wizard steps
- `0.9-backend-update.md` - Database schema and data model

## Contributing

This project is maintained by Pollen Labs. For contributions, please:

1. Review existing code patterns and documentation
2. Follow TypeScript best practices
3. Maintain consistent styling with Tailwind CSS
4. Test on both desktop and mobile devices
5. Update documentation as needed

## License

[Add license information]

## Acknowledgments

- **Pollen Labs** - Creation and development
- **MesoReef DAO** - Maintenance and community hosting

---

For detailed product specifications and implementation details, see the `docs/` directory.
