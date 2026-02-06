import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  experimental: {
    serverActions: {
      bodySizeLimit: '500mb', // Increase to support large backup files
    },
  },
};

export default nextConfig;
