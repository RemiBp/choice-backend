#!/bin/sh
set -e
echo "Running database migrations..."
node node_modules/.bin/typeorm migration:run -d dist/data-source.js
echo "Migrations complete. Starting server..."
exec node dist/index.js
