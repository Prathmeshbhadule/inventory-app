# Production Multi-Stage Dockerfile for Node.js + Express App
FROM node:22-alpine AS base

WORKDIR /app

# Copy package descriptors
COPY package*.json ./

# Install dependencies (production only for final image)
RUN npm ci --only=production

# Copy application source code
COPY . .

# Expose server port
EXPOSE 5000

# Set production environment variables
ENV NODE_ENV=production
ENV PORT=5000

# Start server
CMD ["node", "server.js"]
