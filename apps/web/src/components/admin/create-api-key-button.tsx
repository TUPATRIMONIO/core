'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { ApiKeyFormDialog } from './api-key-form-dialog'

export function CreateApiKeyButton() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        className="bg-[var(--tp-buttons)] hover:bg-[var(--tp-buttons-hover)]"
      >
        <Plus className="h-4 w-4 mr-2" />
        Crear API Key
      </Button>
      <ApiKeyFormDialog open={open} onOpenChange={setOpen} />
    </>
  )
}

