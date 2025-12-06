# Selendra Indexer - All-in-One Container
# Runs PostgreSQL, SubQuery Node, and SubQuery Query Service
#
# Build: docker build -t selendra-indexer .
# Run:   docker run -p 3000:3000 -e SUBSTRATE_RPC=wss://rpc.selendra.org selendra-indexer

FROM node:20-alpine

# Install dependencies
RUN apk add --no-cache \
    postgresql \
    postgresql-contrib \
    supervisor \
    curl \
    bash

# Set up PostgreSQL
ENV PGDATA=/var/lib/postgresql/data
ENV POSTGRES_USER=subquery
ENV POSTGRES_PASSWORD=subquery
ENV POSTGRES_DB=subquery

# Create postgres user and directories
RUN mkdir -p /var/lib/postgresql/data /run/postgresql /var/log/supervisor && \
    chown -R postgres:postgres /var/lib/postgresql /run/postgresql && \
    chmod 700 /var/lib/postgresql/data

# Initialize PostgreSQL
USER postgres
RUN initdb -D /var/lib/postgresql/data && \
    echo "host all all 0.0.0.0/0 md5" >> /var/lib/postgresql/data/pg_hba.conf && \
    echo "listen_addresses='*'" >> /var/lib/postgresql/data/postgresql.conf

USER root

# Install SubQuery CLI globally
RUN npm install -g @subql/node-substrate @subql/query

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy project files
COPY . .

# Generate types and build
RUN npm run codegen && npm run build

# Create startup script
RUN cat > /start.sh << 'EOF'
#!/bin/bash
set -e

echo "=== Starting Selendra Indexer ==="

# Start PostgreSQL
echo "Starting PostgreSQL..."
su - postgres -c "pg_ctl start -D /var/lib/postgresql/data -l /var/lib/postgresql/logfile"

# Wait for PostgreSQL to be ready
echo "Waiting for PostgreSQL..."
until su - postgres -c "pg_isready" 2>/dev/null; do
  sleep 1
done

# Create user and database if not exists
su - postgres -c "psql -tc \"SELECT 1 FROM pg_roles WHERE rolname='subquery'\" | grep -q 1 || psql -c \"CREATE USER subquery WITH PASSWORD 'subquery' SUPERUSER;\""
su - postgres -c "psql -tc \"SELECT 1 FROM pg_database WHERE datname='subquery'\" | grep -q 1 || psql -c \"CREATE DATABASE subquery OWNER subquery;\""

echo "PostgreSQL ready!"

# Start SubQuery Node in background
echo "Starting SubQuery Node..."
cd /app
subql-node-substrate \
  -f=/app \
  --db-schema=app \
  --db-host=localhost \
  --db-port=5432 \
  --db-user=subquery \
  --db-pass=subquery \
  --db-database=subquery \
  --workers=${SUBQUERY_WORKERS:-2} \
  --batch-size=${SUBQUERY_BATCH_SIZE:-30} \
  --log-level=info \
  --network-endpoint=${SUBSTRATE_RPC:-wss://rpc.selendra.org} \
  --timeout=90000 \
  --disable-historical=false &

# Wait for SubQuery Node to be ready
echo "Waiting for SubQuery Node..."
sleep 10
until curl -sf http://localhost:3000/ready > /dev/null 2>&1; do
  echo "Waiting for SubQuery Node to be ready..."
  sleep 5
done
echo "SubQuery Node ready!"

# Start SubQuery Query Service (GraphQL API)
echo "Starting GraphQL Query Service on port 3001..."
subql-query \
  --name=app \
  --playground \
  --indexer=http://localhost:3000 \
  --db-host=localhost \
  --db-port=5432 \
  --db-user=subquery \
  --db-pass=subquery \
  --db-database=subquery &

echo "=== All services started ==="
echo "GraphQL Playground: http://localhost:3000"

# Keep container running and show logs
wait
EOF

RUN chmod +x /start.sh

# Expose ports
# 3000 = SubQuery Query (GraphQL API) - this is the main port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=120s --retries=3 \
  CMD curl -f http://localhost:3000/ready || exit 1

# Start all services
CMD ["/start.sh"]
