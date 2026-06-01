FROM node:18-alpine

WORKDIR /app

# Copy dependency manifests
COPY package*.json ./

# Install packages
RUN npm ci --only=production

# Copy application server
COPY server.js ./

EXPOSE 3001

CMD ["node", "server.js"]