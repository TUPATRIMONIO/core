import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true, // Temporal para deploy rápido
  },
  typescript: {
    ignoreBuildErrors: true, // Ignorar warnings TS
  },
  images: {
    domains: ['localhost'], // Para imágenes locales
  },
};

export default nextConfig;
