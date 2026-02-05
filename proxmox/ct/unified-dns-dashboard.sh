#!/usr/bin/env bash

# Unified DNS Dashboard - Proxmox LXC Creator
# Copyright (c) 2024-2026 D4rk-Sh4dw
# License: MIT
# 
# Run from Proxmox host:
# bash -c "$(curl -fsSL https://raw.githubusercontent.com/D4rk-Sh4dw/dns-server/main/proxmox/ct/unified-dns-dashboard.sh)"

set -euo pipefail

# Colors - CL must be first as it's used in CM
CL=$(echo "\033[m")
RD=$(echo "\033[01;31m")
GN=$(echo "\033[1;32m")
YW=$(echo "\033[33m")
BL=$(echo "\033[36m")
CM="${GN}âœ”ï¸${CL}"
BOLD=$(echo "\033[1m")

# Default values
APP="Unified-DNS-Dashboard"
REPO_URL="https://raw.githubusercontent.com/D4rk-Sh4dw/dns-server/main"
DEFAULT_CPU=2
DEFAULT_RAM=2048
DEFAULT_DISK=8
DEFAULT_OS="debian"
DEFAULT_VERSION="12"

# Spinner
spinner() {
    local pid=$1
    local spin='â ‹â ™â ¹â ¸â ¼â ´â ¦â §â ‡â '
    local i=0
    while kill -0 "$pid" 2>/dev/null; do
        printf "\r ${spin:i++%${#spin}:1} "
        sleep 0.1
    done
    printf "\r"
}

msg_info() { echo -e "${BL}â„¹ï¸  ${1}${CL}"; }
msg_ok() { echo -e "${GN}âœ”ï¸  ${1}${CL}"; }
msg_error() { echo -e "${RD}âŒ ${1}${CL}"; }

header() {
    clear
    echo -e "${BL}"
    cat <<"EOF"
    __  __      _ _____          __   ____  _   _______
   / / / /___  (_) __(_)__  ____/ /  / __ \/ | / / ___/
  / / / / __ \/ / /_/ / _ \/ __  /  / / / /  |/ /\__ \ 
 / /_/ / / / / / __/ /  __/ /_/ /  / /_/ / /|  /___/ / 
 \____/_/ /_/_/_/ /_/\___/\__,_/  /_____/_/ |_//____/  
                                                        
        Dashboard - LXC Installer for Proxmox
EOF
    echo -e "${CL}"
}

check_root() {
    if [[ $EUID -ne 0 ]]; then
        msg_error "This script must be run as root on the Proxmox host"
        exit 1
    fi
}

check_pve() {
    if ! command -v pveversion &>/dev/null; then
        msg_error "This script must be run on a Proxmox VE host"
        exit 1
    fi
    msg_ok "Running on Proxmox VE $(pveversion | cut -d'/' -f2)"
}

get_next_vmid() {
    pvesh get /cluster/nextid 2>/dev/null || echo "100"
}

select_storage() {
    local storages
    storages=$(pvesm status -content rootdir | awk 'NR>1 {print $1}' | tr '\n' ' ')
    if [[ -z "$storages" ]]; then
        msg_error "No storage available for containers"
        exit 1
    fi
    
    echo ""
    echo -e "${YW}Available storages: ${storages}${CL}"
    read -p "Storage for container [local-lvm]: " STORAGE
    STORAGE=${STORAGE:-local-lvm}
}

select_template() {
    local template_storage
    template_storage=$(pvesm status -content vztmpl | awk 'NR>1 {print $1}' | head -1)
    
    TEMPLATE="${template_storage}:vztmpl/debian-12-standard_12.7-1_amd64.tar.zst"
    
    # Check if template exists, download if not
    if ! pveam list "$template_storage" | grep -q "debian-12"; then
        msg_info "Downloading Debian 12 template..."
        pveam download "$template_storage" debian-12-standard_12.7-1_amd64.tar.zst &>/dev/null &
        spinner $!
        msg_ok "Template downloaded"
    fi
}

