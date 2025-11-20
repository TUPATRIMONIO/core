import { Stamp } from 'lucide-react'
import Link from 'next/link'

export default function NotaryLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 bg-background border-b">
        <div className="flex items-center justify-between h-16 px-4 md:px-6">
          <Link href="/notary/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[var(--tp-brand)] flex items-center justify-center">
              <Stamp className="h-5 w-5 text-white" />
            </div>
            <span className="font-semibold text-lg">Portal Notarial</span>
          </Link>
        </div>
      </header>
      <main className="container mx-auto p-4 md:p-6 max-w-7xl">
        {children}
      </main>
    </div>
  )
}

