# Selendra Terminal - Backup & Restore Guide

This guide covers backup and restore procedures for Selendra Terminal's PostgreSQL indexer database.

## Overview

The indexer database contains all indexed blockchain data. Backing it up allows:
- Fast redeployment without re-indexing
- Disaster recovery
- Migrating to new servers

### What to Backup

| Component | Size | Backup Priority |
|-----------|------|-----------------|
| PostgreSQL (indexer data) | 10-50GB | ✅ High - saves hours of re-indexing |
| Selendra Node (blockchain) | ~170GB | ⚠️ Optional - can re-sync from network |

## Backup Scripts

### Quick Backup

```bash
# From the terminal project directory
./scripts/backup-db.sh
```

### Quick Restore

```bash
# Restore from a backup file
./scripts/restore-db.sh backups/selendra-indexer-2024-01-15-120000.sql.gz
```

## Manual Procedures

### Create Backup

```bash
# 1. Create backups directory
mkdir -p backups

# 2. Get current timestamp
TIMESTAMP=$(date +%Y-%m-%d-%H%M%S)

# 3. Create compressed backup
docker exec selendra-indexer-db \
  pg_dump -U subquery -d subquery -Fc \
  > backups/selendra-indexer-${TIMESTAMP}.dump

# Or for SQL format (larger but human-readable):
docker exec selendra-indexer-db \
  pg_dump -U subquery -d subquery | gzip \
  > backups/selendra-indexer-${TIMESTAMP}.sql.gz

echo "Backup created: backups/selendra-indexer-${TIMESTAMP}.dump"
```

### Restore Backup

```bash
# 1. Stop the indexer (prevent writes during restore)
docker-compose stop subquery-node graphql-engine

# 2. Drop and recreate the database
docker exec -i selendra-indexer-db psql -U subquery -d postgres -c "
  DROP DATABASE IF EXISTS subquery;
  CREATE DATABASE subquery;
"

# 3. Restore from custom format (.dump)
docker exec -i selendra-indexer-db \
  pg_restore -U subquery -d subquery \
  < backups/selendra-indexer-2024-01-15-120000.dump

# Or restore from SQL format (.sql.gz)
gunzip -c backups/selendra-indexer-2024-01-15-120000.sql.gz | \
  docker exec -i selendra-indexer-db psql -U subquery -d subquery

# 4. Restart services
docker-compose up -d subquery-node graphql-engine

# 5. Verify
curl -s http://localhost:3001/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"{ _metadata { lastProcessedHeight } }"}'
```

## Backup to Remote Storage (Cloudflare R2)

Cloudflare R2 provides S3-compatible storage with zero egress fees, making it ideal for backups.

### Setup R2

1. Create an R2 bucket in Cloudflare dashboard
2. Generate API tokens with R2 read/write permissions
3. Configure credentials:

```bash
# Create credentials file
cat > ~/.r2-credentials << EOF
[default]
aws_access_key_id = YOUR_R2_ACCESS_KEY_ID
aws_secret_access_key = YOUR_R2_SECRET_ACCESS_KEY
EOF

# Set R2 endpoint (replace with your account ID)
export R2_ENDPOINT="https://<ACCOUNT_ID>.r2.cloudflarestorage.com"
export R2_BUCKET="selendra-backups"
```

### Backup to R2

```bash
# Create backup and upload to R2
TIMESTAMP=$(date +%Y-%m-%d-%H%M%S)
BACKUP_FILE="selendra-indexer-${TIMESTAMP}.dump"

# Create backup
docker exec selendra-indexer-db \
  pg_dump -U subquery -d subquery -Fc \
  > /tmp/${BACKUP_FILE}

# Upload to R2 (using AWS CLI with S3-compatible endpoint)
aws s3 cp /tmp/${BACKUP_FILE} \
  s3://${R2_BUCKET}/backups/${BACKUP_FILE} \
  --endpoint-url ${R2_ENDPOINT}

# Clean up local temp file
rm /tmp/${BACKUP_FILE}

echo "Backup uploaded to R2: ${BACKUP_FILE}"
```

### Restore from R2

```bash
# Download from R2
aws s3 cp \
  s3://${R2_BUCKET}/backups/selendra-indexer-2024-01-15.dump \
  /tmp/ \
  --endpoint-url ${R2_ENDPOINT}

# Stop services
docker-compose stop subquery-node graphql-engine

# Drop and recreate database
docker exec -i selendra-indexer-db psql -U subquery -d postgres -c "
  DROP DATABASE IF EXISTS subquery;
  CREATE DATABASE subquery;
"

# Restore
docker exec -i selendra-indexer-db \
  pg_restore -U subquery -d subquery < /tmp/selendra-indexer-2024-01-15.dump

# Restart services
docker-compose up -d subquery-node graphql-engine

# Clean up
rm /tmp/selendra-indexer-2024-01-15.dump
```

### List R2 Backups

```bash
aws s3 ls s3://${R2_BUCKET}/backups/ --endpoint-url ${R2_ENDPOINT}
```

### Using rclone (Alternative)

rclone provides better multipart upload support for large files:

