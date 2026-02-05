#!/bin/bash

# Standalone Deployment Script (No Git required)
set -e

PROJECT_NAME="dns-server"
BASE_URL="https://raw.githubusercontent.com/D4rk-Sh4dw/dns-server/main"

echo "Creating project directory: $PROJECT_NAME"
mkdir -p "$PROJECT_NAME/config/adguard"
mkdir -p "$PROJECT_NAME/data"
cd "$PROJECT_NAME"

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
