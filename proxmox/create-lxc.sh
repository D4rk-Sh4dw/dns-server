#!/usr/bin/env bash

# Unified DNS Dashboard - LXC Container Creator
# Run on Proxmox host to create the container
#
# Usage: bash create-lxc.sh

set -euo pipefail

# Colors
CL="\033[m"
RD="\033[01;31m"
GN="\033[1;32m"
YW="\033[33m"
BL="\033[36m"
BOLD="\033[1m"

msg_info() { echo -e "${BL}ℹ️  ${1}${CL}"; }
msg_ok() { echo -e "${GN}✔️  ${1}${CL}"; }
msg_error() { echo -e "${RD}❌ ${1}${CL}"; exit 1; }

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

get_next_id() {
    pvesh get /cluster/nextid 2>/dev/null || echo "100"
}

get_storages() {
    pvesm status -content rootdir 2>/dev/null | awk 'NR>1 {print $1}'
}

get_tmpl_storages() {
    pvesm status -content vztmpl 2>/dev/null | awk 'NR>1 {print $1}'
}

get_latest_debian_tmpl() {
    local storage=$1
    # Refresh template list
    pveam update &>/dev/null
    # Find latest debian-12-standard
    pveam available -section system | grep "debian-12-standard" | sort -V | tail -1 | awk '{print $2}'
}

