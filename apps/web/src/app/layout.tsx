import type {Metadata} from "next";
import {Geist, Geist_Mono, Quicksand} from "next/font/google";
import { cn } from "@/lib/utils";
import { LocationProvider } from '../components/LocationProvider';
import { UpdateNotification } from '@tupatrimonio/update-notifier';
import { ServiceWorkerRegistration } from '../components/ServiceWorkerRegistration';
import "../../../../packages/ui/globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const quicksand = Quicksand({
  variable: "--font-quicksand",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
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
    icon: [
      { url: "/icons/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/icons/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [
      { url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={cn(
      "min-h-screen bg-background font-quicksand antialiased",
      `${geistSans.variable} ${geistMono.variable} ${quicksand.variable} antialiased`
    )}>
      <body className="bg-background text-foreground">
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