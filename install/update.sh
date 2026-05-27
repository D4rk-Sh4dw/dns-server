#!/bin/bash

# DNS Dashboard Update Script
# Updates an existing installation by pulling the latest changes and restarting services.
# Supports both Git-based and standalone (wget-based) installations.

set -e

# --- Configuration ---
INSTALL_DIR="/opt/dns-server"
BASE_URL="https://raw.githubusercontent.com/D4rk-Sh4dw/dns-server/main"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}=== DNS Dashboard Update ===${NC}"

# --- Detect installation directory ---
# If run from within the project dir, use that. Otherwise default to INSTALL_DIR.
if [ -f "./docker-compose.yml" ] && [ -f "./install/update.sh" ]; then
    INSTALL_DIR="$(pwd)"
    echo -e "${GREEN}Detected project directory: $INSTALL_DIR${NC}"
elif [ -d "$INSTALL_DIR" ]; then
    echo -e "${GREEN}Using default directory: $INSTALL_DIR${NC}"
else
    echo -e "${RED}Error: Could not find installation directory.${NC}"
    echo "Either run this script from the project directory or set INSTALL_DIR."
    echo "Usage: INSTALL_DIR=/path/to/dns-server bash update.sh"
    exit 1
fi

cd "$INSTALL_DIR"

# --- Detect installation type ---
IS_GIT=false
if [ -d ".git" ] && command -v git &> /dev/null; then
    IS_GIT=true
    echo -e "${GREEN}Git-based installation detected.${NC}"
else
    echo -e "${YELLOW}Standalone (wget) installation detected.${NC}"
fi

# --- Step 1: Pull latest files ---
echo ""
echo -e "${BLUE}[1/5] Downloading latest configuration...${NC}"

if [ "$IS_GIT" = true ]; then
    echo "Pulling updates via git..."
    git fetch origin
    LOCAL=$(git rev-parse HEAD)
    REMOTE=$(git rev-parse origin/main)

    if [ "$LOCAL" = "$REMOTE" ]; then
        echo -e "${GREEN}Already up to date (commit $LOCAL).${NC}"
        SKIP_REBUILD=false  # Still check for env/image changes
    else
        echo -e "${YELLOW}Updates available!${NC}"
        echo "  Local:  $LOCAL"
        echo "  Remote: $REMOTE"
        git pull origin main
        echo -e "${GREEN}Git pull successful.${NC}"
    fi
else
    echo "Downloading latest docker-compose.yml..."
    wget -qO docker-compose.yml "$BASE_URL/docker-compose.yml"

    echo "Downloading latest Nginx config templates..."
    mkdir -p nginx/templates
    wget -qO nginx/templates/default.conf.template "$BASE_URL/nginx/templates/default.conf.template"
    wget -qO nginx/start.sh "$BASE_URL/nginx/start.sh"
    chmod +x nginx/start.sh

    echo -e "${GREEN}Files downloaded successfully.${NC}"
fi

# --- Step 2: Check for breaking changes ---
echo ""
echo -e "${BLUE}[2/5] Checking for configuration changes...${NC}"

# Check if new environment variables were added
if grep -q "DNS_SERVER_WEB_SERVICE_LOCAL_ADDRESSES" docker-compose.yml 2>/dev/null; then
    # Check if Technitium webservice.config exists (env vars only read on first start)
    TECHNITIUM_DATA=$(grep -oP '(?<=- \./data/technitium:)[^\s]+' docker-compose.yml 2>/dev/null || echo "/etc/dns")
    if [ -z "$TECHNITIUM_DATA" ] || [ "$TECHNITIUM_DATA" = "/etc/dns" ]; then
        TECHNITIUM_DATA="./data/technitium"
    fi

    if [ -f "$TECHNITIUM_DATA/webservice.config" ]; then
        echo -e "${YELLOW}Technitium webservice.config exists.${NC}"
        echo "  Environment variables are only read on first start."
        echo "  Deleting webservice.config so the new DNS_SERVER_WEB_SERVICE_LOCAL_ADDRESSES takes effect..."
        rm -f "$TECHNITIUM_DATA/webservice.config"
        echo -e "${GREEN}Deleted webservice.config. It will be recreated on next start.${NC}"
    fi
fi

# --- Step 3: Pull latest Docker images ---
echo ""
echo -e "${BLUE}[3/5] Pulling latest Docker images...${NC}"
docker compose pull 2>/dev/null || docker-compose pull 2>/dev/null || {
    echo -e "${YELLOW}Could not pull images. They will be updated on next build.${NC}"
}

# --- Step 4: Restart services ---
echo ""
echo -e "${BLUE}[4/5] Restarting services...${NC}"

# Detect which compose command to use
if command -v docker &> /dev/null; then
    COMPOSE_CMD="docker compose"
elif command -v docker-compose &> /dev/null; then
    COMPOSE_CMD="docker-compose"
else
    echo -e "${RED}Error: Neither 'docker compose' nor 'docker-compose' found.${NC}"
    exit 1
fi

echo "Recreating containers with updated config..."
$COMPOSE_CMD up -d --force-recreate nginx technitium

echo "Ensuring all services are running..."
$COMPOSE_CMD up -d

# --- Step 5: Health check ---
echo ""
echo -e "${BLUE}[5/5] Health check...${NC}"

sleep 3

# Check container status
FAILED=false
for container in dns-dashboard dns-proxy dns-adguard dns-technitium; do
    STATUS=$(docker inspect -f '{{.State.Status}}' "$container" 2>/dev/null || echo "not found")
    if [ "$STATUS" = "running" ]; then
        echo -e "  ${GREEN}✓${NC} $container: $STATUS"
    else
        echo -e "  ${RED}✗${NC} $container: $STATUS"
        FAILED=true
    fi
done

# Get IP
IP_ADDR=$(hostname -I 2>/dev/null | awk '{print $1}')
if [ -z "$IP_ADDR" ]; then IP_ADDR="localhost"; fi

echo ""
if [ "$FAILED" = true ]; then
    echo -e "${RED}=== Update completed with warnings ===${NC}"
    echo -e "${YELLOW}Some containers are not running. Check with: docker compose ps${NC}"
    echo -e "${YELLOW}View logs with: docker compose logs <service>${NC}"
else
    echo -e "${GREEN}=== Update completed successfully! ===${NC}"
fi
echo ""
echo "Dashboard:  http://$IP_ADDR:8080/"
echo "AdGuard:    http://$IP_ADDR:8080/adguard/"
echo "Technitium: http://$IP_ADDR:8080/technitium/"