import type { Metadata } from 'next'
import { Outfit, Nunito, Quicksand, Josefin_Sans } from 'next/font/google'
import '../../../../packages/ui/globals.css'
import { Providers } from '@/providers'
import { FloatingActions } from '@/components/FloatingActions'

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
})

const nunito = Nunito({
  subsets: ["latin"],
  weight: ["200", "300", "400", "500", "600", "700", "800"],
  variable: "--font-nunito",
  display: "swap",
})

const quicksand = Quicksand({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-quicksand",
  display: "swap",
})

const josefinSans = Josefin_Sans({
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700"],
  variable: "--font-josefin-sans",
  display: "swap",
})

export const metadata: Metadata = {
  title: 'TuPatrimonio App',
  description: 'Tu Tranquilidad, Nuestra Prioridad',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" className={`${outfit.variable} ${nunito.variable} ${quicksand.variable} ${josefinSans.variable} antialiased`} suppressHydrationWarning>
      <body className={outfit.className}>
        <Providers>
          {children}
          {/* Floating Actions: Theme switcher, cookies y WhatsApp */}
          <FloatingActions />
        </Providers>
      </body>
    </html>
  )
}
