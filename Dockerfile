# --------------> Build nuxt app
FROM node:24.5.0-bookworm AS ui-build

WORKDIR /nuxt

COPY package.json .yarnrc.yml nuxt.config.ts ./

RUN corepack enable && yarn set version berry && yarn install

COPY app ./app
COPY i18n ./i18n

COPY server ./server

COPY public ./public

RUN yarn build

# --------------> Build pocketbase
FROM golang:1.24.6-bookworm AS pb-build

ENV CGO_ENABLED=0
ENV GOPROXY=direct

WORKDIR /pocketbase

COPY ./pocketbase/main.go ./pocketbase/go.mod ./pocketbase/go.sum /pocketbase/

RUN go mod download

RUN go build

COPY ./pocketbase/pb_hooks ./pb_hooks

COPY ./pocketbase/pb_migrations ./pb_migrations

# --------------> The final stage
FROM node:24.5.0-bookworm-slim

# Install Nginx
RUN apt-get update && apt-get install -y nginx ca-certificates

WORKDIR /app

# Copy the build output and other necessary files from the ui build stage
COPY --from=pb-build /pocketbase /pb
COPY --from=ui-build /nuxt/.output /app/ui
COPY .docker/docker-entrypoint.sh /app/entrypoint.sh
COPY .docker/nginx.conf /etc/nginx/nginx.conf

# Make the entrypoint script executable
RUN chmod +x /app/entrypoint.sh

# Install concurrently for running multiple commands
RUN npm install -g concurrently

# Set the entrypoint
ENTRYPOINT ["/app/entrypoint.sh"]

EXPOSE 80 8080 3000