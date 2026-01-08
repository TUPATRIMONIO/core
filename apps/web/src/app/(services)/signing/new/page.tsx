'use client'

import { DocumentRequestWizard } from '@/components/signing/wizard/DocumentRequestWizard'

export default function NewSigningPage() {
  return (
    <div className="max-w-4xl mx-auto py-8 space-y-6 px-4 md:px-0">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-foreground">Firmar Documento</h1>
        <p className="text-muted-foreground">
          Sigue los pasos para configurar tu firma electrónica con plena validez legal.
        </p>
      </div>
      
      <DocumentRequestWizard />
    </div>
  )
}

