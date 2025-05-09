# Use official Node.js image
FROM node:18-alpine

# Set working directory
WORKDIR /app

#ARG PORT

#ENV PORT = ${PORT}

# Copy package.json and install dependencies
#COPY package.json ./
#RUN npm install
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy the rest of the app
COPY . .

# Expose the port
# EXPOSE=4000
EXPOSE 8080

# Start the service
CMD ["npm", "start"]
