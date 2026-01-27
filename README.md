# Unified DNS Platform

A modern, high-performance, and modular DNS platform designed to replace ad-hoc setups like AdGuard Home, Pi-hole, and Unbound. Built with **Rust** (Data Plane), **Go** (Control Plane), and **React** (Frontend).

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Status](https://img.shields.io/badge/status-MVP-green.svg)

## 🚀 Features

- **High Performance DNS**: Powered by Rust (`hickory-dns`) with multi-threading and async I/O.
- **Modern Control Plane**: RESTful API written in Go for managing tenants, zones, and policies.
- **Real-time Updates**: Configuration changes (e.g., new blocklists) are synced instantly via Redis Pub/Sub.
- **Multi-Tenancy**: Built from the ground up to support multiple isolated users/tenants.
- **Beautiful Dashboard**: A modern React-based UI for monitoring and configuration.
- **CI/CD Integrated**: Auto-builds Docker images via Gitea Actions.

## 🏗 Architecture

The platform consists of three main microservices:

1.  **Data Plane (`data-plane/`)**: The actual DNS server (Rust). Handles queries, filtering, and caching.
2.  **Control Plane (`control-plane/`)**: The management API (Go). Handles DB storage and business logic.
3.  **Frontend (`frontend/`)**: The web interface (React/Vite).

Infrastructure dependencies:
- **PostgreSQL**: Persistent storage for configuration.
- **Redis**: Caching and Message Bus for real-time config sync.

## 🛠 Local Development

### Prerequisites
- Docker & Docker Compose
- Go 1.21+ (optional, for local api dev)
- Rust 1.75+ (optional, for local dns dev)
- Node.js 18+ (optional, for local frontend dev)

### Quick Start (Dev Mode)
To spin up the entire stack locally in development mode:

```bash
docker-compose up --build
```

This will expose:
- **Frontend**: http://localhost:3000
- **API**: http://localhost:8080
- **DNS**: Port 1053 (UDP/TCP)

## 📦 Deployment (Production)

The project includes a production-ready `docker-compose.yml` that pulls optimized images from your Gitea Registry.

### 1. Prerequisites
- A server with Docker & Docker Compose installed.
- Access to the Gitea Registry (`gitea.vmhaus.de`).

### 2. Setup
On your target server:

1.  Create a deployment directory.
2.  Copy the `deploy/` folder contents (`docker-compose.yml` and `.env.example`) to the server.
3.  Rename `.env.example` to `.env` and adjust passwords/ports if needed.

```bash
mv .env.example .env
nano .env
```

### 3. Run
Log in to the registry (if private):
```bash
docker login gitea.vmhaus.de
```

Start the stack:
```bash
docker-compose up -d
```

Your DNS server is now running on Port 53 (default)!

## 🔄 CI/CD Pipeline

This repository uses **Gitea Actions** to automatically build and push Docker images.
- **Workflow file**: `.gitea/workflows/docker-build.yaml`
- **Trigger**: Push to `main` branch.
- **Target**: `gitea.vmhaus.de/marcel/dns-[service]:latest`

To configure the workflow, ensure these Secrets are set in Gitea:
- `DOCKER_USERNAME`: Your Gitea username.
- `DOCKER_TOKEN`: An Access Token with `write:package` scope.

---
*Created by Antigravity*
