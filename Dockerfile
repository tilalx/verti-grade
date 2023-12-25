# Step 1: Build frontend and move it to backend
FROM node:20 AS builder

WORKDIR /app

# Copy frontend and backend code
COPY frontend /app/frontend
COPY backend /app/backend

# Build frontend
WORKDIR /app/frontend
RUN yarn set version berry && yarn
RUN yarn install
RUN yarn build

# Move frontend build to backend
WORKDIR /app/backend
RUN mkdir -p /app/backend/frontend
RUN mv /app/frontend/dist /app/backend

# Step 2: Create final image with only necessary files
FROM node:20

WORKDIR /app

# Copy backend code and frontend build
COPY --from=builder /app/backend /app/backend

# Remove unnecessary files
WORKDIR /app/backend
RUN rm -rf /app/backend/frontend/node_modules
RUN rm -rf /app/backend/frontend/src

# Install dependencies and start backend
RUN yarn set version berry && yarn
RUN yarn install
CMD ["yarn", "start"]
