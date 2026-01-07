FROM node:20-alpine

# Install dependencies
RUN apk add --no-cache openssl wget

WORKDIR /app

# Copy dependency files first for better layer caching
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies and generate Prisma client
RUN npm ci && npx prisma generate

# Copy application code
COPY . .

# Build the application
RUN npm run build 

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Change ownership of app directory
RUN chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

CMD npx prisma migrate deploy && npm start