#!/usr/bin/env bash

# Copyright (c) 2024-2026
# Author: D4rk-Sh4dw
# License: MIT
# Source: https://github.com/D4rk-Sh4dw/dns-server

# This script runs INSIDE the LXC container

set -euo pipefail

# Colors
YW=$(echo "\033[33m")
GN=$(echo "\033[1;32m")
RD=$(echo "\033[01;31m")
CL=$(echo "\033[m")

msg_info() { echo -e "${YW}⏳ ${1}...${CL}"; }
msg_ok() { echo -e "${GN}✔️  ${1}${CL}"; }
msg_error() { echo -e "${RD}❌ ${1}${CL}"; exit 1; }

export DEBIAN_FRONTEND=noninteractive

msg_info "Updating System"
apt-get update &>/dev/null
apt-get upgrade -y &>/dev/null
msg_ok "System Updated"

msg_info "Installing Dependencies"
apt-get install -y curl wget git nginx openssl ca-certificates gnupg &>/dev/null
msg_ok "Installed Dependencies"

msg_info "Installing Node.js 20"
curl -fsSL https://deb.nodesource.com/setup_20.x 2>/dev/null | bash - &>/dev/null
apt-get install -y nodejs &>/dev/null
msg_ok "Installed Node.js $(node -v)"

msg_info "Installing .NET 8 Runtime"
wget -q https://packages.microsoft.com/config/debian/12/packages-microsoft-prod.deb -O /tmp/packages-microsoft-prod.deb
dpkg -i /tmp/packages-microsoft-prod.deb &>/dev/null
rm /tmp/packages-microsoft-prod.deb
apt-get update &>/dev/null
apt-get install -y aspnetcore-runtime-8.0 &>/dev/null
msg_ok "Installed .NET Runtime"

msg_info "Installing AdGuard Home"
curl -s -S -L https://raw.githubusercontent.com/AdguardTeam/AdGuardHome/master/scripts/install.sh 2>/dev/null | sh -s -- -v &>/dev/null
msg_ok "Installed AdGuard Home"

msg_info "Installing Technitium DNS Server"
curl -sSL https://download.technitium.com/dns/install.sh 2>/dev/null | bash &>/dev/null
msg_ok "Installed Technitium DNS"

msg_info "Installing Unified DNS Dashboard"
git clone -q https://github.com/D4rk-Sh4dw/dns-server.git /opt/dns-dashboard
cd /opt/dns-dashboard/frontend

# Generate secure auth secret
AUTH_SECRET=$(openssl rand -base64 32)

cat >.env.local <<EOF
ADGUARD_URL=http://127.0.0.1:3000
ADGUARD_USER=admin
ADGUARD_PASS=admin123
TECHNITIUM_URL=http://127.0.0.1:5380
TECHNITIUM_PASSWORD=admin123
AUTH_SECRET=${AUTH_SECRET}
ADMIN_USER=admin
ADMIN_PASSWORD=admin123
EOF

npm ci &>/dev/null
npm run build &>/dev/null
msg_ok "Installed Dashboard"

msg_info "Creating Dashboard Service"
cat <<EOF >/etc/systemd/system/dns-dashboard.service
[Unit]
Description=Unified DNS Dashboard
After=network.target AdGuardHome.service dns.service

[Service]
Type=simple
User=root
WorkingDirectory=/opt/dns-dashboard/frontend
ExecStart=/usr/bin/npm start
Restart=on-failure
RestartSec=10
Environment=NODE_ENV=production
Environment=PORT=3001

[Install]
WantedBy=multi-user.target
EOF
systemctl daemon-reload
systemctl enable --now dns-dashboard &>/dev/null
msg_ok "Created Dashboard Service"

msg_info "Configuring Nginx"
cat <<'EOF' >/etc/nginx/sites-available/dns-dashboard
server {
    listen 80 default_server;
    server_name _;

    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_cache_bypass $http_upgrade;
    }

    location /adguard/ {
        proxy_pass http://127.0.0.1:3000/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /technitium/ {
        proxy_pass http://127.0.0.1:5380/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
EOF

ln -sf /etc/nginx/sites-available/dns-dashboard /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
systemctl reload nginx
msg_ok "Configured Nginx"

msg_ok "Installation Complete!"
