'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'
import { removeTeamMember } from '@/lib/admin/actions'
import { useRouter } from 'next/navigation'

interface RemoveTeamMemberButtonProps {
  teamId: string
  userId: string
  userName: string
}

export function RemoveTeamMemberButton({
  teamId,
  userId,
  userName,
}: RemoveTeamMemberButtonProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleRemove = async () => {
    if (!confirm(`¿Estás seguro de que deseas remover a ${userName} de este team?`)) {
      return
    }

    setLoading(true)

    try {
      const result = await removeTeamMember(teamId, userId)

      if (result.error) {
        alert(result.error)
      } else {
        router.refresh()
      }
    } catch (err: any) {
      alert(err.message || 'Ocurrió un error inesperado')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleRemove}
      disabled={loading}
      title="Remover miembro"
    >
      <X className="h-4 w-4" />
    </Button>
  )
}

