# Build stage
FROM node:20-alpine AS builder

# Install pnpm
RUN npm install -g pnpm@9.0.0

# Set working directory
WORKDIR /app

# Copy workspace files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY turbo.json ./

# Copy package files
COPY packages/eslint-config/package.json ./packages/eslint-config/
COPY packages/typescript-config/package.json ./packages/typescript-config/
COPY packages/ui/package.json ./packages/ui/
COPY apps/web/package.json ./apps/web/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY packages/eslint-config ./packages/eslint-config
COPY packages/typescript-config ./packages/typescript-config
COPY packages/ui ./packages/ui
COPY apps/web ./apps/web

# Reinstall to ensure workspace dependencies are properly linked after copying source
RUN pnpm install --frozen-lockfile

# Build the application
# Use pnpm --filter to ensure proper workspace resolution
WORKDIR /app
RUN pnpm --filter web build

# Production stage - optimized for smaller image size
FROM node:20-alpine AS production

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm@9.0.0

# Copy standalone build output from Next.js (much smaller)
COPY --from=builder /app/apps/web/.next/standalone ./
COPY --from=builder /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder /app/apps/web/public ./apps/web/public

WORKDIR /app/apps/web

# Expose port
EXPOSE 3000

# Set environment to production
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Start the application using the standalone server
CMD ["node", "server.js"]

