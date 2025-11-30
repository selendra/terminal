#!/bin/bash
# Indexer Sync Monitor Script
# Usage: ./monitor-indexer.sh

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

while true; do
    clear
    echo -e "${BLUE}╔══════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║           Selendra Terminal - Indexer Monitor                 ║${NC}"
    echo -e "${BLUE}╚══════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    
    # Get sync status
    SYNC_DATA=$(curl -s 'http://localhost:3001/graphql' -H 'Content-Type: application/json' -d '{"query":"{ _metadata { lastProcessedHeight targetHeight } }"}' 2>/dev/null)
    
    if [ $? -eq 0 ] && [ -n "$SYNC_DATA" ]; then
        CURRENT=$(echo $SYNC_DATA | jq -r '.data._metadata.lastProcessedHeight // 0')
        TARGET=$(echo $SYNC_DATA | jq -r '.data._metadata.targetHeight // 0')
        
        if [ "$TARGET" -gt 0 ]; then
            PERCENT=$(echo "scale=4; $CURRENT * 100 / $TARGET" | bc)
            REMAINING=$((TARGET - CURRENT))
            
            echo -e "${GREEN}Current Block:${NC}  $CURRENT"
            echo -e "${GREEN}Target Block:${NC}   $TARGET"
            echo -e "${GREEN}Progress:${NC}       ${PERCENT}%"
            echo -e "${GREEN}Remaining:${NC}      $REMAINING blocks"
            echo ""
        fi
    else
        echo -e "${YELLOW}⚠ Cannot connect to indexer GraphQL${NC}"
    fi
    
    # Get latest benchmark
    echo -e "${BLUE}Latest Indexing Speed:${NC}"
    docker logs selendra-indexer-node 2>&1 | grep INDEXING | tail -3
    echo ""
    
    # Container status
    echo -e "${BLUE}Container Status:${NC}"
    docker ps --format "table {{.Names}}\t{{.Status}}" | grep selendra
    echo ""
    
    echo -e "${YELLOW}Refreshing in 30 seconds... (Ctrl+C to exit)${NC}"
    sleep 30
done
