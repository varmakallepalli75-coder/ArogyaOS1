# MedCareAxis — Deployment Guide

## Domain Architecture

| URL | Purpose |
|-----|---------|
| `https://medcareaxis.com` | Hospital Staff Dashboard |
| `https://www.medcareaxis.com` | → redirects to medcareaxis.com |
| `https://portal.medcareaxis.com` | Patient Portal |
| `https://medcareaxis.net` | → redirects to medcareaxis.com |

---

## Step 1 — DNS Configuration

Log in to your domain registrar (GoDaddy / Namecheap / Hostinger / etc.) and add these DNS records.

You need a VPS/server IP first — get one from DigitalOcean, AWS, or Hetzner.

### medcareaxis.com DNS Records

| Type | Name | Value | TTL |
|------|------|-------|-----|
| A | `@` | `YOUR_SERVER_IP` | 300 |
| A | `www` | `YOUR_SERVER_IP` | 300 |
| A | `portal` | `YOUR_SERVER_IP` | 300 |

### medcareaxis.net DNS Records

| Type | Name | Value | TTL |
|------|------|-------|-----|
| A | `@` | `YOUR_SERVER_IP` | 300 |
| A | `www` | `YOUR_SERVER_IP` | 300 |

> ⏳ DNS propagation takes 5–30 minutes. Verify with: `nslookup medcareaxis.com`

---

## Step 2 — Get a VPS Server

Recommended: **DigitalOcean Droplet** or **Hetzner Cloud CX21**

Minimum specs:
- **RAM:** 2 GB (4 GB recommended)
- **CPU:** 2 vCPU
- **Disk:** 40 GB SSD
- **OS:** Ubuntu 22.04 LTS

---

## Step 3 — Server Setup (run on your VPS)

```bash
# SSH into your server
ssh root@YOUR_SERVER_IP

# Clone the repo
git clone https://github.com/varmakallepalli75-coder/ArogyaOS1.git /opt/medcareaxis
cd /opt/medcareaxis

# Make deploy script executable
chmod +x scripts/deploy.sh

# Run the deploy script
./scripts/deploy.sh
```

The script will:
1. Install Docker and Node.js
2. Build both React frontends
3. Prompt you to fill in `.env`
4. Get SSL certificates from Let's Encrypt (free)
5. Start all services with docker compose

---

## Step 4 — Fill in .env

After the script creates `.env`, edit it:

```bash
nano /opt/medcareaxis/.env
```

Critical values to set:
```env
POSTGRES_PASSWORD=YourStrongPassword123!
ConnectionStrings__DefaultConnection=Host=db;Port=5432;Database=medcareaxis;Username=medcareaxis_user;Password=YourStrongPassword123!
JwtSettings__SecretKey=A64CharRandomStringHereUseOpenSSLRandBase64Output
SuperAdmin__Password=YourAdminPassword!
Email__Username=your@gmail.com
Email__Password=your_gmail_app_password
```

Generate a strong JWT secret key:
```bash
openssl rand -base64 64
```

---

## Step 5 — Run Again After .env

```bash
cd /opt/medcareaxis
./scripts/deploy.sh
```

---

## Useful Commands

```bash
# View all running containers
docker compose ps

# View live logs
docker compose logs -f

# View only API logs
docker compose logs -f api

# Restart after code change
git pull && docker compose up -d --build api

# Rebuild frontends after UI change
cd frontend/hospital && npm run build && cd ../..
cd frontend/patient-portal && npm run build && cd ../..
docker compose restart nginx

# Stop everything
docker compose down

# Database backup
docker compose exec db pg_dump -U medcareaxis_user medcareaxis > backup_$(date +%Y%m%d).sql

# Apply database migrations (first time or after adding migrations)
docker compose exec api dotnet MedCareAxis.API.dll --migrate
```

---

## SSL Certificate Renewal

Certificates auto-renew every 12 hours via the certbot container. To force renew:

```bash
docker compose run --rm certbot certonly --webroot \
  -w /var/www/certbot \
  -d medcareaxis.com -d www.medcareaxis.com \
  -d portal.medcareaxis.com \
  -d medcareaxis.net -d www.medcareaxis.net \
  --email admin@medcareaxis.com --agree-tos --non-interactive
docker compose restart nginx
```

---

## Firewall Setup

```bash
# Allow only HTTP, HTTPS, and SSH
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw enable
```

---

## Architecture Overview

```
Internet
   │
   ├── medcareaxis.com ──────────────────────────────────────────┐
   ├── www.medcareaxis.com → redirect to medcareaxis.com         │
   ├── medcareaxis.net → redirect to medcareaxis.com             │
   └── portal.medcareaxis.com ──────────────────────────────┐   │
                                                             │   │
                                              ┌──────────────▼───▼──────┐
                                              │      Nginx (80/443)       │
                                              │  - SSL termination        │
                                              │  - Serves /var/www/hospital│
                                              │  - Serves /var/www/portal │
                                              │  - Proxies /api/ → API    │
                                              └──────┬────────────────────┘
                                                     │ /api/*
                                              ┌──────▼──────────┐
                                              │   .NET API       │
                                              │   Port 5200      │
                                              └──────┬───────────┘
                                                     │
                                              ┌──────▼───────────┐
                                              │   PostgreSQL      │
                                              │   Port 5432       │
                                              └──────────────────┘
```

---

## After Deployment — First Steps

1. Visit `https://medcareaxis.com` → you should see the hospital login page
2. Login with superadmin: `admin@medcareaxis.com` / (password from .env)
3. Register your first hospital from SuperAdmin panel
4. Staff can log in to `https://medcareaxis.com`
5. Patients can use `https://portal.medcareaxis.com`
