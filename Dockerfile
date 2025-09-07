# Use official Node.js 18 image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies (all are now in dependencies)
RUN npm install --production=false

# Copy the rest of the source code
COPY . .

# Build TypeScript and generated code
RUN npm run build

# Expose port if your app listens (adjust if needed)
EXPOSE 6500

# Run the app
CMD ["node", "dist/index.js"]
