import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  experimental: {
    serverActions: {
      bodySizeLimit: '500mb', // Increase to support large backup files
    },
    middlewareClientMaxBodySize: '500mb', // Allow large uploads through middleware
  },
};

export default nextConfig;
