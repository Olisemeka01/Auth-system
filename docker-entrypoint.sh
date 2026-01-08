#!/bin/sh
set -e

echo "🚀 Starting Auth System..."

# Install pnpm
npm install -g pnpm@9.15.4

# Install dependencies
pnpm install

# Build application
pnpm build

# Run migrations
pnpm run migration:run

# Seed database
pnpm seed

# Start application
node dist/src/main.js
