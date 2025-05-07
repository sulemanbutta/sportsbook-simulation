# Use official Node.js image
FROM node:18-alpine

# Set working directory
WORKDIR /app

ARG PORT

ENV PORT = ${PORT}

# Copy package.json and install dependencies
COPY package.json ./
RUN npm install


# no-op bump to force cache invalidation:
LABEL build-ts="2025-05-06T23:15:00Z"
# Copy the rest of the app
COPY . .

# Expose the port
EXPOSE 4000

# Start the service
CMD ["npm", "start"]
