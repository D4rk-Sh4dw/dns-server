# Reverse DNS & OPNsense Integration

This document outlines the two primary methods for resolving local hostnames and tracking devices within the DNS Server environment.

## Method 1: Generic PTR Resolution (AdGuard Home)

This is the standard DNS-based approach. When AdGuard Home sees an IP address, it sends a `PTR` (Reverse DNS) query to a designated internal server.

### How it works
1. **Request:** AdGuard receives a query or processes a log entry for `192.168.1.50`.
2. **Forwarding:** AdGuard sends a query for `50.1.168.192.in-addr.arpa` to the configured Reverse DNS IP.
3. **Response:** The internal server (e.g., OPNsense, AD Domain Controller) responds with the hostname (e.g., `laptop.lan`).
4. **Result:** The AdGuard dashboard and Query Logs show the hostname instead of the IP.

### Configuration
- **Location:** Settings -> Reverse DNS & Client Resolution.
- **Field:** `Private Reverse DNS Servers`.
- **Target:** The IP address of your DHCP server (e.g., OPNsense IP).

---

---

## Method 2: OPNsense API Integration (Discovery)

Beyond simple DNS resolution, this method uses the OPNsense API to directly fetch the DHCP lease table from various backends (Dnsmasq or Kea).

### Why use the API?
- **Visibility:** See devices even if they haven't sent a DNS query yet.
- **Backend Support:** Our integration supports modern Kea DHCP (`/api/kea/leases4`) and Dnsmasq (`/api/dnsmasq/leases`).
- **Metadata:** Retrieve MAC addresses, lease expiration times, and static vs. dynamic status.

### Setup Guide
3. **Set Permissions (ACLs) in OPNsense:**
   - Go to **System > Access > Users** and select your API user.
   - Under **Effective Privileges**, add:
     - **For Kea:** `Services: Kea DHCP: Leases4`
     - **For Dnsmasq:** `Services: Dnsmasq: Leases`
   - **Note on SSL:** The dashboard automatically supports self-signed certificates, which is common for firewalls in local networks.
4. **Configure in Dashboard:**
   - Go to **Settings -> OPNsense Integration**.
   - Select your **DHCP Backend** (Kea or Dnsmasq).
   - Enter your **OPNsense URL**, **API Key**, and **API Secret**.

## Strategic Choice: OPNsense vs. Technitium

It is important to understand when to use which system for Reverse DNS to avoid stale records.

### Case A: Dynamic Devices (DHCP)
- **Examples:** Laptops, Smartphones, dynamic VMs.
- **Handling:** **Do not create manual PTR records.**
- **Workflow:** Let OPNsense handle these. Ensure "Register DHCP Leases" is enabled in OPNsense Unbound/Dnsmasq. AdGuard will query OPNsense via the configured Reverse DNS IP and get the current, live hostname.

### Case B: Critical Infrastructure (Fixed IPs)
- **Examples:** Switches, NAS, Proxies, fixed Servers.
- **Handling:** **Create manual PTR records in Technitium.**
- **Workflow:** Assign a "Static Lease" (Reservation) in OPNsense or hardcode the IP on the device. Then, create the matching PTR record in our "Zones & Records" dashboard. This ensures the name is always resolvable, even if the DHCP server is down.

---

## Method 3: Manual Static Mapping (The "Clean" Way)

For devices with hardcoded IPs (e.g., switches, printers) that don't appear in DHCP, you should create a Reverse Zone in Technitium.

### Setting up a Reverse Zone for `192.168.1.x`
1. **In our Dashboard:** Go to **Zones & Records**.
2. **Helper:** Click **Add Zone** and use the **Reverse DNS Helper** tab.
3. **Subnet:** Enter your subnet (e.g., `192.168.1.0`).
4. **Auto-Format:** The dashboard will automatically create the zone `1.168.192.in-addr.arpa`.
5. **Add Records:** Inside the zone, add **PTR** records by entering just the last part of the IP (e.g., `50`).

> [!TIP]
> Even for static devices, it is **highly recommended** to add them as "Static Leases" in OPNsense. Even if the device doesn't request an IP, the API will still "know" about the entry, allowing it to show up in our Dashboard.

## Best Practices
- **Enable Hostname Registration:** In OPNsense (Unbound), ensure "Register DHCP Leases" is enabled.
- **Match Subnets:** Ensure the Reverse Zone in Technitium matches exactly the subnet managed by OPNsense.
