import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    'invoiceiq.agileclevel',
    'invoiceiq.agileclevel.demo',
    'localhost',
  ],
};

export default nextConfig;
