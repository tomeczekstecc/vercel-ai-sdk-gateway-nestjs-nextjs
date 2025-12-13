# Environment Variables Guide

## Overview

This document explains how environment variables work in Docker builds and runtime, especially for Next.js applications.

## Key Concepts

### Build-Time vs Runtime Variables

1. **Build-Time Variables** (`ARG` in Dockerfile)
   - Only available during `docker build`
   - Cannot be accessed at runtime
   - Used to pass values during image construction

2. **Runtime Variables** (`ENV` in Dockerfile)
   - Available at runtime inside the container
   - Can be overridden via `docker-compose.yml` or `docker run -e`
   - Set default values but allow runtime changes

### Next.js Special Case: `NEXT_PUBLIC_*`

⚠️ **CRITICAL**: `NEXT_PUBLIC_*` variables are **baked into the JavaScript bundle** during `next build` and **CANNOT be changed at runtime**.

- They must be provided at **build time** via `--build-arg`
- Once the image is built, these values are permanent
- To change them, you must rebuild the image

## Current Setup

### API Service (NestJS)

**Build-Time**: None required

**Runtime Variables** (can be changed in `docker-compose.prod.yml`):
- `NODE_ENV` - Environment mode (default: `production`)
- `PORT` - Server port (default: `3002`)
- `DATABASE_URL` - PostgreSQL connection string
- `UI_URL` - Frontend URL for CORS

**Example Override**:
```yaml
environment:
  DATABASE_URL: postgresql://user:pass@host:5432/db
  UI_URL: https://yourdomain.com
```

### Web Service (Next.js)

**Build-Time Variables** (must be set during `docker build`):
- `NEXT_PUBLIC_API_URL` - API URL baked into the build
  - ⚠️ **Cannot be changed at runtime**
  - Must rebuild image to change this value

**Runtime Variables** (can be changed in `docker-compose.prod.yml`):
- `NODE_ENV` - Environment mode (default: `production`)
- `PORT` - Server port (default: `3000`)
- `API_URL` - Used by `next.config.js` rewrites (can be changed at runtime)
- `HOSTNAME` - Server hostname (default: `0.0.0.0`)

## Usage Examples

### Building with Build-Time Variables

```bash
# Build web image with NEXT_PUBLIC_API_URL
docker build \
  --build-arg NEXT_PUBLIC_API_URL=http://api:3002 \
  -f apps/web/Dockerfile \
  -t registry-server.codderzz.com/vercel-gateway-nest-next/web:latest .
```

### Overriding Runtime Variables

**docker-compose.prod.yml**:
```yaml
services:
  web:
    environment:
      API_URL: http://api:3002  # ✅ Can be changed
      PORT: 3000                # ✅ Can be changed
      # NEXT_PUBLIC_API_URL     # ❌ Cannot be changed (baked in)
```

**docker run**:
```bash
docker run -e API_URL=http://api:3002 \
  registry-server.codderzz.com/vercel-gateway-nest-next/web:latest
```

## Best Practices

### 1. Minimize `NEXT_PUBLIC_*` Usage

Only use `NEXT_PUBLIC_*` for values that truly need to be in the client-side bundle:
- ✅ Public API endpoints
- ✅ Public feature flags
- ❌ Secrets (never use `NEXT_PUBLIC_*` for secrets!)
- ❌ Values that might change between environments

### 2. Use Server-Side Variables When Possible

For values that can change, use regular environment variables accessed server-side:
- Use `API_URL` in `next.config.js` for rewrites (runtime configurable)
- Use server-side API routes to proxy requests
- Access `process.env.VARIABLE` only in server components/API routes

### 3. Build-Time Configuration

If you need different `NEXT_PUBLIC_*` values for different environments:
- Build separate images: `web:dev`, `web:staging`, `web:prod`
- Use CI/CD to build with appropriate values
- Tag images appropriately

### 4. Runtime Configuration

For values that should be configurable:
- Use regular `ENV` variables
- Set defaults in Dockerfile
- Override in `docker-compose.yml` or via `-e` flag
- Use `next.config.js` for runtime configuration

## Current Implementation

### Web Service

**Build-Time** (`NEXT_PUBLIC_API_URL`):
- Used in: `apps/web/components/ChatInterface.tsx`
- Set via: `--build-arg NEXT_PUBLIC_API_URL=...`
- Default: `http://api:3002` (if not provided)

**Runtime** (`API_URL`):
- Used in: `apps/web/next.config.js` for rewrites
- Can be overridden in `docker-compose.prod.yml`
- Default: `http://api:3002`

### Recommended Approach

Since `NEXT_PUBLIC_API_URL` is used client-side, consider:

1. **Option A**: Use relative paths or proxy through Next.js
   ```typescript
   // Use relative path or proxy
   api: '/api/chats'  // Proxied via next.config.js
   ```

2. **Option B**: Build environment-specific images
   ```bash
   # Development
   docker build --build-arg NEXT_PUBLIC_API_URL=http://localhost:3002 ...
   
   # Production
   docker build --build-arg NEXT_PUBLIC_API_URL=https://api.yourdomain.com ...
   ```

3. **Option C**: Use runtime detection (if possible)
   ```typescript
   // Detect API URL at runtime (if same domain)
   const apiUrl = typeof window !== 'undefined' 
     ? window.location.origin + '/api'
     : process.env.API_URL
   ```

## Troubleshooting

### Variable Not Changing at Runtime

**Symptom**: Changed `NEXT_PUBLIC_API_URL` in docker-compose but it doesn't work

**Solution**: Rebuild the image with the new value
```bash
docker build --build-arg NEXT_PUBLIC_API_URL=new-value ...
```

### Variable Not Available

**Symptom**: `process.env.VARIABLE` is `undefined`

**Check**:
1. Is it set in `docker-compose.yml`?
2. Is it prefixed with `NEXT_PUBLIC_` for client-side?
3. Did you restart the container after changing it?

### Build-Time Variable Not Working

**Symptom**: `ARG` value not available during build

**Check**:
1. Is it passed via `--build-arg`?
2. Is it converted to `ENV` before use?
3. Is it used in the correct build stage?

## Summary

| Variable Type | Build-Time | Runtime | Example |
|--------------|------------|---------|---------|
| `ARG` | ✅ | ❌ | Build configuration |
| `ENV` | ✅ | ✅ | Server configuration |
| `NEXT_PUBLIC_*` | ✅ (baked in) | ❌ | Client-side config |

**Remember**: `NEXT_PUBLIC_*` variables are permanent once the image is built. Plan accordingly!

