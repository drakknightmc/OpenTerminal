# OpenTerminal Deployment on Raspberry Pi 4B (vault-pi)

This guide covers hardened deployment of OpenTerminal to a Raspberry Pi 4B (aarch64/arm64) running DietPi OS.

## Target Environment

- **Host**: vault-pi at `192.168.0.112`
- **OS**: DietPi (aarch64/arm64)
- **Hardware**: Raspberry Pi 4B with 3.8GB RAM (~2.6GB typically available)
- **Docker**: 29.6.2 + Docker Compose v5.3.1 (already installed)
- **User**: `drak` (in docker group, no passwordless sudo)
- **SSH Key**: `~/.ssh/vaultssh`
- **Constraints**:
  - ~2.6GB free RAM shared with other running services (brain-mcp, omniroute, Beszel, Tailscale, UpSnap, PostgreSQL, Redis, Node-RED, cloudflared tunnel)
  - 17GB disk free
  - Memory-intensive `next build` cannot run safely on-device

## Resource Allocation

`docker-compose.yml` includes hard memory limits to prevent OOM-kill during runtime:

- **api** (Express backend): 256M memory limit / 128M reservation, 0.5 CPU cores
- **web** (Next.js frontend): 512M memory limit / 256M reservation, 0.75 CPU cores
- **Total allocated**: 768M (~30% of Pi's 2.6GB free RAM, leaving headroom for other services)

These limits are conservative and sized for runtime only. **Build happens off-device** (see build strategy below).

## Build Strategy

### Why Cross-Compile (Recommended)

`next build` can consume 500MB–1.5GB of RAM during the Docker image build. On a Pi with only 2.6GB free RAM and other services running, on-device build risks:
- Memory thrashing and swap storms
- Build timeout/OOM-kill
- System instability

**Solution**: Build arm64 images on a more powerful machine (e.g., desktop at 192.168.0.183), then transfer and load on the Pi. No registry required.

### Recommended: Build on Desktop, Transfer via Tar

#### Prerequisites

On your desktop (must have Docker 20.10+ with `buildx` support):
```bash
# Verify buildx is available
docker buildx version
```

Docker Desktop includes buildx by default. For Linux, install via:
```bash
docker buildx create --use
```

#### Build Step 1: Cross-Compile Images for arm64

From the project root on your desktop:

```bash
cd ~/Documents/project/OpenTerminal

# Build api image for arm64
docker buildx build \
  --platform linux/arm64 \
  --file server/Dockerfile \
  --tag openterminal-api:arm64 \
  --output type=docker \
  .

# Build web image for arm64
docker buildx build \
  --platform linux/arm64 \
  --file web/Dockerfile \
  --tag openterminal-web:arm64 \
  --output type=docker \
  .
```

**Note**: If you're on an ARM machine (e.g., another Pi), omit `--platform linux/arm64` and just build natively.

#### Build Step 2: Save Images as Tar Files

```bash
cd /tmp  # Or any temp directory with 2–3GB free space

docker save openterminal-api:arm64 | gzip > openterminal-api-arm64.tar.gz
docker save openterminal-web:arm64 | gzip > openterminal-web-arm64.tar.gz

ls -lh openterminal-*.tar.gz  # Verify ~150–300MB combined
```

#### Build Step 3: Transfer to Pi

```bash
scp -i ~/.ssh/vaultssh openterminal-api-arm64.tar.gz drak@192.168.0.112:/tmp/
scp -i ~/.ssh/vaultssh openterminal-web-arm64.tar.gz drak@192.168.0.112:/tmp/
```

#### Build Step 4: Load Images on Pi

SSH into the Pi and load the images:

```bash
ssh -i ~/.ssh/vaultssh drak@192.168.0.112

# On the Pi:
docker load < /tmp/openterminal-api-arm64.tar.gz
docker load < /tmp/openterminal-web-arm64.tar.gz

# Verify images are loaded
docker images | grep openterminal
```

Expected output:
```
openterminal-api   arm64       <hash>      <date>   ~50–100MB
openterminal-web   arm64       <hash>      <date>   ~150–250MB
```

### Fallback: Build On-Pi (If RAM Available)

If the Pi has been rebooted and shows >800MB free RAM:

```bash
ssh -i ~/.ssh/vaultssh drak@192.168.0.112

# On the Pi:
cd ~/OpenTerminal
docker compose build
```

**Risk**: If build fails due to memory exhaustion, either:
1. Stop other services temporarily (each of these runs as user `drak` via Docker/user services, no sudo needed — see the memory note on this Pi's no-passwordless-sudo constraint): `docker stop <container>` for the heaviest ones (postgres, redis, node-red)
2. Revert to the cross-compile method

## Deployment Steps

### Prerequisites

`docker-compose.yml` already includes, in this fork:
- `deploy.resources.limits.memory` set for both services
- `NODE_ENV=production` in both service environment blocks

### Deploy

1. **SSH into the Pi**:
   ```bash
   ssh -i ~/.ssh/vaultssh drak@192.168.0.112
   ```

2. **Clone or sync the repo** (if not already present):
   ```bash
   git clone https://github.com/drakknightmc/OpenTerminal.git ~/OpenTerminal
   cd ~/OpenTerminal
   ```

   Or, if already present, sync the latest `docker-compose.yml`:
   ```bash
   cd ~/OpenTerminal
   git pull
   ```

3. **Set environment variables** (if needed):
   ```bash
   # Create a .env file for docker compose
   echo "ANTHROPIC_API_KEY=your-key-here" > .env
   ```

   Alternatively, pass via command line:
   ```bash
   export ANTHROPIC_API_KEY="your-key-here"
   ```

4. **Load the pre-built images** (from the cross-build step above), then start services:
   ```bash
   docker compose up -d
   ```

   Verify services started:
   ```bash
   docker compose ps
   docker compose logs -f  # Watch for 30 seconds, Ctrl+C to exit
   ```

5. **Test access**:
   - API: `curl http://192.168.0.112:4000/api/status`
   - Web: `curl http://192.168.0.112:3000/`

   Or from your desktop:
   ```bash
   curl http://vault-pi.local:3000/  # If mDNS available
   curl http://192.168.0.112:3000/
   ```

### Persistence: Automatic Startup on Boot

Since the Pi has no passwordless sudo (preventing system service installation), use a user crontab entry:

```bash
# On the Pi:
crontab -e

# Add this line (exact path from your clone/deploy directory):
@reboot sleep 10 && cd /home/drak/OpenTerminal && docker compose up -d
```

The `sleep 10` ensures Docker daemon has started before compose attempts to connect.

Verify crontab is set:
```bash
crontab -l
```

## Monitoring

### Check Resource Usage

```bash
# On the Pi:
docker stats --no-stream

# Example output:
# CONTAINER       CPU %    MEM USAGE / LIMIT   MEM %   NET I/O
# openterminal-api    0.5%     45M / 256M         17%    ...
# openterminal-web    1.2%     120M / 512M        23%    ...
```

If either service consistently approaches its limit (>80%), increase the limit in `docker-compose.yml` `deploy.resources.limits.memory` and restart.

### View Logs

```bash
docker compose logs -f api
docker compose logs -f web
docker compose logs -f  # All services
```

### Stop Services

```bash
docker compose down
```

This stops and removes containers but preserves the `terminal-data` volume (SQLite database).

## Troubleshooting

### Services fail to start ("Cannot connect to Docker daemon")

**Cause**: `drak` user is not in the `docker` group.

**Fix**: ask the user to run this themselves (requires sudo they haven't granted this session):
```bash
sudo usermod -aG docker drak
# Log out and log back in, or:
newgrp docker
```

### "memory limit exceeded" in logs

**Cause**: Container memory limit too low for current workload.

**Fix**: Increase limits in `docker-compose.yml` if Pi has free RAM:
```yaml
deploy:
  resources:
    limits:
      memory: 384M  # Increase from 256M
```

Then restart:
```bash
docker compose restart api
```

### Persistent data missing after restart

**Cause**: Volume was deleted or misconfigured.

**Check**:
```bash
docker volume ls | grep terminal-data
docker volume inspect terminal-data
```

The volume path should be a Docker-managed directory (usually `/var/lib/docker/volumes/...`). If lost, data is gone. Recreate or restore from backup.

### Next.js build hangs on Pi

**Do not deploy with on-device build.** Always cross-compile on desktop using the buildx method. See "Fallback: Build On-Pi" only if necessary.

## Security Notes

- **ANTHROPIC_API_KEY**: Store in `.env` (git-ignored) or Docker secrets. Never commit to git.
- **Network**: The Pi is on a private LAN (192.168.0.112). For external access, use Tailscale, Cloudflare Tunnel, or other VPN. OpenTerminal does not provide its own auth — if exposed beyond the LAN, gate it behind Cloudflare Access (already used for this user's other `*.drak.work` services) rather than exposing it raw.
- **Volume backups**: The `terminal-data` volume contains SQLite data. Include it in your Pi's backup strategy.
- **CORS**: `server/src/index.ts` runs `cors()` with no origin restriction. Acceptable here because the API has no cookie/credential auth and the real perimeter is Cloudflare Access at the tunnel layer, not app-level CORS — leave as-is unless this ever gets exposed without that gate.

## Next Steps

- Monitor the services for 24–48 hours to confirm stability.
- If resource usage is consistently low, consider reducing limits to free up RAM for other services.
- If access is needed from outside the LAN, set up Tailscale or Cloudflare Tunnel integration.
- Keep the Pi's Docker images updated periodically by rebuilding and reloading.
