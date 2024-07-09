# --------------> The build image
FROM node:22.3.0-bookworm AS ui-build

WORKDIR /app

COPY package.json .yarnrc.yml ./

RUN corepack enable  && yarn set version berry && yarn install

COPY src ./src

RUN yarn build

# --------------> The final stage
FROM node:22.3.0-bookworm-slim
WORKDIR /app

# Copy the build output and other necessary files from the ui build stage
COPY pocketbase /app/pocketbase
COPY --from=ui-build /app/.output /app/ui
COPY docker-entrypoint.sh /app/entrypoint.sh

# Make the entrypoint script executable
RUN chmod +x /app/entrypoint.sh

RUN npm install -g concurrently

# Set the entrypoint
ENTRYPOINT ["/app/entrypoint.sh"]

EXPOSE 8080 8081

CMD ["concurrently", "node ui/server/index.mjs", "/app/pocketbase/pocketbase serve --http=0.0.0.0:8080"]