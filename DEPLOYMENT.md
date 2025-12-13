# Deployment Guide

This guide provides step-by-step instructions for deploying the application to `registry-server.codderzz.com`.

## Quick Start

### 1. Build and Push Images

```bash
# Make deploy script executable
chmod +x deploy.sh

# Deploy with 'latest' tag
./deploy.sh

# Or deploy with specific version
./deploy.sh v1.0.0
```

### 2. Deploy to Server

```bash
# Pull latest images
docker-compose -f docker-compose.prod.yml pull

# Start services
docker-compose -f docker-compose.prod.yml up -d

# View logs
docker-compose -f docker-compose.prod.yml logs -f
```

## Detailed Deployment Steps

### Prerequisites

1. **Docker installed** on your machine
2. **Docker Compose** installed
3. **Access credentials** for `registry-server.codderzz.com`
4. **SSH access** to deployment server (if deploying remotely)

### Step 1: Build Images

Build both API and Web images:

```bash
# Build API
docker build -f apps/api/Dockerfile \
  -t registry-server.codderzz.com/vercel-gateway-nest-next/api:latest .

# Build Web
docker build -f apps/web/Dockerfile \
  -t registry-server.codderzz.com/vercel-gateway-nest-next/web:latest .
```

### Step 2: Login to Registry

```bash
docker login registry-server.codderzz.com
```

Enter your credentials when prompted.

### Step 3: Push Images

```bash
# Push API image
docker push registry-server.codderzz.com/vercel-gateway-nest-next/api:latest

# Push Web image
docker push registry-server.codderzz.com/vercel-gateway-nest-next/web:latest
```

### Step 4: Deploy on Server

#### Option A: Using Docker Compose (Recommended)

1. **Copy files to server:**
   ```bash
   scp docker-compose.prod.yml .env.prod user@server:/path/to/app/
   ```

2. **SSH into server:**
   ```bash
   ssh user@server
   cd /path/to/app
   ```

3. **Pull and start services:**
   ```bash
   docker-compose -f docker-compose.prod.yml pull
   docker-compose -f docker-compose.prod.yml up -d
   ```

#### Option B: Manual Docker Run

```bash
# Start PostgreSQL
docker run -d \
  --name postgres \
  -e POSTGRES_PASSWORD=your_password \
  -e POSTGRES_DB=chatdb \
  -v postgres_data:/var/lib/postgresql/data \
  postgres:16-alpine

# Start API
docker run -d \
  --name nestjs-api \
  -p 3002:3002 \
  -e DATABASE_URL=postgresql://postgres:your_password@postgres:5432/chatdb \
  -e UI_URL=http://your-domain.com \
  --link postgres:postgres \
  registry-server.codderzz.com/vercel-gateway-nest-next/api:latest

# Start Web
docker run -d \
  --name nextjs-web \
  -p 3000:3000 \
  -e API_URL=http://api:3002 \
  --link nestjs-api:api \
  registry-server.codderzz.com/vercel-gateway-nest-next/web:latest
```

## Environment Configuration

Create `.env.prod` file on your server:

```env
# Database
POSTGRES_PASSWORD=your_secure_password

# API
UI_URL=https://your-domain.com
DATABASE_URL=postgresql://postgres:your_secure_password@postgres:5432/chatdb

# Web
API_URL=http://api:3002
```

Load environment variables:

```bash
export $(cat .env.prod | xargs)
docker-compose -f docker-compose.prod.yml up -d
```

## Versioning Strategy

### Tagging Images

```bash
# Build with version tag
./deploy.sh v1.0.0

# Build with latest tag
./deploy.sh latest

# Build with git commit hash
./deploy.sh $(git rev-parse --short HEAD)
```

### Updating Production

```bash
# Update docker-compose.prod.yml with new version
# Then pull and restart
docker-compose -f docker-compose.prod.yml pull
docker-compose -f docker-compose.prod.yml up -d
```

## Monitoring and Maintenance

### View Logs

