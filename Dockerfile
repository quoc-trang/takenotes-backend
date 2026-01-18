# --- STAGE 1: Build ---
FROM node:20-alpine AS builder

# Prisma 6 requires openssl and sometimes libc6-compat on Alpine to run binary engines
RUN apk add --no-cache openssl libc6-compat

WORKDIR /app

# Copy package files and prisma schema first to leverage Docker cache
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies using npm ci for deterministic builds
RUN npm ci

# Copy the rest of the application code
COPY . .

# Generate Prisma Client (Binary for Alpine will be automatically selected)
RUN npx prisma generate

# Build the TypeScript application
RUN npm run build

# --- STAGE 2: Run ---
FROM node:20-alpine AS runner

# Install runtime dependencies for Prisma Client SSL connections
RUN apk add --no-cache openssl libc6-compat
WORKDIR /app

# Set production environment
ENV NODE_ENV=production

# Copy built assets and modules with correct ownership for the 'node' user
COPY --from=builder --chown=node:node /app/node_modules ./node_modules
COPY --from=builder --chown=node:node /app/dist ./dist
COPY --from=builder --chown=node:node /app/package*.json ./
COPY --from=builder --chown=node:node /app/prisma ./prisma

# Security: Run the application as a non-root user
USER node

# Default port for Cloud Run
EXPOSE 8080

# Apply database migrations and start the application
# Note: Ensure the DATABASE_URL environment variable is provided at runtime
CMD npx prisma migrate deploy && node dist/index.js