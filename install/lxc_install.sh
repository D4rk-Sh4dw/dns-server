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
apt-get install -y curl sudo git ca-certificates gnupg lsb-release

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
echo -e "${BLUE}Cloning repository to $INSTALL_DIR...${NC}"
if [ ! -d "$INSTALL_DIR" ]; then
    git clone https://github.com/D4rk-Sh4dw/dns-server.git "$INSTALL_DIR"
else
    echo -e "${GREEN}Project directory already exists, pulling updates...${NC}"
    cd "$INSTALL_DIR" && git pull
fi

# 4. Run Docker Compose
echo -e "${BLUE}Starting infrastructure with Docker Compose...${NC}"
cd "$INSTALL_DIR"
docker compose up -d

echo -e "${GREEN}Installation completed!${NC}"
echo -e "Access the Dashboard at: http://<your-lxc-ip>/"
echo -e "${BLUE}NOTE:${NC} Ensure that 'Nesting' is enabled in your LXC Options in Proxmox."
