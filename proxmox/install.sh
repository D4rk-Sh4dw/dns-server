#!/usr/bin/env bash

# Unified DNS Dashboard - Installation Script
# Run INSIDE the LXC container after creation
#
# Usage: bash <(curl -fsSL https://raw.githubusercontent.com/D4rk-Sh4dw/dns-server/main/proxmox/install.sh)

set -euo pipefail

# Colors
CL="\033[m"
RD="\033[01;31m"
GN="\033[1;32m"
YW="\033[33m"
BL="\033[36m"

msg_info() { echo -e "${BL}â³ ${1}...${CL}"; }
msg_ok() { echo -e "${GN}âœ”ï¸  ${1}${CL}"; }
msg_error() { echo -e "${RD}âŒ ${1}${CL}"; exit 1; }

header() {
    clear
    echo -e "${BL}"
    cat <<"EOF"
   __  __      _ _____          __   ____  _   _______
  / / / /___  (_) __(_)__  ____/ /  / __ \/ | / / ___/
 / / / / __ \/ / /_/ / _ \/ __  /  / / / /  |/ /\__ \ 
/ /_/ / / / / / __/ /  __/ /_/ /  / /_/ / /|  /___/ / 
\____/_/ /_/_/_/ /_/\___/\__,_/  /_____/_/ |_//____/  

          Dashboard Installation
EOF
    echo -e "${CL}"
}

check_root() {
    if [[ $EUID -ne 0 ]]; then
        msg_error "Run as root"
    fi
}

export DEBIAN_FRONTEND=noninteractive

header
check_root

msg_info "Updating system"
apt-get update -qq
apt-get upgrade -y -qq
msg_ok "System updated"

msg_info "Installing dependencies"
apt-get install -y -qq curl wget git nginx openssl ca-certificates gnupg
msg_ok "Dependencies installed"

msg_info "Installing Node.js 20"
curl -fsSL https://deb.nodesource.com/setup_20.x 2>/dev/null | bash - >/dev/null 2>&1
apt-get install -y -qq nodejs
msg_ok "Node.js $(node -v) installed"

msg_info "Installing .NET 8 Runtime"
wget -q https://packages.microsoft.com/config/debian/12/packages-microsoft-prod.deb -O /tmp/ms.deb
dpkg -i /tmp/ms.deb >/dev/null 2>&1
rm /tmp/ms.deb
apt-get update -qq
apt-get install -y -qq aspnetcore-runtime-8.0
msg_ok ".NET Runtime installed"

msg_info "Installing AdGuard Home"
curl -s -S -L https://raw.githubusercontent.com/AdguardTeam/AdGuardHome/master/scripts/install.sh 2>/dev/null | sh -s -- -v >/dev/null 2>&1
msg_ok "AdGuard Home installed"

msg_info "Installing Technitium DNS"
curl -sSL https://download.technitium.com/dns/install.sh 2>/dev/null | bash >/dev/null 2>&1
msg_ok "Technitium DNS installed"

msg_info "Cloning Dashboard repository"
git clone -q https://github.com/D4rk-Sh4dw/dns-server.git /opt/dns-dashboard
msg_ok "Repository cloned"

msg_info "Configuring Dashboard"
cd /opt/dns-dashboard/frontend

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
msg_ok "Configuration created"

msg_info "Building Dashboard (this takes a few minutes)"
npm ci --silent 2>/dev/null
npm run build --silent 2>/dev/null
msg_ok "Dashboard built"

msg_info "Creating systemd service"
cat <<EOF >/etc/systemd/system/dns-dashboard.service
[Unit]
Description=Unified DNS Dashboard
After=network.target AdGuardHome.service dns.service

[Service]
Type=simple
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
systemctl enable --now dns-dashboard >/dev/null 2>&1
msg_ok "Dashboard service created"

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
        proxy_cache_bypass $http_upgrade;
    }

    location /adguard/ {
        proxy_pass http://127.0.0.1:3000/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /technitium/ {
        proxy_pass http://127.0.0.1:5380/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
EOF
ln -sf /etc/nginx/sites-available/dns-dashboard /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
systemctl reload nginx
msg_ok "Nginx configured"

# Get IP
IP=$(hostname -I | awk '{print $1}')

echo ""
echo -e "${GN}â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•${CL}"
echo -e "${GN}          Installation Complete!${CL}"
echo -e "${GN}â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•${CL}"
echo ""
echo -e "  ${BL}Dashboard:${CL}    http://${IP}"
echo -e "  ${BL}AdGuard:${CL}      http://${IP}/adguard/"
echo -e "  ${BL}Technitium:${CL}   http://${IP}/technitium/"
echo ""
echo -e "  ${YW}Login: admin / admin123${CL}"
echo ""
echo -e "  ${BL}Services:${CL}"
echo -e "    systemctl status dns-dashboard"
echo -e "    systemctl status AdGuardHome"
echo -e "    systemctl status dns"
echo ""
