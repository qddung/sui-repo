# Quick Start - Run Prisma Locally

## 🚀 Fastest Way (Docker Compose)

```powershell
# 1. Start PostgreSQL
docker-compose up -d postgres

# 2. Create .env file (if not exists)
# Copy .env.example to .env and update DATABASE_URL

# 3. Generate Prisma Client
yarn prisma:generate

# 4. Run migrations
yarn prisma:migrate

# 5. (Optional) Open Prisma Studio
yarn prisma:studio
```

## 📋 Step-by-Step Commands

### 1. Install Dependencies (if not done)
```powershell
yarn install
```

### 2. Set Up Database

**Option A: Docker Compose**
```powershell
docker-compose up -d postgres
```

**Option B: Local PostgreSQL**
```powershell
# Create database
createdb suimeet_indexer
# Or using psql
psql -U postgres -c "CREATE DATABASE suimeet_indexer;"
```

### 3. Configure Environment

Create `.env` file:
```env
DATABASE_URL=postgres://suimeet:suimeet_password@localhost:5432/suimeet_indexer
SUIMEET_PACKAGE_ID=0x<your_package_id>
SUI_RPC_URL=https://fullnode.testnet.sui.io:443
SUI_NETWORK=testnet
LOG_LEVEL=info
```

### 4. Generate Prisma Client
```powershell
yarn prisma:generate
```

### 5. Run Migrations
```powershell
yarn prisma:migrate
```

When prompted, enter a migration name (e.g., `init`)

### 6. Verify Setup

**Option A: Prisma Studio (Visual)**
```powershell
yarn prisma:studio
```
Open http://localhost:5555 in your browser

**Option B: psql (Command Line)**
```powershell
psql postgres://suimeet:suimeet_password@localhost:5432/suimeet_indexer
\dt  # List tables
SELECT * FROM meeting_rooms;  # View data
\q   # Exit
```

## ✅ Verify It's Working

```powershell
# Check if tables were created
yarn prisma:studio

# Or using psql
psql $env:DATABASE_URL -c "\dt"
```

## 🛠️ Common Commands

```powershell
# Generate Prisma Client
yarn prisma:generate

# Create migration
yarn prisma:migrate

# Open Prisma Studio
yarn prisma:studio

# Reset database (WARNING: deletes all data)
npx prisma migrate reset

# View migration status
npx prisma migrate status
```

## 🔧 Troubleshooting

### PostgreSQL not running
```powershell
# Check if PostgreSQL is running (Docker)
docker ps | findstr postgres

# Start PostgreSQL (Docker)
docker-compose up -d postgres

# Check if PostgreSQL is running (Local)
Get-Service postgresql*
```

### Connection error
- Check `.env` file has correct `DATABASE_URL`
- Verify PostgreSQL is running
- Check credentials (username/password)

### Migration errors
```powershell
# Reset and re-run migrations
npx prisma migrate reset
yarn prisma:migrate
```

## 📚 Next Steps

Once Prisma is set up:

1. **Run the indexer**:
   ```powershell
   yarn dev
   ```

2. **Monitor database**:
   ```powershell
   yarn prisma:studio
   ```

3. **Check indexed data**:
   ```sql
   SELECT * FROM meeting_rooms ORDER BY indexed_at DESC LIMIT 10;
   ```

