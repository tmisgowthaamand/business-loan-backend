FROM node:18-slim

# Install required system dependencies
RUN apt-get update && apt-get install -y \
    openssl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Create app directory
WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./
COPY prisma ./prisma/

# Install all dependencies (including devDependencies for build)
RUN echo "🔧 Installing dependencies..." && \
    npm ci && \
    echo "✅ Dependencies installed"

# Copy source code
COPY . .

# Generate Prisma client and build
RUN echo "🔧 Generating Prisma client..." && \
    npx prisma generate && \
    echo "🔧 Building application..." && \
    npm run build && \
    echo "🔧 Verifying build output..." && \
    ls -la dist/ && \
    test -f dist/main.js && \
    echo "✅ Build verification successful" && \
    echo "🔧 Cleaning up dev dependencies..." && \
    npm ci --only=production && \
    npm cache clean --force && \
    echo "✅ Production dependencies ready"

# Create non-root user for security
RUN groupadd -r nodejs && useradd -r -g nodejs nestjs

# Change ownership of the app directory
RUN chown -R nestjs:nodejs /app
USER nestjs

# Expose port
EXPOSE 5002

# Start the application
CMD ["node", "dist/main.js"]
