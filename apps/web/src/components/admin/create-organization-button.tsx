'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { OrganizationFormDialog } from './organization-form-dialog'

export function CreateOrganizationButton() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        className="bg-[var(--tp-buttons)] hover:bg-[var(--tp-buttons-hover)]"
      >
        <Plus className="h-4 w-4 mr-2" />
        Crear Organización
      </Button>
      <OrganizationFormDialog
        open={open}
        onOpenChange={setOpen}
        organization={null}
      />
    </>
  )
}

