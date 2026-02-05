# Unified DNS Dashboard

This project is a centralized management interface that unifies **AdGuard Home** and **Technitium DNS Server**.

## Architecture

Instead of reinventing the wheel, we leverage best-in-class open source solutions:

*   **AdGuard Home**: Used for network-wide ad blocking, tracking protection, and as the primary recursive resolver for clients.
*   **Technitium DNS**: Used for authoritative DNS capabilities, managing local zones, DHCP, and advanced records.
*   **Unified Dashboard**: A custom-built Web UI that connects to the APIs of both services to provide a "Single Pane of Glass" experience.

## Quick Start

1.  Start the infrastructure:
    ```bash
    docker compose up -d
    ```

2.  Access the **Unified Dashboard**: http://localhost (Port 80)
    *   **Default Login:** `admin` / `admin123`
    *   **AdGuard Direct:** http://localhost/adguard/
    *   **Technitium Direct:** http://localhost/technitium/

## Security & Passwords

The system uses **Environment Variables** in `docker-compose.yml` to manage passwords for the Dashboard, autologin scripts, and service credentials.

### How to Change Passwords

**1. Technitium DNS**
*   **Method:** Fully automated via `docker-compose.yml`.
*   **Steps:**
    1.  Edit `docker-compose.yml`.
    2.  Change `TECHNITIUM_PASSWORD` (and `DNS_SERVER_ADMIN_PASSWORD` in the technitium service).
    3.  Run `docker compose up -d --build`.
    4.  **Result:** The service password works, and the Dashboard autologin updates automatically.

**2. AdGuard Home**
*   **Method:** Hybrid (Web UI + Config).
*   **Steps:**
    1.  Log in to AdGuard Home manually.
    2.  Go to **Settings > General Settings** and change the password.
    3.  **IMPORTANT:** You must now update `docker-compose.yml` with the *same* password in the `ADGUARD_PASS` variable.
    4.  Run `docker compose up -d --build`.
    5.  **Result:** The Dashboard autologin will now use the new password. If you forget step 3, the autologin will fail.

**3. Dashboard Login**
*   **Method:** Managed via `docker-compose.yml`.
*   **Steps:**
    1.  Edit `docker-compose.yml`.
    2.  Change `ADMIN_PASSWORD` in the `dashboard` service environment.
    3.  Run `docker compose up -d --build`.


## Project Structure

*   `dashboard/`: The React/Next.js management application (Work In Progress).
*   `archive/`: Legacy custom DNS engine attempts (Deprecated).
*   `data/`: Persistent storage for Docker containers.
