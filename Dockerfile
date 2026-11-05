
# Use Node.js 24
FROM node:24

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy application files
COPY . .

# Create uploads directory
RUN mkdir -p public/uploads

# Application port
EXPOSE 3000

# Start application
CMD ["npm", "start"]
