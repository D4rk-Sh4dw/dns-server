# New Direction: Unified DNS Management Dashboard

**Objective:** Create a central GUI (Dashboard) to manage standard, official instances of **AdGuard Home** and **Technitium DNS Server**. 

**NO** custom DNS engine. **NO** rewriting DNS logic.

## Architecture

1.  **Underlying Services (Docker Containers)**:
    *   **AdGuard Home**: Handles Recursive DNS, Ad-Blocking, Logging.
    *   **Technitium DNS**: Handles Authoritative DNS (Zones, Records).
    *   *(Optional)* **Unbound**: If needed for recursive caching, otherwise AdGuard handles this.

2.  **The "Product" (What we build)**:
    *   A **Unified Dashboard** (Web UI).
    *   **Backend Wrapper**: A thin API layer that proxies requests to AdGuard and Technitium APIs.

## Functionality
*   **Single Login**: Log into the Unified Dashboard.
*   **Combined Stats**: See query counts from AdGuard and Zone stats from Technitium on one screen.
*   **Blocklist Manager**: UI sends "Add Blocklist" command to AdGuard APIs.
*   **Zone Manager**: UI sends "Add Zone/Record" command to Technitium APIs.

## Next Steps (If approved)
1.  Move current custom code to a `_archive` folder.
2.  Create a new `docker-compose.yml` deploying official `adguard/adguardhome` and `technitium/dns-server`.
3.  Scaffold a simpler Next.js/React app that consumes their APIs.
