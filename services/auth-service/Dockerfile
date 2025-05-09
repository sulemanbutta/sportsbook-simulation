# Use official Node.js image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Build arguments for version tracking
ARG BUILD_TIMESTAMP
ARG COMMIT_SHA

# Set environment variables for version tracking
ENV BUILD_TIMESTAMP=${BUILD_TIMESTAMP}
ENV COMMIT_SHA=${COMMIT_SHA}

#ARG PORT

#ENV PORT = ${PORT}

# Copy package.json and install dependencies
#COPY package.json ./
#RUN npm install
COPY package*.json ./
RUN npm install
# Install dependencies
#RUN npm ci --only=production

# Copy the rest of the app
COPY . .

RUN echo "Building auth-service version: ${BUILD_TIMESTAMP}" && \
    echo "Commit: ${COMMIT_SHA}" && \
    echo "Files in container:" && \
    find . -type f | grep -v "node_modules" | sort

# Expose the port
# EXPOSE=4000
EXPOSE 8080

# Start the service
CMD ["npm", "start"]
