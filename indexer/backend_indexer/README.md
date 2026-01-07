# SuiMeet Indexer (TypeScript/Node.js)

Production-grade indexer for SuiMeet meeting room events using TypeScript and Node.js.

## Overview

This indexer tracks all meeting room events on-chain and stores them in PostgreSQL for efficient querying. It processes:

- **RoomCreated**: New meeting rooms
- **RoomStarted**: When meetings begin
- **RoomEnded**: When meetings conclude
- **GuestApproved**: When hosts approve participants
- **GuestRevoked**: When hosts revoke access
- **MetadataUpdated**: When room metadata is updated

## Architecture

```
Sui Blockchain → TypeScript Indexer → PostgreSQL → Your Application
                  (Event Processing)   (Structured Data)
```

### Components

- **Event Parsers** (`src/types/events.ts`): Type-safe event definitions
- **Processors** (`src/processors/`): Transform events into database operations
- **Database Models** (`prisma/schema.prisma`): Prisma ORM models for PostgreSQL
- **Migrations** (`prisma/migrations/`): Database schema definitions

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Create Database

```bash
# Create database
createdb suimeet_indexer

# Or with psql
psql postgres
CREATE DATABASE suimeet_indexer;
\q
```

### 3. Configure Environment

```bash
# Copy example env file
cp .env.example .env

# Edit .env with your settings
DATABASE_URL=postgres://localhost/suimeet_indexer
SUIMEET_PACKAGE_ID=0x<your_package_id>
SUI_RPC_URL=https://fullnode.testnet.sui.io:443
SUI_NETWORK=testnet
```

### 4. Run Migrations

```bash
npm run prisma:migrate
```

### 5. Generate Prisma Client

```bash
npm run prisma:generate
```

## Running the Indexer

### Development Mode

```bash
npm run dev
```

### Production Mode

```bash
npm run build
npm start
```

### With Custom Checkpoint Range

```bash
# Index from checkpoint 1000 to 2000
FIRST_CHECKPOINT=1000 LAST_CHECKPOINT=2000 npm start
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | Required |
| `SUIMEET_PACKAGE_ID` | SuiMeet package ID on Sui | Required |
| `SUI_RPC_URL` | Sui RPC endpoint URL | Required |
| `SUI_NETWORK` | Sui network (testnet/mainnet) | `testnet` |
| `CHECKPOINT_BUFFER_SIZE` | Checkpoint buffer size | `5000` |
| `INGEST_CONCURRENCY` | Concurrent checkpoint processing | `200` |
| `RETRY_INTERVAL_MS` | Retry interval in milliseconds | `200` |
| `FIRST_CHECKPOINT` | First checkpoint to index (optional) | `null` |
| `LAST_CHECKPOINT` | Last checkpoint to index (optional) | `null` |
| `LOG_LEVEL` | Logging level (info/debug/error) | `info` |

## Database Schema

### meeting_rooms Table

| Column | Type | Description |
|--------|------|-------------|
| id | BIGSERIAL | Primary key |
| room_id | VARCHAR(66) | Unique Sui object ID |
| title | TEXT | Meeting title |
| hosts | VARCHAR[] | Array of host addresses |
| seal_policy_id | VARCHAR(66) | Seal policy ID |
| status | SMALLINT | 1=scheduled, 2=active, 3=ended |
| max_participants | BIGINT | Maximum allowed participants |
| require_approval | BOOLEAN | Whether approval is required |
| participant_count | INTEGER | Current number of participants |
| created_at | BIGINT | Creation timestamp (ms) |
| started_at | BIGINT | Start timestamp (ms) |
| ended_at | BIGINT | End timestamp (ms) |
| checkpoint_sequence_number | BIGINT | Sui checkpoint number |
| transaction_digest | VARCHAR(64) | Transaction hash |
| indexed_at | TIMESTAMP | When indexed |
| updated_at | TIMESTAMP | Last updated |

## Querying Data

### SQL Examples

```sql
-- Get all active meetings
SELECT * FROM meeting_rooms
WHERE status = 2
ORDER BY created_at DESC;

