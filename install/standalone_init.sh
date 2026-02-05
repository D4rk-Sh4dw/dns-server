#!/bin/bash

# Standalone Deployment Script (No Git required)
set -e

PROJECT_NAME="dns-server"
BASE_URL="https://raw.githubusercontent.com/D4rk-Sh4dw/dns-server/main"

echo "Creating project directory: $PROJECT_NAME"
mkdir -p "$PROJECT_NAME/config/adguard"
mkdir -p "$PROJECT_NAME/data"
cd "$PROJECT_NAME"

# --- Port 53 Fix (systemd-resolved) ---
if systemctl is-active --quiet systemd-resolved; then
    echo "Systemd-resolved detected. Disabling DNSStubListener to free Port 53..."
    sudo mkdir -p /etc/systemd/resolved.conf.d
    echo -e "[Resolve]\nDNSStubListener=no" | sudo tee /etc/systemd/resolved.conf.d/adguard.conf > /dev/null
    sudo mv /etc/resolv.conf /etc/resolv.conf.bak || true
    echo "nameserver 1.1.1.1" | sudo tee /etc/resolv.conf > /dev/null
    sudo systemctl restart systemd-resolved
fi

echo "Downloading docker-compose.yml..."
wget -qO docker-compose.yml "$BASE_URL/docker-compose.yml"

echo "Downloading default AdGuard Home configuration..."
wget -qO config/adguard/AdGuardHome.yaml "$BASE_URL/config/adguard/AdGuardHome.yaml"

echo "Starting infrastructure..."
docker compose up -d

# Get current IP
IP_ADDR=$(hostname -I | awk '{print $1}')
if [ -z "$IP_ADDR" ]; then IP_ADDR="localhost"; fi

echo ""
echo "===================================================="
echo "Installation complete!"
echo "Access the Dashboard at: http://$IP_ADDR/"
echo "===================================================="
