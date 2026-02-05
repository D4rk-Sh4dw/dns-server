#!/bin/bash
#
# Unified DNS Dashboard - LXC Installation Script
# For Proxmox LXC containers (Debian 12 / Ubuntu 22.04+)
#
# Usage: curl -sSL https://raw.githubusercontent.com/D4rk-Sh4dw/dns-server/main/install-lxc.sh | bash
#    or: ./install-lxc.sh
#

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
INSTALL_DIR="/opt/dns-dashboard"
DASHBOARD_USER="dns-dashboard"
ADGUARD_PORT=3000
TECHNITIUM_PORT=5380
DASHBOARD_PORT=3001
NGINX_PORT=80

# Default credentials (change these!)
ADMIN_USER="admin"
ADMIN_PASSWORD="admin123"
ADGUARD_USER="admin"
ADGUARD_PASS="admin123"
TECHNITIUM_PASSWORD="admin123"
AUTH_SECRET=$(openssl rand -base64 32)

# Interactive mode flag
INTERACTIVE=true
SKIP_CONFIRM=false

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -y|--yes)
            SKIP_CONFIRM=true
            shift
            ;;
        --non-interactive)
            INTERACTIVE=false
            shift
            ;;
        --admin-user)
            ADMIN_USER="$2"
            shift 2
            ;;
        --admin-pass)
            ADMIN_PASSWORD="$2"
            shift 2
            ;;
        --adguard-pass)
            ADGUARD_PASS="$2"
            shift 2
            ;;
        --technitium-pass)
            TECHNITIUM_PASSWORD="$2"
            shift 2
            ;;
        -h|--help)
            echo "Usage: $0 [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  -y, --yes              Skip confirmation prompts"
            echo "  --non-interactive      Run without any prompts (use defaults)"
            echo "  --admin-user USER      Set dashboard admin username"
            echo "  --admin-pass PASS      Set dashboard admin password"
            echo "  --adguard-pass PASS    Set AdGuard admin password"
            echo "  --technitium-pass PASS Set Technitium admin password"
            echo "  -h, --help             Show this help message"
            exit 0
            ;;
        *)
            log_error "Unknown option: $1"
            exit 1
            ;;
    esac
done

print_banner() {
    echo -e "${BLUE}"
    echo "â•”â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•—"
    echo "â•‘         Unified DNS Dashboard - LXC Installation            â•‘"
    echo "â•‘              AdGuard Home + Technitium DNS                  â•‘"
    echo "â•šâ•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•"
    echo -e "${NC}"
}

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

check_root() {
    if [[ $EUID -ne 0 ]]; then
        log_error "This script must be run as root"
        exit 1
    fi
}

check_os() {
    if [[ -f /etc/debian_version ]]; then
        log_info "Detected Debian-based system"
        OS="debian"
    elif [[ -f /etc/redhat-release ]]; then
        log_error "RedHat-based systems are not yet supported"
        exit 1
    else
        log_error "Unsupported operating system"
        exit 1
    fi
}

install_dependencies() {
    log_info "Installing system dependencies..."
    apt-get update
    apt-get install -y \
        curl \
        wget \
        git \
        nginx \
        openssl \
        ca-certificates \
        gnupg \
        lsb-release
}

install_nodejs() {
    log_info "Installing Node.js 20 LTS..."
    
    if command -v node &> /dev/null; then
        NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
        if [[ $NODE_VERSION -ge 18 ]]; then
            log_info "Node.js $(node -v) already installed"
            return
        fi
    fi
    
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs
    log_info "Node.js $(node -v) installed"
}

install_dotnet() {
    log_info "Installing .NET 8 Runtime (required for Technitium)..."
    
    if command -v dotnet &> /dev/null; then
        log_info ".NET already installed"
        return
    fi
    
    wget https://packages.microsoft.com/config/debian/12/packages-microsoft-prod.deb -O /tmp/packages-microsoft-prod.deb
    dpkg -i /tmp/packages-microsoft-prod.deb
    rm /tmp/packages-microsoft-prod.deb
    apt-get update
    apt-get install -y aspnetcore-runtime-8.0
    log_info ".NET Runtime installed"
}

install_adguard() {
    log_info "Installing AdGuard Home..."
    
    if [[ -f /opt/AdGuardHome/AdGuardHome ]]; then
        log_info "AdGuard Home already installed"
        return
    fi
    
    curl -s -S -L https://raw.githubusercontent.com/AdguardTeam/AdGuardHome/master/scripts/install.sh | sh -s -- -v
    
    # Wait for AdGuard to start and create config
    sleep 5
    
    log_info "AdGuard Home installed"
}

