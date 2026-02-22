#!/usr/bin/env bash
set -euo pipefail

TARGET="${1:?Usage: ./docker-build.sh <all|client|server> [--push]}"
PUSH=false
[[ "${2:-}" == "--push" ]] && PUSH=true

IMAGE_PREFIX="${IMAGE_PREFIX:-consultation}"
TIMESTAMP="$(date -u +%Y%m%d-%H%M%S)"
GIT_SHA="$(git rev-parse --short HEAD 2>/dev/null || echo "unknown")"

build_image() {
  local name="$1"
  local dockerfile="$2"
  shift 2
  local image="${IMAGE_PREFIX}:${name}"

  echo "\nBuilding ${image}...\n"
  docker build \
    -f "$dockerfile" \
    --platform linux/amd64 \
    -t "${image}-${TIMESTAMP}" \
    -t "${image}-sha-${GIT_SHA}" \
    -t "${image}-latest" \
    "$@" \
    .

  if [[ "$PUSH" == true ]]; then
    echo "\nPushing ${image}...\n"
    docker push "${image}-${TIMESTAMP}"
    docker push "${image}-sha-${GIT_SHA}"
    docker push "${image}-latest"
  fi

  echo "Done: ${image}-${TIMESTAMP}"
}

case "$TARGET" in
  client)
    build_image client dockerfiles/client.Dockerfile
    ;;
  server)
    build_image server dockerfiles/server.Dockerfile
    ;;
  all)
    build_image client dockerfiles/client.Dockerfile
    build_image server dockerfiles/server.Dockerfile
    ;;
  *)
    echo "Unknown target: $TARGET (expected all, client, or server)" >&2
    exit 1
    ;;
esac
