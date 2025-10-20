# syntax=docker/dockerfile:1.7
# --------------> Build pocketbase (Go)
FROM golang:1.25.1-trixie AS pb-build
ARG TARGETOS
ARG TARGETARCH
ENV CGO_ENABLED=0 \
    GOOS=${TARGETOS} \
    GOARCH=${TARGETARCH}

WORKDIR /src

# Copy only go mod/sum first for better caching
COPY pocketbase/go.mod pocketbase/go.sum ./pocketbase/
WORKDIR /src/pocketbase

# BuildKit caches: module + build cache
RUN --mount=type=cache,target=/go/pkg/mod \
    --mount=type=cache,target=/root/.cache/go-build \
    go mod download

# Now copy the rest needed to build
COPY pocketbase/main.go ./
COPY pocketbase/pb_hooks ./pb_hooks
COPY pocketbase/pb_migrations ./pb_migrations

# Compile to /out; -trimpath makes cache keys stable
RUN --mount=type=cache,target=/go/pkg/mod \
    --mount=type=cache,target=/root/.cache/go-build \
    go build -trimpath -ldflags="-s -w" -o /out/pocketbase

# --------------> Build nuxt app (Node)
FROM node:25.0.0-trixie AS ui-deps
WORKDIR /app

# Toolchain for native deps (sharp, parcel/watcher, esbuild)
RUN apt-get update && apt-get install -y --no-install-recommends \
      git python3 make g++ pkg-config \
    && rm -rf /var/lib/apt/lists/*

# Copy only what Yarn needs for dependency resolution
COPY .yarn ./.yarn
COPY .yarnrc.yml package.json nuxt.config.ts ./
# IMPORTANT: commit yarn.lock to the repo and copy it in
COPY yarn.lock ./

# add the bits Nuxt i18n expects during install
COPY i18n ./i18n

# Pin Yarn and install with cache mounts
RUN corepack enable && corepack prepare yarn --activate
RUN --mount=type=cache,target=/usr/local/share/.cache/yarn \
    --mount=type=cache,target=/root/.cache \
    yarn install --immutable --inline-builds \
    || (cat /tmp/xfs-*/build.log || true; exit 1)

FROM node:25.0.0-trixie AS ui-build
WORKDIR /app
ENV NODE_ENV=production NITRO_PRESET=node-server
RUN corepack enable && corepack prepare yarn@4.3.1 --activate
COPY --from=ui-deps /app/ ./
COPY app ./app
COPY server ./server
COPY public ./public
COPY i18n ./i18n
RUN --mount=type=cache,target=/root/.cache yarn build \
    || (cat /tmp/xfs-*/build.log || true; exit 1)

# --------------> Runtime (final stage)
FROM node:25.0.0-trixie-slim
# Install nginx (cacheable layer)
RUN apt-get update && apt-get install -y --no-install-recommends nginx ca-certificates \
 && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy artifacts only
COPY --from=pb-build /out/pocketbase /pb/pocketbase
COPY --from=ui-build /app/.output /app/ui

# Entrypoint + nginx config
COPY .docker/docker-entrypoint.sh /app/entrypoint.sh
COPY .docker/nginx.conf /etc/nginx/nginx.conf
RUN chmod +x /app/entrypoint.sh

# Avoid global npm installs at runtime; use npx if needed. (concurrently usually not needed in final image)
# EXPOSE as needed
EXPOSE 80 8080 3000
ENTRYPOINT ["/app/entrypoint.sh"]