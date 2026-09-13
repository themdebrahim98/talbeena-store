import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Product photos served from Firebase Storage (signed + public URLs).
    remotePatterns: [
      { protocol: "https", hostname: "storage.googleapis.com" },
      { protocol: "https", hostname: "firebasestorage.googleapis.com" },
    ],
  },
};

export default nextConfig;
