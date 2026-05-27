#!/bin/bash

# DNS Dashboard Update Script
# Updates an existing installation by pulling the latest changes and restarting services.
# Supports both Git-based and standalone (wget-based) installations.
# IMPORTANT: Preserves existing environment variables in docker-compose.yml.

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

# --- Helper: Extract env vars from a docker-compose.yml ---
# Returns lines like: "  - KEY=VALUE" for all services
extract_env_vars() {
    local file="$1"
    local in_env=false
    local service=""
    while IFS= read -r line; do
        # Detect service header
        if [[ "$line" =~ ^[[:space:]]*([a-z0-9_-]+):$ ]]; then
            service="${BASH_REMATCH[1]}"
            in_env=false
        fi
        # Detect environment: section
        if [[ "$line" =~ ^[[:space:]]*environment: ]]; then
            in_env=true
            continue
        fi
        # End of environment section if line is not indented enough or is another key
        if $in_env; then
            if [[ "$line" =~ ^[[:space:]]*-[[:space:]]+(.*) ]]; then
                echo "$service:${BASH_REMATCH[1]}"
            elif [[ ! "$line" =~ ^[[:space:]]+- ]] && [[ "$line" =~ ^[[:space:]]*[a-z] ]]; then
                in_env=false
            fi
        fi
    done < "$file"
}

# --- Helper: Restore env vars into a docker-compose.yml ---
# Takes the new compose file and a saved env vars file, merges them
restore_env_vars() {
    local compose_file="$1"
    local env_backup="$2"
    
    if [ ! -f "$env_backup" ] || [ ! -s "$env_backup" ]; then
        return
    fi

    echo -e "${YELLOW}Restoring custom environment variables...${NC}"
    
    # Read saved env vars into associative arrays per service
    declare -A saved_envs
    while IFS=: read -r svc key_value; do
        # Extract just the key (before the =)
        key="${key_value%%=*}"
        if [ -n "$saved_envs[$svc]" ]; then
            saved_envs[$svc]="${saved_envs[$svc]}|$key_value"
        else
            saved_envs[$svc]="$key_value"
        fi
    done < "$env_backup"

    # Now process the new compose file
    local tmp_file="${compose_file}.tmp"
    local in_env=false
    local current_service=""
    
    while IFS= read -r line; do
        # Detect service header
        if [[ "$line" =~ ^[[:space:]]*([a-z0-9_-]+):$ ]]; then
            # Before switching service, inject any missing env vars for previous service
            if [ -n "$current_service" ] && [ -n "${saved_envs[$current_service]}" ]; then
                # Get env keys already present in the new file for this service
                # (we track this during the environment section parsing)
                :
            fi
            current_service="${BASH_REMATCH[1]}"
            in_env=false
        fi

        # Detect environment: section
        if [[ "$line" =~ ^[[:space:]]*environment: ]]; then
            in_env=true
            echo "$line" >> "$tmp_file"
            continue
        fi

        # End of environment section
        if $in_env; then
            if [[ ! "$line" =~ ^[[:space:]]+- ]] && [[ "$line" =~ ^[[:space:]]*[a-z] ]]; then
                # We're leaving the environment section - inject missing vars
                if [ -n "$current_service" ] && [ -n "${saved_envs[$current_service]}" ]; then
                    # Collect keys already present in new file
                    present_keys=""
                    # We'll handle this differently - just append all saved vars
                    # that aren't already in the file
                    IFS='|' read -ra vars <<< "${saved_envs[$current_service]}"
                    for var in "${vars[@]}"; do
                        key="${var%%=*}"
                        # Check if this key already exists in the new compose file for this service
                        if ! grep -q "^[[:space:]]*- ${key}=" "$tmp_file" 2>/dev/null; then
                            # Get the indentation from the last env line
                            indent="      "
                            echo "${indent}- ${var}" >> "$tmp_file"
                            echo -e "  ${YELLOW}+ Restored: ${current_service} → ${key}${NC}"
                        fi
                    done
                fi
                in_env=false
            fi
        fi

        echo "$line" >> "$tmp_file"
    done < "$compose_file"

    # Handle case where environment section is the last section in the file
    if $in_env && [ -n "$current_service" ] && [ -n "${saved_envs[$current_service]}" ]; then
        IFS='|' read -ra vars <<< "${saved_envs[$current_service]}"
        for var in "${vars[@]}"; do
            key="${var%%=*}"
            if ! grep -q "^[[:space:]]*- ${key}=" "$tmp_file" 2>/dev/null; then
                indent="      "
                echo "${indent}- ${var}" >> "$tmp_file"
                echo -e "  ${YELLOW}+ Restored: ${current_service} → ${key}${NC}"
            fi
        done
    fi

    mv "$tmp_file" "$compose_file"
}

