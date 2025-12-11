'use client'

import { PageHeader } from '@/components/admin/page-header'
import { CreateDocumentForm } from '@/components/signing/CreateDocumentForm'

export default function NewDocumentPage() {
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <PageHeader
        title="Nuevo Documento"
        description="Sube un archivo PDF para iniciar el proceso de firma electrónica."
      />
      
      <CreateDocumentForm />
    </div>
  )
}
