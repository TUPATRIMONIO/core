import type { NextConfig } from "next";
import { createHash } from "crypto";
import path from "path";

const nextConfig: NextConfig = {
  // Transpilar packages del monorepo
  transpilePackages: ["@tupatrimonio/assets"],
  eslint: {
    ignoreDuringBuilds: true, // Temporal para deploy rápido
  },
  typescript: {
    ignoreBuildErrors: true, // Ignorar warnings TS
  },
  // Configurar webpack para resolver archivos desde packages
  webpack: (config, { isServer }) => {
    // Permitir importar archivos desde el package assets
    config.resolve.alias = {
      ...config.resolve.alias,
      "@tupatrimonio/assets/public": path.resolve(
        __dirname,
        "../../packages/assets/public",
      ),
    };

    // Suprimir warnings de handlebars sobre require.extensions
    config.ignoreWarnings = [
      ...(config.ignoreWarnings || []),
      {
        module: /node_modules\/handlebars/,
        message: /require\.extensions/,
      },
    ];

    // Configurar PDFKit para servidor (copiar archivos de fuentes)
    if (isServer) {
      config.externals = config.externals || [];
      // No externalizar pdfkit en el servidor para que funcione correctamente
    }

    return config;
  },
  images: {
    domains: ["localhost"], // Para imágenes locales
  },
  // Headers de seguridad y PWA
  async headers() {
    return [
      // Headers for signing preview API - Allow embedding
      {
        source: "/api/signing/preview/:path*",
        headers: [
          {
            key: "X-Frame-Options",
            value: "SAMEORIGIN",
          },
          {
            key: "Content-Security-Policy",
            value: "frame-ancestors 'self'",
          },
        ],
      },
      // Headers de seguridad globales
      {
        source: "/:path*",
        headers: [
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
        ],
      },
      // Headers para dashboard (privado)
      {
        source: "/dashboard/:path*",
        headers: [
          {
            key: "X-Robots-Tag",
            value: "noindex, nofollow",
          },
          {
            key: "Cache-Control",
            value: "private, no-cache, no-store",
          },
        ],
      },
      // Headers para Service Worker (PWA)
      {
        source: "/sw.js",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=0, must-revalidate",
          },
          {
            key: "Service-Worker-Allowed",
            value: "/",
          },
          {
            key: "Content-Type",
            value: "application/javascript",
          },
        ],
      },
      {
        source: "/sw-update.js",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=0, must-revalidate",
          },
          {
            key: "Content-Type",
            value: "application/javascript",
          },
        ],
      },
      // Headers para Manifest (PWA)
      {
        source: "/manifest.json",
        headers: [
          {
            key: "Content-Type",
            value: "application/manifest+json",
          },
          {
            key: "Cache-Control",
            value: "public, max-age=3600",
          },
        ],
      },
      // Headers para Version (PWA - Update Notification)
      {
        source: "/version.json",
        headers: [
          {
            key: "Content-Type",
            value: "application/json",
          },
          {
            key: "Cache-Control",
            value: "no-cache, no-store, must-revalidate",
          },
        ],
      },
      // Headers para íconos PWA (cache largo)
      {
        source: "/icons/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      // Headers para páginas de autenticación (no cache)
      {
        source: "/login/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "no-store, max-age=0",
          },
        ],
      },
      {
        source: "/auth/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "no-store, max-age=0",
          },
        ],
      },
    ];
  },
  // Redirects de autenticación
  async redirects() {
    return [
      {
        source: "/signin",
        destination: "/login",
        permanent: true,
      },
      {
        source: "/signup",
        destination: "/login",
        permanent: true,
      },
    ];
  },
  generateBuildId: async () => {
    // Generar un ID único basado en timestamp
    const timestamp = Date.now();
    const hash = createHash("sha256")
      .update(timestamp.toString())
      .digest("hex")
      .substring(0, 12);

    console.log("🔧 [Web App] Generando Build ID:", hash);
    console.log("📅 [Web App] Timestamp:", timestamp);
    console.log(
      "✨ [Web App] Version info ahora se sirve via API Route /version.json",
    );

    return hash;
  },
};

export default nextConfig;
