#!/bin/bash
set -e

# Run pocketbase migration
/app/pocketbase/pocketbase migrate

# Execute the CMD provided as arguments
exec "$@"
