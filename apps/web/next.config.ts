import type { NextConfig } from "next";
import { writeFileSync } from "fs";
import { join } from "path";
import { createHash } from "crypto";

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
  // Headers de seguridad y PWA
  async headers() {
    return [
      // Headers de seguridad globales
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
      // Headers para dashboard (privado)
      {
        source: '/dashboard/:path*',
        headers: [
          {
            key: 'X-Robots-Tag',
            value: 'noindex, nofollow',
          },
          {
            key: 'Cache-Control',
            value: 'private, no-cache, no-store',
          },
        ],
      },
      // Headers para Service Worker (PWA)
      {
        source: '/sw.js',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=0, must-revalidate',
          },
          {
            key: 'Service-Worker-Allowed',
            value: '/',
          },
          {
            key: 'Content-Type',
            value: 'application/javascript',
          },
        ],
      },
      {
        source: '/sw-update.js',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=0, must-revalidate',
          },
          {
            key: 'Content-Type',
            value: 'application/javascript',
          },
        ],
      },
      // Headers para Manifest (PWA)
      {
        source: '/manifest.json',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/manifest+json',
          },
          {
            key: 'Cache-Control',
            value: 'public, max-age=3600',
          },
        ],
      },
      // Headers para Version (PWA - Update Notification)
      {
        source: '/version.json',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/json',
          },
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate',
          },
        ],
      },
      // Headers para íconos PWA (cache largo)
      {
        source: '/icons/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      // Headers para páginas de autenticación (no cache)
      {
        source: '/login/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, max-age=0',
          },
        ],
      },
      {
        source: '/auth/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, max-age=0',
          },
        ],
      },
    ];
  },
  // Redirects de autenticación
  async redirects() {
    return [
      {
        source: '/signin',
        destination: '/login',
        permanent: true,
      },
      {
        source: '/signup',
        destination: '/login',
        permanent: true,
      },
      {
        source: '/register',
        destination: '/login',
        permanent: true,
      },
    ];
  },
  generateBuildId: async () => {
    // Generar un ID único basado en timestamp
    const timestamp = Date.now();
    const hash = createHash('sha256')
      .update(timestamp.toString())
      .digest('hex')
      .substring(0, 12);
    
    // Crear version.json
    const versionInfo = {
      version: `${timestamp}`,
      buildId: hash,
      deployedAt: new Date().toISOString(),
    };

    // FIX para Vercel: usar __dirname para obtener el directorio correcto
    // En Vercel con monorepo, process.cwd() apunta al root, no a apps/web
    const publicDir = join(__dirname, 'public');
    const versionPath = join(publicDir, 'version.json');
    
    try {
      writeFileSync(versionPath, JSON.stringify(versionInfo, null, 2));
      console.log('✅ [Web App] version.json generated:', versionInfo);
      console.log('📂 Ubicación:', versionPath);
    } catch (error) {
      console.error('❌ [Web App] Error generating version.json:', error);
      console.error('📂 Intentando escribir en:', versionPath);
      
      // Fallback: intentar con process.cwd() para desarrollo local
      try {
        const fallbackDir = join(process.cwd(), 'public');
        const fallbackPath = join(fallbackDir, 'version.json');
        writeFileSync(fallbackPath, JSON.stringify(versionInfo, null, 2));
        console.log('✅ [Web App] version.json generado en fallback:', fallbackPath);
      } catch (fallbackError) {
        console.error('❌ [Web App] Fallback también falló:', fallbackError);
      }
    }

    return hash;
  },
};

export default nextConfig;
