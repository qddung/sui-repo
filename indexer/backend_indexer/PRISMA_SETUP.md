# Prisma Local Setup Guide

This guide will help you set up and run Prisma locally for the backend_indexer project.

## Prerequisites

1. **PostgreSQL** installed and running locally
   - Download from: https://www.postgresql.org/download/
   - Or use Docker: `docker run --name postgres -e POSTGRES_PASSWORD=postgres -p 5432:5432 -d postgres`

2. **Node.js** (v18 or higher)
   - Download from: https://nodejs.org/

## Step 1: Install Dependencies

```bash
cd backend_indexer
npm install
# or
yarn install
```

## Step 2: Set Up PostgreSQL Database

### Option A: Using PostgreSQL CLI

```bash
# Create database
createdb suimeet_indexer

# Or connect to PostgreSQL and create database
psql postgres
CREATE DATABASE suimeet_indexer;
\q
```

### Option B: Using Docker

```bash
# Run PostgreSQL in Docker
docker run --name suimeet-postgres \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=suimeet_indexer \
  -p 5432:5432 \
  -d postgres:15-alpine

# Verify it's running
docker ps
```

### Option C: Using Docker Compose (Recommended)

```bash
# Start PostgreSQL using docker-compose
docker-compose up -d postgres

# This will start PostgreSQL on port 5432
```

## Step 3: Configure Environment Variables

```bash
# Copy the example env file
cp .env.example .env

# Edit .env with your database credentials
# For local PostgreSQL (default):
DATABASE_URL=postgres://postgres:postgres@localhost:5432/suimeet_indexer

# Or if you have a different user/password:
DATABASE_URL=postgres://your_user:your_password@localhost:5432/suimeet_indexer
```

**Important**: Update the `DATABASE_URL` in `.env` to match your PostgreSQL setup.

## Step 4: Generate Prisma Client

```bash
npm run prisma:generate
# or
yarn prisma:generate
```

This generates the Prisma Client based on your schema.

## Step 5: Run Database Migrations

```bash
# Create and apply migrations
npm run prisma:migrate
# or
yarn prisma:migrate

# This will:
# 1. Create migration files in prisma/migrations/
# 2. Apply migrations to your database
# 3. Regenerate Prisma Client
```

If you get prompted for a migration name, you can use: `init`

## Step 6: Verify Setup

### Option A: Using Prisma Studio (Visual Database Browser)

```bash
npm run prisma:studio
# or
yarn prisma:studio
```

This will open Prisma Studio in your browser at `http://localhost:5555` where you can:
- View all tables
- Browse data
- Edit records
- Test queries

### Option B: Using psql

```bash
psql postgres://postgres:postgres@localhost:5432/suimeet_indexer

# List tables
\dt

# Check meeting_rooms table
SELECT * FROM meeting_rooms LIMIT 5;

# Exit
\q
```

### Option C: Using a Database GUI

You can use any PostgreSQL client like:
- **pgAdmin**: https://www.pgadmin.org/
- **DBeaver**: https://dbeaver.io/
- **TablePlus**: https://tableplus.com/
- **Postico**: https://eggerapps.at/postico/ (Mac only)

Connect using:
- Host: `localhost`
- Port: `5432`
- Database: `suimeet_indexer`
- User: `postgres` (or your user)
- Password: `postgres` (or your password)

## Common Commands

### Prisma Commands

```bash
# Generate Prisma Client
npm run prisma:generate

# Create a new migration
npm run prisma:migrate

# Apply migrations (production)
npm run prisma:deploy

# Open Prisma Studio
npm run prisma:studio

# Reset database (WARNING: deletes all data)
npx prisma migrate reset

# View migration status
npx prisma migrate status

# Format Prisma schema
npx prisma format

# Validate Prisma schema
npx prisma validate
```

### Database Commands

```bash
# Connect to database
psql postgres://postgres:postgres@localhost:5432/suimeet_indexer

# List all tables
\dt

# Describe a table
\d meeting_rooms

# View table data
SELECT * FROM meeting_rooms;

# Count records
SELECT COUNT(*) FROM meeting_rooms;

# Exit psql
\q
```

## Troubleshooting

### Error: "Can't reach database server"

**Solution**: Make sure PostgreSQL is running:
```bash
# Check if PostgreSQL is running
# Windows
net start postgresql-x64-15

# Mac/Linux
brew services list | grep postgresql
# or
sudo systemctl status postgresql

# Docker
docker ps | grep postgres
```

### Error: "database does not exist"

**Solution**: Create the database:
```bash
createdb suimeet_indexer
# or
psql postgres -c "CREATE DATABASE suimeet_indexer;"
```

### Error: "password authentication failed"

**Solution**: Check your `.env` file and make sure the `DATABASE_URL` has the correct credentials:
```bash
# Format: postgres://USERNAME:PASSWORD@HOST:PORT/DATABASE
DATABASE_URL=postgres://postgres:postgres@localhost:5432/suimeet_indexer
```

### Error: "relation does not exist"

**Solution**: Run migrations:
```bash
npm run prisma:migrate
```

### Reset Database (Delete all data and start fresh)

```bash
# WARNING: This will delete all data!
npx prisma migrate reset

# This will:
# 1. Drop the database
# 2. Create a new database
# 3. Apply all migrations
# 4. Run seed script (if exists)
```

## Next Steps

Once Prisma is set up locally:

1. **Run the indexer**:
   ```bash
   npm run dev
   ```

2. **Monitor the database**:
   ```bash
   npm run prisma:studio
   ```

3. **Check indexed data**:
   ```sql
   SELECT * FROM meeting_rooms ORDER BY indexed_at DESC LIMIT 10;
   ```

## Additional Resources

- [Prisma Documentation](https://www.prisma.io/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Prisma Studio Guide](https://www.prisma.io/studio)

