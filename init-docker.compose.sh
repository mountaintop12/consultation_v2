#!/bin/bash

usage() {
  echo "Usage: $0 [--production | --production-with-db | --local]"
  echo ""
  echo "  --production     Run production services only"
  echo "  --production-with-db  Run production services with database"
  echo "  --local          Run local development services"
  exit 1
}

if [ $# -ne 1 ]; then
  usage
fi

case "$1" in
  --production)
    COMPOSE_FILES="-f docker-compose.production.yml"
    MODE="production"
    ;;
  --production-with-db)
    COMPOSE_FILES="-f docker-compose.production.yml -f docker-compose.production.db.yml"
    MODE="production with DB"
    ;;
  --local)
    COMPOSE_FILES="-f docker-compose.local.yml"
    MODE="local"
    ;;
  *)
    usage
    ;;
esac

echo -e "\nInitializing Docker Compose environment ($MODE) ...\n"

docker -v
docker compose version

echo -e "\nBuilding and starting Docker Compose services ($MODE) ...\n"

docker compose \
  $COMPOSE_FILES \
  --env-file .env.docker.compose \
  up \
  --build \
  --force-recreate \
  -d
