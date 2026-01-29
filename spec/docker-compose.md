# Docker Compose (Production)

```yaml
# docker-compose.yml
version: "3.8"

services:
  web:
    build:
      context: .
      dockerfile: apps/web/Dockerfile
    ports:
      - "3000:3000"
    environment:
      - CONVEX_URL=${CONVEX_URL}
      - BETTER_AUTH_SECRET=${BETTER_AUTH_SECRET}
    depends_on:
      - docling

  docling:
    build:
      context: apps/docling
    ports:
      - "8000:8000"
    environment:
      - MAX_WORKERS=4
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 30s
      timeout: 10s
      retries: 3

networks:
  default:
    name: alpha-network
```
