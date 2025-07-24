# Use Node.js 22 Alpine for smaller image size
FROM node:22-alpine as builder

# Set working directory
WORKDIR /app

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev dependencies for building)
RUN npm ci

# Copy source code
COPY . .

# Run linting and tests
RUN npm run lint
RUN npm run test

# Production stage
FROM node:22-alpine as production

# Set working directory
WORKDIR /app

# Install dumb-init
RUN apk add --no-cache dumb-init

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S microservice -u 1001

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production && \
    npm cache clean --force

# Copy source code with proper ownership
COPY --chown=microservice:nodejs src/ ./src/
COPY --chown=microservice:nodejs scripts/ ./scripts/

# Switch to non-root user
USER microservice

# Expose port
EXPOSE 3000

# Add labels for metadata
LABEL maintainer="Backend Team"
LABEL version="1.0.0"
LABEL description="Enterprise Node.js Microservice"

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "fetch('http://localhost:3000/health').then(r => r.ok ? process.exit(0) : process.exit(1)).catch(() => process.exit(1))"

# Start application with dumb-init
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "src/main.js"]