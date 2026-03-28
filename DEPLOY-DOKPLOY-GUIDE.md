# BuildMetry v1.0 — Production Deployment Guide
## Dokploy + Hostinger VPS (Complete Beginner Guide)

---

# TABLE OF CONTENTS

1. What You're Building
2. What You Need Before Starting
3. Prepare Your Code (Local Computer)
4. Buy and Set Up Hostinger VPS
5. Connect to Your Server via SSH
6. Install Dokploy on Your Server
7. Deploy BuildMetry with Dokploy
8. Run Database Setup
9. First Login & Configuration
10. Connect Your Domain Name
11. Set Up HTTPS (SSL Certificate)
12. Set Up Auto-Deploy from GitHub
13. Set Up Automatic Backups
14. Daily Management Commands
15. Troubleshooting Common Problems
16. Security Hardening

---

# 1. WHAT YOU'RE BUILDING

When you're done, you'll have:

```
Internet Users
      │
      ▼
Your Domain (buildmetry.com)
      │
      ▼
Hostinger VPS (your server)
      │
      ├── Dokploy (manages everything)
      │
      ├── Frontend (React app — what users see)
      │     └── Nginx (web server)
      │
      ├── Backend (Node.js API — business logic)
      │     └── Prisma (talks to database)
      │
      └── PostgreSQL (database — stores all data)
```

**Cost: ~$6-8/month total.**

---

# 2. WHAT YOU NEED BEFORE STARTING

Check off each item:

- [ ] **A computer** with a terminal (Mac Terminal, Windows PowerShell, or Linux Terminal)
- [ ] **Your BuildMetry code** in a GitHub repository (you should already have this)
- [ ] **A credit card** to purchase Hostinger VPS (~$6/month)
- [ ] **A domain name** (optional but recommended — you can add it later)
- [ ] **30-45 minutes** of uninterrupted time

