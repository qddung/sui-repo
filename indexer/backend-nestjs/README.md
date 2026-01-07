# SuiMeet Backend (NestJS)

Backend API for SuiMeet - JWT session management with auto-sign support for Sui blockchain transactions. Built with NestJS framework.

## Features

- 🔐 JWT-based authentication with wallet signatures
- 🔑 Ephemeral key management for auto-signing
- 🏠 Room creation and management
- ✅ Guest approval system
- 🔒 Encrypted private key storage
- 📊 PostgreSQL database with Prisma
- 🎯 NestJS framework with TypeScript

## Setup

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables (create `.env` file):
```env
DATABASE_URL="postgresql://user:password@localhost:5432/suimeet"
JWT_SECRET=your-super-secret-jwt-key-change-in-production
ENCRYPTION_KEY=your-32-byte-hex-key  # Generate with: openssl rand -hex 32
PORT=3001
NODE_ENV=development
```

3. Generate Prisma Client:
```bash
npm run prisma:generate
```

4. Run migrations:
```bash
npm run prisma:migrate
```

5. Start development server:
```bash
npm run start:dev
```

## API Endpoints

### Authentication

- `POST /api/auth/nonce` - Generate nonce for wallet authentication
- `POST /api/auth/verify` - Verify signature and create session
- `POST /api/auth/refresh` - Refresh access token

### Sessions

- `POST /api/sessions/ephemeral-key` - Create ephemeral key for auto-signing
- `POST /api/sessions/auto-sign` - Auto-sign transaction
- `GET /api/sessions/me` - Get current session info

### Rooms

- `GET /api/rooms` - Get all meeting rooms
- `GET /api/rooms/:roomId` - Get room details
- `POST /api/rooms` - Create a new meeting room record
- `POST /api/rooms/:roomId/approval-request` - Request approval to join room
- `POST /api/rooms/:roomId/approve/:requestId` - Approve a guest
- `POST /api/rooms/:roomId/deny/:requestId` - Deny a guest

### Child Wallet

- `POST /api/child-wallet/create` - Create a child wallet (ephemeral keypair)
- `GET /api/child-wallet/list` - List all active child wallets
- `POST /api/child-wallet/sign` - Sign a transaction using child wallet
- `DELETE /api/child-wallet/:id` - Revoke a child wallet

### Signaling

- `POST /api/signaling/:roomId/offer` - Set WebRTC offer
- `GET /api/signaling/:roomId/offer` - Get WebRTC offer
- `POST /api/signaling/:roomId/answer` - Set WebRTC answer
- `GET /api/signaling/:roomId/answer` - Get WebRTC answer
- `POST /api/signaling/:roomId/candidates` - Add ICE candidate
- `GET /api/signaling/:roomId/candidates` - Get ICE candidates
- `POST /api/signaling/:roomId/end` - End call

## Architecture

- **Authentication Flow**: Wallet → Nonce → Signature → JWT Session
- **Auto-Sign Flow**: Ephemeral Key → Encrypted Storage → Auto-Sign API
- **Room Management**: On-chain Sui objects + Off-chain Prisma records

## Project Structure

```
src/
├── auth/              # Authentication module
├── sessions/          # Session management module
├── rooms/             # Room management module
├── child-wallet/      # Child wallet (ephemeral keys) module
├── signaling/         # WebRTC signaling module
├── common/            # Shared utilities
│   ├── prisma/       # Prisma service
│   ├── crypto/       # Encryption utilities
│   ├── jwt/          # JWT utilities
│   ├── guards/       # Auth guards
│   └── decorators/   # Custom decorators
├── config/           # Configuration module
└── types/            # TypeScript types
```

## Database Schema

See `prisma/schema.prisma` for full schema with:
- User & Wallet management
- Session & JWT tokens
- Ephemeral keys for auto-signing
- Room & Membership tracking
- POAP minting records
- P2P session logs

## Development

```bash
# Development mode with hot reload
npm run start:dev

# Production build
npm run build
npm run start:prod

# Run tests
npm run test

# Lint code
npm run lint
```

