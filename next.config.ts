import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "placehold.co",
      },
      {
        protocol: "https",
        hostname: "media.ticketmaster.com",
      },
      {
        protocol: "https",
        hostname: "prismic-images.tmol.io",
      },
    ],
  },
};

export default nextConfig;
