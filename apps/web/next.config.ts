import type { NextConfig } from "next";
import { writeFileSync, existsSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { createHash } from "crypto";
import { fileURLToPath } from "url";

// Fix para ESM: __dirname no existe en módulos ES
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

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

    console.log('🔧 [Web App] Generando version.json...');
    console.log('📍 __dirname:', __dirname);
    console.log('📍 process.cwd():', process.cwd());
    
    // ESTRATEGIA MÚLTIPLE: intentar varios métodos para asegurar que funcione
    const strategies = [
      {
        name: 'ESM __dirname',
        dir: join(__dirname, 'public'),
      },
      {
        name: 'process.cwd() directo',
        dir: join(process.cwd(), 'public'),
      },
      {
        name: 'process.cwd() con apps/web',
        dir: join(process.cwd(), 'apps', 'web', 'public'),
      },
    ];

    let success = false;
    
    for (const strategy of strategies) {
      try {
        const versionPath = join(strategy.dir, 'version.json');
        
        // Asegurar que el directorio existe
        if (!existsSync(strategy.dir)) {
          console.log(`📁 Creando directorio: ${strategy.dir}`);
          mkdirSync(strategy.dir, { recursive: true });
        }
        
        writeFileSync(versionPath, JSON.stringify(versionInfo, null, 2));
        console.log(`✅ [${strategy.name}] version.json generado exitosamente`);
        console.log(`📂 Ubicación: ${versionPath}`);
        console.log(`📄 Contenido:`, versionInfo);
        success = true;
        break; // Salir del loop si tuvo éxito
      } catch (error) {
        console.log(`⚠️ [${strategy.name}] Falló:`, error instanceof Error ? error.message : error);
      }
    }
    
    if (!success) {
      console.error('❌ [Web App] TODAS las estrategias fallaron para generar version.json');
      console.error('⚠️ El sistema de notificaciones de actualización NO funcionará');
    }

    return hash;
  },
};

export default nextConfig;
