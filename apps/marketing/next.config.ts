import type { NextConfig } from "next";
import { createHash } from "crypto";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true, // Temporal para deploy rápido
  },
  typescript: {
    ignoreBuildErrors: true, // Ignorar warnings TS
  },
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '54321',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'http',
        hostname: '127.0.0.1',
        port: '54321',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
  /*
  // Redirects para URLs antiguas
  async redirects() {
    return [
      // Redirigir páginas antiguas de servicios a verticales
      {
        source: '/firmas-electronicas',
        destination: '/legal-tech/firma-electronica',
        permanent: true,
      },
      {
        source: '/notaria-digital',
        destination: '/legal-tech/tramites-notariales',
        permanent: true,
      },
      {
        source: '/verificacion-identidad',
        destination: '/cl/verificacion-identidad', // Por defecto a Chile
        permanent: false,
      },
      // Redirigir servicios por país a nuevas rutas
      {
        source: '/cl/firmas-electronicas',
        destination: '/legal-tech/firma-electronica',
        permanent: true,
      },
      {
        source: '/cl/notaria-online',
        destination: '/legal-tech/tramites-notariales',
        permanent: true,
      },
      {
        source: '/mx/firmas-electronicas',
        destination: '/legal-tech/firma-electronica',
        permanent: true,
      },
      {
        source: '/co/firmas-electronicas',
        destination: '/legal-tech/firma-electronica',
        permanent: true,
      },
      // Redirigir páginas legales antiguas
      {
        source: '/cl/legal/terminos',
        destination: '/terminos-y-condiciones',
        permanent: true,
      },
      {
        source: '/cl/legal/privacidad',
        destination: '/politica-privacidad',
        permanent: true,
      },
      {
        source: '/cl/legal/cookies',
        destination: '/politica-privacidad',
        permanent: true,
      },
    ];
  },
  */
  generateBuildId: async () => {
    // Generar un ID único basado en timestamp
    const timestamp = Date.now();
    const hash = createHash('sha256')
      .update(timestamp.toString())
      .digest('hex')
      .substring(0, 12);
    
    console.log('🔧 [Marketing App] Generando Build ID:', hash);
    console.log('📅 [Marketing App] Timestamp:', timestamp);
    console.log('✨ [Marketing App] Version info ahora se sirve via API Route /version.json');

    return hash;
  },
};

export default nextConfig;
