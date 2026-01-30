# Stage 1: Build
FROM node:20-alpine AS builder

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source files
COPY . .

# Build the application
RUN pnpm build

# Stage 2: Production
FROM node:20-alpine AS runner

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nuxt

WORKDIR /app

# Copy built application
COPY --from=builder --chown=nuxt:nodejs /app/.output ./.output

# Create data directory
RUN mkdir -p /app/data && chown -R nuxt:nodejs /app/data

# Switch to non-root user
USER nuxt

# Set environment variables
ENV NODE_ENV=production
ENV DATA_DIR=/app/data
ENV HOST=0.0.0.0
ENV PORT=3000

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

# Start the application
CMD ["node", ".output/server/index.mjs"]
