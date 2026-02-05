#!/usr/bin/env bash

# Copyright (c) 2024-2026
# Author: D4rk-Sh4dw
# License: MIT
# Source: https://github.com/D4rk-Sh4dw/dns-server

# Our install script URL
INSTALL_URL="https://raw.githubusercontent.com/D4rk-Sh4dw/dns-server/main/proxmox/install/unified-dns-dashboard-install.sh"

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

start
build_container

# Now run our install script inside the container
msg_info "Running Custom Installation"
pct exec "$CTID" -- bash -c "curl -fsSL ${INSTALL_URL} | bash"
msg_ok "Custom Installation Complete"

description

msg_ok "Completed Successfully!\n"
echo -e "${CREATING}${GN}${APP} setup has been successfully initialized!${CL}"
echo -e "${INFO}${YW} Access it using the following URLs:${CL}"
echo -e "${TAB}${GATEWAY}${BGN}Dashboard:  http://${IP}${CL}"
echo -e "${TAB}${GATEWAY}${BGN}AdGuard:    http://${IP}/adguard/${CL}"
echo -e "${TAB}${GATEWAY}${BGN}Technitium: http://${IP}/technitium/${CL}"
echo -e "\n${INFO}${YW} Default Login: admin / admin123${CL}"
