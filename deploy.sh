#!/bin/bash

set -e

REGISTRY="registry-server.codderzz.com"
PROJECT="vercel-gateway-nest-next"
VERSION="${1:-latest}"

echo "🚀 Starting deployment process..."
echo "Registry: ${REGISTRY}"
echo "Project: ${PROJECT}"
echo "Version: ${VERSION}"
echo ""

echo "📦 Building API image..."
docker build -f apps/api/Dockerfile -t ${REGISTRY}/${PROJECT}/api:${VERSION} .

echo "📦 Building Web image..."
# Use buildx with better compression and progress output
# Note: We'll build and push together in the push step to avoid building twice
echo "Building will happen during push step..."

echo "🔐 Logging in to registry..."
docker login ${REGISTRY}

echo "⬆️  Pushing API image..."
docker push ${REGISTRY}/${PROJECT}/api:${VERSION}

echo "⬆️  Pushing Web image..."
# Use buildx push with better handling for large images
# Buildx handles retries better and provides progress feedback
MAX_RETRIES=3
RETRY_COUNT=0
RETRY_DELAY=10

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    echo "Pushing attempt $((RETRY_COUNT + 1))/$MAX_RETRIES..."
    if docker buildx build \
      --platform linux/amd64 \
      --push \
      --progress=plain \
      --build-arg NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL:-http://api:3002} \
      -f apps/web/Dockerfile \
      -t ${REGISTRY}/${PROJECT}/web:${VERSION} . 2>&1 | tee /tmp/push.log; then
        echo "✅ Web image pushed successfully"
        break
    else
        RETRY_COUNT=$((RETRY_COUNT + 1))
        if [ $RETRY_COUNT -lt $MAX_RETRIES ]; then
            echo "⚠️  Push failed, retrying in ${RETRY_DELAY} seconds... (Attempt $RETRY_COUNT/$MAX_RETRIES)"
            echo "💡 Tip: Docker buildx will automatically retry individual layers."
            sleep $RETRY_DELAY
            RETRY_DELAY=$((RETRY_DELAY * 2))  # Exponential backoff: 10s, 20s, 40s
        else
            echo "❌ Failed to push Web image after $MAX_RETRIES attempts"
            echo "📋 Last error output:"
            tail -30 /tmp/push.log || echo "No log available"
            echo ""
            echo "💡 Alternative: Try pushing the already-built image:"
            echo "   docker push ${REGISTRY}/${PROJECT}/web:${VERSION}"
            exit 1
        fi
    fi
done

echo ""
echo "✅ Deployment complete!"
echo "📋 Images pushed:"
echo "   - ${REGISTRY}/${PROJECT}/api:${VERSION}"
echo "   - ${REGISTRY}/${PROJECT}/web:${VERSION}"
echo ""
echo "💡 To deploy, run:"
echo "   docker-compose -f docker-compose.prod.yml pull"
echo "   docker-compose -f docker-compose.prod.yml up -d"

