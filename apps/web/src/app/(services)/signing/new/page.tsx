'use client'

import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { DocumentRequestWizard } from '@/components/signing/wizard/DocumentRequestWizard'
import { useSigningWizard } from '@/components/signing/wizard/WizardContext'

export default function NewSigningPage() {
  const { actions, isInitialized } = useSigningWizard()
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    if (isInitialized) {
      actions.reset()
      setIsReady(true)
    }
  }, [isInitialized, actions])

  if (!isReady) {
    return (
      <div className="max-w-4xl mx-auto py-8 space-y-6 px-4 md:px-0">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-foreground">Firmar Documento</h1>
          <p className="text-muted-foreground">
            Sigue los pasos para configurar tu firma electrónica con plena validez legal.
          </p>
        </div>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          <span className="ml-2 text-muted-foreground">Cargando configuración...</span>
        </div>
      </div>
    )
  }

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
