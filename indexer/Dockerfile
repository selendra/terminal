# Selendra Indexer - SubQuery Node with built project
# This image contains the compiled indexer code ready to run
#
# Build: docker build -t selendra-indexer .

FROM subquerynetwork/subql-node-substrate:latest

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy project files
COPY . .

# Generate types and build
RUN npm run codegen && npm run build

# Default command (can be overridden by docker-compose)
CMD ["-f=/app", "--db-schema=app", "--workers=4", "--batch-size=30", "--log-level=info"]
