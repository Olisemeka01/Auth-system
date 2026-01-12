# Multi-stage Dockerfile for both development and production
# Usage:
#   Development: docker build --target development -t auth-system:dev .
#   Production:  docker build --target production -t auth-system:prod .

ARG NODE_VERSION=lts
FROM node:lts-alpine AS base

# Install dependencies for native modules
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    openssl

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json pnpm-lock.yaml ./

# Install pnpm
RUN npm install -g pnpm

# ==========================================
# Development stage
# ==========================================
FROM base AS development

# Install all dependencies (including dev dependencies)
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Expose application port (can be overridden via PORT env var)
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://localhost:${PORT:-3000}/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start development server
CMD ["pnpm", "run", "start:dev"]

# ==========================================
# Builder stage for production
# ==========================================
FROM base AS builder

# Install all dependencies for building
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build the application
RUN pnpm run build

# ==========================================
# Production stage
# ==========================================
FROM node:lts-alpine AS production

# Install dumb-init for proper signal handling
RUN apk add --no-cache \
    dumb-init \
    openssl

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001

# Set working directory
WORKDIR /app

# Copy necessary files from builder
COPY --from=builder --chown=nestjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nestjs:nodejs /app/dist ./dist
COPY --from=builder --chown=nestjs:nodejs /app/package*.json ./
COPY --from=builder --chown=nestjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma 2>/dev/null || true

# Switch to non-root user
USER nestjs

# Expose application port (can be overridden via PORT env var)
EXPOSE 3000

# Environment variables (can be overridden at runtime)
ENV NODE_ENV=production \
    PORT=3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://localhost:${PORT:-3000}/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start application
CMD ["node", "dist/src/main.js"]
