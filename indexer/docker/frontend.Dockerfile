# Frontend Dockerfile
FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app

# Copy package files
COPY frontend-app/package.json frontend-app/package-lock.json* ./
RUN npm ci || yarn install --frozen-lockfile

# Build stage
FROM base AS builder
WORKDIR /app

# Copy dependencies
COPY --from=deps /app/node_modules ./node_modules
COPY frontend-app/ ./

# Set build-time environment variables (can be overridden)
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_PACKAGE_ID
ARG NEXT_PUBLIC_REGISTRY_ID
ARG NEXT_PUBLIC_NETWORK
ARG NEXT_PUBLIC_SUI_RPC_URL
ARG NEXT_PUBLIC_WALRUS_ENDPOINT

ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_PACKAGE_ID=$NEXT_PUBLIC_PACKAGE_ID
ENV NEXT_PUBLIC_REGISTRY_ID=$NEXT_PUBLIC_REGISTRY_ID
ENV NEXT_PUBLIC_NETWORK=$NEXT_PUBLIC_NETWORK
ENV NEXT_PUBLIC_SUI_RPC_URL=$NEXT_PUBLIC_SUI_RPC_URL
ENV NEXT_PUBLIC_WALRUS_ENDPOINT=$NEXT_PUBLIC_WALRUS_ENDPOINT

# Build Next.js application
RUN npm run build || yarn build

# Production stage
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy built application
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./package.json

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["npm", "start"]

