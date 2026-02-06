# Unified DNS Dashboard

This project is a centralized management interface that unifies **AdGuard Home** and **Technitium DNS Server** into a "Single Pane of Glass" experience.

## Architecture

We leverage best-in-class open source solutions:

*   **AdGuard Home**: Handles network-wide ad blocking, tracking protection, and recursing.
*   **Technitium DNS**: Handles authoritative DNS zones, advanced records, and DHCP.
*   **Unified Dashboard**: A custom Next.js Web UI that connects to both APIs.

### Split DNS & Active Directory

The system supports a hybrid architecture:
1.  **Standard Zones**: Managed natively in Technitium (e.g. `home.arpa`).
2.  **Split DNS / Conditional Forwarding**: Technitium can forward specific domains (like Active Directory zones) to upstream servers (e.g. Domain Controllers), while resolving everything else locally.

### Quick Start (Standalone Docker)

If you don't want to clone the repository, you can deploy the infrastructure with a single command:

```bash
bash -c "$(wget -qLO - https://raw.githubusercontent.com/D4rk-Sh4dw/dns-server/main/install/standalone_init.sh)"
```

This will download the `docker-compose.yml` and the necessary default configurations.
    *   **Default Login:** `admin` / `admin123`
    *   **AdGuard Direct:** http://localhost/adguard/
    *   **Technitium Direct:** http://localhost/technitium/

### Proxmox / LXC (Docker-in-LXC)

For Proxmox users, the easiest way is to run the Docker setup inside an LXC container.

**Requirements:**
- **Nesting: Enabled** (LXC -> Options -> Features -> Nesting)
- **Linux: Debian or Ubuntu** based LXC.

**Installation:**
1.  Create your LXC container and enable the **Nesting** feature.
2.  Run the following command inside the LXC:
    ```bash
    bash -c "$(wget -qLO - https://raw.githubusercontent.com/D4rk-Sh4dw/dns-server/main/install/lxc_install.sh)"
    ```

## Updating

To get the latest features (like the new search or CSV import):

```bash
git pull
docker compose up -d --build
```

## Managing Filter Lists (CSV Support)

The dashboard supports managing blocklists and whitelists via CSV files hosted on GitHub or uploaded manually.

### 1. CSV Format

**Blocklist (`blocklists.csv`):**
```csv
enabled,url,name,id
true,https://example.com/list.txt,My Blocklist,1
false,https://example.com/other.txt,Disabled List,2
```

**Whitelist (`whitelists.csv`):**
Supports both the CSV format above OR standard AdGuard rule format:
```text
@@||example.com^$important
@@||trusted.org^
```

### 2. Loading from GitHub

To automatically load lists from a repository:
1.  Upload your CSV to GitHub.
2.  Get the **Raw URL**.
3.  Configure it in `.env` (frontend) or `frontend/config/csv-config.ts`.

### 3. Manual Import

1.  Go to **Filtering**.
2.  Click **"Import CSV"**.
3.  Upload your file and select which lists to apply.

## Security Best Practices

> [!WARNING]
> **Change Default Credentials Immediately!**
> The default credentials (`admin` / `admin123`) are publicly known and must be changed before exposing your system to any network.

### Required Environment Variables

The following environment variables **must** be set in your `docker-compose.yml`:

- `ADMIN_USER` - Dashboard login username
- `ADMIN_PASSWORD` - Dashboard login password
- `AUTH_SECRET` - Secret key for session encryption (use a strong random string)
- `ADGUARD_USER` - AdGuard Home username
- `ADGUARD_PASS` - AdGuard Home password
- `TECHNITIUM_PASSWORD` - Technitium DNS admin password

### OPNsense Integration (Optional)

If you're integrating with OPNsense that uses a self-signed certificate:
- The system supports SSL verification bypass per-request (not globally)
- Configure `skip_ssl_verify: true` in your OPNsense configuration
- This is safe as it only affects OPNsense API calls

## Security & Passwords

The system uses centralized credentials to enable the "Single Pane of Glass" experience and autologin features. If you change a password, you must update it in the `docker-compose.yml` (or your `.env`) to keep the services connected.

### 1. Changing Technitium DNS Password
1.  Open the **Technitium UI** (directly or via Dashboard).
2.  Go to **Settings -> User Accounts** and change the password for `admin`.
3.  Update `TECHNITIUM_PASSWORD` and `DNS_SERVER_ADMIN_PASSWORD` in your `docker-compose.yml`.
4.  Restart with `docker compose up -d`.

### 2. Changing AdGuard Home Password
1.  Open the **AdGuard UI** (directly or via Dashboard).
2.  Go to **Settings -> General Settings** and change the password for your user.
3.  Update `ADGUARD_PASS` in your `docker-compose.yml`.
4.  Restart with `docker compose up -d`.
    *Note: The Dashboard and Autologin require the clear-text password to communicate with the AdGuard API.*

### 3. Changing Dashboard Login
The main login for the Unified Dashboard is managed solely via environment variables:
1.  Update `ADMIN_USER` and `ADMIN_PASSWORD` in your `docker-compose.yml`.
2.  Restart with `docker compose up -d`.

## Project Structure

*   `dashboard/` (frontend): Next.js management application.
*   `data/`: Persistent storage for AdGuard and Technitium.
