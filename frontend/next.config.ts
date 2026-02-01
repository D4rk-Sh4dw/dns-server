import type { NextConfig } from "next";

const nextConfig = {
  output: "standalone",
  experimental: {
    instrumentationHook: true,
  },
  /* config options here */
};

export default nextConfig;
