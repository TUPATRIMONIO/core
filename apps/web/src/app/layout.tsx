import type {Metadata, Viewport} from "next";
import { Outfit, Nunito, Quicksand, Josefin_Sans } from 'next/font/google';
import { cn } from "@/lib/utils";
import { UpdateNotification } from '@tupatrimonio/update-notifier';
import { ServiceWorkerRegistration } from '../components/shared/ServiceWorkerRegistration';
import { GoogleAnalytics } from '../components/shared/GoogleAnalytics';
import { ThemeProvider } from '../components/providers/theme-provider';
import { FloatingActions } from '../components/shared/FloatingActions';
import { AuthListener } from '../components/auth/AuthListener';
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
  title: "TuPatrimonio - Gestión de Patrimonio Personal",
  description: "Plataforma para gestionar y hacer seguimiento de tu patrimonio personal",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "TuPatrimonio",
  },
  icons: {
    icon: [
      { url: '/icons/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/icons/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: '/icons/apple-touch-icon.png',
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: "cover",
  themeColor: "#800039",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={cn(
      `${outfit.variable} ${nunito.variable} ${quicksand.variable} ${josefinSans.variable} antialiased`
    )} suppressHydrationWarning>
      <head>
        <GoogleAnalytics />
      </head>
      <body className={cn("bg-background text-foreground", outfit.className)}>
        <ThemeProvider>
          <AuthListener />
          <ServiceWorkerRegistration />
          <UpdateNotification />
          <main className="min-h-screen">
            {children}
          </main>

          {/* Botón flotante de cambio de tema y WhatsApp */}
          <FloatingActions />
        </ThemeProvider>
      </body>
    </html>
  );
}