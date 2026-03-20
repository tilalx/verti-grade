#!/bin/bash
set -e

APP_VER="${APP_VERSION:-dev}"

# Modify /etc/hosts
cp /etc/hosts /etc/hosts.bak
echo "127.0.0.1 pb" >> /etc/hosts.bak
echo "127.0.0.1 ui" >> /etc/hosts.bak
cat /etc/hosts.bak > /etc/hosts

# Generate a self-signed TLS certificate if none is present.
# Mount real certs at /etc/nginx/ssl/cert.pem and /etc/nginx/ssl/key.pem to override.
SSL_CERT=/etc/nginx/ssl/cert.pem
SSL_KEY=/etc/nginx/ssl/key.pem
if [ ! -f "$SSL_CERT" ] || [ ! -f "$SSL_KEY" ]; then
    echo "[nginx] no TLS certificate found — generating self-signed certificate..."
    mkdir -p /etc/nginx/ssl
    openssl req -x509 -nodes -days 3650 -newkey rsa:2048 \
        -keyout "$SSL_KEY" \
        -out "$SSL_CERT" \
        -subj "/CN=verti-grade/O=Verti-Grade/C=DE" \
        -addext "subjectAltName=DNS:localhost,IP:127.0.0.1" \
        2>/dev/null
    echo "[nginx] self-signed certificate generated (valid 10 years)"
fi

echo ""
echo "========================================"
echo "  Verti-Grade ${APP_VER}"
echo "  ──────────────────────────────────────"
echo "  HTTP   →  http://0.0.0.0:80   (→ 443)"
echo "  HTTPS  →  https://0.0.0.0:443"
echo "========================================"
echo ""

# Run pocketbase migrations
echo "[pocketbase] running migrations..."
/pb/pocketbase migrate

# Create/update the default superuser if credentials are provided via env.
# Set PB_SUPERUSER_EMAIL and PB_SUPERUSER_PASSWORD in your docker-compose.yml.
if [ -n "$PB_SUPERUSER_EMAIL" ] && [ -n "$PB_SUPERUSER_PASSWORD" ]; then
    echo "[pocketbase] upserting superuser ${PB_SUPERUSER_EMAIL}..."
    /pb/pocketbase superuser upsert "$PB_SUPERUSER_EMAIL" "$PB_SUPERUSER_PASSWORD"
fi

# Start PocketBase
echo "[pocketbase] starting..."
/pb/pocketbase serve --http=0.0.0.0:8080 &

# Start Nuxt.js UI
echo "[nuxt] starting..."
node ui/server/index.mjs &

# Start Nginx
echo "[nginx] starting..."
nginx -g "daemon off;"