```bash
# All services
docker-compose -f docker-compose.prod.yml logs -f

# Specific service
docker-compose -f docker-compose.prod.yml logs -f api
docker-compose -f docker-compose.prod.yml logs -f web
```

### Check Status

```bash
# Service status
docker-compose -f docker-compose.prod.yml ps

# Health checks
docker-compose -f docker-compose.prod.yml ps --format json | jq '.[] | {name: .Name, status: .State}'
```

### Restart Services

```bash
# Restart all
docker-compose -f docker-compose.prod.yml restart

# Restart specific service
docker-compose -f docker-compose.prod.yml restart api
```

### Update Services

```bash
# Pull latest images
docker-compose -f docker-compose.prod.yml pull

# Recreate containers with new images
docker-compose -f docker-compose.prod.yml up -d
```

## Troubleshooting

### Images Not Found

```bash
# Verify login
docker login registry-server.codderzz.com

# Check image exists
docker pull registry-server.codderzz.com/vercel-gateway-nest-next/api:latest
```

### Connection Issues

```bash
# Check network connectivity
docker network ls
docker network inspect app-network

# Verify service names
docker-compose -f docker-compose.prod.yml ps
```

### Database Connection Errors

```bash
# Check PostgreSQL is running
docker-compose -f docker-compose.prod.yml ps postgres

# Check database logs
docker-compose -f docker-compose.prod.yml logs postgres

# Verify connection string
docker-compose -f docker-compose.prod.yml exec api env | grep DATABASE_URL
```

### Port Conflicts

```bash
# Check port usage
netstat -tulpn | grep :3000
netstat -tulpn | grep :3002
netstat -tulpn | grep :5432

# Change ports in docker-compose.prod.yml if needed
```

## Rollback Procedure

### Rollback to Previous Version

```bash
# Update docker-compose.prod.yml with previous version tag
# Then pull and restart
docker-compose -f docker-compose.prod.yml pull
docker-compose -f docker-compose.prod.yml up -d
```

### Emergency Stop

```bash
# Stop all services
docker-compose -f docker-compose.prod.yml stop

# Stop and remove containers
docker-compose -f docker-compose.prod.yml down
```

## Backup and Recovery

### Database Backup

```bash
# Create backup
docker-compose -f docker-compose.prod.yml exec postgres \
  pg_dump -U postgres chatdb > backup_$(date +%Y%m%d_%H%M%S).sql

# Restore backup
docker-compose -f docker-compose.prod.yml exec -T postgres \
  psql -U postgres chatdb < backup_20240101_120000.sql
```

### Volume Backup

```bash
# Backup volume
docker run --rm \
  -v postgres_data:/data \
  -v $(pwd):/backup \
  alpine tar czf /backup/postgres_backup.tar.gz /data
```

## Security Best Practices

1. **Use strong passwords** for PostgreSQL
2. **Limit port exposure** - only expose necessary ports
3. **Use secrets management** for sensitive data
4. **Regular updates** - keep images updated
5. **Network isolation** - use Docker networks
6. **SSL/TLS** - use reverse proxy for HTTPS

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Build and Deploy

on:
  push:
    branches: [main]

jobs:
  build-and-push:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v2
      
      - name: Login to Registry
        uses: docker/login-action@v2
        with:
          registry: registry-server.codderzz.com
          username: ${{ secrets.REGISTRY_USERNAME }}
          password: ${{ secrets.REGISTRY_PASSWORD }}
      
      - name: Build and push API
        uses: docker/build-push-action@v4
        with:
          context: .
          file: ./apps/api/Dockerfile
          push: true
          tags: registry-server.codderzz.com/vercel-gateway-nest-next/api:latest
      
      - name: Build and push Web
        uses: docker/build-push-action@v4
        with:
          context: .
          file: ./apps/web/Dockerfile
          push: true
          tags: registry-server.codderzz.com/vercel-gateway-nest-next/web:latest
```

## Support

For deployment issues, check:
1. Docker logs: `docker-compose -f docker-compose.prod.yml logs`
2. Service health: `docker-compose -f docker-compose.prod.yml ps`
3. Network connectivity: `docker network inspect app-network`

