# Use official Node.js image
FROM node:18-alpine

# Set working directory
WORKDIR /app

ARG PORT

#ENV PORT = $PORT
ENV NODE_OPTIONS=--dns-result-order=ipv4first

# Copy package.json and install dependencies
COPY package.json ./
RUN npm install
#RUN npm ci --prefer-offline

# Copy the rest of the app
COPY . .

# Expose the port
#EXPOSE 4001
EXPOSE 8080

# Start the service
CMD ["npm", "start"]
