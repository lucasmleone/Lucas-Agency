# Dockerfile simplificado - requiere que dist/ ya esté compilado localmente
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install ONLY production dependencies
RUN npm ci --only=production

# Copy built frontend (ya compilado localmente)
COPY dist ./dist

# Copy server code
COPY server ./server

# Expose port
EXPOSE 80

# Set environment
ENV NODE_ENV=production

# Start server with memory limit for t2.micro (Free Tier)
CMD ["node", "--max-old-space-size=256", "server/index.js"]
