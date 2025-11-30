# Selendra Terminal - Deployment Guide

This guide covers deploying Selendra Terminal with the full indexer stack for optimal performance.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│  Docker Compose Stack                                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────┐                                            │
│  │ Selendra Node   │ ◄── Archive mode (~170GB)                  │
│  │ (port 9944)     │     Full blockchain state                  │
│  └────────┬────────┘                                            │
│           │                                                     │
│           ▼ HTTP/WS (internal network)                          │
│  ┌─────────────────┐     ┌─────────────────┐                    │
│  │ SubQuery Node   │────►│ PostgreSQL      │                    │
│  │ (indexer)       │     │ (port 5432)     │                    │
│  └────────┬────────┘     └────────▲────────┘                    │
│           │                       │                             │
│           ▼                       │                             │
│  ┌─────────────────┐              │                             │
│  │ GraphQL API     │──────────────┘                             │
│  │ (port 3001)     │                                            │
│  └────────┬────────┘                                            │
│           │                                                     │
│           ▼                                                     │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ Next.js Terminal App (port 3000)                           │ │
│  │ - Real-time blockchain data from Selendra Node             │ │
│  │ - Historical/indexed data from GraphQL API                 │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

## Why Local Node?

| Setup | Indexing Speed | Reliability | Notes |
|-------|----------------|-------------|-------|
| Public RPC | ~10 blocks/s | ❌ Frequent disconnections | WebSocket timeouts, rate limits |
| Local Node | 3,000-18,000 blocks/s | ✅ Very stable | Recommended for production |

**Local node provides 300-1800x faster indexing!**

## System Requirements

### Minimum Requirements
- **CPU**: 4 cores
- **RAM**: 16GB
- **Storage**: 250GB SSD (170GB for node + 50GB for PostgreSQL + headroom)
- **Network**: 100Mbps

### Recommended Requirements
- **CPU**: 8+ cores
- **RAM**: 32GB
- **Storage**: 500GB NVMe SSD
- **Network**: 1Gbps

## Deployment Options

### Option 1: Full Stack (Recommended)

Deploy everything together for maximum performance:

```bash
# Clone and navigate to project
cd selendra/devtools/terminal

# Start full stack
docker-compose up -d

# View logs
docker-compose logs -f

# Check sync progress
./scripts/monitor-indexer.sh
```

Services started:
- `selendra-node` - Selendra archive node (port 9944)
- `postgres` - PostgreSQL database (port 5432)
- `subquery-node` - SubQuery indexer
- `graphql-engine` - GraphQL API (port 3001)
- `explorer` - Terminal app (port 3000)

### Option 2: Standalone Explorer (Public RPC)

If you don't want to run a local node (slower, less reliable):

```bash
docker-compose --profile standalone up -d explorer-standalone
```

## Two-Phase Sync Strategy

For initial deployment, use a two-phase approach for fastest sync:

### Phase 1: Fast Block Sync (~30 minutes for 17M blocks)

The default `indexer/project.yaml` is configured for fast sync:
- Only indexes blocks (no transactions/events)
- Uses `modulo: 5000` to sample every 5000th block
- Achieves 3,000-18,000 blocks/second

```bash
# Start the stack
docker-compose up -d

# Monitor progress
watch -n 5 'curl -s http://localhost:3001/graphql \
  -H "Content-Type: application/json" \
  -d "{\"query\":\"{ _metadata { lastProcessedHeight targetHeight } }\"}"'
```

### Phase 2: Full Transaction Indexing

After Phase 1 reaches ~99%, switch to full indexing:

```bash
# Stop the indexer
docker-compose stop subquery-node

# Backup fast-sync config and switch to full config
cp indexer/project.yaml indexer/project-fast.yaml
cp indexer/project-full.yaml indexer/project.yaml

# Rebuild indexer
cd indexer && pnpm install && pnpm build && cd ..

# Restart with full handlers
docker-compose up -d subquery-node

# Monitor (will be slower, ~10-100 blocks/s with full handlers)
docker logs -f selendra-indexer-node
```

