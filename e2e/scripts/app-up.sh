#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/../.."

BUILD_ID="${BUILD_NUMBER:-local}"
export E2E_IMAGE="${E2E_IMAGE:-gripello:e2e-${BUILD_ID}}"
export COMPOSE_PROJECT_NAME="gripello-e2e-${BUILD_ID}"

if [[ "$(docker images -q "$E2E_IMAGE" 2>/dev/null)" == "" ]]; then
    echo "[e2e] building $E2E_IMAGE ..."
    docker buildx build --platform linux/amd64 --load -t "$E2E_IMAGE" .
fi

docker volume inspect gripello-e2e-yarn-cache >/dev/null 2>&1 || docker volume create gripello-e2e-yarn-cache >/dev/null

docker compose -p "$COMPOSE_PROJECT_NAME" -f e2e/docker-compose.e2e.yml up \
    --abort-on-container-exit --exit-code-from e2e
