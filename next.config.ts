import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: ['res.cloudinary.com'], // Add this line to whitelist Cloudinary hostname
  },
  /* config options here */
};

export default nextConfig;