## Environment Variables

Create a `.env` file for custom configuration:

```env
# Database credentials
DB_USER=subquery
DB_PASS=your_secure_password
DB_DATABASE=subquery

# Node configuration
RUST_LOG=info
```

## Health Checks

### Check Selendra Node
```bash
curl -s http://localhost:9944 \
  -H "Content-Type: application/json" \
  -d '{"id":1,"jsonrpc":"2.0","method":"system_health","params":[]}'
```

### Check Indexer Progress
```bash
curl -s http://localhost:3001/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"{ _metadata { lastProcessedHeight targetHeight } }"}'
```

### Check GraphQL API
```bash
curl -s http://localhost:3001/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"{ blocks(first: 1, orderBy: NUMBER_DESC) { nodes { number hash } } }"}'
```

### Check Explorer
```bash
curl -s http://localhost:3000/api/health
```

## Monitoring

### Real-time Indexer Speed
```bash
docker logs -f selendra-indexer-node 2>&1 | grep benchmark
```

Example output:
```
INDEXING: 5684.64 blocks/s. Target: 17,008,996. Current: 14,730,000. ETA: 6 mins
```

### Container Status
```bash
docker-compose ps
```

### Resource Usage
```bash
docker stats
```

## Troubleshooting

### Indexer Connection Errors
If you see "WebSocket connection closed" or timeout errors:

1. Ensure Selendra node is fully synced:
   ```bash
   curl -s http://localhost:9944 \
     -H "Content-Type: application/json" \
     -d '{"id":1,"jsonrpc":"2.0","method":"system_syncState","params":[]}'
   ```

2. Check node health:
   ```bash
   docker logs selendra-node | tail -50
   ```

3. Restart the indexer:
   ```bash
   docker-compose restart subquery-node
   ```

### Slow Indexing
If indexing is slower than expected:

1. Check if using HTTP endpoint (more stable than WebSocket for historical sync)
2. Reduce batch size: `--batch-size=20`
3. Reduce workers: `--workers=1`
4. Increase timeout: `--timeout=120000`

### Database Issues
If PostgreSQL has issues:

```bash
# Check logs
docker logs selendra-indexer-db

# Connect to database
docker exec -it selendra-indexer-db psql -U subquery -d subquery

# Check table sizes
\dt+ app.*
```

### Reset Indexer
To start indexing from scratch:

```bash
# Stop services
docker-compose down

# Remove indexer database (keeps blockchain data!)
docker volume rm terminal_postgres_data

# Restart
docker-compose up -d
```

## Backup & Restore

See [backup.md](./backup.md) for database backup and restore procedures.

## Updating

### Update Selendra Node
```bash
docker-compose pull selendra-node
docker-compose up -d selendra-node
```

### Update Indexer
```bash
cd indexer
pnpm install
pnpm build
cd ..
docker-compose restart subquery-node
```

### Update Explorer
```bash
docker-compose build explorer
docker-compose up -d explorer
```

## Production Checklist

- [ ] Adequate storage (250GB+ SSD)
- [ ] Set secure database password in `.env`
- [ ] Configure reverse proxy (nginx/caddy) with SSL
- [ ] Set up monitoring (Prometheus/Grafana)
- [ ] Configure backup schedule
- [ ] Set up log rotation
- [ ] Configure firewall rules
- [ ] Test failover procedures

## Ports Reference

| Service | Internal Port | External Port | Purpose |
|---------|--------------|---------------|---------|
| Selendra Node | 9944 | 9944 | RPC (HTTP + WebSocket) |
| Selendra Node | 30333 | 30333 | P2P networking |
| PostgreSQL | 5432 | 5432 | Database |
| GraphQL API | 3000 | 3001 | Indexed data API |
| Explorer | 3000 | 3000 | Web interface |
