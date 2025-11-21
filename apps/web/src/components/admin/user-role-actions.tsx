'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Shield } from 'lucide-react'
import { AssignRoleDialog } from './assign-role-dialog'

interface UserRoleActionsProps {
  userId: string
  userName: string
  organizationId: string
  currentRoleId?: string
  currentRoleName?: string
}

export function UserRoleActions({
  userId,
  userName,
  organizationId,
  currentRoleId,
  currentRoleName,
}: UserRoleActionsProps) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setOpen(true)}
        title="Gestionar rol"
      >
        <Shield className="h-4 w-4" />
      </Button>
      <AssignRoleDialog
        open={open}
        onOpenChange={setOpen}
        organizationId={organizationId}
        userId={userId}
        userName={userName}
        currentRoleId={currentRoleId}
        currentRoleName={currentRoleName}
      />
    </>
  )
}

