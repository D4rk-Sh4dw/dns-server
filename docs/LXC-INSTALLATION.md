# LXC Installation Guide (Proxmox)

This guide explains how to install the Unified DNS Dashboard in a **Proxmox LXC container without Docker**.

## Quick Install (Proxmox Community Script Style)

Run this command directly on your **Proxmox host shell**:

```bash
bash -c "$(curl -fsSL https://raw.githubusercontent.com/D4rk-Sh4dw/dns-server/main/proxmox/ct/unified-dns-dashboard.sh)"
```

This will:
1. Prompt for container configuration (ID, hostname, resources, network)
2. Download the Debian 12 template
3. Create and start the LXC container
4. Install all services automatically

---

## Prerequisites

### Recommended LXC Specs
| Resource | Minimum | Recommended |
|----------|---------|-------------|
| RAM | 1 GB | 2 GB |
| CPU | 1 Core | 2 Cores |
| Disk | 8 GB | 20 GB |
| OS | Debian 12 | Debian 12 / Ubuntu 22.04 |

### Create LXC Container in Proxmox

```bash
# Via Proxmox CLI
pct create 100 local:vztmpl/debian-12-standard_12.2-1_amd64.tar.zst \
  --hostname dns-server \
  --memory 2048 \
  --cores 2 \
  --net0 name=eth0,bridge=vmbr0,ip=dhcp \
  --storage local-lvm \
  --unprivileged 1 \
  --features nesting=1

pct start 100
pct enter 100
```

Or use the Proxmox Web UI: **Create CT** → Select Debian 12 template.

---

## Manual Installation

### 1. Install Dependencies

```bash
apt update && apt install -y curl wget git nginx openssl ca-certificates gnupg
```

### 2. Install Node.js 20

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs
```

### 3. Install .NET 8 Runtime

```bash
wget https://packages.microsoft.com/config/debian/12/packages-microsoft-prod.deb
dpkg -i packages-microsoft-prod.deb
apt update && apt install -y aspnetcore-runtime-8.0
```

### 4. Install AdGuard Home

```bash
curl -s -S -L https://raw.githubusercontent.com/AdguardTeam/AdGuardHome/master/scripts/install.sh | sh -s -- -v
```

### 5. Install Technitium DNS

```bash
curl -sSL https://download.technitium.com/dns/install.sh | bash
```

### 6. Install Dashboard

```bash
# Clone repository
git clone https://github.com/D4rk-Sh4dw/dns-server.git /opt/dns-dashboard
cd /opt/dns-dashboard/frontend

# Create environment config
cat > .env.local << 'EOF'
ADGUARD_URL=http://127.0.0.1:3000
ADGUARD_USER=admin
ADGUARD_PASS=admin123
TECHNITIUM_URL=http://127.0.0.1:5380
TECHNITIUM_PASSWORD=admin123
AUTH_SECRET=your_secret_key_here
ADMIN_USER=admin
ADMIN_PASSWORD=admin123
EOF

# Build
npm ci
npm run build
```

### 7. Create Systemd Service

```bash
cat > /etc/systemd/system/dns-dashboard.service << 'EOF'
[Unit]
Description=Unified DNS Dashboard
After=network.target AdGuardHome.service dns.service

[Service]
Type=simple
User=root
WorkingDirectory=/opt/dns-dashboard/frontend
ExecStart=/usr/bin/npm start
Restart=on-failure
Environment=NODE_ENV=production
Environment=PORT=3001

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable --now dns-dashboard
```

### 8. Configure Nginx

```bash
cat > /etc/nginx/sites-available/dns-dashboard << 'EOF'
server {
    listen 80 default_server;
    server_name _;

    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /adguard/ {
        proxy_pass http://127.0.0.1:3000/;
        proxy_set_header Host $host;
    }

    location /technitium/ {
        proxy_pass http://127.0.0.1:5380/;
        proxy_set_header Host $host;
    }
}
EOF

ln -sf /etc/nginx/sites-available/dns-dashboard /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
systemctl reload nginx
```

---

## Post-Installation

### Port Configuration

| Service | Port | Description |
|---------|------|-------------|
| Nginx | 80 | Reverse Proxy (Main Entry) |
| AdGuard Home | 53 | DNS (TCP/UDP) |
| AdGuard Web | 3000 | Internal only |
| Technitium Web | 5380 | Internal only |
| Dashboard | 3001 | Internal only |

### Configure DNS Architecture

1. **AdGuard Home** handles port 53 for all clients
2. **Technitium** handles authoritative zones (local domains, DHCP)
3. AdGuard forwards local zone queries to Technitium

Set up DNS forwarding in AdGuard:
- Go to **DNS Settings** → **Upstream DNS**
- Add: `[/home.arpa/]127.0.0.1:5353` (adjust domain/port as needed)

---

## Service Management

```bash
# Dashboard
systemctl status dns-dashboard
systemctl restart dns-dashboard
journalctl -u dns-dashboard -f

# AdGuard Home
systemctl status AdGuardHome
systemctl restart AdGuardHome

# Technitium DNS
systemctl status dns
systemctl restart dns
```

---

## Updating

```bash
cd /opt/dns-dashboard
git pull
cd frontend
npm ci
npm run build
systemctl restart dns-dashboard
```

---

## Troubleshooting

### Dashboard not starting
```bash
journalctl -u dns-dashboard -n 50
```

### Port 53 conflict
```bash
# Check what's using port 53
ss -tulpn | grep :53

# Disable systemd-resolved if needed
systemctl disable --now systemd-resolved
```

### Check all services
```bash
systemctl status AdGuardHome dns dns-dashboard nginx
```

---

## Comparison: Docker vs LXC

| Feature | Docker | LXC |
|---------|--------|-----|
| Setup complexity | Simple | Medium |
| Resource overhead | Higher | Lower |
| Proxmox integration | Good | Native |
| Snapshots/Backups | Docker volumes | Native PBS/vzdump |
| Network config | Docker network | Direct bridge |
| Updates | `docker pull` | `git pull` + build |
