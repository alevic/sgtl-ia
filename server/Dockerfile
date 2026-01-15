FROM node:20-alpine

WORKDIR /app

# Copy dependency files
COPY server/package*.json ./server/

# Install dependencies
RUN cd server && npm install

# Copy source code and shared types
COPY server/ ./server/
COPY types.ts ./

# Set workdir to server for running scripts
WORKDIR /app/server

EXPOSE 4000

CMD ["npm", "run", "dev"]
