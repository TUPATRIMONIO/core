import type {Metadata} from "next";
import {Geist, Geist_Mono, Quicksand} from "next/font/google";
import { cn } from "@/lib/utils";
import { LocationProvider } from '../components/LocationProvider';
import "../../../../../packages/ui/globals.css";

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
        <LocationProvider>
          <main className="min-h-screen flex flex-col items-center">
            {children}
          </main>
        </LocationProvider>
      </body>
    </html>
  );
}