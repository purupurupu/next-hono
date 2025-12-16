# Development Dockerfile for Bun + Hono backend
FROM oven/bun:1.0

WORKDIR /app

# Install dependencies
COPY package.json bun.lockb ./
RUN bun install --frozen-lockfile

# Copy source code
COPY . .

# Expose port
EXPOSE 3000

# Development command with hot reload
CMD ["bun", "run", "--watch", "src/index.ts"]
