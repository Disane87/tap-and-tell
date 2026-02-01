FROM node:20-bookworm

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Install PostgreSQL client (for psql, pg_dump, etc.)
RUN apt-get update && apt-get install -y --no-install-recommends \
    postgresql-client \
    git \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /workspace
