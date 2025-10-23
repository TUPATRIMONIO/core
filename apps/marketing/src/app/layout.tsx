import type { Metadata } from "next";
import { Inter } from 'next/font/google';
import { LocationProvider } from '../components/LocationProvider';
import { VersionNotificationProvider } from '../components/VersionNotificationProvider';
import "../../../../packages/ui/globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL('https://tupatrimonio.app'),
  title: {
    default: "TuPatrimonio - Firmas Electrónicas, Verificación Digital y Notaría Online",
    template: "%s | TuPatrimonio"
  },
  description: "Digitaliza tus procesos legales con TuPatrimonio: firmas electrónicas válidas, verificación de identidad biométrica y servicios notariales 100% online. Prueba gratis.",
  keywords: ["firma electrónica", "verificación identidad", "notaría digital", "Chile", "documentos digitales"],
  authors: [{ name: "TuPatrimonio Team" }],
  creator: "TuPatrimonio",
  publisher: "TuPatrimonio",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'es_CL',
    url: 'https://tupatrimonio.app',
    siteName: 'TuPatrimonio',
    title: 'TuPatrimonio - Servicios Legales Digitales con IA',
    description: 'Firmas electrónicas, verificación de identidad y notaría digital. Digitaliza tus procesos legales de forma segura y eficiente.',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'TuPatrimonio - Servicios Legales Digitales'
      }
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TuPatrimonio - Servicios Legales Digitales',
    description: 'Firmas electrónicas, verificación de identidad y notaría digital. Digitaliza tus procesos legales.',
    images: ['/og-image.jpg'],
    creator: '@tupatrimonio',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es-CL">
      <head>
        {/* Meta tags para información de build */}
        <meta name="build-timestamp" content={process.env.BUILD_TIMESTAMP || Date.now().toString()} />
        <meta name="app-version" content={process.env.npm_package_version || '0.1.0'} />
      </head>
      <body className={inter.className}>
        <VersionNotificationProvider />
        <LocationProvider>
          <main>{children}</main>
        </LocationProvider>
      </body>
    </html>
  );
}
