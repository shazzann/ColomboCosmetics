# Build stage
FROM node:22-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./
COPY prisma ./prisma

# Install dependencies
RUN npm ci --omit=dev

# Generate Prisma client
RUN npx prisma generate

# Copy source
COPY src ./src

# Build TypeScript
RUN npm run build

# Runtime stage
FROM node:22-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma

# Install production dependencies
RUN npm ci --omit=dev

# Copy generated Prisma client from builder
COPY --from=builder /app/node_modules/.prisma /app/node_modules/.prisma

# Copy compiled code
COPY --from=builder /app/dist ./dist

# Expose port
EXPOSE 3000

# Start server
CMD ["node", "dist/src/index.js"]