# --- Step 1: Backup existing env vars ---
echo ""
echo -e "${BLUE}[1/6] Backing up environment variables...${NC}"

ENV_BACKUP=$(mktemp)
extract_env_vars docker-compose.yml > "$ENV_BACKUP" 2>/dev/null || true

if [ -s "$ENV_BACKUP" ]; then
    ENV_COUNT=$(wc -l < "$ENV_BACKUP")
    echo -e "${GREEN}Saved $ENV_COUNT environment variables from current docker-compose.yml${NC}"
else
    echo -e "${YELLOW}No environment variables found in current docker-compose.yml${NC}"
fi

# --- Step 2: Pull latest files ---
echo ""
echo -e "${BLUE}[2/6] Downloading latest configuration...${NC}"

if [ "$IS_GIT" = true ]; then
    echo "Pulling updates via git..."
    git stash 2>/dev/null || true  # Stash local changes (like custom env vars)
    git fetch origin
    LOCAL=$(git rev-parse HEAD)
    REMOTE=$(git rev-parse origin/main)

    if [ "$LOCAL" = "$REMOTE" ]; then
        echo -e "${GREEN}Already up to date (commit $LOCAL).${NC}"
        git stash pop 2>/dev/null || true  # Restore local changes
    else
        echo -e "${YELLOW}Updates available!${NC}"
        echo "  Local:  $LOCAL"
        echo "  Remote: $REMOTE"
        git pull origin main
        git stash pop 2>/dev/null || true  # Restore local changes on top
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

    # --- Restore env vars for standalone installations ---
    if [ -s "$ENV_BACKUP" ]; then
        restore_env_vars docker-compose.yml "$ENV_BACKUP"
    fi
fi

# Clean up temp file
rm -f "$ENV_BACKUP"

# --- Step 3: Check for breaking changes ---
echo ""
echo -e "${BLUE}[3/6] Checking for configuration changes...${NC}"

# Check if new environment variables were added
if grep -q "DNS_SERVER_WEB_SERVICE_LOCAL_ADDRESSES" docker-compose.yml 2>/dev/null; then
    # Check if Technitium webservice.config exists (env vars only read on first start)
    TECHNITIUM_DATA="./data/technitium"

    if [ -f "$TECHNITIUM_DATA/webservice.config" ]; then
        echo -e "${YELLOW}Technitium webservice.config exists.${NC}"
        echo "  Environment variables are only read on first start."
        echo "  Deleting webservice.config so the new DNS_SERVER_WEB_SERVICE_LOCAL_ADDRESSES takes effect..."
        rm -f "$TECHNITIUM_DATA/webservice.config"
        echo -e "${GREEN}Deleted webservice.config. It will be recreated on next start.${NC}"
    fi
fi

# --- Step 4: Pull latest Docker images ---
echo ""
echo -e "${BLUE}[4/6] Pulling latest Docker images...${NC}"
docker compose pull 2>/dev/null || docker-compose pull 2>/dev/null || {
    echo -e "${YELLOW}Could not pull images. They will be updated on next build.${NC}"
}

# --- Step 5: Restart services ---
echo ""
echo -e "${BLUE}[5/6] Restarting services...${NC}"

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

# --- Step 6: Health check ---
echo ""
echo -e "${BLUE}[6/6] Health check...${NC}"

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