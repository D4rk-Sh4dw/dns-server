#!/bin/bash

# Unified DNS Dashboard - Docker-in-LXC Installation Script
# This script installs Docker and then runs the dashboard via docker-compose.

set -e

# --- Configuration ---
INSTALL_DIR="/opt/dns-server"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}Starting Unified DNS Dashboard Docker-in-LXC Installation...${NC}"

# Check if we are in an LXC and if nesting is enabled (best effort)
if [ -d /sys/module/overlay ]; then
    echo -e "${GREEN}Overlay module detected.${NC}"
else
    echo -e "${RED}WARNING: Overlay module not detected. Ensure 'Nesting' is enabled in Proxmox LXC settings.${NC}"
fi

# 1. Install dependencies
echo -e "${BLUE}Installing base dependencies...${NC}"
apt-get update
apt-get install -y curl sudo git ca-certificates gnupg lsb-release procps lsof

# --- Port 53 Fix (systemd-resolved) ---
echo -e "${BLUE}Checking for Port 53 conflicts (systemd-resolved)...${NC}"
if systemctl is-active --quiet systemd-resolved; then
    echo -e "${YELLOW}Systemd-resolved detected. Stopping and disabling it to free Port 53...${NC}"
    systemctl stop systemd-resolved
    systemctl disable systemd-resolved
    
    # Ensure /etc/resolv.conf is a real file and points to an external DNS
    rm -f /etc/resolv.conf
    echo "nameserver 1.1.1.1" > /etc/resolv.conf
    echo "nameserver 8.8.8.8" >> /etc/resolv.conf
    echo -e "${GREEN}Port 53 should now be free.${NC}"
fi

# Check if port 53 is still in use by something else
if lsof -Pi :53 -sTCP:LISTEN -t >/dev/null ; then
    echo -e "${RED}WARNING: Port 53 is still in use!${NC}"
    lsof -i :53
    echo -e "${RED}Please check the above processes and stop them manually.${NC}"
fi

# 2. Install Docker
echo -e "${BLUE}Installing Docker...${NC}"
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    rm get-docker.sh
else
    echo -e "${GREEN}Docker is already installed.${NC}"
fi

# 3. Setup Project
echo -e "${BLUE}Setting up project files in $INSTALL_DIR...${NC}"
if [ -d "$INSTALL_DIR" ] && [ ! -d "$INSTALL_DIR/.git" ]; then
    echo -e "${RED}Warning: $INSTALL_DIR exists but is not a git repository. Removing and re-cloning...${NC}"
    rm -rf "$INSTALL_DIR"
fi

if [ ! -d "$INSTALL_DIR" ]; then
    git clone https://github.com/D4rk-Sh4dw/dns-server.git "$INSTALL_DIR"
else
    echo -e "${GREEN}Project directory already exists, pulling updates...${NC}"
    cd "$INSTALL_DIR" && git pull
fi

# Ensure AdGuard config is present even if clone had issues
if [ ! -f "$INSTALL_DIR/config/adguard/AdGuardHome.yaml" ]; then
    echo -e "${BLUE}Downloading default AdGuard Home configuration...${NC}"
    mkdir -p "$INSTALL_DIR/config/adguard"
    curl -s -L https://raw.githubusercontent.com/D4rk-Sh4dw/dns-server/main/config/adguard/AdGuardHome.yaml -o "$INSTALL_DIR/config/adguard/AdGuardHome.yaml"
fi

# 4. Run Docker Compose
echo "Starting infrastructure..."
cd "$INSTALL_DIR"
docker compose up -d

# Get current IP
IP_ADDR=$(hostname -I | awk '{print $1}')
if [ -z "$IP_ADDR" ]; then IP_ADDR="localhost"; fi

echo ""
echo "===================================================="
echo "Installation complete!"
echo "Access the Dashboard at: http://$IP_ADDR/"
echo "===================================================="
echo -e "${BLUE}NOTE:${NC} Ensure that 'Nesting' is enabled in your LXC Options in Proxmox."
