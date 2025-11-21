'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { InvitationFormDialog } from './invitation-form-dialog'

export function CreateInvitationButton() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        className="bg-[var(--tp-buttons)] hover:bg-[var(--tp-buttons-hover)]"
      >
        <Plus className="h-4 w-4 mr-2" />
        Enviar Invitación
      </Button>
      <InvitationFormDialog open={open} onOpenChange={setOpen} />
    </>
  )
}

