#!/bin/bash

echo -e "\nInitializing Docker Compose environment ...\n"

docker -v
docker compose version

echo -e "\nBuilding and starting Docker Compose services ...\n"

docker compose \
  -f docker-compose.production.yml \
  -f docker-compose.production.db.yml \
  -f docker-compose.local.yml \
  --env-file .env.docker.compose \
  up \
  --build \
  --force-recreate \
  -d