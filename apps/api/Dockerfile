# Build stage
FROM node:20-alpine AS builder

# Install pnpm
RUN npm install -g pnpm@9.0.0

# Set working directory
WORKDIR /app

# Copy workspace files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY turbo.json ./

# Copy package files (package.json only first for better layer caching)
COPY packages/eslint-config/package.json ./packages/eslint-config/
COPY packages/typescript-config/package.json ./packages/typescript-config/
COPY packages/ui/package.json ./packages/ui/
COPY apps/api/package.json ./apps/api/

# Install dependencies (including devDependencies for build)
# This installs all workspace dependencies based on package.json files
RUN pnpm install --frozen-lockfile

# Copy source code (node_modules excluded by .dockerignore)
COPY packages/eslint-config ./packages/eslint-config
COPY packages/typescript-config ./packages/typescript-config
COPY packages/ui ./packages/ui
COPY apps/api ./apps/api

# Reinstall to ensure workspace dependencies are properly linked after copying source
RUN pnpm install --frozen-lockfile

# Remove drizzle.config.ts before build (it's a dev tool config, not part of the app)
RUN rm -f /app/apps/api/drizzle.config.ts || true

# Build the application
# Use pnpm --filter to ensure proper workspace resolution
WORKDIR /app
RUN pnpm --filter api build

# Production stage
FROM node:20-alpine AS production

# Install pnpm
RUN npm install -g pnpm@9.0.0

WORKDIR /app

# Copy workspace files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Copy package files
COPY packages/eslint-config/package.json ./packages/eslint-config/
COPY packages/typescript-config/package.json ./packages/typescript-config/
COPY packages/ui/package.json ./packages/ui/
COPY apps/api/package.json ./apps/api/

# Install production dependencies only
RUN pnpm install --frozen-lockfile --prod

# Copy built application
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=builder /app/packages ./packages

WORKDIR /app/apps/api

# Expose port
EXPOSE 3002

# Start the application
CMD ["node", "dist/main.js"]

