import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    // Las fotos de producto se sirven desde /public/uploads (mismo origen).
    formats: ["image/avif", "image/webp"],
    dangerouslyAllowSVG: true,
    contentDispositionType: "attachment",
  },
  experimental: {
    optimizePackageImports: ["@react-three/drei"],
  },
};

export default nextConfig;
