# syntax=docker/dockerfile:1.7
# --------------> Build pocketbase (Go)
FROM golang:1.27.1-trixie@sha256:433790e515d27dc6003e847e644cc0af956985cf315c1c58a3b73ee2dd305183 AS pb-build
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
FROM node:26.8.2-trixie@sha256:fb192b8ad31841aadc4bb79c44ae0f59d193a798ffbc9fdce37ba6ecb20c2236 AS ui-deps
WORKDIR /app

# Toolchain for native deps (sharp, parcel/watcher, esbuild)
RUN apt-get update && apt-get install -y --no-install-recommends \
      git python3 make g++ pkg-config \
    && rm -rf /var/lib/apt/lists/*

# Copy only what Yarn needs for dependency resolution
COPY .yarnrc.yml package.json nuxt.config.ts ./
# IMPORTANT: commit yarn.lock to the repo and copy it in
COPY yarn.lock ./

# add the bits Nuxt i18n expects during install
COPY i18n ./i18n

# Pin Yarn and install with cache mounts
RUN npm install -g corepack --force
RUN corepack enable && corepack prepare yarn --activate
RUN --mount=type=cache,target=/usr/local/share/.cache/yarn \
    --mount=type=cache,target=/root/.cache \
    yarn install --immutable --inline-builds \
    || (cat /tmp/xfs-*/build.log || true; exit 1)

FROM node:26.8.2-trixie@sha256:fb192b8ad31841aadc4bb79c44ae0f59d193a798ffbc9fdce37ba6ecb20c2236 AS ui-build
WORKDIR /app
ENV NODE_ENV=production NITRO_PRESET=node-server
ARG APP_VERSION
ENV APP_VERSION=${APP_VERSION}
RUN npm install -g corepack --force
RUN corepack enable && corepack prepare yarn --activate
COPY --from=ui-deps /app/ ./
COPY app ./app
COPY server ./server
COPY public ./public
COPY i18n ./i18n
RUN --mount=type=cache,target=/root/.cache yarn build \
    || (cat /tmp/xfs-*/build.log || true; exit 1)

# --------------> Runtime (final stage)
FROM node:26.8.2-trixie-slim@sha256:f7bb8247fdb16250dbec7fd0e24f091c6f5f0a29d256f3aef5816a7a369166b2
# Install nginx (cacheable layer)
RUN apt-get update && apt-get install -y --no-install-recommends nginx ca-certificates curl openssl \
 && rm -rf /var/lib/apt/lists/*

WORKDIR /app

ARG APP_VERSION
ENV APP_VERSION=${APP_VERSION}

# Copy artifacts only
COPY --from=pb-build /out/pocketbase /pb/pocketbase
COPY ./pocketbase/pb_migrations /pb/pb_migrations
COPY ./pocketbase/pb_hooks /pb/pb_hooks
COPY --from=ui-build /app/.output /app/ui

# Entrypoint + nginx config
COPY .docker/docker-entrypoint.sh /app/entrypoint.sh
COPY .docker/nginx.conf /etc/nginx/nginx.conf
RUN chmod +x /app/entrypoint.sh

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -fs http://localhost:8080/api/health \
   && curl -fs http://localhost:3000/ \
   && curl -fsk https://localhost/ || exit 1

EXPOSE 80 443
ENTRYPOINT ["/app/entrypoint.sh"]
