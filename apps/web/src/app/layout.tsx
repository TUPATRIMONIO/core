import type {Metadata} from "next";
import {Geist, Geist_Mono, Outfit} from "next/font/google";
import { cn } from "@/lib/utils";
import { LocationProvider } from '../components/LocationProvider';
import { UpdateNotification } from '@tupatrimonio/update-notifier';
import { ServiceWorkerRegistration } from '../components/ServiceWorkerRegistration';
import { GoogleAnalytics } from '../components/GoogleAnalytics';
import "../../../../packages/ui/globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "TuPatrimonio - Gestión de Patrimonio Personal",
  description: "Plataforma para gestionar y hacer seguimiento de tu patrimonio personal",
  manifest: "/manifest.json",
  themeColor: "#800039",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "TuPatrimonio",
  },
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 5,
    userScalable: true,
    viewportFit: "cover",
  },
  icons: {
    icon: '/icon.png',
    shortcut: '/favicon.ico',
    apple: '/apple-icon.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={cn(
      "min-h-screen bg-background antialiased",
      `${geistSans.variable} ${geistMono.variable} ${outfit.variable} antialiased`
    )}>
      <head>
        <GoogleAnalytics />
      </head>
      <body className={cn("bg-background text-foreground", outfit.className)}>
        <ServiceWorkerRegistration />
        <LocationProvider>
          <UpdateNotification />
          <main className="min-h-screen flex flex-col items-center">
            {children}
          </main>
        </LocationProvider>
      </body>
    </html>
  );
}