# Use Node.js 18 LTS base image
FROM node:18

# Set working directory
WORKDIR /usr/src/app

# Copy dependency files and install
COPY package*.json ./
RUN npm install

# Copy the rest of the app
COPY . .

# Expose the port Parse Server will run on
EXPOSE 1337

# Start Parse Server
CMD ["npm", "start"]
