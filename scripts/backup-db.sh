#!/bin/bash
# Selendra Terminal - Database Backup Script
# Creates a compressed backup of the indexer PostgreSQL database
#
# Usage:
#   ./scripts/backup-db.sh                    # Create timestamped backup (local only)
#   ./scripts/backup-db.sh --upload           # Create backup and upload to R2
#   ./scripts/backup-db.sh my-backup          # Create named backup
#   ./scripts/backup-db.sh my-backup --upload # Named backup + upload to R2
#
# Environment variables:
#   BACKUP_DIR      - Local backup directory (default: ./backups)
#   R2_ENDPOINT     - Cloudflare R2 endpoint URL
#   R2_BUCKET       - R2 bucket name (default: selendra-backups)
#   CONTAINER_NAME  - Docker container name (default: selendra-indexer-db)

set -e

# Configuration
CONTAINER_NAME="${CONTAINER_NAME:-selendra-indexer-db}"
DB_USER="${DB_USER:-subquery}"
DB_NAME="${DB_NAME:-subquery}"
BACKUP_DIR="${BACKUP_DIR:-./backups}"
TIMESTAMP=$(date +%Y-%m-%d-%H%M%S)

# R2 Configuration
R2_BUCKET="${R2_BUCKET:-selendra-backups}"
R2_ENDPOINT="${R2_ENDPOINT:-}"

# Parse arguments
UPLOAD_TO_R2=false
BACKUP_NAME=""

for arg in "$@"; do
    if [ "$arg" == "--upload" ] || [ "$arg" == "-u" ]; then
        UPLOAD_TO_R2=true
    elif [ -z "$BACKUP_NAME" ] && [[ ! "$arg" =~ ^- ]]; then
        BACKUP_NAME="$arg"
    fi
done

BACKUP_NAME="${BACKUP_NAME:-selendra-indexer-${TIMESTAMP}}"
BACKUP_FILE="${BACKUP_DIR}/${BACKUP_NAME}.dump"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}======================================${NC}"
echo -e "${GREEN}Selendra Terminal - Database Backup${NC}"
echo -e "${GREEN}======================================${NC}"

# Create backup directory if it doesn't exist
mkdir -p "${BACKUP_DIR}"

# Check if container is running
if ! docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
    echo -e "${RED}Error: Container '${CONTAINER_NAME}' is not running${NC}"
    echo "Start the database with: docker-compose up -d postgres"
    exit 1
fi

# Get database size for progress indication
echo -e "${YELLOW}Checking database size...${NC}"
DB_SIZE=$(docker exec ${CONTAINER_NAME} psql -U ${DB_USER} -d ${DB_NAME} -t -c \
    "SELECT pg_size_pretty(pg_database_size('${DB_NAME}'));" 2>/dev/null | xargs)
echo "Database size: ${DB_SIZE}"

# Get current block height for reference
echo -e "${YELLOW}Getting current indexer state...${NC}"
BLOCK_COUNT=$(docker exec ${CONTAINER_NAME} psql -U ${DB_USER} -d ${DB_NAME} -t -c \
    "SELECT COUNT(*) FROM app.blocks;" 2>/dev/null | xargs || echo "unknown")
echo "Indexed blocks: ${BLOCK_COUNT}"

# Create backup
echo -e "${YELLOW}Creating backup...${NC}"
echo "Output: ${BACKUP_FILE}"

START_TIME=$(date +%s)

docker exec ${CONTAINER_NAME} \
    pg_dump -U ${DB_USER} -d ${DB_NAME} -Fc \
    > "${BACKUP_FILE}"

END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))

# Get backup file size
BACKUP_SIZE=$(ls -lh "${BACKUP_FILE}" | awk '{print $5}')

# Create a metadata file
cat > "${BACKUP_FILE}.meta" << EOF
{
    "timestamp": "${TIMESTAMP}",
    "database_size": "${DB_SIZE}",
    "backup_size": "${BACKUP_SIZE}",
    "block_count": "${BLOCK_COUNT}",
    "duration_seconds": ${DURATION},
    "container": "${CONTAINER_NAME}",
    "database": "${DB_NAME}"
}
EOF

echo ""
echo -e "${GREEN}======================================${NC}"
echo -e "${GREEN}Backup completed successfully!${NC}"
echo -e "${GREEN}======================================${NC}"
echo ""
echo "Backup file: ${BACKUP_FILE}"
echo "Backup size: ${BACKUP_SIZE}"
echo "Duration: ${DURATION} seconds"

# Upload to Cloudflare R2 if requested
if [ "$UPLOAD_TO_R2" = true ]; then
    echo ""
    if [ -z "$R2_ENDPOINT" ]; then
        echo -e "${RED}Error: R2_ENDPOINT not set${NC}"
        echo "Set it with: export R2_ENDPOINT=https://<ACCOUNT_ID>.r2.cloudflarestorage.com"
        exit 1
    fi
    
    echo -e "${YELLOW}Uploading to Cloudflare R2...${NC}"
    echo "Bucket: ${R2_BUCKET}"
    echo "Endpoint: ${R2_ENDPOINT}"
    
    # Upload backup file
    aws s3 cp "${BACKUP_FILE}" \
        "s3://${R2_BUCKET}/backups/${BACKUP_NAME}.dump" \
        --endpoint-url "${R2_ENDPOINT}"
    
    # Upload metadata
    aws s3 cp "${BACKUP_FILE}.meta" \
        "s3://${R2_BUCKET}/backups/${BACKUP_NAME}.dump.meta" \
        --endpoint-url "${R2_ENDPOINT}"
    
    echo -e "${GREEN}Upload complete!${NC}"
    echo "R2 path: s3://${R2_BUCKET}/backups/${BACKUP_NAME}.dump"
fi

echo ""
echo "To restore this backup, run:"
echo "  ./scripts/restore-db.sh ${BACKUP_FILE}"
if [ "$UPLOAD_TO_R2" = true ]; then
    echo ""
    echo "Or restore from R2:"
    echo "  ./scripts/restore-db.sh --from-r2 ${BACKUP_NAME}.dump"
fi
