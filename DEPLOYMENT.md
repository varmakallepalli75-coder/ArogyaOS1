# MedCareAxis — Deployment Guide

> **Current hosting: bare-metal AWS EC2** (`34.201.2.181`), no Docker. The .NET API
> runs directly under **systemd**, **nginx** is installed and configured manually on
> the box (not in a container), and SSL is handled by **Certbot** running directly on
> the host. Deploys happen automatically via GitHub Actions
> (`.github/workflows/deploy.yml`) on every push to `main` (production),
> `staging`, or `dev`.
>
> `docker-compose.yml`, `Dockerfile`, and `scripts/deploy.sh` in this repo describe an
> **earlier, abandoned** Docker/VPS-based deployment plan. They are kept only in case
> Docker is useful for local development — they are not used for hosting and following
> them will not match what's actually running in production.

## Domain Architecture

| URL | Purpose |
|-----|---------|
| `https://medcareaxis.com` | Hospital Staff Dashboard |
| `https://www.medcareaxis.com` | → redirects to medcareaxis.com |
| `https://portal.medcareaxis.com` | Patient Portal |
| `https://medcareaxis.net` / `.in` / `.info` | → redirected to medcareaxis.com (via Cloudflare or DNS-level redirect, if configured) |

---

## Architecture Overview

```
Internet
   │
   ├── medcareaxis.com ────────────────────────────┐
   ├── www.medcareaxis.com → redirect              │
   └── portal.medcareaxis.com ─────────────────┐   │
                                                │   │
                                  ┌─────────────▼───▼──────────┐
                                  │   nginx (80/443, manual)     │
                                  │   - Certbot-issued SSL       │
                                  │   - serves /var/www/hospital │
                                  │   - serves /var/www/portal   │
                                  │   - proxies /api/ → 127.0.0.1:5200
                                  └──────────────┬────────────────┘
                                                 │
                                  ┌──────────────▼────────────────┐
                                  │  .NET API — systemd service     │
                                  │  "medcareaxis", port 5200        │
                                  │  /health → DB connectivity check │
                                  └──────────────┬────────────────┘
                                                 │
                                  ┌──────────────▼────────────────┐
                                  │  PostgreSQL — same EC2 host      │
                                  └──────────────────────────────┘
```

All three pieces (nginx, the API, Postgres) currently run on the **same single EC2
instance** — there is no separate database server or load balancer. That's a real
single-point-of-failure worth knowing about, not an oversight to "fix" casually — see
the Backups section.

---

## How deploys work

`.github/workflows/deploy.yml` SSHes into the EC2 box (via `secrets.EC2_HOST` /
`secrets.EC2_SSH_KEY`, already configured in the repo's GitHub secrets) on every push
to `main`, `staging`, or `dev`, and for the matching branch:

1. `git pull`s the latest code into `/var/www/medcareaxis`
2. Backs up the current published API build (so a bad deploy can be reverted)
3. `dotnet publish`es the API and restarts the systemd service
4. Polls `http://127.0.0.1:5200/health` for up to 30 seconds — if the app doesn't
   come back healthy, it **automatically rolls back** to the previous build and fails
   the pipeline run (so you'll see a red ❌ in GitHub Actions, not a false-positive ✅)
5. Only once the backend is confirmed healthy, builds both frontend apps
   (`frontend/hospital`, `frontend/patient-portal` — an npm workspace, installed once
   from `frontend/`) and copies each `dist/` into its nginx web root

Production paths: API published to `/var/www/medcareaxis-published`, hospital
frontend to `/var/www/hospital`, patient portal to `/var/www/portal`. Staging/dev use
the same paths with `-staging`/`-dev` suffixes.

**What this does NOT do**: change nginx config, renew SSL, or install system
packages (Node.js, .NET SDK, nginx, Certbot are all assumed already present on the
box — set up once, by hand).

## Manual server setup (one-time, per environment)

None of the following is version-controlled or automated — it was done once by hand
on the EC2 box and needs to be redone if the instance is ever rebuilt:

- Node.js and the .NET 10 SDK installed system-wide
- nginx installed and configured (see the "Architecture Overview" above for what it
  needs to do; there is no canonical live copy of this config checked into the repo —
  `nginx/nginx.conf` is a reference/starting point, written for the old Docker setup,
  now updated to proxy to `127.0.0.1:5200` instead of a Docker hostname, but the
  actual live config on the box may differ from this file)
- Certbot, with certificates already issued for all four domains
- A systemd unit per environment (`medcareaxis`, `medcareaxis-staging`,
  `medcareaxis-dev`) — see `deploy/medcareaxis.service.example` in this repo for a
  reference unit file to adapt; none currently exists in version control, which means
  a fresh EC2 instance cannot be fully reprovisioned from this repo alone
- Environment variables for the API (JWT secret, DB connection string, R2/SES/MSG91
  credentials, etc.) — wherever the systemd unit's `EnvironmentFile=` points, following
  the same `Key__SubKey` naming as `.env.example`

## Database backups

`scripts/backup/backup.sh` runs a cron-driven `pg_dump` with 30-day local retention.
**It is not currently copied off the EC2 box** — the S3/rclone off-site copy lines in
that script are commented out. Since Postgres lives on the same instance as everything
else, a lost/corrupted instance currently means lost backups too. Enabling the
off-site copy (or taking periodic EBS snapshots of the volume) is the single highest-
value thing to do here, and no restore has ever been tested — a backup that's never
been restored from is a hope, not a guarantee.

---

## After Deployment — First Steps

1. Visit `https://medcareaxis.com` → hospital login page
2. Log in with the SuperAdmin account (email/password set via `SuperAdmin__Email` /
   `SuperAdmin__Password` in the API's environment **the first time it ever started**
   against this database — changing the env var later does not change an
   already-seeded account's password)
3. Register hospitals from the SuperAdmin panel
4. Staff log in at `https://medcareaxis.com`, patients at `https://portal.medcareaxis.com`
