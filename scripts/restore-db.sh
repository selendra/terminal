#!/bin/bash
# Selendra Terminal - Database Restore Script
# Restores the indexer PostgreSQL database from a backup
#
# Usage:
#   ./scripts/restore-db.sh backups/selendra-indexer-2024-01-15.dump
#   ./scripts/restore-db.sh --from-r2 selendra-indexer-2024-01-15.dump
#   ./scripts/restore-db.sh --list-r2
#
# Environment variables:
#   R2_ENDPOINT     - Cloudflare R2 endpoint URL
#   R2_BUCKET       - R2 bucket name (default: selendra-backups)
#   CONTAINER_NAME  - Docker container name (default: selendra-indexer-db)
#
# WARNING: This will REPLACE all data in the current database!

set -e

# Configuration
CONTAINER_NAME="${CONTAINER_NAME:-selendra-indexer-db}"
DB_USER="${DB_USER:-subquery}"
DB_NAME="${DB_NAME:-subquery}"

# R2 Configuration
R2_BUCKET="${R2_BUCKET:-selendra-backups}"
R2_ENDPOINT="${R2_ENDPOINT:-}"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Parse arguments
FROM_R2=false
LIST_R2=false
BACKUP_FILE=""

for arg in "$@"; do
    if [ "$arg" == "--from-r2" ] || [ "$arg" == "-r" ]; then
        FROM_R2=true
    elif [ "$arg" == "--list-r2" ] || [ "$arg" == "-l" ]; then
        LIST_R2=true
    elif [ -z "$BACKUP_FILE" ] && [[ ! "$arg" =~ ^- ]]; then
        BACKUP_FILE="$arg"
    fi
done

echo -e "${GREEN}======================================${NC}"
echo -e "${GREEN}Selendra Terminal - Database Restore${NC}"
echo -e "${GREEN}======================================${NC}"

# List R2 backups
if [ "$LIST_R2" = true ]; then
    if [ -z "$R2_ENDPOINT" ]; then
        echo -e "${RED}Error: R2_ENDPOINT not set${NC}"
        echo "Set it with: export R2_ENDPOINT=https://<ACCOUNT_ID>.r2.cloudflarestorage.com"
        exit 1
    fi
    
    echo ""
    echo "Available backups in R2 (${R2_BUCKET}):"
    aws s3 ls "s3://${R2_BUCKET}/backups/" --endpoint-url "${R2_ENDPOINT}" | grep -E "\.dump$"
    exit 0
fi

# Download from R2 if requested
if [ "$FROM_R2" = true ]; then
    if [ -z "$R2_ENDPOINT" ]; then
        echo -e "${RED}Error: R2_ENDPOINT not set${NC}"
        echo "Set it with: export R2_ENDPOINT=https://<ACCOUNT_ID>.r2.cloudflarestorage.com"
        exit 1
    fi
    
    if [ -z "$BACKUP_FILE" ]; then
        echo -e "${RED}Error: No backup filename specified${NC}"
        echo ""
        echo "Usage: ./scripts/restore-db.sh --from-r2 <backup-filename>"
        echo ""
        echo "List available backups with: ./scripts/restore-db.sh --list-r2"
        exit 1
    fi
    
    echo -e "${YELLOW}Downloading backup from R2...${NC}"
    mkdir -p /tmp/selendra-restore
    
    aws s3 cp \
        "s3://${R2_BUCKET}/backups/${BACKUP_FILE}" \
        "/tmp/selendra-restore/${BACKUP_FILE}" \
        --endpoint-url "${R2_ENDPOINT}"
    
    # Also download metadata if available
    aws s3 cp \
        "s3://${R2_BUCKET}/backups/${BACKUP_FILE}.meta" \
        "/tmp/selendra-restore/${BACKUP_FILE}.meta" \
        --endpoint-url "${R2_ENDPOINT}" 2>/dev/null || true
    
    BACKUP_FILE="/tmp/selendra-restore/${BACKUP_FILE}"
    echo -e "${GREEN}Download complete!${NC}"
fi