configure() {
    header
    echo -e "${BOLD}Container Configuration${CL}\n"
    
    local next_id=$(get_next_id)
    read -p "Container ID [$next_id]: " CTID
    CTID=${CTID:-$next_id}
    
    read -p "Hostname [dns-dashboard]: " HOSTNAME
    HOSTNAME=${HOSTNAME:-dns-dashboard}
    
    read -p "Root Password (leave empty for no password): " PASSWORD
    
    read -p "CPU Cores [2]: " CPU
    CPU=${CPU:-2}
    
    read -p "RAM in MB [2048]: " RAM
    RAM=${RAM:-2048}
    
    read -p "Disk in GB [8]: " DISK
    DISK=${DISK:-8}
    
    echo ""
    echo -e "${BOLD}Storage Selection${CL}"
    local storages=($(get_storages))
    if [ ${#storages[@]} -eq 0 ]; then
        msg_error "No storage found for rootfs"
    fi
    for i in "${!storages[@]}"; do
        echo "$((i+1))) ${storages[$i]}"
    done
    read -p "Select storage [1]: " STORAGE_INDEX
    STORAGE_INDEX=${STORAGE_INDEX:-1}
    STORAGE=${storages[$((STORAGE_INDEX-1))]}
    
    echo ""
    echo -e "${BOLD}Template Selection${CL}"
    local tmpl_storages=($(get_tmpl_storages))
    if [ ${#tmpl_storages[@]} -eq 0 ]; then
        msg_error "No storage found for templates"
    fi
    for i in "${!tmpl_storages[@]}"; do
        echo "$((i+1))) ${tmpl_storages[$i]}"
    done
    read -p "Select template storage [1]: " TMPL_STORAGE_INDEX
    TMPL_STORAGE_INDEX=${TMPL_STORAGE_INDEX:-1}
    TMPL_STORAGE=${tmpl_storages[$((TMPL_STORAGE_INDEX-1))]}
    
    msg_info "Searching for the latest Debian 12 template..."
    LATEST_DEBIAN=$(get_latest_debian_tmpl "$TMPL_STORAGE")
    if [ -z "$LATEST_DEBIAN" ]; then
        msg_error "Could not find a Debian 12 template in Proxmox repo"
    fi
    TEMPLATE="${TMPL_STORAGE}:vztmpl/${LATEST_DEBIAN}"
    
    if ! pveam list "${TMPL_STORAGE}" 2>/dev/null | grep -q "${LATEST_DEBIAN}"; then
        msg_info "Downloading $LATEST_DEBIAN..."
        pveam download "${TMPL_STORAGE}" "${LATEST_DEBIAN}"
    fi
    
    echo ""
    echo -e "${BOLD}Network Configuration${CL}"
    echo "1) DHCP (Recommended)"
    echo "2) Static IP"
    read -p "Choice [1]: " NET_CHOICE
    NET_CHOICE=${NET_CHOICE:-1}
    
    if [[ "$NET_CHOICE" == "2" ]]; then
        read -p "IP (e.g. 10.1.0.14/24): " STATIC_IP
        read -p "Gateway: " GATEWAY
        NET_CONFIG="ip=${STATIC_IP},gw=${GATEWAY}"
    else
        NET_CONFIG="ip=dhcp"
    fi
    
    read -p "Bridge [vmbr0]: " BRIDGE
    BRIDGE=${BRIDGE:-vmbr0}
    
    echo ""
    echo -e "${BOLD}Advanced Options${CL}"
    read -p "Privileged container? (y/N): " PRIV_CHOICE
    if [[ "$PRIV_CHOICE" =~ ^[yY] ]]; then
        PRIV_FLAG=0
    else
        PRIV_FLAG=1
    fi
    
    read -p "DNS Server (leave empty for host DNS): " DNS_SERVER
    
    # Summary
    echo ""
    echo -e "${BL}════════════════════════════════════════${CL}"
    echo -e "  Container ID:  ${GN}$CTID${CL}"
    echo -e "  Hostname:      ${GN}$HOSTNAME${CL}"
    echo -e "  CPU/RAM/Disk:  ${GN}${CPU} cores / ${RAM}MB / ${DISK}GB${CL}"
    echo -e "  Network:       ${GN}$NET_CONFIG on $BRIDGE${CL}"
    echo -e "  Template:      ${GN}$TEMPLATE${CL}"
    echo -e "  Unprivileged:  ${GN}$([ "$PRIV_FLAG" -eq 1 ] && echo "Yes" || echo "No")${CL}"
    echo -e "${BL}════════════════════════════════════════${CL}"
    echo ""
    
    read -p "Create container? [Y/n]: " CONFIRM
    [[ "$CONFIRM" =~ ^[nN] ]] && exit 0
}

create() {
    msg_info "Creating container $CTID..."
    
    local cmd="pct create \"$CTID\" \"$TEMPLATE\" \
        --hostname \"$HOSTNAME\" \
        --cores \"$CPU\" \
        --memory \"$RAM\" \
        --rootfs \"${STORAGE}:${DISK}\" \
        --net0 \"name=eth0,bridge=${BRIDGE},${NET_CONFIG}\" \
        --unprivileged $PRIV_FLAG \
        --features nesting=1 \
        --onboot 1"
    
    if [ -n "$PASSWORD" ]; then
        cmd="$cmd --password \"$PASSWORD\""
    fi
    
    if [ -n "$DNS_SERVER" ]; then
        # Check if comma separated or single
        cmd="$cmd --nameserver \"$DNS_SERVER\""
    fi
    
    set +e
    eval $cmd
    local status=$?
    set -e
    
    if [ $status -ne 0 ]; then
        msg_error "Failed to create container (Exit Code: $status). Check the output above for errors."
    fi
    
    msg_ok "Container created"
    
    msg_info "Starting container..."
    pct start "$CTID"
    sleep 5
    msg_ok "Container started"
}

show_next_steps() {
    sleep 3
    local IP=$(pct exec "$CTID" -- hostname -I 2>/dev/null | awk '{print $1}')
    
    echo ""
    echo -e "${GN}════════════════════════════════════════════════════════${CL}"
    echo -e "${GN}  Container $CTID created successfully!${CL}"
    echo -e "${GN}════════════════════════════════════════════════════════${CL}"
    echo ""
    echo -e "${BOLD}Next step - Run inside the container:${CL}"
    echo ""
    echo -e "  ${YW}pct enter $CTID${CL}"
    echo ""
    echo -e "  Then run the installer:"
    echo -e "  ${YW}bash <(curl -fsSL https://raw.githubusercontent.com/D4rk-Sh4dw/dns-server/main/proxmox/install.sh)${CL}"
    echo ""
    if [[ -n "$IP" ]]; then
        echo -e "  Container IP: ${GN}$IP${CL}"
    fi
}

main() {
    check_root
    check_pve
    configure
    create
    show_next_steps
}

main
