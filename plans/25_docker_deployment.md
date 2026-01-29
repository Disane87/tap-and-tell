# Docker Deployment

Local self-hosted deployment using Docker.

## Features

- Single Docker image for the complete app
- Docker Compose for easy setup
- Persistent volume for data storage
- Environment variable configuration
- Health check endpoint
- Optional reverse proxy config (Traefik/Nginx)

## Files to Create

```
docker/
├── Dockerfile
├── docker-compose.yml
├── docker-compose.prod.yml
├── .dockerignore
└── nginx.conf (optional)
```

## Dockerfile

- Multi-stage build (build + runtime)
- Node.js Alpine base image
- Non-root user for security
- Expose port 3000

## Docker Compose

- App service with health checks
- Volume mount for `.data` directory
- Environment variables from `.env`
- Optional: Watchtower for auto-updates

## Environment Variables

```env
ADMIN_PASSWORD=secure-password
TOKEN_SECRET=random-secret
DATA_DIR=/app/data
NODE_ENV=production
```

## Commands

```bash
# Build and run
docker-compose up -d

# View logs
docker-compose logs -f

# Backup data
docker cp tap-and-tell:/app/data ./backup

# Update
docker-compose pull && docker-compose up -d
```

## Health Check

- `GET /api/health` endpoint
- Returns `{ status: 'ok', timestamp: ... }`
- Used by Docker for container health

## Implementation Steps

1. Create Dockerfile with multi-stage build
2. Create docker-compose.yml
3. Add `/api/health` endpoint
4. Create `.dockerignore`
5. Add deployment documentation to README
6. Test local Docker deployment
