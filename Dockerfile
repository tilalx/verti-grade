# --------------> The build stage for the backend
FROM node:21 as backend-build
WORKDIR /app/backend
COPY backend/package*.json ./
RUN yarn install
COPY backend/ ./

# --------------> The build stage for the frontend
FROM node:21 as frontend-build
WORKDIR /app/frontend
COPY frontend/ ./
RUN yarn install && yarn build

# --------------> The final stage
FROM node:21
# Set working directory
WORKDIR /app

# Copy the build output and other necessary files from the backend build stage
COPY --from=backend-build /app/backend /app/backend

# Copy the build output and other necessary files from the frontend build stage
COPY --from=frontend-build /app/frontend/.output /app/frontend/.output

# Install production dependencies for the frontend server
WORKDIR /app/frontend/server
RUN yarn install --only=production

# Expose the ports the app runs on
EXPOSE 3000

# Set the command to start both servers
# Using a tool like supervisord or running both commands in parallel
CMD ["sh", "-c", "node /app/backend/server.js  & node /app/frontend/.output/server/index.mjs"]