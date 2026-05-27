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
    echo "Systemd-resolved detected. Stopping and disabling it to free Port 53..."
    sudo systemctl stop systemd-resolved
    sudo systemctl disable systemd-resolved
    sudo rm -f /etc/resolv.conf
    echo -e "nameserver 1.1.1.1\nnameserver 8.8.8.8" | sudo tee /etc/resolv.conf > /dev/null
fi

# Diagnostic check
if sudo lsof -Pi :53 -sTCP:LISTEN -t >/dev/null ; then
    echo "WARNING: Port 53 is still in use by:"
    sudo lsof -i :53
fi

echo "Downloading docker-compose.yml..."
wget -qO docker-compose.yml "$BASE_URL/docker-compose.yml"

echo "Downloading .env.example..."
wget -qO .env.example "$BASE_URL/.env.example"

echo "Creating .env from .env.example..."
cp .env.example .env

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
echo "Access the Dashboard at: http://$IP_ADDR:8080/"
echo ""
echo "IMPORTANT: Edit .env to change default credentials!"
echo "  Default login: admin / admin123"
echo "===================================================="