# Check if backup file is provided
if [ -z "${BACKUP_FILE}" ]; then
    echo -e "${RED}Error: No backup file specified${NC}"
    echo ""
    echo "Usage: ./scripts/restore-db.sh <backup-file>"
    echo ""
    echo "Available backups:"
    ls -lh backups/*.dump backups/*.sql.gz 2>/dev/null || echo "  No backups found in ./backups/"
    exit 1
fi

# Check if backup file exists
if [ ! -f "${BACKUP_FILE}" ]; then
    echo -e "${RED}Error: Backup file not found: ${BACKUP_FILE}${NC}"
    exit 1
fi

# Check if container is running
if ! docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
    echo -e "${RED}Error: Container '${CONTAINER_NAME}' is not running${NC}"
    echo "Start the database with: docker-compose up -d postgres"
    exit 1
fi

# Show backup info
BACKUP_SIZE=$(ls -lh "${BACKUP_FILE}" | awk '{print $5}')
echo ""
echo "Backup file: ${BACKUP_FILE}"
echo "Backup size: ${BACKUP_SIZE}"

# Show metadata if available
if [ -f "${BACKUP_FILE}.meta" ]; then
    echo ""
    echo "Backup metadata:"
    cat "${BACKUP_FILE}.meta"
fi

# Confirm restore
echo ""
echo -e "${YELLOW}WARNING: This will REPLACE all data in the '${DB_NAME}' database!${NC}"
read -p "Are you sure you want to continue? (yes/no): " CONFIRM

if [ "${CONFIRM}" != "yes" ]; then
    echo "Restore cancelled."
    exit 0
fi

# Stop dependent services
echo ""
echo -e "${YELLOW}Stopping indexer services...${NC}"
docker-compose stop subquery-node graphql-engine 2>/dev/null || true

# Drop and recreate database
echo -e "${YELLOW}Preparing database...${NC}"
docker exec ${CONTAINER_NAME} psql -U ${DB_USER} -d postgres -c "
    SELECT pg_terminate_backend(pg_stat_activity.pid)
    FROM pg_stat_activity
    WHERE pg_stat_activity.datname = '${DB_NAME}'
    AND pid <> pg_backend_pid();
" 2>/dev/null || true

docker exec ${CONTAINER_NAME} psql -U ${DB_USER} -d postgres -c "
    DROP DATABASE IF EXISTS ${DB_NAME};
    CREATE DATABASE ${DB_NAME};
" 2>/dev/null

# Restore based on file type
echo -e "${YELLOW}Restoring database...${NC}"
START_TIME=$(date +%s)

if [[ "${BACKUP_FILE}" == *.dump ]]; then
    # Custom format
    docker exec -i ${CONTAINER_NAME} \
        pg_restore -U ${DB_USER} -d ${DB_NAME} --no-owner --no-acl \
        < "${BACKUP_FILE}"
elif [[ "${BACKUP_FILE}" == *.sql.gz ]]; then
    # Compressed SQL format
    gunzip -c "${BACKUP_FILE}" | \
        docker exec -i ${CONTAINER_NAME} psql -U ${DB_USER} -d ${DB_NAME}
elif [[ "${BACKUP_FILE}" == *.sql ]]; then
    # Plain SQL format
    docker exec -i ${CONTAINER_NAME} psql -U ${DB_USER} -d ${DB_NAME} \
        < "${BACKUP_FILE}"
else
    echo -e "${RED}Error: Unsupported backup format${NC}"
    echo "Supported formats: .dump, .sql.gz, .sql"
    exit 1
fi

END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))

# Verify restore
echo ""
echo -e "${YELLOW}Verifying restore...${NC}"
BLOCK_COUNT=$(docker exec ${CONTAINER_NAME} psql -U ${DB_USER} -d ${DB_NAME} -t -c \
    "SELECT COUNT(*) FROM app.blocks;" 2>/dev/null | xargs || echo "0")
echo "Restored blocks: ${BLOCK_COUNT}"

# Check indexer state
LAST_HEIGHT=$(docker exec ${CONTAINER_NAME} psql -U ${DB_USER} -d ${DB_NAME} -t -c \
    "SELECT value FROM app._metadata WHERE key = 'lastProcessedHeight';" 2>/dev/null | xargs || echo "unknown")
echo "Last processed height: ${LAST_HEIGHT}"

# Restart services
echo ""
echo -e "${YELLOW}Restarting indexer services...${NC}"
docker-compose up -d subquery-node graphql-engine

echo ""
echo -e "${GREEN}======================================${NC}"
echo -e "${GREEN}Restore completed successfully!${NC}"
echo -e "${GREEN}======================================${NC}"
echo ""
echo "Duration: ${DURATION} seconds"
echo "Blocks restored: ${BLOCK_COUNT}"
echo "Last height: ${LAST_HEIGHT}"
echo ""
echo "The indexer will continue from block ${LAST_HEIGHT}."
echo "Monitor progress with: docker logs -f selendra-indexer-node"