-- Get meetings by host
SELECT * FROM meeting_rooms
WHERE '0xhost_address' = ANY(hosts)
ORDER BY created_at DESC;

-- Get meetings requiring approval
SELECT * FROM meeting_rooms
WHERE require_approval = true
AND status IN (1, 2);

-- Get meeting by seal policy ID
SELECT * FROM meeting_rooms
WHERE seal_policy_id = '0x...';
```

## Monitoring

### Check Indexer Progress

```sql
-- Latest indexed checkpoint
SELECT MAX(checkpoint_sequence_number) as latest_checkpoint
FROM meeting_rooms;

-- Indexing rate
SELECT
  COUNT(*) as rooms_indexed,
  MAX(checkpoint_sequence_number) - MIN(checkpoint_sequence_number) as checkpoints_processed,
  MAX(indexed_at) - MIN(indexed_at) as time_taken
FROM meeting_rooms
WHERE indexed_at > NOW() - INTERVAL '1 hour';
```

## Performance Tuning

### Indexer Settings

```bash
# Faster ingestion (more concurrent requests)
INGEST_CONCURRENCY=500 npm start

# Larger checkpoint buffer
CHECKPOINT_BUFFER_SIZE=10000 npm start

# Faster retries
RETRY_INTERVAL_MS=100 npm start
```

### Database Optimization

```sql
-- Add custom indexes
CREATE INDEX idx_meeting_rooms_status_created
ON meeting_rooms(status, created_at DESC);

CREATE INDEX idx_meeting_rooms_hosts_gin
ON meeting_rooms USING GIN(hosts);

-- Analyze tables
ANALYZE meeting_rooms;
```

## Troubleshooting

### Issue: Indexer falls behind

**Solution**: Increase concurrency and buffer size

```bash
INGEST_CONCURRENCY=1000 CHECKPOINT_BUFFER_SIZE=20000 npm start
```

### Issue: Database connection errors

**Solution**: Check PostgreSQL connection limits

```sql
-- Check current connections
SELECT count(*) FROM pg_stat_activity;

-- Increase max connections (postgresql.conf)
max_connections = 200
```

### Issue: Events not being indexed

**Solution**: Verify package ID

```bash
# Check contract deployment
sui client object <PACKAGE_ID>

# Verify events are emitted
sui client events --package <PACKAGE_ID>
```

## Development

### Adding New Event Types

1. **Define event type** in `src/types/events.ts`:
```typescript
export interface HostAdded {
  room_id: ObjectId;
  new_host: SuiAddress;
  added_at: bigint;
}
```

2. **Update processor** in `src/processors/room-processor.ts`:
```typescript
// Handle HostAdded event
if (event.type.includes('HostAdded')) {
  // Process event
}
```

### Running Tests

```bash
# Unit tests (when implemented)
npm test

# Integration tests with database
npm run test:integration
```

## Production Deployment

### Docker

```bash
# Build image
docker build -t suimeet-indexer .

# Run container
docker run -d \
  --name suimeet-indexer \
  -e DATABASE_URL=postgres://... \
  -e SUIMEET_PACKAGE_ID=0x... \
  -e SUI_RPC_URL=https://... \
  suimeet-indexer
```

### Systemd Service

```ini
# /etc/systemd/system/suimeet-indexer.service
[Unit]
Description=SuiMeet Indexer
After=network.target postgresql.service

[Service]
Type=simple
User=indexer
WorkingDirectory=/opt/suimeet-indexer
EnvironmentFile=/opt/suimeet-indexer/.env
ExecStart=/usr/bin/node /opt/suimeet-indexer/dist/index.js
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl enable suimeet-indexer
sudo systemctl start suimeet-indexer
sudo systemctl status suimeet-indexer
```

## License

MIT

## Support

For issues or questions, open an issue on GitHub.

