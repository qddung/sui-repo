# SuiMeet Docker Setup

This directory contains Docker configuration files for running SuiMeet services.

## Services

- **postgres**: PostgreSQL database (suimeet-postgres)
- **backend**: Express.js backend API
- **frontend**: Next.js frontend application

## Quick Start

1. **Create environment file** (optional, can use defaults):
   ```bash
   cp .env.example .env
   ```

2. **Build and start all services**:
   ```bash
   docker-compose up -d
   ```

3. **View logs**:
   ```bash
   docker-compose logs -f
   ```

4. **Stop services**:
   ```bash
   docker-compose down
   ```

## Environment Variables

### Backend
- `DATABASE_URL`: PostgreSQL connection string (auto-configured for postgres service)
- `JWT_SECRET`: Secret key for JWT tokens
- `ENCRYPTION_KEY`: AES-256 key for encrypting private keys
- `SUI_PACKAGE_ID`: Sui package ID
- `CORS_ORIGIN`: Allowed CORS origin (default: http://localhost:3000)

### Frontend
- `NEXT_PUBLIC_API_URL`: Backend API URL (default: http://backend:3001/api)
- `NEXT_PUBLIC_PACKAGE_ID`: Sui package ID
- `NEXT_PUBLIC_REGISTRY_ID`: Sui registry ID
- `NEXT_PUBLIC_NETWORK`: Sui network (testnet/mainnet)
- `NEXT_PUBLIC_SUI_RPC_URL`: Sui RPC endpoint
- `NEXT_PUBLIC_WALRUS_ENDPOINT`: Walrus API endpoint

## Database

The postgres service uses:
- **User**: suimeet
- **Password**: suimeet_password
- **Database**: suimeet_indexer
- **Port**: 5432

Data persists in the `postgres_data` volume.

## Accessing Services

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001/api
- **PostgreSQL**: localhost:5432

## Development

For development with hot-reload, use the individual service commands instead of Docker:

```bash
# Backend
cd backend
npm run dev

# Frontend
cd frontend-app
npm run dev
```

## Troubleshooting

1. **Port conflicts**: Change ports in docker-compose.yml if 3000, 3001, or 5432 are in use
2. **Database connection**: Ensure postgres service is healthy before starting backend
3. **Build errors**: Check that all environment variables are set correctly
4. **Prisma migrations**: Backend automatically runs migrations on startup