**You do NOT need:**
- Docker experience (we'll install it automatically)
- Server administration experience (this guide covers everything)
- Any software installed on your computer (just a terminal and browser)

---

# 3. PREPARE YOUR CODE (LOCAL COMPUTER)

> ⚡ Do this on YOUR computer, not on the server.

## Step 3.1: Open your terminal

- **Mac**: Press `Cmd + Space`, type "Terminal", press Enter
- **Windows**: Press `Win + X`, click "Windows PowerShell"
- **Linux**: Press `Ctrl + Alt + T`

## Step 3.2: Navigate to your project folder

```bash
# Replace with YOUR actual project path
cd /path/to/your/buildmetry

# Verify you're in the right folder — you should see frontend/ and backend/
ls
```

You should see output like:
```
frontend/   backend/   package.json   ...
```

If you don't see `frontend/` and `backend/`, you're in the wrong folder.

## Step 3.3: Download and run the setup script

Place the `setup-docker.sh` file in your project root folder, then:

```bash
# Make the script executable (required on Mac/Linux)
chmod +x setup-docker.sh

# Run the script
./setup-docker.sh
```

**What this creates:**
```
your-project/
├── frontend/
│   ├── Dockerfile          ← NEW (tells Docker how to build frontend)
│   ├── nginx.conf          ← NEW (web server configuration)
│   ├── .dockerignore       ← NEW (files to skip during build)
│   ├── package.json        (your existing file)
│   └── src/App.jsx         (your existing file)
├── backend/
│   ├── Dockerfile          ← NEW (tells Docker how to build backend)
│   ├── .dockerignore       ← NEW
│   ├── package.json        (your existing file)
│   └── prisma/schema.prisma (your existing file)
├── docker-compose.yml      ← NEW (orchestrates all 3 services)
├── manage.sh               ← NEW (helper commands)
├── .env                    ← NEW (passwords — NEVER commit this!)
└── .gitignore              ← UPDATED (excludes .env)
```

## Step 3.4: Push to GitHub

```bash
# Stage all new files
git add -A

# Commit with a descriptive message
git commit -m "Add Docker deployment files for production"

# Push to GitHub (main branch)
git push origin main
```

> ⚠️ The `.env` file is in `.gitignore` so it won't be uploaded to GitHub. This is correct — passwords should never be in your repository.

---

# 4. BUY AND SET UP HOSTINGER VPS

## Step 4.1: Go to Hostinger

Open your browser and go to: **https://www.hostinger.com/vps-hosting**

## Step 4.2: Choose a plan

Select **KVM 2** or higher:

| Plan | RAM | CPU | Storage | Price | Works? |
|------|-----|-----|---------|-------|--------|
| KVM 1 | 1 GB | 1 vCPU | 20 GB | ~$4/mo | ❌ Not enough RAM |
| **KVM 2** | **2 GB** | **2 vCPU** | **40 GB** | **~$6/mo** | **✅ Recommended** |
| KVM 4 | 4 GB | 2 vCPU | 80 GB | ~$10/mo | ✅ Better performance |

> 💡 **Why KVM 2?** Dokploy itself uses ~500MB RAM. Your app uses ~300MB. You need at least 2GB total.

## Step 4.3: Choose settings during purchase

- **Operating System**: Select **Ubuntu 22.04** or **Ubuntu 24.04**
  - DO NOT select CentOS, Debian, or any other OS
- **Server Location**: Choose the location closest to your users
  - USA customers → pick a US location
- **Hostname**: Type `buildmetry` (or anything you want)

## Step 4.4: Complete purchase and get your credentials

After purchase:

1. Go to **Hostinger Dashboard** (hPanel)
2. Click **VPS** in the sidebar
3. Click your server → **Manage**
4. You'll see:
   - **IP Address**: Something like `154.12.345.678` (write this down!)
   - **Username**: `root`
   - **Password**: (click the eye icon to reveal — write this down!)

> 📝 Write down your **IP address** and **root password**. You'll need them in the next step.

---

# 5. CONNECT TO YOUR SERVER VIA SSH

SSH lets you type commands on your server from your computer.

## Step 5.1: Open your terminal

Same terminal you used in Step 3.

## Step 5.2: Connect

```bash
# Replace YOUR_IP with the IP address from Step 4.4
# Example: ssh root@154.12.345.678
ssh root@YOUR_IP
```

**First time connecting?** You'll see this message:
```
The authenticity of host '154.12.345.678' can't be established.
Are you sure you want to continue connecting (yes/no)?
```

Type `yes` and press Enter.

**Then enter your password** (from Step 4.4).

> 💡 When typing passwords in the terminal, nothing appears on screen — no dots, no asterisks. This is normal. Just type and press Enter.

## Step 5.3: Verify you're connected

You should see something like:
```
root@buildmetry:~#
```

This means you're now controlling your server. Everything you type runs on the server, not your computer.

## Step 5.4: Update the server

```bash
# Update the package list (tells the server about available updates)
apt-get update

# Install all available updates (-y means "yes to all")
apt-get upgrade -y
```

This takes 1-2 minutes. Wait for it to finish.

---

# 6. INSTALL DOKPLOY ON YOUR SERVER

> ⚡ All commands in this section run on your SERVER (the SSH terminal from Step 5).

## Step 6.1: Install Dokploy with one command

```bash
curl -sSL https://dokploy.com/install.sh | sh
```

**What this does automatically:**
- Installs Docker (the container platform)
- Installs Docker Compose (runs multiple containers)
- Installs Traefik (handles domains and SSL certificates)
- Installs the Dokploy dashboard

**This takes 2-5 minutes.** Wait for the "Installation complete" message.

## Step 6.2: Verify Dokploy is running

```bash
docker ps
```

You should see containers running with names like `dokploy`, `traefik`, etc.

## Step 6.3: Open Dokploy in your browser

On your computer (not the server terminal), open:

```
http://YOUR_IP:3000
```

> Replace `YOUR_IP` with your server's IP address from Step 4.4.
> Example: `http://154.12.345.678:3000`

You'll see the Dokploy registration page.

## Step 6.4: Create your Dokploy admin account

1. Enter your **email address**
2. Choose a **strong password** (at least 12 characters)
3. Click **Register**

> ⚠️ Remember this password! It's your Dokploy dashboard login.

You're now in the Dokploy dashboard.

---

# 7. DEPLOY BUILDMETRY WITH DOKPLOY

## Step 7.1: Create a new project

1. In Dokploy, click **Projects** in the sidebar
2. Click the **+ Create Project** button
3. Enter the name: `BuildMetry`
4. Click **Create**

## Step 7.2: Create a Compose service

1. Click on your **BuildMetry** project
2. Click **+ Create Service**
3. Select **Compose**
4. Enter the name: `buildmetry-app`
5. Click **Create**

## Step 7.3: Connect to GitHub

1. Click on the **buildmetry-app** service you just created
2. Go to the **Provider** tab (or General tab, look for Source)
3. Select **GitHub** as the provider
4. Click **Connect GitHub Account**
5. A GitHub popup will appear — click **Authorize Dokploy**
6. Select your GitHub account
7. Choose your **buildmetry** repository
8. Branch: `main`
9. Compose Path: `./docker-compose.yml`
10. Click **Save**

## Step 7.4: Set environment variables

1. Go to the **Environment** tab
2. Click **Add Variable** or paste these all at once:

```
DB_NAME=buildmetry
DB_USER=buildmetry
DB_PASSWORD=PASTE_A_STRONG_PASSWORD_HERE
JWT_SECRET=PASTE_A_LONG_RANDOM_STRING_HERE
JWT_EXPIRES_IN=7d
FRONTEND_PORT=3000
FRONTEND_URL=http://YOUR_IP:3000
```

**To generate secure passwords**, go back to your SERVER terminal and run:

```bash
# Generate a database password (copy the output)
echo "DB_PASSWORD=$(openssl rand -base64 24 | tr -d '/+=')"

# Generate a JWT secret (copy the output)
echo "JWT_SECRET=$(openssl rand -hex 32)"
```

Copy the generated values and paste them into Dokploy.

> ⚠️ Replace `YOUR_IP` in `FRONTEND_URL` with your actual server IP.

3. Click **Save**

## Step 7.5: Deploy!

1. Click the **Deploy** button (usually top-right or in the Deployments tab)
2. Watch the build logs appear

**What happens during deployment:**
```
1. Dokploy pulls your code from GitHub          (~10 seconds)
2. Docker builds the frontend image              (~2-3 minutes)
   - Installs npm packages
   - Builds the React app with Vite
   - Packages it into Nginx
3. Docker builds the backend image               (~1-2 minutes)
   - Installs npm packages
   - Generates Prisma client
4. Docker pulls PostgreSQL image                  (~30 seconds)
5. All containers start up                        (~10 seconds)
6. Backend pushes schema to database              (~5 seconds)
```

**Total: 3-5 minutes on first deploy.**

## Step 7.6: Verify it's working

Open your browser and go to:

```
http://YOUR_IP:3000
```

You should see the BuildMetry login page!

> 🎉 **If you see the login page, congratulations — your app is deployed!**

> ❌ **If you see an error**, go to Section 15 (Troubleshooting).

---

# 8. RUN DATABASE SETUP

The app is running, but the database is empty. You need to create the tables and add seed data.

## Step 8.1: Open a terminal on the backend container

**Option A — Via Dokploy dashboard:**
1. Go to your **buildmetry-app** service
2. Click the **Terminal** tab (or Advanced → Terminal)
3. Select the **backend** container
4. You'll get a command line inside the container

**Option B — Via SSH (if Terminal tab isn't available):**
```bash
# SSH into your server
ssh root@YOUR_IP

# Find the backend container name
docker ps | grep backend

# Open a shell inside it (replace CONTAINER_NAME)
docker exec -it CONTAINER_NAME sh
```

## Step 8.2: Run the database migration

Inside the backend container terminal:

```bash
# This creates all database tables based on your Prisma schema
npx prisma db push --accept-data-loss
```

You should see: "Your database is now in sync with your Prisma schema."

## Step 8.3: Run the seeder (optional — adds demo data)

```bash
# This adds sample customers, estimates, projects, etc.
node prisma/seed.js
```

> 💡 If you don't have a seed.js file, skip this step. You'll add data manually through the app.

## Step 8.4: Exit the container (if using SSH)

```bash
exit
```

---

# 9. FIRST LOGIN & CONFIGURATION

## Step 9.1: Open BuildMetry

Go to: `http://YOUR_IP:3000`

## Step 9.2: Log in

If you ran the seeder, use the demo credentials:

| Field | Value |
|-------|-------|
| Email | `jason@jbconstruction.com` |
| Password | `contractor123` |

## Step 9.3: Change the default password immediately!

1. Go to **Company Setup** (gear icon in sidebar)
2. Click **Users & Roles** tab
3. Click the edit button next to Jason Braddock
4. Change the email and password to YOUR real credentials
5. Save

## Step 9.4: Set up your company info

Still in Company Setup:

1. **Company Info** tab → Enter your real business name, address, phone, license number
2. **Theme & Branding** tab → Upload your company logo
3. **Email & Notifications** tab → Set up SMTP for sending estimates/invoices by email

---

# 10. CONNECT YOUR DOMAIN NAME

> Skip this section if you don't have a domain yet. You can always add one later.

## Step 10.1: Add DNS records at your domain registrar

Go to where you bought your domain (GoDaddy, Namecheap, Hostinger, etc.):

1. Find **DNS Settings** or **DNS Zone Editor**
2. Add these records:

| Type | Name | Value | TTL |
|------|------|-------|-----|
| A | `@` | `YOUR_IP` | 3600 |
| A | `www` | `YOUR_IP` | 3600 |

> Replace `YOUR_IP` with your Hostinger VPS IP address.

## Step 10.2: Wait for DNS propagation

DNS changes take 5-30 minutes (sometimes up to 48 hours).

**Test if it's working:**
```bash
# Run this on your computer
ping yourdomain.com
```

If it shows your server's IP, DNS is ready.

## Step 10.3: Add domain in Dokploy

1. Open Dokploy dashboard: `http://YOUR_IP:3000`
2. Go to your **buildmetry-app** service
3. Click the **Domains** tab
4. Click **+ Add Domain**
5. Enter your domain: `yourdomain.com`
6. Set the container port to `3000` (or whatever FRONTEND_PORT you used)
7. Click **Save**

## Step 10.4: Update the FRONTEND_URL

1. Go to the **Environment** tab in Dokploy
2. Change `FRONTEND_URL` to `https://yourdomain.com`
3. Save and redeploy

---

# 11. SET UP HTTPS (SSL CERTIFICATE)

> Dokploy handles SSL automatically through Traefik + Let's Encrypt.

## Step 11.1: Enable HTTPS in Dokploy

1. Go to your service → **Domains** tab
2. Click your domain
3. Toggle **HTTPS** to ON
4. Click **Save**

That's it! Dokploy will:
- Request a free SSL certificate from Let's Encrypt
- Install it automatically
- Redirect HTTP to HTTPS
- Auto-renew the certificate every 60 days

## Step 11.2: Verify HTTPS

Open `https://yourdomain.com` — you should see the lock icon in your browser.

---

# 12. SET UP AUTO-DEPLOY FROM GITHUB

This makes it so every time you push code to GitHub, your app automatically updates.

## Step 12.1: Enable auto-deploy in Dokploy

1. Go to your service in Dokploy
2. Click **Deployments** tab (or General)
3. Look for **Auto Deploy** toggle and enable it
4. Dokploy will show you a **Webhook URL** — copy it

## Step 12.2: Add the webhook to GitHub

1. Go to your repository on GitHub.com
2. Click **Settings** tab (top of repo page)
3. Click **Webhooks** in the left sidebar
4. Click **Add webhook**
5. Fill in:
   - **Payload URL**: Paste the webhook URL from Dokploy
   - **Content type**: Select `application/json`
   - **Which events**: Select "Just the push event"
6. Click **Add webhook**

## Step 12.3: Test it

On your local computer:
```bash
# Make any small change
echo "// auto-deploy test" >> README.md
git add -A
git commit -m "Test auto-deploy"
git push origin main
```

Go to Dokploy → Deployments tab — you should see a new deployment triggered automatically.

---

# 13. SET UP AUTOMATIC BACKUPS

> ⚠️ This is critically important. Set it up now, not later.

## Step 13.1: SSH into your server

```bash
ssh root@YOUR_IP
```

## Step 13.2: Create a backup folder

```bash
mkdir -p /root/backups
```

## Step 13.3: Test a manual backup first

```bash
# Find your database container name
docker ps | grep postgres

# Run the backup (replace CONTAINER_NAME)
docker exec CONTAINER_NAME pg_dump -U buildmetry buildmetry > /root/backups/test_backup.sql

# Verify the backup file was created
ls -la /root/backups/
```

## Step 13.4: Set up automatic daily backups

```bash
# Open the cron editor
crontab -e
```

If asked to choose an editor, type `1` (for nano) and press Enter.

Add this line at the bottom of the file:

```
0 2 * * * docker exec $(docker ps -qf "ancestor=postgres:15-alpine") pg_dump -U buildmetry buildmetry > /root/backups/buildmetry_$(date +\%Y\%m\%d).sql 2>/dev/null && find /root/backups -mtime +30 -delete
```

Save and exit:
- **nano editor**: Press `Ctrl + X`, then `Y`, then `Enter`

**What this does:**
- Runs every day at 2:00 AM
- Creates a backup file like `buildmetry_20260327.sql`
- Automatically deletes backups older than 30 days

## Step 13.5: Verify the cron job was saved

```bash
crontab -l
```

You should see your backup line.

---

# 14. DAILY MANAGEMENT COMMANDS

## From your local computer:

```bash
# Update the app (push code changes)
git add -A
git commit -m "description of changes"
git push origin main
# (Dokploy auto-deploys if webhook is set up)
```

## From SSH on the server:

```bash
# Connect to your server
ssh root@YOUR_IP

# Navigate to project (if using manage.sh)
cd /path/to/buildmetry

# View all running containers
docker ps

# View logs from a specific service
docker compose logs -f backend    # Backend logs
docker compose logs -f frontend   # Frontend logs
docker compose logs -f db         # Database logs

# Restart a specific service
docker compose restart backend

# Restart everything
docker compose restart

# Manual backup
docker exec $(docker ps -qf "ancestor=postgres:15-alpine") pg_dump -U buildmetry buildmetry > backup.sql

# Restore from backup (WARNING: replaces all data)
docker exec -i $(docker ps -qf "ancestor=postgres:15-alpine") psql -U buildmetry buildmetry < backup.sql

# Check disk space
df -h

# Check memory usage
free -h
```

## From Dokploy dashboard:

| Action | Where to Find It |
|--------|-----------------|
| View build logs | Service → Deployments tab |
| View runtime logs | Service → Logs tab |
| Restart service | Service → Actions → Restart |
| Redeploy | Service → Deploy button |
| View resource usage | Service → Monitoring tab |
| Open container terminal | Service → Terminal tab |
| Manage domains | Service → Domains tab |
| Change env variables | Service → Environment tab |

---

# 15. TROUBLESHOOTING COMMON PROBLEMS

## Problem: "Dockerfile not found" during build

**Cause:** The Dockerfile isn't inside the frontend/ or backend/ folder.

**Fix:** Run `setup-docker.sh` in your project root, commit, and push:
```bash
chmod +x setup-docker.sh
./setup-docker.sh
git add -A
git commit -m "Add Docker files"
git push origin main
```

## Problem: Build fails on "npm ci"

**Cause:** Missing `package-lock.json` file.

**Fix:**
```bash
cd frontend && npm install && cd ..
cd backend && npm install && cd ..
git add -A
git commit -m "Add lock files"
git push origin main
```

## Problem: App loads but API calls fail (502 error)

**Cause:** Backend didn't start or can't connect to database.

**Fix:** Check backend logs in Dokploy → Logs tab. Common issues:
- Database password mismatch → check Environment tab
- Prisma schema not pushed → run `npx prisma db push` in Terminal tab

## Problem: "Connection refused" on port 3000

**Cause:** Firewall blocking the port or containers not running.

**Fix:**
```bash
# SSH into server
ssh root@YOUR_IP

# Check if containers are running
docker ps

# If not running, check logs
docker compose logs

# Open the port in firewall
ufw allow 3000
```

## Problem: Out of memory / server slow

**Cause:** KVM 1 (1GB RAM) is too small.

**Fix — Add swap space (temporary):**
```bash
ssh root@YOUR_IP
fallocate -l 2G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile
echo '/swapfile swap swap defaults 0 0' >> /etc/fstab
```

**Better fix:** Upgrade to KVM 2 or higher in Hostinger dashboard.

## Problem: SSL certificate not working

**Cause:** DNS not pointing to server, or certificate request failed.

**Fix:**
1. Verify DNS: `ping yourdomain.com` should show your server IP
2. Wait 30 minutes for DNS propagation
3. In Dokploy, remove and re-add the domain with HTTPS enabled
4. Check Traefik logs: `docker logs $(docker ps -qf "name=traefik")`

## Problem: "Port 3000 already in use"

**Cause:** Dokploy dashboard already uses port 3000.

**Fix:** Change your app's port:
1. In Dokploy → Environment tab, change `FRONTEND_PORT=3001`
2. Redeploy
3. Access app at `http://YOUR_IP:3001`

## Problem: Can't log in (forgot password)

**Fix:**
```bash
# SSH into server, open backend container
docker exec -it $(docker ps -qf "name=backend") sh

# In the container, run:
npx prisma studio
# This opens a database editor — find your User table and reset the password
```

---

# 16. SECURITY HARDENING

Do these AFTER everything is working.

## Step 16.1: Set up the firewall

```bash
ssh root@YOUR_IP

# Allow only necessary ports
ufw allow 22       # SSH (so you can connect)
ufw allow 80       # HTTP (web traffic)
ufw allow 443      # HTTPS (secure web traffic)
ufw allow 3000     # Dokploy dashboard

# Enable the firewall
ufw enable

# Verify
ufw status
```

## Step 16.2: Set up SSH key authentication (no more passwords)

On YOUR computer (not the server):

```bash
# Generate an SSH key (press Enter for all prompts)
ssh-keygen -t ed25519 -C "your-email@example.com"

# Copy the key to your server
ssh-copy-id root@YOUR_IP
```

Test it — you should connect without a password:
```bash
ssh root@YOUR_IP
```

## Step 16.3: Disable password login (after SSH keys work!)

> ⚠️ Only do this AFTER Step 16.2 works! Otherwise you'll lock yourself out.

```bash
ssh root@YOUR_IP

# Edit SSH config
nano /etc/ssh/sshd_config

# Find and change this line:
# PasswordAuthentication yes
# Change to:
# PasswordAuthentication no

# Save: Ctrl+X, Y, Enter

# Restart SSH
systemctl restart sshd
```

## Step 16.4: Restrict Dokploy dashboard access

In Dokploy settings, you can set allowed IP addresses so only you can access the admin dashboard.

---

# QUICK REFERENCE CARD

```
LOCAL COMPUTER
──────────────
1. ./setup-docker.sh           Create Docker files
2. git push origin main        Push to GitHub

SERVER (SSH)
──────────────
3. ssh root@YOUR_IP            Connect to server
4. curl -sSL https://dokploy.com/install.sh | sh   Install Dokploy

DOKPLOY DASHBOARD (http://YOUR_IP:3000)
──────────────
5. Create Project → Compose    Set up service
6. Connect GitHub              Link repository
7. Set Environment Variables   Add passwords
8. Click Deploy                Build & launch
9. Terminal → run migrations   Set up database

POST-DEPLOY
──────────────
10. Add domain + HTTPS         Professional URL
11. Set up webhook             Auto-deploy
12. Set up cron backup         Data protection
13. Configure firewall         Security
```
