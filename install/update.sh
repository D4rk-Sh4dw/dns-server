#!/bin/bash

# DNS Dashboard Update Script
# Updates an existing installation by pulling the latest changes and restarting services.
# Supports both Git-based and standalone (wget-based) installations.
# Configuration is stored in .env (never overwritten by updates).

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
if [ -f "./docker-compose.yml" ]; then
    INSTALL_DIR="$(pwd)"
    echo -e "${GREEN}Detected project directory: $INSTALL_DIR${NC}"
elif [ -d "$INSTALL_DIR" ] && [ -f "$INSTALL_DIR/docker-compose.yml" ]; then
    echo -e "${GREEN}Using default directory: $INSTALL_DIR${NC}"
else
    # Search common installation paths
    FOUND_DIR=""
    for candidate in "/opt/dns-server" "$HOME/dns-server" "$HOME/dns-server/dns-server" "./dns-server"; do
        if [ -f "$candidate/docker-compose.yml" ]; then
            FOUND_DIR="$candidate"
            break
        fi
    done

    if [ -n "$FOUND_DIR" ]; then
        INSTALL_DIR="$FOUND_DIR"
        echo -e "${GREEN}Found installation at: $INSTALL_DIR${NC}"
    else
        # Interactive prompt
        echo -e "${YELLOW}Could not automatically detect the installation directory.${NC}"
        echo -e "${YELLOW}Please enter the path to your dns-server installation:${NC}"
        read -r -p "> " USER_DIR
        if [ -z "$USER_DIR" ]; then
            echo -e "${RED}No path provided. Aborting.${NC}"
            exit 1
        fi
        USER_DIR="${USER_DIR/#\~/$HOME}"
        USER_DIR="${USER_DIR%/}"
        if [ -f "$USER_DIR/docker-compose.yml" ]; then
            INSTALL_DIR="$USER_DIR"
            echo -e "${GREEN}Verified: $INSTALL_DIR${NC}"
        else
            echo -e "${RED}Error: No docker-compose.yml found in $USER_DIR${NC}"
            exit 1
        fi
    fi
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

# --- Step 1: Migrate old env vars to .env if needed ---
echo ""
echo -e "${BLUE}[1/5] Checking .env configuration...${NC}"

if [ ! -f ".env" ]; then
    if [ -f ".env.example" ]; then
        cp .env.example .env
        echo -e "${GREEN}Created .env from .env.example${NC}"
    else
        # Download .env.example and create .env
        wget -qO .env.example "$BASE_URL/.env.example" 2>/dev/null || true
        if [ -f ".env.example" ]; then
            cp .env.example .env
            echo -e "${GREEN}Downloaded and created .env from .env.example${NC}"
        else
            # Create minimal .env
            cat > .env << 'ENVEOF'
ADMIN_USER=admin
ADMIN_PASSWORD=admin123
AUTH_SECRET=change_me_to_a_random_string
ADGUARD_USER=admin
ADGUARD_PASS=admin123
TECHNITIUM_USER=admin
TECHNITIUM_PASSWORD=admin123
ENVEOF
            echo -e "${YELLOW}Created minimal .env with default values.${NC}"
        fi
    fi

    # Migrate hardcoded values from old docker-compose.yml if it still has them
    if [ -f "docker-compose.yml" ] && grep -q "ADGUARD_USER=admin" docker-compose.yml 2>/dev/null; then
        echo -e "${YELLOW}Old docker-compose.yml has hardcoded values. They will be used after the next step downloads the new compose file.${NC}"
    fi
else
    echo -e "${GREEN}.env file exists. Your configuration is safe.${NC}"
fi

# --- Step 2: Pull latest files ---
echo ""
echo -e "${BLUE}[2/5] Downloading latest configuration...${NC}"

if [ "$IS_GIT" = true ]; then
    echo "Pulling updates via git..."
    git stash 2>/dev/null || true
    git fetch origin
    LOCAL=$(git rev-parse HEAD)
    REMOTE=$(git rev-parse origin/main)

    if [ "$LOCAL" = "$REMOTE" ]; then
        echo -e "${GREEN}Already up to date (commit $LOCAL).${NC}"
        git stash pop 2>/dev/null || true
    else
        echo -e "${YELLOW}Updates available!${NC}"
        echo "  Local:  $LOCAL"
        echo "  Remote: $REMOTE"
        git pull origin main
        git stash pop 2>/dev/null || true
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

# --- Step 3: Stop containers and clean up config ---
echo ""
echo -e "${BLUE}[3/5] Stopping containers and cleaning up...${NC}"

# Detect which compose command to use
if command -v docker &> /dev/null; then
    COMPOSE_CMD="docker compose"
elif command -v docker-compose &> /dev/null; then
    COMPOSE_CMD="docker-compose"
else
    echo -e "${RED}Error: Neither 'docker compose' nor 'docker-compose' found.${NC}"
    exit 1
fi

# Stop Technitium first so it stops recreating webservice.config
echo "Stopping Technitium container..."
$COMPOSE_CMD stop technitium 2>/dev/null || docker stop dns-technitium 2>/dev/null || true

# Delete webservice.config while container is stopped
TECHNITIUM_DATA="./data/technitium"
if [ -f "$TECHNITIUM_DATA/webservice.config" ]; then
    echo -e "${YELLOW}Deleting webservice.config for clean startup...${NC}"
    rm -f "$TECHNITIUM_DATA/webservice.config"
    echo -e "${GREEN}Deleted. Technitium will recreate it with correct defaults.${NC}"
fi

# --- Step 4: Pull latest Docker images and restart ---
echo ""
echo -e "${BLUE}[4/5] Pulling latest Docker images and restarting services...${NC}"

$COMPOSE_CMD pull 2>/dev/null || {
    echo -e "${YELLOW}Could not pull images. They will be updated on next build.${NC}"
}

echo "Recreating containers with updated config..."
$COMPOSE_CMD up -d --force-recreate

echo "Ensuring all services are running..."
$COMPOSE_CMD up -d

# --- Step 5: Health check ---
echo ""
echo -e "${BLUE}[5/5] Health check...${NC}"

sleep 5

FAILED=false
for container in dns-dashboard dns-proxy dns-adguard dns-technitium; do
    STATUS=$(docker inspect -f '{{.State.Status}}' "$container" 2>/dev/null || echo "not found")
    if [ "$STATUS" = "running" ]; then
        echo -e "  ${GREEN}✓${NC} $container: $STATUS"
    else
        echo -e "  ${RED}✗${NC} $container: $STATUS"
        echo -e "  ${YELLOW}  Last logs:${NC}"
        docker logs --tail 10 "$container" 2>&1 | sed 's/^/    /'
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
echo ""
echo -e "${BLUE}Config: Edit .env to change passwords and settings.${NC}"