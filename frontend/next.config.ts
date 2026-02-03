import type { NextConfig } from "next";

const nextConfig = {
  output: "standalone",

  async rewrites() {
    return [
      {
        source: "/adguard/:path*",
        destination: "http://dns-adguard:3000/:path*",
      },
      {
        source: "/technitium/:path*",
        destination: "http://dns-technitium:5380/:path*",
      },
      // Fallback for static assets that might be requested at root by these apps
      // This is a "best effort" to catch some common assets if they leak out of the subpath
      // Note: This might conflict if both apps use the same filenames.
      // We prioritize AdGuard for now as it's more likely to be user-facing.
      {
        source: "/control/:path*",
        destination: "http://dns-adguard:3000/control/:path*",
      },
      {
        source: "/login.html",
        destination: "http://dns-adguard:3000/login.html",
      },
    ];
  },

  export default nextConfig;
