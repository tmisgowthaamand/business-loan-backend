FROM node:18-alpine

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create app directory
WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./

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
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001

# Change ownership of the app directory
RUN chown -R nestjs:nodejs /app
USER nestjs

# Expose port
EXPOSE 5002

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start the application directly with node
CMD ["node", "dist/main.js"]
