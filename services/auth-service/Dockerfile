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

# Install dependencies needed for Cloud SQL Proxy
RUN apk add --no-cache curl bash netcat-openbsd

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
# CMD ["npm", "start"]
# Install Cloud SQL Proxy
RUN curl -o cloud-sql-proxy https://dl.google.com/cloudsql/cloud_sql_proxy.linux.amd64 && \
    chmod +x cloud-sql-proxy && \
    mv cloud-sql-proxy /usr/local/bin/

# Copy startup script
COPY start.sh /start.sh
RUN chmod +x /start.sh

# Use startup script instead of npm start
CMD ["/start.sh"]
