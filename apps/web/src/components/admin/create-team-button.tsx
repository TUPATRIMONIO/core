'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { TeamFormDialog } from './team-form-dialog'

export function CreateTeamButton() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        className="bg-[var(--tp-buttons)] hover:bg-[var(--tp-buttons-hover)]"
      >
        <Plus className="h-4 w-4 mr-2" />
        Crear Team
      </Button>
      <TeamFormDialog open={open} onOpenChange={setOpen} team={null} />
    </>
  )
}

