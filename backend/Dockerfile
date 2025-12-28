# Development Dockerfile for Node.js + Hono backend
FROM node:24-alpine

# Enable corepack for pnpm support
RUN corepack enable

WORKDIR /app

# Install dependencies
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Expose port
EXPOSE 3000

# Development command with hot reload
CMD ["pnpm", "run", "dev"]
