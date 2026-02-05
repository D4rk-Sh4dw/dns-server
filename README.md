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

## Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/D4rk-Sh4dw/dns-server.git
    cd dns-server
    ```

2.  **Start the infrastructure:**
    ```bash
    docker compose up -d
    ```

3.  Access the **Unified Dashboard**: http://localhost (Port 80)
    *   **Default Login:** `admin` / `admin123`
    *   **AdGuard Direct:** http://localhost/adguard/
    *   **Technitium Direct:** http://localhost/technitium/


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

## Security & Passwords

Passwords for services are managed via `docker-compose.yml`.

*   **Technitium & Dashboard**: Update `docker-compose.yml` and rebuild (`docker compose up -d --build`).
*   **AdGuard Home**: Change in AdGuard Web UI **AND** update `docker-compose.yml` to match (required for autologin).

## Project Structure

*   `dashboard/` (frontend): Next.js management application.
*   `data/`: Persistent storage for AdGuard and Technitium.
