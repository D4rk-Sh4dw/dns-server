#!/usr/bin/env bash

# Unified DNS Dashboard - LXC Container Creator
# Run on Proxmox host to create the container
#
# Usage: bash create-lxc.sh
# Then inside the container: bash <(curl -fsSL https://raw.githubusercontent.com/D4rk-Sh4dw/dns-server/main/proxmox/install.sh)

set -euo pipefail

# Colors
CL="\033[m"
RD="\033[01;31m"
GN="\033[1;32m"
YW="\033[33m"
BL="\033[36m"
BOLD="\033[1m"

msg_info() { echo -e "${BL}â„¹ï¸  ${1}${CL}"; }
msg_ok() { echo -e "${GN}âœ”ï¸  ${1}${CL}"; }
msg_error() { echo -e "${RD}âŒ ${1}${CL}"; exit 1; }

header() {
    clear
    echo -e "${BL}"
    cat <<"EOF"
   __  __      _ _____          __   ____  _   _______
  / / / /___  (_) __(_)__  ____/ /  / __ \/ | / / ___/
 / / / / __ \/ / /_/ / _ \/ __  /  / / / /  |/ /\__ \ 
/ /_/ / / / / / __/ /  __/ /_/ /  / /_/ / /|  /___/ / 
\____/_/ /_/_/_/ /_/\___/\__,_/  /_____/_/ |_//____/  

     LXC Container Creator for Proxmox
EOF
    echo -e "${CL}"
}

check_root() {
    if [[ $EUID -ne 0 ]]; then
        msg_error "Run as root on Proxmox host"
    fi
}

check_pve() {
    if ! command -v pveversion &>/dev/null; then
        msg_error "This must run on a Proxmox VE host"
    fi
    msg_ok "Proxmox VE $(pveversion | cut -d'/' -f2)"
}

# Get next available VMID
get_next_id() {
    pvesh get /cluster/nextid 2>/dev/null || echo "100"
}

# Get available storages
get_storage() {
    local storages
    storages=$(pvesm status -content rootdir 2>/dev/null | awk 'NR>1 {print $1}' | head -5)
    echo -e "${YW}Available storages:${CL} ${storages}"
    read -p "Storage [local-lvm]: " STORAGE
    STORAGE=${STORAGE:-local-lvm}
}

# Get template storage and download if needed
get_template() {
    local tmpl_storage
    tmpl_storage=$(pvesm status -content vztmpl 2>/dev/null | awk 'NR>1 {print $1}' | head -1)
    tmpl_storage=${tmpl_storage:-local}
    
    TEMPLATE="${tmpl_storage}:vztmpl/debian-12-standard_12.7-1_amd64.tar.zst"
    
    if ! pveam list "${tmpl_storage}" 2>/dev/null | grep -q "debian-12-standard"; then
        msg_info "Downloading Debian 12 template..."
        pveam download "${tmpl_storage}" debian-12-standard_12.7-1_amd64.tar.zst
        msg_ok "Template downloaded"
    else
        msg_ok "Template available"
    fi
}

configure() {
    header
    echo -e "${BOLD}Container Configuration${CL}\n"
    
    local next_id
    next_id=$(get_next_id)
    
    read -p "Container ID [$next_id]: " CTID
    CTID=${CTID:-$next_id}
    
    read -p "Hostname [dns-dashboard]: " HOSTNAME
    HOSTNAME=${HOSTNAME:-dns-dashboard}
    
    read -p "CPU Cores [2]: " CPU
    CPU=${CPU:-2}
    
    read -p "RAM in MB [2048]: " RAM
    RAM=${RAM:-2048}
    
    read -p "Disk in GB [8]: " DISK
    DISK=${DISK:-8}
    
    get_storage
    
    echo ""
    echo -e "${BOLD}Network${CL}"
    echo "1) DHCP"
    echo "2) Static IP"
    read -p "Choice [1]: " NET_CHOICE
    
    if [[ "$NET_CHOICE" == "2" ]]; then
        read -p "IP (e.g. 10.1.0.14/24): " STATIC_IP
        read -p "Gateway: " GATEWAY
        NET_CONFIG="ip=${STATIC_IP},gw=${GATEWAY}"
    else
        NET_CONFIG="ip=dhcp"
    fi
    
    read -p "Bridge [vmbr0]: " BRIDGE
    BRIDGE=${BRIDGE:-vmbr0}
    
    # Summary
    echo ""
    echo -e "${BL}â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•${CL}"
    echo -e "  Container ID:  ${GN}$CTID${CL}"
    echo -e "  Hostname:      ${GN}$HOSTNAME${CL}"
    echo -e "  CPU/RAM/Disk:  ${GN}${CPU} cores / ${RAM}MB / ${DISK}GB${CL}"
    echo -e "  Network:       ${GN}$NET_CONFIG on $BRIDGE${CL}"
    echo -e "${BL}â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•${CL}"
    echo ""
    
    read -p "Create container? [Y/n]: " CONFIRM
    [[ "$CONFIRM" =~ ^[nN] ]] && exit 0
}

create() {
    msg_info "Creating container $CTID"
    
    pct create "$CTID" "$TEMPLATE" \
        --hostname "$HOSTNAME" \
        --cores "$CPU" \
        --memory "$RAM" \
        --rootfs "${STORAGE}:${DISK}" \
        --net0 "name=eth0,bridge=${BRIDGE},${NET_CONFIG}" \
        --unprivileged 1 \
        --features nesting=1 \
        --onboot 1
    
    msg_ok "Container created"
    
    msg_info "Starting container"
    pct start "$CTID"
    sleep 5
    msg_ok "Container started"
}

show_next_steps() {
    # Get IP
    sleep 3
    local IP
    IP=$(pct exec "$CTID" -- hostname -I 2>/dev/null | awk '{print $1}')
    
    echo ""
    echo -e "${GN}â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•${CL}"
    echo -e "${GN}  Container $CTID created successfully!${CL}"
    echo -e "${GN}â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•${CL}"
    echo ""
    echo -e "${BOLD}Next step - Run inside the container:${CL}"
    echo ""
    echo -e "  ${YW}pct enter $CTID${CL}"
    echo ""
    echo -e "  Then run:"
    echo -e "  ${YW}bash <(curl -fsSL https://raw.githubusercontent.com/D4rk-Sh4dw/dns-server/main/proxmox/install.sh)${CL}"
    echo ""
    if [[ -n "$IP" ]]; then
        echo -e "  Container IP: ${GN}$IP${CL}"
    fi
    echo ""
}

main() {
    header
    check_root
    check_pve
    get_template
    configure
    create
    show_next_steps
}

main
