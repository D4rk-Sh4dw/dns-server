#!/usr/bin/env bash

# Copyright (c) 2024-2026
# Author: D4rk-Sh4dw
# License: MIT
# Source: https://github.com/D4rk-Sh4dw/dns-server

# Override the install script path BEFORE sourcing build.func
# The build.func looks for install scripts at a specific URL pattern,
# we need to tell it to use our URL instead

# First, set the URL for our install script
CUSTOM_INSTALL_URL="https://raw.githubusercontent.com/D4rk-Sh4dw/dns-server/main/proxmox/install/unified-dns-dashboard-install.sh"

# Source community-scripts build functions
source <(curl -fsSL https://raw.githubusercontent.com/community-scripts/ProxmoxVE/main/misc/build.func)

APP="Unified-DNS-Dashboard"
var_tags="${var_tags:-dns;adblock;dhcp}"
var_cpu="${var_cpu:-2}"
var_ram="${var_ram:-2048}"
var_disk="${var_disk:-8}"
var_os="${var_os:-debian}"
var_version="${var_version:-12}"
var_unprivileged="${var_unprivileged:-1}"

header_info "$APP"
variables
color
catch_errors

function update_script() {
  header_info
  check_container_storage
  check_container_resources
  
  if [[ ! -d /opt/dns-dashboard ]]; then
    msg_error "No ${APP} Installation Found!"
    exit
  fi
  
  msg_info "Updating ${APP}"
  cd /opt/dns-dashboard
  git pull
  cd frontend
  npm ci
  npm run build
  systemctl restart dns-dashboard
  msg_ok "Updated ${APP}"
  exit
}

# Custom build function that uses our install script
custom_build() {
  # Create the container using the standard function
  if [[ "$CT_TYPE" == "0" ]]; then
    msg_info "Creating Privileged Container"
  else
    msg_info "Creating Unprivileged Container"
  fi
  
  # Use pct to create container
  pct create "$CTID" "${TEMPLATE}" \
    -arch "${ARCH}" \
    -features "${PCT_OPTIONS}" \
    -hostname "$HN" \
    -net0 "name=eth0,bridge=$BRG,ip=$NET,gw=$GATE${MAC}${VLAN}" \
    -onboot 1 \
    -cores "$CORE_COUNT" \
    -memory "$RAM_SIZE" \
    -unprivileged "$CT_TYPE" \
    -rootfs "$DISK_REF" \
    ${PW:-} ${SSH:-}
    
  msg_ok "Container Created"
  
  msg_info "Starting Container"
  pct start "$CTID"
  sleep 5
  msg_ok "Started Container"
  
  # Push and run our install script
  msg_info "Running Installation Script"
  pct exec "$CTID" -- bash -c "curl -fsSL ${CUSTOM_INSTALL_URL} | bash"
  msg_ok "Installation Complete"
}

start

# Use custom build instead of build_container
custom_build

description

msg_ok "Completed Successfully!\n"
echo -e "${CREATING}${GN}${APP} setup has been successfully initialized!${CL}"
echo -e "${INFO}${YW} Access it using the following URLs:${CL}"
echo -e "${TAB}${GATEWAY}${BGN}Dashboard:  http://${IP}${CL}"
echo -e "${TAB}${GATEWAY}${BGN}AdGuard:    http://${IP}/adguard/${CL}"
echo -e "${TAB}${GATEWAY}${BGN}Technitium: http://${IP}/technitium/${CL}"
echo -e "\n${INFO}${YW} Default Login: admin / admin123${CL}"
