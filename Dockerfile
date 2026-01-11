# --- STAGE 1: Build ---
FROM node:20-alpine AS builder

# install openssl for Prisma
RUN apk add --no-cache openssl

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/

# using npm ci to install correct version in package.json
RUN npm ci

# copy all the code and build
COPY . .
RUN npx prisma generate
RUN npm run build

# --- STAGE 2: Run ---
FROM node:20-alpine AS runner

RUN apk add --no-cache openssl
WORKDIR /app

RUN chown -R node:node /app

# copy node_modules and files from build step to runner
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/prisma ./prisma

# using default user node in alpine node
USER node

# cloud run default port
EXPOSE 8080

CMD npx prisma migrate deploy && node dist/index.js