install_technitium() {
    log_info "Installing Technitium DNS Server..."
    
    if systemctl is-active --quiet dns.service 2>/dev/null; then
        log_info "Technitium DNS already installed"
        return
    fi
    
    curl -sSL https://download.technitium.com/dns/install.sh | bash
    
    # Configure Technitium to not bind to port 53 (AdGuard will use it)
    sleep 5
    
    log_info "Technitium DNS installed"
}

install_dashboard() {
    log_info "Installing Unified DNS Dashboard..."
    
    # Create user for dashboard
    if ! id "$DASHBOARD_USER" &>/dev/null; then
        useradd -r -s /bin/false -d "$INSTALL_DIR" "$DASHBOARD_USER"
    fi
    
    # Clone or update repository
    if [[ -d "$INSTALL_DIR" ]]; then
        log_info "Updating existing installation..."
        cd "$INSTALL_DIR"
        git pull
    else
        git clone https://github.com/D4rk-Sh4dw/dns-server.git "$INSTALL_DIR"
    fi
    
    cd "$INSTALL_DIR/frontend"
    
    # Create environment file
    cat > .env.local << EOF
ADGUARD_URL=http://127.0.0.1:${ADGUARD_PORT}
ADGUARD_USER=${ADGUARD_USER}
ADGUARD_PASS=${ADGUARD_PASS}
TECHNITIUM_URL=http://127.0.0.1:${TECHNITIUM_PORT}
TECHNITIUM_PASSWORD=${TECHNITIUM_PASSWORD}
AUTH_SECRET=${AUTH_SECRET}
ADMIN_USER=${ADMIN_USER}
ADMIN_PASSWORD=${ADMIN_PASSWORD}
EOF
    
    # Install dependencies and build
    log_info "Installing npm dependencies..."
    npm ci
    
    log_info "Building production bundle..."
    npm run build
    
    # Set ownership
    chown -R "$DASHBOARD_USER:$DASHBOARD_USER" "$INSTALL_DIR"
    
    log_info "Dashboard installed"
}

create_dashboard_service() {
    log_info "Creating systemd service for dashboard..."
    
    cat > /etc/systemd/system/dns-dashboard.service << EOF
[Unit]
Description=Unified DNS Dashboard
After=network.target AdGuardHome.service dns.service

[Service]
Type=simple
User=${DASHBOARD_USER}
WorkingDirectory=${INSTALL_DIR}/frontend
ExecStart=/usr/bin/npm start
Restart=on-failure
RestartSec=10
Environment=NODE_ENV=production
Environment=PORT=${DASHBOARD_PORT}

[Install]
WantedBy=multi-user.target
EOF
    
    systemctl daemon-reload
    systemctl enable dns-dashboard
    systemctl start dns-dashboard
    
    log_info "Dashboard service created and started"
}

