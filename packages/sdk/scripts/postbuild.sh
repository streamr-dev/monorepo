#!/bin/bash

mkdir -p dist

SCRIPT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)

cd "${SCRIPT_DIR}/.."

# Sanitize the final package.json
tsx scripts/rewrite-package.ts

# Copy stuff
cp -f README.md LICENSE readme-header.png dist

# Copy over the migrations
mkdir -p dist/cjs/src/encryption/migrations
cp -f src/encryption/migrations/* dist/cjs/src/encryption/migrations
mkdir -p dist/esm/src/encryption/migrations
cp -f src/encryption/migrations/* dist/esm/src/encryption/migrations
