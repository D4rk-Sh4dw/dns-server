#!/bin/bash

# Unified DNS Dashboard - Native LXC Installation Script
# This script installs AdGuard Home, Technitium DNS, and the Dashboard natively.

set -e

# --- Configuration ---
INSTALL_DIR="/opt/dns-server"
DASHBOARD_DIR="$INSTALL_DIR/frontend"
AGH_DIR="/opt/AdGuardHome"
TECHNITIUM_DIR="/etc/dns"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}Starting Unified DNS Dashboard Native Installation...${NC}"

# 1. Update and install dependencies
echo -e "${BLUE}Installing dependencies...${NC}"
apt-get update
apt-get install -y curl sudo git nginx nodejs npm wget jq

# 2. Install Technitium DNS Server
echo -e "${BLUE}Installing Technitium DNS Server...${NC}"
curl -sSL https://download.technitium.com/dns/install.sh | sudo bash

# --- DNS FIX ---
# Technitium installer might have set /etc/resolv.conf to 127.0.0.1.
# If it's not fully configured yet, we lose internet access.
echo -e "${BLUE}Fixing DNS resolution for remaining steps...${NC}"
echo "nameserver 1.1.1.1" > /etc/resolv.conf

# 3. Install AdGuard Home
echo -e "${BLUE}Installing AdGuard Home...${NC}"
curl -s -S -L https://raw.githubusercontent.com/AdguardTeam/AdGuardHome/master/scripts/install.sh | sh -s -- -v

# 4. Setup Dashboard
echo -e "${BLUE}Setting up Dashboard...${NC}"
mkdir -p "$INSTALL_DIR"
if [ ! -d "$DASHBOARD_DIR" ]; then
    git clone https://github.com/D4rk-Sh4dw/dns-server.git "$INSTALL_DIR"
fi

cd "$DASHBOARD_DIR"
npm install
npm run build

# 5. Create Dashboard Systemd Service
echo -e "${BLUE}Creating systemd services...${NC}"
cat <<EOF > /etc/systemd/system/dns-dashboard.service
[Unit]
Description=Unified DNS Dashboard
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=$DASHBOARD_DIR
Environment=NODE_ENV=production
Environment=PORT=3000
Environment=ADGUARD_URL=http://localhost:3000
Environment=TECHNITIUM_URL=http://localhost:5380
ExecStart=/usr/bin/npm start
Restart=always

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable dns-dashboard
systemctl start dns-dashboard

# 6. Configure Nginx
echo -e "${BLUE}Configuring Nginx...${NC}"
cat <<EOF > /etc/nginx/sites-available/dns-dashboard
server {
    listen 80;
    server_name _;

    location / {
        proxy_pass http://localhost:3000/;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    location /adguard/ {
        proxy_pass http://localhost:3000/;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_redirect / /adguard/;
        proxy_cookie_path / /adguard/;
    }

    location /technitium/ {
        proxy_pass http://localhost:5380/;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cookie_path / /technitium/;
    }
}
EOF

ln -sf /etc/nginx/sites-available/dns-dashboard /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
systemctl restart nginx

# 7. Final adjustments (Port Conflict Fix)
# Both services want port 53 by default. 
# We recommend AdGuard on 53 and Technitium on another port (e.g. 5353).
echo -e "${BLUE}Final adjustments for port compatibility...${NC}"
# Note: Changing Technitium port natively requires API calls or config edits.
# For now, we inform the user to check settings if port 53 is blocked.

echo -e "${GREEN}Installation completed!${NC}"
echo -e "Access the Dashboard at: http://<your-lxc-ip>/"
echo -e "${BLUE}IMPORTANT:${NC} AdGuard Home and Technitium may conflict on Port 53."
echo -e "Please configure one of them to use a different port (e.g. 5353) in their respective Web UIs."
echo -e "The Unified Dashboard will still work if you update the URLs in the settings/env."
