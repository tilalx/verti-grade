#!/bin/bash
set -e

# Modify /etc/hosts
cp /etc/hosts /etc/hosts.bak
echo "127.0.0.1 pb" >> /etc/hosts.bak
echo "127.0.0.1 ui" >> /etc/hosts.bak
cat /etc/hosts.bak > /etc/hosts

# Run pocketbase migration
/pb/pocketbase migrate

# Start PocketBase
/pb/pocketbase serve --http=0.0.0.0:8080 &

# Start Nuxt.js UI
node ui/server/index.mjs &

# Start Nginx
nginx -g "daemon off;"