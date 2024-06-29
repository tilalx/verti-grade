FROM node:21 as frontend-build
WORKDIR /app/frontend
COPY frontend/ ./
RUN yarn install && yarn build

# --------------> The final stage
FROM node:21
# Set working directory
WORKDIR /app

# Copy the build output and other necessary files from the frontend build stage
COPY --from=frontend-build /app/frontend/.output /app/frontend/.output

EXPOSE 3000

CMD ["node", "frontend/.output/server.js"]