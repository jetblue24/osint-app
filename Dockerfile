FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application files
COPY . .

# Build React frontend
RUN npm run build

# Expose port
EXPOSE 5000

# Start the server
CMD ["npm", "start"]
