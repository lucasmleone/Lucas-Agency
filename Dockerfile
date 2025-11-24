FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Build frontend and verify
RUN npm run build && \
    ls -la dist/ && \
    echo "Build completed successfully"

# Expose port
EXPOSE 80

# Set environment
ENV NODE_ENV=production

# Start server
CMD ["node", "server/index.js"]
