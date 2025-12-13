# Vercel AI SDK Gateway - NestJS & Next.js

A full-stack AI chat application built with NestJS backend and Next.js frontend, featuring Vercel AI SDK integration, PostgreSQL database, and Docker containerization.

## 📋 Table of Contents

- [Stack Overview](#stack-overview)
- [Architecture](#architecture)
- [API Documentation](#api-documentation)
- [Web Application Features](#web-application-features)
- [Development Setup](#development-setup)
- [Docker Deployment](#docker-deployment)
- [Environment Variables](#environment-variables)

## 🏗️ Stack Overview

### Backend (API)
- **Framework**: NestJS 11.x
- **Language**: TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **AI SDK**: Vercel AI SDK (`ai` package)
- **Runtime**: Node.js 20+
- **Package Manager**: pnpm 9.0.0

### Frontend (Web)
- **Framework**: Next.js 16.x (App Router)
- **Language**: TypeScript
- **UI Library**: React 19.x
- **Styling**: Tailwind CSS 4.x
- **AI SDK**: `@ai-sdk/react` for chat functionality
- **Package Manager**: pnpm 9.0.0

### Infrastructure
- **Monorepo**: Turborepo
- **Containerization**: Docker & Docker Compose
- **Database**: PostgreSQL 16 (Alpine)

## 🏛️ Architecture

```
┌─────────────────┐
│   Next.js Web   │  Port 3000
│   (Frontend)    │
└────────┬────────┘
         │ HTTP/REST
         │
┌────────▼────────┐
│  NestJS API     │  Port 3002
│  (Backend)      │
└────────┬────────┘
         │
┌────────▼────────┐
│   PostgreSQL    │  Port 5432
│   (Database)    │
└─────────────────┘
```

### Monorepo Structure

```
vercel-ai-sdk-gateway-nestjs-nextjs/
├── apps/
│   ├── api/          # NestJS backend application
│   └── web/          # Next.js frontend application
├── packages/
│   ├── ui/           # Shared UI components
│   ├── eslint-config/    # Shared ESLint configuration
│   └── typescript-config/ # Shared TypeScript configuration
├── docker-compose.yml
└── package.json
```

## 📡 API Documentation

### Base URL
- **Development**: `http://localhost:3002`
- **Production**: Configure via `API_URL` environment variable

### Endpoints

#### 1. Create/Stream Chat Message

**POST** `/chats`

Streams AI responses using Vercel AI SDK with tool support.

**Request Body:**
```json
{
  "message": {
    "id": "string",
    "role": "user",
    "parts": [
      {
        "type": "text",
        "text": "What's the weather in Warsaw?"
      }
    ]
  },
  "id": "chat-uuid",
  "model": "google/gemini-2.5-flash-lite"
}
```

**Response:**
- **Content-Type**: `text/event-stream` (Server-Sent Events)
- **Stream**: Real-time streaming of AI responses with tool calls

**Example:**
```bash
curl -X POST http://localhost:3002/chats \
  -H "Content-Type: application/json" \
  -d '{
    "message": {
      "id": "msg-1",
      "role": "user",
      "parts": [{"type": "text", "text": "Hello"}]
    },
    "id": "chat-123",
    "model": "google/gemini-2.5-flash-lite"
  }'
```

**Features:**
- Creates chat conversation if it doesn't exist
- Stores user message in database
- Streams AI response with tool support
- Automatically saves AI responses to database on completion
- Updates chat `updatedAt` timestamp

---

#### 2. Get All Chats

**GET** `/chats`

Retrieves all chat conversations with their latest message snippet.

**Response:**
```json
[
  {
    "id": "uuid",
    "updatedAt": "2024-01-01T12:00:00Z",
    "snippet": "Latest message text snippet (max 60 chars)..."
  }
]
```

**Example:**
```bash
curl http://localhost:3002/chats
```

**Response Details:**
- Returns chats ordered by `updatedAt` (most recent first)
- Includes snippet from the latest message (truncated to 60 characters)
- Shows "Brak wiadomości" (No messages) if chat is empty

---

#### 3. Get Chat by ID

**GET** `/chats/:id`

Retrieves a specific chat conversation.

**Parameters:**
- `id` (path parameter): Chat UUID

**Response:**
```json
{
  "id": "uuid",
  "updatedAt": "2024-01-01T12:00:00Z"
}
```

**Example:**
```bash
curl http://localhost:3002/chats/123e4567-e89b-12d3-a456-426614174000
```

---

#### 4. Get Chat Messages

**GET** `/chats/:id/messages`

Retrieves all messages for a specific chat conversation.

**Parameters:**
- `id` (path parameter): Chat UUID

**Response:**
```json
[
  {
    "id": "msg-uuid",
    "role": "user" | "assistant",
    "parts": [
      {
        "type": "text",
        "text": "Message content"
      }
    ]
  }
]
```

**Example:**
```bash
curl http://localhost:3002/chats/123e4567-e89b-12d3-a456-426614174000/messages
```

**Response Details:**
- Returns messages ordered by `createdAt` (oldest first)
- Messages are stored as `UIMessage` format compatible with Vercel AI SDK
- Includes both user and assistant messages

---

### Database Schema

#### `chat_conversations` Table
```sql
- id: UUID (Primary Key)
- updatedAt: Timestamp
```

#### `chat_messages` Table
```sql
- id: UUID (Primary Key)
- chatId: UUID (Foreign Key → chat_conversations.id)
- content: JSONB (UIMessage format)
- createdAt: Timestamp
- updatedAt: Timestamp
```

### AI Tools

The API supports AI tools that can be called during conversations:

#### `getWeatherTool`
- **Description**: Get the current weather for a location
- **Input**: `{ location: string }`
- **Output**: 
  ```json
  {
    "location": "string",
    "temperature": number,
    "condition": "sunny" | "cloudy" | "rainy" | "partly cloudy",
    "humidity": number
  }
  ```

**Note**: Currently returns mock data. Can be extended to integrate with real weather APIs.

---

## 🌐 Web Application Features

### Core Features

#### 1. **Chat Interface**
- Real-time streaming chat interface
- Message history persistence
- Support for multiple AI models
- Tool call visualization (e.g., weather cards)
- Responsive design with dark theme

#### 2. **Chat Sidebar**
- List of all chat conversations
- Chat preview with snippet and date
- "New Chat" button to create conversations
- Active chat highlighting
- Empty state handling

#### 3. **Model Selection**
- Customizable AI model input
- Default: `google/gemini-2.5-flash-lite`
- Link to Vercel AI Gateway models documentation
- Model persists during conversation

#### 4. **Message Display**
- User messages (right-aligned, blue background)
- Assistant messages (left-aligned, gray background)
- Role labels ("Ty" / "Asystent")
- Support for text messages
- Tool output rendering (e.g., WeatherCard component)

#### 5. **Weather Tool Integration**
- Visual weather cards with:
  - Location name
  - Temperature display
  - Weather condition with emoji icons
  - Humidity percentage
  - Gradient background styling

#### 6. **Loading States**
- Animated loading indicator during AI response
- Disabled input during streaming
- Status management (`ready`, `streaming`, etc.)

#### 7. **Message Persistence**
- Automatic message loading on page load
- Messages fetched from API on chat selection
- Real-time message updates during streaming

### Pages

#### `/` - Home Page
- Welcome message: "Witaj w czacie"
- Instructions: "Kontynuuj konwersację wybierając czat po lewej lub zacznij nową rozmowę"
- Centered layout with sidebar

#### `/chat/[id]` - Chat Page
- Full chat interface
- Chat sidebar navigation
- Message input and display
- Model selection

### UI Components

#### `ChatSidebar`
- Displays list of chats
- Fetches chats from `/api/chats`
- Handles navigation between chats
- Creates new chats with UUID

#### `ChatInterface`
- Main chat interface component
- Integrates with `@ai-sdk/react` `useChat` hook
- Handles message sending and receiving
- Manages model selection
- Renders tool outputs

#### `WeatherCard`
- Displays weather information
- Gradient background styling
- Weather condition icons
- Temperature and humidity display

---

## 🚀 Development Setup

### Prerequisites

- Node.js 18+ (recommended: 20+)
- pnpm 9.0.0
- PostgreSQL 16+ (or use Docker Compose)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd vercel-ai-sdk-gateway-nestjs-nextjs
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Set up environment variables**
   
   Create `.env` file in `apps/api/`:
   ```env
   DATABASE_URL=postgresql://postgres:postgres@localhost:5432/chatdb
   UI_URL=http://localhost:3000
   PORT=3002
   ```

   Create `.env.local` file in `apps/web/`:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:3002
   ```

4. **Set up database**
   
   Using Docker Compose:
   ```bash
   docker-compose up -d postgres
   ```
   
   Or use your own PostgreSQL instance and run migrations:
   ```bash
   cd apps/api
   pnpm drizzle-kit generate
   pnpm drizzle-kit push
   ```

5. **Run development servers**
   ```bash
   # From root directory
   pnpm dev
   
   # Or run individually
   pnpm --filter api dev
   pnpm --filter web dev
   ```

### Development URLs

- **Web App**: http://localhost:3000
- **API**: http://localhost:3002
- **PostgreSQL**: localhost:5432

---

## 🐳 Docker Deployment

### Prerequisites

- Docker 20.10+
- Docker Compose 2.0+
- Access to registry: `registry-server.codderzz.com`

### Building Images

#### Build API Image

```bash
# Build API image
docker build -f apps/api/Dockerfile -t registry-server.codderzz.com/vercel-gateway-nest-next/api:latest .

# Or with specific tag
docker build -f apps/api/Dockerfile -t registry-server.codderzz.com/vercel-gateway-nest-next/api:v1.0.0 .
```

#### Build Web Image

```bash
# Build Web image
docker build -f apps/web/Dockerfile -t registry-server.codderzz.com/vercel-gateway-nest-next/web:latest .

# Or with specific tag
docker build -f apps/web/Dockerfile -t registry-server.codderzz.com/vercel-gateway-nest-next/web:v1.0.0 .
```

#### Build Both Images

```bash
# Build both images
docker build -f apps/api/Dockerfile -t registry-server.codderzz.com/vercel-gateway-nest-next/api:latest .
docker build -f apps/web/Dockerfile -t registry-server.codderzz.com/vercel-gateway-nest-next/web:latest .
```

### Pushing to Registry

#### Login to Registry

```bash
# Login to your registry
docker login registry-server.codderzz.com

# Enter your credentials when prompted
```

#### Push Images

```bash
# Push API image
docker push registry-server.codderzz.com/vercel-gateway-nest-next/api:latest

# Push Web image
docker push registry-server.codderzz.com/vercel-gateway-nest-next/web:latest

# Push with specific tags
docker push registry-server.codderzz.com/vercel-gateway-nest-next/api:v1.0.0
docker push registry-server.codderzz.com/vercel-gateway-nest-next/web:v1.0.0
```

### Deploying with Docker Compose

#### Option 1: Use Registry Images

Create `docker-compose.prod.yml`:

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    container_name: postgres
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-postgres}
      POSTGRES_DB: chatdb
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5

  api:
    image: registry-server.codderzz.com/vercel-gateway-nest-next/api:latest
    container_name: nestjs-api
    ports:
      - "3002:3002"
    environment:
      NODE_ENV: production
      PORT: 3002
      DATABASE_URL: postgresql://postgres:${POSTGRES_PASSWORD:-postgres}@postgres:5432/chatdb
      UI_URL: ${UI_URL:-http://localhost:3000}
    depends_on:
      postgres:
        condition: service_healthy
    restart: unless-stopped

  web:
    image: registry-server.codderzz.com/vercel-gateway-nest-next/web:latest
    container_name: nextjs-web
    ports:
      - "3000:3000"
    environment:
      NODE_ENV: production
      PORT: 3000
      API_URL: ${API_URL:-http://api:3002}
    depends_on:
      - api
    restart: unless-stopped

volumes:
  postgres_data:
```

#### Deploy

```bash
# Pull latest images
docker-compose -f docker-compose.prod.yml pull

# Start services
docker-compose -f docker-compose.prod.yml up -d

# View logs
docker-compose -f docker-compose.prod.yml logs -f

# Stop services
docker-compose -f docker-compose.prod.yml down

# Stop and remove volumes (⚠️ deletes data)
docker-compose -f docker-compose.prod.yml down -v
```

#### Option 2: Build and Deploy Locally

```bash
# Build and start all services
docker-compose up --build -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Deployment Script

Create `deploy.sh` for automated deployment:

```bash
#!/bin/bash

set -e

REGISTRY="registry-server.codderzz.com"
PROJECT="vercel-gateway-nest-next"
VERSION="${1:-latest}"

echo "Building API image..."
docker build -f apps/api/Dockerfile -t ${REGISTRY}/${PROJECT}/api:${VERSION} .

echo "Building Web image..."
docker build -f apps/web/Dockerfile -t ${REGISTRY}/${PROJECT}/web:${VERSION} .

echo "Logging in to registry..."
docker login ${REGISTRY}

echo "Pushing API image..."
docker push ${REGISTRY}/${PROJECT}/api:${VERSION}

echo "Pushing Web image..."
docker push ${REGISTRY}/${PROJECT}/web:${VERSION}

echo "Deployment complete!"
echo "Images pushed:"
echo "  - ${REGISTRY}/${PROJECT}/api:${VERSION}"
echo "  - ${REGISTRY}/${PROJECT}/web:${VERSION}"
```

**Usage:**
```bash
chmod +x deploy.sh
./deploy.sh          # Uses 'latest' tag
./deploy.sh v1.0.0   # Uses specific version tag
```

### Production Considerations

1. **Environment Variables**: Use `.env` files or Docker secrets for sensitive data
2. **Database Backups**: Set up regular PostgreSQL backups
3. **SSL/TLS**: Use reverse proxy (nginx/traefik) for HTTPS
4. **Monitoring**: Add health checks and monitoring tools
5. **Scaling**: Use Docker Swarm or Kubernetes for production scaling
6. **Resource Limits**: Set CPU and memory limits in docker-compose

### Health Checks

The API and Web services include health check endpoints. You can verify deployment:

```bash
# Check API health
curl http://localhost:3002/chats

# Check Web health
curl http://localhost:3000
```

---

## 🔐 Environment Variables

### API (`apps/api`)

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `DATABASE_URL` | PostgreSQL connection string | - | ✅ |
| `UI_URL` | Frontend URL for CORS | - | ✅ |
| `PORT` | API server port | `3002` | ❌ |
| `NODE_ENV` | Environment mode | `development` | ❌ |

### Web (`apps/web`)

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `NEXT_PUBLIC_API_URL` | Backend API URL | - | ✅ |
| `PORT` | Web server port | `3000` | ❌ |
| `NODE_ENV` | Environment mode | `development` | ❌ |

### Docker Compose

| Variable | Description | Default |
|----------|-------------|---------|
| `POSTGRES_PASSWORD` | PostgreSQL password | `postgres` |
| `UI_URL` | Frontend URL for CORS | `http://localhost:3000` |
| `API_URL` | Backend API URL | `http://api:3002` |

---

## 📚 Additional Resources

- [NestJS Documentation](https://docs.nestjs.com/)
- [Next.js Documentation](https://nextjs.org/docs)
- [Vercel AI SDK](https://sdk.vercel.ai/docs)
- [Drizzle ORM](https://orm.drizzle.team/)
- [Docker Documentation](https://docs.docker.com/)
- [Turborepo Documentation](https://turborepo.org/docs)

---

## 📝 License

UNLICENSED - Private project

---

## 🤝 Contributing

This is a private project. For questions or issues, please contact the maintainers.
