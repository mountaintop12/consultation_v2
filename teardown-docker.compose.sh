#!/bin/bash

usage() {
  echo "Usage: $0 [--production | --production-with-db | --local]"
  echo ""
  echo "  --production     Tear down production services"
  echo "  --production-with-db  Tear down production services with database"
  echo "  --local          Tear down local development services"
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
    COMPOSE_FILES="-f docker-compose.production.yml -f docker-compose.local.yml"
    MODE="local"
    ;;
  --local-with-db)
    COMPOSE_FILES="-f docker-compose.production.yml -f docker-compose.production.db.yml -f docker-compose.local.yml"
    MODE="local with DB"
    ;;
  *)
    usage
    ;;
esac

echo -e "\nTearing down Docker Compose environment ($MODE) ...\n"

docker compose \
  $COMPOSE_FILES \
  --env-file .env.docker.compose \
  down \
  --volumes \
  --remove-orphans
