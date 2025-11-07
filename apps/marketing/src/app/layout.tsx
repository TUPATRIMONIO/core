import type { Metadata } from "next";
import { Outfit, Nunito, Quicksand, Josefin_Sans } from 'next/font/google';
import { LocationProvider } from '../components/LocationProvider';
import { ConditionalUpdateNotification } from '../components/ConditionalUpdateNotification';
import { ServiceWorkerRegistration } from '../components/ServiceWorkerRegistration';
import { GoogleAnalytics } from '../components/GoogleAnalytics';
import { StructuredData, generateOrganizationSchema, generateWebSiteSchema } from '../components/StructuredData';
import { ThemeProvider } from '../components/theme-provider';
import { FloatingActions } from '../components/FloatingActions';
import "../../../../packages/ui/globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
});

const nunito = Nunito({
  subsets: ["latin"],
  weight: ["200", "300", "400", "500", "600", "700", "800"],
  variable: "--font-nunito",
  display: "swap",
});

const quicksand = Quicksand({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-quicksand",
  display: "swap",
});

const josefinSans = Josefin_Sans({
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700"],
  variable: "--font-josefin-sans",
  display: "swap",
});

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
  // Google Search Console verification
  // Reemplazar "PASTE_YOUR_VERIFICATION_CODE_HERE" con el código que te da Google
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || '',
  },
  icons: {
    icon: '/icon.png',
    shortcut: '/favicon.ico',
    apple: '/apple-icon.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es-CL" className={`${outfit.variable} ${nunito.variable} ${quicksand.variable} ${josefinSans.variable} antialiased`} suppressHydrationWarning>
      <head>
        <GoogleAnalytics />
      </head>
      <body className={outfit.className}>
        <ThemeProvider>
          <ServiceWorkerRegistration />
          
          {/* Structured Data for SEO */}
          <StructuredData data={generateOrganizationSchema()} />
          <StructuredData data={generateWebSiteSchema()} />
          
          <LocationProvider>
            <ConditionalUpdateNotification />
            <main>{children}</main>
          </LocationProvider>

          {/* Floating Actions: Theme switcher y futuras acciones rápidas */}
          <FloatingActions />
        </ThemeProvider>
      </body>
    </html>
  );
}