configure_container() {
    header
    echo -e "${BOLD}Container Configuration${CL}\n"
    
    local next_id
    next_id=$(get_next_vmid)
    
    read -p "Container ID [$next_id]: " CTID
    CTID=${CTID:-$next_id}
    
    read -p "Hostname [dns-dashboard]: " HOSTNAME
    HOSTNAME=${HOSTNAME:-dns-dashboard}
    
    read -p "CPU Cores [$DEFAULT_CPU]: " CPU
    CPU=${CPU:-$DEFAULT_CPU}
    
    read -p "RAM in MB [$DEFAULT_RAM]: " RAM
    RAM=${RAM:-$DEFAULT_RAM}
    
    read -p "Disk Size in GB [$DEFAULT_DISK]: " DISK
    DISK=${DISK:-$DEFAULT_DISK}
    
    select_storage
    
    echo ""
    echo -e "${BOLD}Network Configuration${CL}"
    echo "1) DHCP"
    echo "2) Static IP"
    read -p "Select [1]: " NET_TYPE
    NET_TYPE=${NET_TYPE:-1}
    
    if [[ "$NET_TYPE" == "2" ]]; then
        read -p "IP Address (e.g., 10.1.0.14/24): " STATIC_IP
        read -p "Gateway: " GATEWAY
        NET_CONFIG="ip=${STATIC_IP},gw=${GATEWAY}"
    else
        NET_CONFIG="ip=dhcp"
    fi
    
    read -p "Bridge [vmbr0]: " BRIDGE
    BRIDGE=${BRIDGE:-vmbr0}
    
    # Summary
    echo ""
    echo -e "${BL}â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•${CL}"
    echo -e "${BOLD}           Configuration Summary${CL}"
    echo -e "${BL}â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•${CL}"
    echo -e "  Container ID:  ${GN}$CTID${CL}"
    echo -e "  Hostname:      ${GN}$HOSTNAME${CL}"
    echo -e "  CPU:           ${GN}$CPU cores${CL}"
    echo -e "  RAM:           ${GN}$RAM MB${CL}"
    echo -e "  Disk:          ${GN}$DISK GB${CL}"
    echo -e "  Storage:       ${GN}$STORAGE${CL}"
    echo -e "  Network:       ${GN}$NET_CONFIG${CL}"
    echo -e "${BL}â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•${CL}"
    echo ""
    
    read -p "Create container? [Y/n]: " CONFIRM
    case "$CONFIRM" in
        [nN][oO]|[nN])
            msg_info "Cancelled"
            exit 0
            ;;
    esac
}

create_container() {
    msg_info "Creating LXC container $CTID..."
    
    pct create "$CTID" "$TEMPLATE" \
        --hostname "$HOSTNAME" \
        --cores "$CPU" \
        --memory "$RAM" \
        --rootfs "${STORAGE}:${DISK}" \
        --net0 "name=eth0,bridge=${BRIDGE},${NET_CONFIG}" \
        --unprivileged 1 \
        --features nesting=1 \
        --onboot 1 \
        --start 0 \
        &>/dev/null
    
    msg_ok "Container $CTID created"
}

start_container() {
    msg_info "Starting container..."
    pct start "$CTID"
    sleep 5
    msg_ok "Container started"
}

