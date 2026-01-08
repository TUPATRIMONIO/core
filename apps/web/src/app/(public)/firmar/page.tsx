'use client'

import { DocumentRequestWizard } from '@/components/signing/wizard/DocumentRequestWizard'

export default function PublicSigningPage() {
  return (
    <div className="min-h-screen bg-[var(--tp-background-light)] dark:bg-[var(--tp-background-dark)]">
      <header className="flex h-16 items-center border-b px-6 bg-white dark:bg-zinc-950">
        <div className="flex items-center gap-2">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--tp-buttons)] font-semibold text-white">
            TP
          </span>
          <span className="font-bold text-xl text-foreground">TuPatrimonio</span>
        </div>
      </header>
      
      <main className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-foreground">Firmar Documento</h1>
          <p className="text-muted-foreground">
            Sigue los pasos para configurar tu firma electrónica con plena validez legal.
          </p>
        </div>
        
        <DocumentRequestWizard />
      </main>
    </div>
  )
}


