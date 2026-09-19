#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/../.."

BUILD_ID="${BUILD_NUMBER:-local}"
export COMPOSE_PROJECT_NAME="vg-e2e-${BUILD_ID}"
export E2E_IMAGE="${E2E_IMAGE:-verti-grade:e2e-${BUILD_ID}}"

docker compose -p "$COMPOSE_PROJECT_NAME" -f e2e/docker-compose.e2e.yml down -v
