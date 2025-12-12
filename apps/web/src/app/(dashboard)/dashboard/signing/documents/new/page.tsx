'use client'

import { PageHeader } from '@/components/shared/page-header'
import { DocumentRequestWizard } from '@/components/signing/wizard/DocumentRequestWizard'

export default function NewDocumentPage() {
  return (
    <div className="space-y-6 max-w-4xl mx-auto px-4 pb-6">
      <PageHeader
        title="Nuevo Documento"
        description="Crea tu solicitud paso a paso: sube el PDF, elige servicios, agrega firmantes y paga."
      />
      
      <DocumentRequestWizard />
    </div>
  )
}

