import type { Metadata } from 'next'
import './globals.css'

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
    <html lang="es">
      <body>
        {children}
      </body>
    </html>
  )
}