configure_nginx() {
    log_info "Configuring Nginx reverse proxy..."
    
    cat > /etc/nginx/sites-available/dns-dashboard << 'EOF'
server {
    listen 80 default_server;
    server_name _;

    # Dashboard (main UI)
    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # AdGuard Home direct access
    location /adguard/ {
        proxy_pass http://127.0.0.1:3000/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_cache_bypass $http_upgrade;
    }

    # Technitium direct access
    location /technitium/ {
        proxy_pass http://127.0.0.1:5380/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF
    
    # Enable site and remove default
    ln -sf /etc/nginx/sites-available/dns-dashboard /etc/nginx/sites-enabled/
    rm -f /etc/nginx/sites-enabled/default
    
    # Test and reload nginx
    nginx -t
    systemctl reload nginx
    
    log_info "Nginx configured"
}

configure_ports() {
    log_info "Configuring service ports..."
    
    # Technitium should not listen on port 53 (AdGuard will)
    # This is handled via Technitium's web UI after first start
    
    log_warn "IMPORTANT: After installation, configure Technitium to NOT listen on port 53"
    log_warn "AdGuard Home will handle port 53 and forward authoritative queries to Technitium"
}

print_summary() {
    IP_ADDR=$(hostname -I | awk '{print $1}')
    
    echo ""
    echo -e "${GREEN}â•”â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•—${NC}"
    echo -e "${GREEN}â•‘                 Installation Complete!                       â•‘${NC}"
    echo -e "${GREEN}â•šâ•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•${NC}"
    echo ""
    echo -e "${BLUE}Access URLs:${NC}"
    echo -e "  Dashboard:    http://${IP_ADDR}"
    echo -e "  AdGuard:      http://${IP_ADDR}/adguard/"
    echo -e "  Technitium:   http://${IP_ADDR}/technitium/"
    echo ""
    echo -e "${BLUE}Default Credentials:${NC}"
    echo -e "  Dashboard:    ${ADMIN_USER} / ${ADMIN_PASSWORD}"
    echo -e "  AdGuard:      ${ADGUARD_USER} / ${ADGUARD_PASS}"
    echo -e "  Technitium:   admin / ${TECHNITIUM_PASSWORD}"
    echo ""
    echo -e "${YELLOW}IMPORTANT: Change these default passwords!${NC}"
    echo ""
    echo -e "${BLUE}Service Management:${NC}"
    echo -e "  systemctl status dns-dashboard"
    echo -e "  systemctl status AdGuardHome"
    echo -e "  systemctl status dns"
    echo ""
    echo -e "${BLUE}Configuration:${NC}"
    echo -e "  Dashboard:    ${INSTALL_DIR}/frontend/.env.local"
    echo -e "  AdGuard:      /opt/AdGuardHome/AdGuardHome.yaml"
    echo -e "  Technitium:   /etc/dns/config"
    echo ""
    echo -e "${YELLOW}Post-Installation Steps:${NC}"
    echo -e "  1. Complete AdGuard Home setup wizard at http://${IP_ADDR}:3000"
    echo -e "  2. Set Technitium to listen on a different port (not 53)"
    echo -e "  3. Configure AdGuard to forward DNS to Technitium for local zones"
    echo ""
}

# Main installation flow
main() {
    print_banner
    check_root
    check_os
    
    # Run interactive configuration if enabled
    if [[ "$INTERACTIVE" == true ]]; then
        interactive_config
    fi
    
    log_info "Starting installation..."
    
    install_dependencies
    install_nodejs
    install_dotnet
    install_adguard
    install_technitium
    install_dashboard
    create_dashboard_service
    configure_nginx
    configure_ports
    
    print_summary
}

# Interactive configuration
interactive_config() {
    echo ""
    echo -e "${BLUE}â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•${NC}"
    echo -e "${BLUE}                    Configuration Setup                        ${NC}"
    echo -e "${BLUE}â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•${NC}"
    echo ""
    echo -e "Press ${GREEN}Enter${NC} to accept defaults shown in ${YELLOW}[brackets]${NC}"
    echo ""
    
    # Dashboard Admin User
    read -p "Dashboard Admin Username [${ADMIN_USER}]: " input
    ADMIN_USER="${input:-$ADMIN_USER}"
    
    # Dashboard Admin Password
    read -p "Dashboard Admin Password [${ADMIN_PASSWORD}]: " input
    ADMIN_PASSWORD="${input:-$ADMIN_PASSWORD}"
    
    # AdGuard Password
    read -p "AdGuard Home Password [${ADGUARD_PASS}]: " input
    ADGUARD_PASS="${input:-$ADGUARD_PASS}"
    
    # Technitium Password
    read -p "Technitium DNS Password [${TECHNITIUM_PASSWORD}]: " input
    TECHNITIUM_PASSWORD="${input:-$TECHNITIUM_PASSWORD}"
    
    # Show summary and confirm
    echo ""
    echo -e "${BLUE}â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•${NC}"
    echo -e "${BLUE}                  Configuration Summary                        ${NC}"
    echo -e "${BLUE}â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•${NC}"
    echo ""
    echo -e "  ${GREEN}Dashboard User:${NC}     $ADMIN_USER"
    echo -e "  ${GREEN}Dashboard Pass:${NC}     $ADMIN_PASSWORD"
    echo -e "  ${GREEN}AdGuard Pass:${NC}       $ADGUARD_PASS"
    echo -e "  ${GREEN}Technitium Pass:${NC}    $TECHNITIUM_PASSWORD"
    echo ""
    echo -e "  ${GREEN}Install Directory:${NC}  $INSTALL_DIR"
    echo -e "  ${GREEN}Web Port:${NC}           $NGINX_PORT"
    echo ""
    
    if [[ "$SKIP_CONFIRM" != true ]]; then
        echo -e "${YELLOW}The following will be installed:${NC}"
        echo "  â€¢ AdGuard Home (DNS + Ad blocking)"
        echo "  â€¢ Technitium DNS Server (Authoritative DNS + DHCP)"
        echo "  â€¢ Unified DNS Dashboard (Next.js)"
        echo "  â€¢ Nginx (Reverse Proxy)"
        echo "  â€¢ Node.js 20 LTS"
        echo "  â€¢ .NET 8 Runtime"
        echo ""
        read -p "Proceed with installation? [Y/n]: " confirm
        case "$confirm" in
            [nN][oO]|[nN])
                log_info "Installation cancelled."
                exit 0
                ;;
        esac
    fi
    
    echo ""
}

# Run main function
main "$@"

