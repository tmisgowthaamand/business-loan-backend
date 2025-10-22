# Backend Deployment Guide for Render

## Problem Fixed
The error `Cannot find module '/app/dist/main'` occurs because the build step is missing from the deployment process.

## Solution Applied

### 1. Updated Dockerfile
```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including devDependencies for build)
RUN npm ci

# Copy source code
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build the application
RUN npm run build

# Remove devDependencies to reduce image size
RUN npm ci --only=production && npm cache clean --force

# Expose port (Render uses PORT env variable)
EXPOSE $PORT

# Start the application
CMD ["npm", "run", "start:prod"]
```

### 2. Updated package.json scripts
```json
{
  "scripts": {
    "prebuild": "rimraf dist",
    "build": "nest build",
    "start:prod": "node dist/main.js",
    "postbuild": "echo 'Build completed successfully'"
  }
}
```

### 3. Created render.yaml
```yaml
services:
  - type: web
    name: business-loan-backend
    env: node
    buildCommand: npm ci && npx prisma generate && npm run build
    startCommand: npm run start:prod
    envVars:
      - key: NODE_ENV
        value: production
```

## Deployment Steps for Render

### Option 1: Using Docker (Recommended)
1. Ensure Dockerfile is in root directory
2. In Render dashboard:
   - Set **Build Command**: `docker build -t backend .`
   - Set **Start Command**: `docker run -p $PORT:$PORT backend`

### Option 2: Using Node.js Build
1. In Render dashboard:
   - Set **Build Command**: `npm ci && npx prisma generate && npm run build`
   - Set **Start Command**: `npm run start:prod`

### Option 3: Using render.yaml
1. Commit render.yaml to repository root
2. Render will automatically use the configuration

## Environment Variables Required
Set these in Render dashboard:
- `NODE_ENV=production`
- `PORT` (automatically set by Render)
- `DATABASE_URL` (if using database)
- `JWT_SECRET` (for authentication)
- Any other environment variables your app needs

## Local Testing
Before deploying, test locally:
```bash
# Install dependencies
npm ci

# Generate Prisma client
npx prisma generate

# Build the application
npm run build

# Check if build was successful
node build-check.js

# Test production build
npm run start:prod
```

## Troubleshooting

### If build fails:
1. Check Node.js version (should be 18+)
2. Ensure all dependencies are in package.json
3. Run `npm run build` locally first

### If start fails:
1. Verify dist/main.js exists after build
2. Check file permissions
3. Ensure PORT environment variable is set

### Common Issues:
- **Missing dist folder**: Build command not running
- **Permission denied**: File permissions issue
- **Module not found**: Missing dependencies or wrong paths

## Build Verification
Run the build check script:
```bash
node build-check.js
```

This will verify:
- ✅ dist directory exists
- ✅ main.js file exists
- ✅ File sizes and structure
- ✅ Available npm scripts

## Success Indicators
When deployment works correctly, you should see:
```
🚀 Starting NestJS application...
✅ NestJS application created successfully
🌐 Attempting to start server on port 10000...
🎉 Backend server successfully running on port 10000
📋 API endpoints available at /api/
```
