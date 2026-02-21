#!/usr/bin/env bash

# https://docs.radixdlt.com/docs/productionize-your-code#publish-a-package-built-through-the-deterministic-builder

echo "Pulling the latest builder image..."

# Pull the latest builder image
DOCKER_DEFAULT_PLATFORM=linux/amd64 \
  docker pull \
  radixdlt/scrypto-builder:v1.3.1
#

echo "Building Scrypto code using the builder image..."

# Build the Scrypto code using the builder image
DOCKER_DEFAULT_PLATFORM=linux/amd64 \
  docker run \
  -v ./:/src \
  radixdlt/scrypto-builder:v1.3.1 \
#