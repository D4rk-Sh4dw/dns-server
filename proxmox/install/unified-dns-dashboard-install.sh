#!/usr/bin/env bash

# Copyright (c) 2024-2026
# Author: D4rk-Sh4dw
# License: MIT
# Source: https://github.com/D4rk-Sh4dw/dns-server

source /dev/stdin <<<"$FUNCTIONS_FILE_PATH"
color
verb_ip6
catch_errors
setting_up_container
network_check
update_os

msg_info "Installing Dependencies"
$STD apt-get install -y \
    curl \
    wget \
    git \
    nginx \
    openssl \
    ca-certificates \
    gnupg
msg_ok "Installed Dependencies"

msg_info "Installing Node.js 20"
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
$STD apt-get install -y nodejs
msg_ok "Installed Node.js $(node -v)"

msg_info "Installing .NET 8 Runtime"
wget -q https://packages.microsoft.com/config/debian/12/packages-microsoft-prod.deb -O /tmp/packages-microsoft-prod.deb
$STD dpkg -i /tmp/packages-microsoft-prod.deb
rm /tmp/packages-microsoft-prod.deb
$STD apt-get update
$STD apt-get install -y aspnetcore-runtime-8.0
msg_ok "Installed .NET Runtime"

msg_info "Installing AdGuard Home"
fetch_and_deploy_gh_release "AdGuardHome" "AdguardTeam/AdGuardHome" "prebuild" "latest" "/opt/AdGuardHome" "AdGuardHome_linux_amd64.tar.gz"

cat <<EOF >/etc/systemd/system/AdGuardHome.service
[Unit]
Description=AdGuard Home: Network-level blocker
ConditionFileIsExecutable=/opt/AdGuardHome/AdGuardHome
After=syslog.target network-online.target

[Service]
StartLimitInterval=5
StartLimitBurst=10
ExecStart=/opt/AdGuardHome/AdGuardHome "-s" "run"
WorkingDirectory=/opt/AdGuardHome
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF
systemctl enable -q --now AdGuardHome
msg_ok "Installed AdGuard Home"

msg_info "Installing Technitium DNS Server"
curl -sSL https://download.technitium.com/dns/install.sh | bash
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

$STD npm ci
$STD npm run build
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
systemctl enable -q --now dns-dashboard
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

motd_ssh
customize
cleanup_lxc
