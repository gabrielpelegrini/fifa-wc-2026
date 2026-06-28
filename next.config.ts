import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // "standalone" removed — Vercel handles output natively.
  // Use "build:standalone" script for Docker/self-hosted deployments.
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
};

export default nextConfig;
