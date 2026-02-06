import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  experimental: {
    serverActions: {
      bodySizeLimit: '50mb', // Increase from default 1MB to support backup files
    },
  },
};

export default nextConfig;
