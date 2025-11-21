'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Pencil } from 'lucide-react'
import { TeamFormDialog } from './team-form-dialog'

interface EditTeamButtonProps {
  team: {
    id: string
    name: string
    description?: string | null
    organization_id: string
    lead_user_id?: string | null
    color?: string | null
  }
}

export function EditTeamButton({ team }: EditTeamButtonProps) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        variant="outline"
        size="sm"
      >
        <Pencil className="h-4 w-4 mr-2" />
        Editar
      </Button>
      <TeamFormDialog
        open={open}
        onOpenChange={setOpen}
        team={team}
        defaultOrganizationId={team.organization_id}
      />
    </>
  )
}