run_install_script() {
    msg_info "Running installation script inside container..."
    
    # Push the install script into the container and execute it
    pct exec "$CTID" -- bash -c "
        export DEBIAN_FRONTEND=noninteractive
        
        # Update system
        apt-get update &>/dev/null
        apt-get upgrade -y &>/dev/null
        
        # Install dependencies
        apt-get install -y curl wget git nginx openssl ca-certificates gnupg &>/dev/null
        
        # Install Node.js 20
        curl -fsSL https://deb.nodesource.com/setup_20.x | bash - &>/dev/null
        apt-get install -y nodejs &>/dev/null
        
        # Install .NET 8 Runtime
        wget -q https://packages.microsoft.com/config/debian/12/packages-microsoft-prod.deb -O /tmp/packages-microsoft-prod.deb
        dpkg -i /tmp/packages-microsoft-prod.deb &>/dev/null
        apt-get update &>/dev/null
        apt-get install -y aspnetcore-runtime-8.0 &>/dev/null
        
        # Install AdGuard Home
        curl -s -S -L https://raw.githubusercontent.com/AdguardTeam/AdGuardHome/master/scripts/install.sh | sh -s -- -v &>/dev/null
        
        # Install Technitium DNS
        curl -sSL https://download.technitium.com/dns/install.sh | bash &>/dev/null
        
        # Install Dashboard
        git clone -q https://github.com/D4rk-Sh4dw/dns-server.git /opt/dns-dashboard
        cd /opt/dns-dashboard/frontend
        
        # Create env file
        AUTH_SECRET=\$(openssl rand -base64 32)
        cat >.env.local <<ENVEOF
ADGUARD_URL=http://127.0.0.1:3000
ADGUARD_USER=admin
ADGUARD_PASS=admin123
TECHNITIUM_URL=http://127.0.0.1:5380
TECHNITIUM_PASSWORD=admin123
AUTH_SECRET=\${AUTH_SECRET}
ADMIN_USER=admin
ADMIN_PASSWORD=admin123
ENVEOF
        
        npm ci &>/dev/null
        npm run build &>/dev/null
        
        # Create dashboard service
        cat >/etc/systemd/system/dns-dashboard.service <<SVCEOF
[Unit]
Description=Unified DNS Dashboard
After=network.target AdGuardHome.service dns.service

[Service]
Type=simple
WorkingDirectory=/opt/dns-dashboard/frontend
ExecStart=/usr/bin/npm start
Restart=on-failure
RestartSec=10
Environment=NODE_ENV=production
Environment=PORT=3001

[Install]
WantedBy=multi-user.target
SVCEOF
        
        systemctl daemon-reload
        systemctl enable --now dns-dashboard &>/dev/null
        
        # Configure Nginx
        cat >/etc/nginx/sites-available/dns-dashboard <<'NGINXEOF'
server {
    listen 80 default_server;
    server_name _;

    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }

    location /adguard/ {
        proxy_pass http://127.0.0.1:3000/;
        proxy_set_header Host \$host;
    }

    location /technitium/ {
        proxy_pass http://127.0.0.1:5380/;
        proxy_set_header Host \$host;
    }
}
NGINXEOF
        
        ln -sf /etc/nginx/sites-available/dns-dashboard /etc/nginx/sites-enabled/
        rm -f /etc/nginx/sites-enabled/default
        systemctl reload nginx
    "
    
    msg_ok "Installation complete"
}

get_container_ip() {
    # Wait for IP
    local tries=0
    while [[ $tries -lt 30 ]]; do
        IP=$(pct exec "$CTID" -- hostname -I 2>/dev/null | awk '{print $1}')
        if [[ -n "$IP" ]]; then
            break
        fi
        sleep 1
        ((tries++))
    done
}

print_summary() {
    get_container_ip
    
    echo ""
    echo -e "${GN}â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•${CL}"
    echo -e "${GN}          Installation Complete!${CL}"
    echo -e "${GN}â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•${CL}"
    echo ""
    echo -e "  ${BL}Dashboard:${CL}  http://${IP}"
    echo -e "  ${BL}AdGuard:${CL}    http://${IP}/adguard/"
    echo -e "  ${BL}Technitium:${CL} http://${IP}/technitium/"
    echo ""
    echo -e "  ${YW}Default Login: admin / admin123${CL}"
    echo ""
    echo -e "  ${BL}Container ID:${CL} $CTID"
    echo -e "  ${BL}Enter container:${CL} pct enter $CTID"
    echo ""
}

# Main
main() {
    header
    check_root
    check_pve
    select_template
    configure_container
    create_container
    start_container
    run_install_script
    print_summary
}

main "$@"
