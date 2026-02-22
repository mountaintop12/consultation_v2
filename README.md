# Consultation & Vote Collector

A governance dApp for Radix DLT. The on-chain Scrypto blueprints manage temperature checks, proposals, and voting. The web app displays votes and counts results off-chain.

## On-Chain Setup

Before running the web app, you need a deployed Governance component on the Radix ledger. See [`scrypto/README.md`](scrypto/README.md) for the full guide — building the blueprints, deploying the package, creating an owner badge, instantiating the component, and creating admin badges.

After deployment, update the governance addresses in `packages/shared/src/governance/config.ts` — the `TODO_*` placeholders for `packageAddress`, `componentAddress`, and `adminBadgeAddress` must be replaced with the addresses from your deployment (see [step 5 in the Scrypto README](scrypto/README.md#5-configure-the-web-app)).

## Prerequisites

- **Node 22+** (see `engines` in root `package.json`)
- **pnpm** (corepack-managed — `corepack enable` if not already active)
- **AWS credentials** (SST path only) — SST uses the standard credential chain (`AWS_PROFILE`, env vars, etc.). See [SST IAM credentials docs](https://sst.dev/docs/iam-credentials). Not needed for Docker deployment.
- **Docker** (recommended) or a PostgreSQL instance

## Setup

```sh
pnpm install
docker compose up -d   # starts Postgres 17 on :5432
pnpm db:migrate        # requires DATABASE_URL in env
```

| Variable                | Description                                               | Default       |
| ----------------------- | --------------------------------------------------------- | ------------- |
| `DATABASE_URL`          | PostgreSQL connection string                              | —             |
| `NETWORK_ID`            | Radix network (`1` = mainnet, `2` = stokenet)             | `2`           |
| `POLL_TIMEOUT_DURATION` | Poll Lambda timeout (Effect duration, e.g. `120 seconds`) | `120 seconds` |
| `SERVER_PORT`           | HTTP server listen port (Docker/HTTP mode only)           | `4000`        |
| `ENV`                   | Environment name (`production`, `development`)            | —             |
| `LEDGER_STATE_VERSION`  | Override ledger cursor position (see below)               | —             |

### Ledger cursor override

Set `LEDGER_STATE_VERSION` to rewind (or fast-forward) the poll cursor to a specific state version. The override is **idempotent** — it won't re-apply if the value hasn't changed, so it's safe to leave set permanently.

How it works: the last applied override value is stored in the DB. On startup, if the env var matches that stored value the override is skipped. If it differs, the cursor is moved and the new value is remembered.

| Scenario                                          | What happens                                   |
| ------------------------------------------------- | ---------------------------------------------- |
| Set `LEDGER_STATE_VERSION=500` for the first time | Cursor moves to 500                            |
| Lambda restarts, env var still `500`              | Already applied — nothing changes              |
| Change env var to `800`                           | Cursor moves to 800                            |
| Remove the env var entirely                       | Override is inactive, cursor advances normally |

## Running locally

```sh
pnpm dev   # starts both apps via Turbo
```

Or run each app individually:

### Vote Collector

```sh
pnpm -F vote-collector dev       # → Hono HTTP server on :4000 (default)
pnpm -F vote-collector sst:dev   # → SST live Lambda proxy (requires AWS credentials)
```

The default `dev` command starts a self-contained Node.js HTTP server (Hono + Effect) with an embedded poll scheduler — no AWS account needed.

The `sst:dev` command deploys **real AWS infrastructure** (API Gateway, Lambda, Cron) and routes Lambda invocations back to your local machine via the SST Live Lambda proxy. On first run, SST prints the API Gateway URL (stable per stage). Copy it — you'll need it for the consultation app.

### Consultation dApp

```sh
pnpm -F consultation-dapp dev   # → Vite on :3000
```

Set `VITE_VOTE_COLLECTOR_URL` to the API Gateway URL printed by SST above. You can export it in your shell, add it to a `.env` file in `apps/consultation`, or use [direnv](https://direnv.net/) with an `.envrc`.

## Deploying Vote Collector (SST / AWS Lambda)

### Prerequisites

- AWS credentials configured (see Prerequisites above)
- PostgreSQL database accessible from Lambda (e.g. RDS, Neon, Supabase)
- An environment file in the repo root — copy `.env.example` and fill in the values.
  The deploy script (`deploy.sh`) sources it and exports the variables to SST.

  | Environment | Env file        | SST stage    | `NETWORK_ID` | Deploy command                        |
  | ----------- | --------------- | ------------ | ------------ | ------------------------------------- |
  | Stokenet    | `.env.stokenet` | `stokenet`   | `2`          | `pnpm deploy:vote-collector:stokenet` |
  | Mainnet     | `.env.mainnet`  | `production` | `1`          | `pnpm deploy:vote-collector:mainnet`  |

  Both files require `DATABASE_URL` and `NETWORK_ID`.

> **Mainnet only**: populate the governance addresses in
> `packages/shared/src/governance/config.ts` (`GovernanceConfig.MainnetLive`) —
> `packageAddress`, `componentAddress`, and `adminBadgeAddress`
> are currently set to `TODO_*` placeholders. These come from deploying and
> instantiating a Governance component — see [`scrypto/README.md`](scrypto/README.md#deploying-to-ledger)
> for the full walkthrough.

### Deploy

```sh
pnpm deploy:vote-collector:stokenet   # sources .env.stokenet, migrates, deploys to development stage
pnpm deploy:vote-collector:mainnet    # sources .env.mainnet, migrates, deploys to production stage
```

### What gets deployed

| Resource | Type                   | Details                                            |
| -------- | ---------------------- | -------------------------------------------------- |
| `Poll`   | `sst.aws.Cron`         | Lambda on a 1-minute schedule, polls Radix Gateway |
| `Api`    | `sst.aws.ApiGatewayV2` | `GET /vote-results`, `GET /account-votes`          |

Region: `eu-west-1`. Runtime: Node.js 22.

### Stage protection

The `production` stage has `protect: true` (prevents accidental deletion of resources) and `removal: retain` (resources are retained even if removed from config). All other stages use `removal: remove`.

### Teardown

```sh
# Remove stokenet
pnpm -F vote-collector sst:remove:stokenet

# Remove mainnet (resources are retained due to removal: retain)
pnpm -F vote-collector sst:remove:mainnet
```

> **Warning**: Production resources are retained after `sst remove`. You must manually delete them in the AWS console if needed.

### Verify

After deploying, the API URL is printed as an output. Verify with:

```sh
# Replace with your API URL
curl 'https://<api-url>/vote-results?type=proposal&entityId=1'
curl 'https://<api-url>/account-votes?type=proposal&entityId=1'
```

Check CloudWatch Logs for the `Poll` and `Api` Lambda functions to confirm execution.

## Deploying with Docker

As an alternative to SST/Lambda, the full stack can run as Docker containers orchestrated via Docker Compose with nginx reverse proxy and automatic TLS via Let's Encrypt.

### Prerequisites

- Docker and Docker Compose
- DNS A records for two subdomains pointing to your server (e.g. `app.example.com`, `api.example.com`)
- If using Cloudflare: set SSL/TLS mode to **Full (Strict)**

### Services

| Service          | Description                                                       |
| ---------------- | ----------------------------------------------------------------- |
| `nginx`          | Reverse proxy with TLS termination (ports 80 + 443)               |
| `certbot`        | Automatic certificate renewal (checks every 12h)                  |
| `consultation`   | TanStack Start + React consultation dApp (internal port 3000)     |
| `vote-collector` | Hono HTTP server + embedded poll scheduler (internal port 3001)   |
| `postgres`       | PostgreSQL 17 (optional — via `docker-compose.production.db.yml`) |

### Docker Compose files

| File                               | Purpose                                                              |
| ---------------------------------- | -------------------------------------------------------------------- |
| `docker-compose.production.yml`    | Core production stack (nginx, certbot, consultation, vote-collector) |
| `docker-compose.production.db.yml` | Adds a bundled PostgreSQL 17 instance (overlay)                      |
| `docker-compose.local.yml`         | Local testing overrides: HTTP-only, disables certbot (overlay)       |

### Environment files

Docker Compose deployment uses **two** env files:

| File                  | Template                      | Used by                             | Purpose                                                                      |
| --------------------- | ----------------------------- | ----------------------------------- | ---------------------------------------------------------------------------- |
| `.env.docker.compose` | `.env.docker.compose.example` | `docker compose --env-file`         | Variable substitution in compose files (domains, image tags, DB credentials) |
| `.env`                | `.env.example`                | consultation container (`env_file`) | Consultation dApp runtime vars (Nitro, Vite SSR fallbacks)                   |

**`.env.docker.compose`** variables:

| Variable              | Description                                        | Default                                    |
| --------------------- | -------------------------------------------------- | ------------------------------------------ |
| `DOCKER_IMAGE_SERVER` | Vote collector Docker image                        | `mountaintop12/consultation:server-latest` |
| `DOCKER_IMAGE_CLIENT` | Consultation dApp Docker image                     | `mountaintop12/consultation:client-latest` |
| `DATABASE_URL`        | PostgreSQL connection string                       | — (required)                               |
| `NETWORK_ID`          | Radix network (`1` = mainnet, `2` = stokenet)      | —                                          |
| `APP_DOMAIN`          | Consultation dApp domain (e.g. `app.example.com`)  | — (required)                               |
| `API_DOMAIN`          | Vote collector API domain (e.g. `api.example.com`) | — (required)                               |
| `CERTBOT_EMAIL`       | Email for Let's Encrypt notifications              | — (required)                               |
| `CERTBOT_STAGING`     | Set to `1` for staging certs (testing)             | `0`                                        |
| `POSTGRES_USER`       | PostgreSQL user (DB overlay only)                  | `postgres`                                 |
| `POSTGRES_PASSWORD`   | PostgreSQL password (DB overlay only)              | `postgres`                                 |
| `POSTGRES_DB`         | PostgreSQL database name (DB overlay only)         | `consultation`                             |
| `POSTGRES_PORT`       | PostgreSQL port (DB overlay only)                  | `5432`                                     |

**`.env`** variables:

| Variable                              | Description                          |
| ------------------------------------- | ------------------------------------ |
| `VITE_ENV`                            | Environment name (e.g. `production`) |
| `VITE_PUBLIC_DAPP_DEFINITION_ADDRESS` | Radix dApp definition address        |
| `VITE_PUBLIC_NETWORK_ID`              | Radix network ID                     |
| `VITE_VOTE_COLLECTOR_URL`             | Vote collector API base URL          |
| `NITRO_HOST`                          | Nitro server bind host (`0.0.0.0`)   |
| `NITRO_PORT`                          | Nitro server port (`3000`)           |

### Runtime configuration

The consultation container supports runtime configuration via `config.production.js`, which is volume-mounted into the container at `/app/.output/public/config.js`. This allows overriding Vite build-time values without rebuilding the image:

```js
window.__RUNTIME_CONFIG__ = {
  ENV: "production",
  DAPP_DEFINITION_ADDRESS: "account_rdx12x...",
  NETWORK_ID: "2",
  VOTE_COLLECTOR_URL: "https://api.example.com",
};
```

Edit `config.production.js` in the repo root to set production values.

### Init script

The `init-docker.compose.sh` script provides a convenient way to start Docker Compose in different modes:

```sh
bash init-docker.compose.sh --production      # production services only (external DB)
bash init-docker.compose.sh --production-db   # production services + bundled PostgreSQL
bash init-docker.compose.sh --local           # local development services
```

The script uses `.env.docker.compose` as the env file and runs `docker compose up --build --force-recreate -d`.

### First-time setup (production with TLS)

```sh
# 1. Create env files
cp .env.example .env
cp .env.docker.compose.example .env.docker.compose
# Edit both files with your values

# 2. Test with staging certs first (avoids Let's Encrypt rate limits)
CERTBOT_STAGING=1 bash init-letsencrypt.sh

# 3. Once verified, delete certbot/conf and re-run for production certs
rm -rf certbot/conf
bash init-letsencrypt.sh

# 4. Start all services
bash init-docker.compose.sh --production
# or
bash init-docker.compose.sh --production-with-db
```

### Certificate renewal

Certbot automatically checks for renewal every 12 hours. However, nginx needs a reload to pick up new certs. Add a host cron job:

```sh
# Reload nginx every 12 hours to pick up renewed certificates
0 */12 * * * docker compose -f docker-compose.production.yml exec nginx nginx -s reload
```

> **Alternative**: For zero-renewal setups behind Cloudflare, consider using a [Cloudflare Origin CA certificate](https://developers.cloudflare.com/ssl/origin-configuration/origin-ca/) (15-year validity) instead of Let's Encrypt.

### Building Docker images

The `docker-build.sh` script builds multi-stage Docker images with automatic tagging:

```sh
./docker-build.sh client          # build consultation dApp image
./docker-build.sh server          # build vote collector image
./docker-build.sh all             # build both
./docker-build.sh all --push      # build and push to Docker Hub
```

Each build produces three tags: `<name>-<timestamp>`, `<name>-sha-<git-sha>`, and `<name>-latest`. Set `IMAGE_PREFIX` to override the image name (default: `consultation`).

A GitHub Actions workflow (`.github/workflows/manual.docker.publish.yml`) provides manual-trigger Docker builds that push to Docker Hub.

### Verify

```sh
curl "https://$APP_DOMAIN"
curl "https://$API_DOMAIN/vote-results?type=proposal&entityId=1"
```

### Local testing

To test the nginx routing, headers, and rate limiting locally without TLS or real DNS:

1. Add local DNS entries to `/etc/hosts`:

   ```
   127.0.0.1 app.local api.local
   ```

2. Set domains in `.env.docker.compose`:

   ```
   APP_DOMAIN=app.local
   API_DOMAIN=api.local
   ```

3. Start with the local override (HTTP-only, no certbot):

   ```sh
   docker compose -f docker-compose.production.yml -f docker-compose.local.yml --env-file .env.docker.compose up --build
   ```

4. Verify:

   ```sh
   curl http://app.local                                              # consultation HTML
   curl http://api.local/vote-results?type=proposal&entityId=1        # API response
   ```

## Deploying Consultation (standalone)

The consultation app is a [TanStack Start](https://tanstack.com/start) app that builds to a [Nitro](https://nitro.build) server output, deployable to any Node.js host, Vercel, Netlify, Cloudflare, and more.

### Build

```sh
pnpm -F consultation-dapp build
```

This produces a `.output/` directory containing the standalone server.

The following env vars are **baked at build time** (Vite static replacement) and must be set before building:

| Variable                              | Description                          |
| ------------------------------------- | ------------------------------------ |
| `VITE_ENV`                            | Environment name (e.g. `production`) |
| `VITE_VOTE_COLLECTOR_URL`             | Vote collector API base URL          |
| `VITE_PUBLIC_DAPP_DEFINITION_ADDRESS` | Radix dApp definition address        |
| `VITE_PUBLIC_NETWORK_ID`              | Radix network ID                     |

### Run

```sh
NITRO_HOST=0.0.0.0 NITRO_PORT=3000 node .output/server/index.mjs
```

### Platform presets

For platform-specific deployments (Vercel, Netlify, Cloudflare, etc.), see the [TanStack Start hosting guide](https://tanstack.com/start/latest/docs/framework/react/guide/hosting).

For Docker-based deployment, see [Deploying with Docker](#deploying-with-docker) above.

## Useful commands

| Command            | What it does                           |
| ------------------ | -------------------------------------- |
| `pnpm db:studio`   | Open Drizzle Studio (database browser) |
| `pnpm db:generate` | Generate a new Drizzle migration       |
| `pnpm check-types` | Type-check all packages                |
| `pnpm format`      | Format with Biome                      |
| `pnpm test`        | Run tests across the monorepo          |

## Project structure

```
scrypto/              Radix Scrypto blueprints (Governance + VoteDelegation)
apps/
  vote-collector/     Vote collector — SST serverless (Lambda + Cron) or HTTP server (Hono + Docker)
  consultation/       TanStack Start + React consultation dApp (SSR via Nitro)
packages/
  database/           Drizzle ORM schema & migrations
  shared/             Shared types and utilities (includes governance config)
dockerfiles/          Multi-stage Dockerfiles (client + server)
nginx/                Nginx reverse proxy configuration (production + local)
certbot/              Let's Encrypt certificate storage
docker/               Docker utilities
```

See [`scrypto/README.md`](scrypto/README.md) for blueprint documentation and deployment guide.
See [`apps/vote-collector/README.md`](apps/vote-collector/README.md) for architecture details, SST configuration, and custom domains.
