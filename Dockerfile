# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package.json package-lock.json* ./
RUN npm ci --legacy-peer-deps

# Copy source files
COPY . .

# Build arguments for RPC configuration
ARG NEXT_PUBLIC_SUBSTRATE_RPC_WS=wss://rpc.selendra.org
ARG NEXT_PUBLIC_SUBSTRATE_RPC_HTTP=https://rpc.selendra.org
ARG NEXT_PUBLIC_EVM_RPC_HTTP=https://rpc.selendra.org

# Set environment variables for build
ENV NEXT_PUBLIC_SUBSTRATE_RPC_WS=$NEXT_PUBLIC_SUBSTRATE_RPC_WS
ENV NEXT_PUBLIC_SUBSTRATE_RPC_HTTP=$NEXT_PUBLIC_SUBSTRATE_RPC_HTTP
ENV NEXT_PUBLIC_EVM_RPC_HTTP=$NEXT_PUBLIC_EVM_RPC_HTTP

# Build the application
RUN npm run build

# Production stage
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy built assets
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Set ownership
RUN chown -R nextjs:nodejs /app

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
