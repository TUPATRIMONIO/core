'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Pencil } from 'lucide-react'
import { OrganizationFormDialog } from './organization-form-dialog'

interface EditOrganizationButtonProps {
  organization: {
    id: string
    name: string
    slug: string
    org_type: string
    email?: string | null
    phone?: string | null
    country?: string | null
    status: string
  }
}

export function EditOrganizationButton({ organization }: EditOrganizationButtonProps) {
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
      <OrganizationFormDialog
        open={open}
        onOpenChange={setOpen}
        organization={organization}
      />
    </>
  )
}

