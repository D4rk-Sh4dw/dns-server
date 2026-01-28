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
    docker-compose up -d
    ```

2.  Access the services:
    *   **AdGuard Home**: http://localhost:3001
    *   **Technitium**: http://localhost:5380

3.  (Coming Soon) Access the **Unified Dashboard** on http://localhost:3000

## Project Structure

*   `dashboard/`: The React/Next.js management application (Work In Progress).
*   `archive/`: Legacy custom DNS engine attempts (Deprecated).
*   `data/`: Persistent storage for Docker containers.
