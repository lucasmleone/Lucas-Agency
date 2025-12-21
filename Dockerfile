# Production Stage - Uses pre-built dist from repository
FROM node:18-alpine
WORKDIR /app

# Install production dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy pre-built frontend assets from repo (not rebuilding)
COPY dist ./dist
COPY server ./server
COPY scripts ./scripts

# Environment and Start
ENV NODE_ENV=production
EXPOSE 80
CMD ["node", "--max-old-space-size=256", "server/index.js"]
