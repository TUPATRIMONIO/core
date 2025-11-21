'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'
import { cancelInvitation } from '@/lib/admin/actions'
import { useRouter } from 'next/navigation'

interface CancelInvitationButtonProps {
  invitationId: string
  invitationEmail: string
}

export function CancelInvitationButton({
  invitationId,
  invitationEmail,
}: CancelInvitationButtonProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleCancel = async () => {
    if (!confirm(`¿Estás seguro de que deseas cancelar la invitación para ${invitationEmail}?`)) {
      return
    }

    setLoading(true)

    try {
      const result = await cancelInvitation(invitationId)

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
      onClick={handleCancel}
      disabled={loading}
      title="Cancelar invitación"
    >
      <X className="h-4 w-4" />
    </Button>
  )
}