```bash
# Configure rclone for R2
rclone config create r2 s3 \
  provider Cloudflare \
  access_key_id YOUR_R2_ACCESS_KEY_ID \
  secret_access_key YOUR_R2_SECRET_ACCESS_KEY \
  endpoint https://<ACCOUNT_ID>.r2.cloudflarestorage.com

# Upload backup
rclone copy /tmp/selendra-indexer-backup.dump r2:selendra-backups/backups/

# Download backup
rclone copy r2:selendra-backups/backups/selendra-indexer-2024-01-15.dump /tmp/

# Sync local backups folder to R2
rclone sync ./backups r2:selendra-backups/backups/
```

## Scheduled Backups

### Using Cron

Add to crontab (`crontab -e`):

```bash
# Daily backup at 2 AM
0 2 * * * cd /path/to/terminal && ./scripts/backup-db.sh >> /var/log/selendra-backup.log 2>&1

# Weekly cleanup - keep only last 7 daily backups
0 3 * * 0 find /path/to/terminal/backups -name "*.dump" -mtime +7 -delete
```

### Using Docker Backup Container

Add to `docker-compose.yml`:

```yaml
  backup:
    image: postgres:16-alpine
    container_name: selendra-backup
    depends_on:
      - postgres
    environment:
      PGHOST: postgres
      PGUSER: subquery
      PGPASSWORD: subquery
      PGDATABASE: subquery
    volumes:
      - ./backups:/backups
    entrypoint: /bin/sh
    command: -c 'while true; do
      pg_dump -Fc > /backups/selendra-$$(date +%Y%m%d-%H%M%S).dump;
      find /backups -name "*.dump" -mtime +7 -delete;
      sleep 86400;
      done'
    networks:
      - selendra-network
    profiles:
      - backup
```

Start backup service:
```bash
docker-compose --profile backup up -d backup
```

## Migration Between Servers

### Export from Source Server

```bash
# On source server
cd /path/to/terminal

# Stop writes
docker-compose stop subquery-node

# Create backup
docker exec selendra-indexer-db \
  pg_dump -U subquery -d subquery -Fc \
  > indexer-migration.dump

# Get backup size
ls -lh indexer-migration.dump
```

### Transfer to Destination

```bash
# Using rsync (recommended for large files)
rsync -avz --progress indexer-migration.dump user@new-server:/path/to/terminal/

# Or using scp
scp indexer-migration.dump user@new-server:/path/to/terminal/
```

### Import on Destination Server

```bash
# On destination server
cd /path/to/terminal

# Start PostgreSQL only
docker-compose up -d postgres
sleep 10  # Wait for PostgreSQL to be ready

# Restore
docker exec -i selendra-indexer-db \
  pg_restore -U subquery -d subquery --clean --if-exists \
  < indexer-migration.dump

# Start remaining services
docker-compose up -d
```

## Verify Backup Integrity

### Check Backup File

```bash
# For custom format
pg_restore --list backups/selendra-indexer-2024-01-15.dump | head -20

# Check file size (should be reasonable - 1-50GB typically)
ls -lh backups/
```

### Test Restore to Temporary Database

```bash
# Create test database
docker exec selendra-indexer-db \
  createdb -U subquery subquery_test

# Restore to test database
docker exec -i selendra-indexer-db \
  pg_restore -U subquery -d subquery_test \
  < backups/selendra-indexer-latest.dump

# Verify data
docker exec selendra-indexer-db \
  psql -U subquery -d subquery_test \
  -c "SELECT COUNT(*) FROM app.blocks;"

# Clean up
docker exec selendra-indexer-db \
  dropdb -U subquery subquery_test
```

## Disaster Recovery Scenarios

### Scenario 1: Database Corruption

```bash
# Stop all services
docker-compose down

# Remove corrupted volume
docker volume rm terminal_postgres_data

# Start fresh database
docker-compose up -d postgres
sleep 10

# Restore from backup
docker exec -i selendra-indexer-db \
  pg_restore -U subquery -d subquery \
  < backups/selendra-indexer-latest.dump

# Start remaining services
docker-compose up -d
```

### Scenario 2: Complete Server Failure

1. Provision new server
2. Install Docker and Docker Compose
3. Clone repository
4. Download latest backup from Cloudflare R2
5. Follow "Import on Destination Server" steps

### Scenario 3: No Backup Available

```bash
# Start fresh and re-index
docker-compose down -v
docker-compose up -d

# Monitor progress (will take 30+ minutes with fast sync)
./scripts/monitor-indexer.sh
```

## Backup Size Estimates

| Block Height | Approximate Size |
|--------------|------------------|
| 5M blocks | ~5GB |
| 10M blocks | ~15GB |
| 17M blocks | ~30-50GB |

## Best Practices

1. **Regular Backups**: Daily minimum, hourly for production
2. **Off-site Storage**: Keep backups in Cloudflare R2 (zero egress fees)
3. **Test Restores**: Periodically test that backups can be restored
4. **Monitor Backup Size**: Alert if backups are unusually small (may be corrupted)
5. **Encrypt Backups**: If containing sensitive data, encrypt before uploading
6. **Document Recovery**: Keep this runbook updated and accessible
7. **R2 Lifecycle Rules**: Configure automatic deletion of old backups in R2 dashboard
