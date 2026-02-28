import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["http://127.0.0.1:3000"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "i.scdn.co" },
      { protocol: "https", hostname: "*.ticketmaster.com" },
      { protocol: "https", hostname: "s1.ticketimg.com" },
    ],
  },
};

export default nextConfig;
