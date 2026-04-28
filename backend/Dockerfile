# ── Build stage ────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

# Install dependencies
COPY package.json package-lock.json* ./
RUN npm ci --ignore-scripts

# Copy source
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build NestJS
RUN npm run build

# ── Production stage ────────────────────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# Only production dependencies
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev --ignore-scripts

# Copy built output and Prisma files
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY prisma ./prisma

# Run migrations then start the server
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main"]

EXPOSE 3001
