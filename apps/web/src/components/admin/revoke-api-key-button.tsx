'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'
import { revokeApiKey } from '@/lib/admin/actions'
import { useRouter } from 'next/navigation'

interface RevokeApiKeyButtonProps {
  apiKeyId: string
  apiKeyName: string
}

export function RevokeApiKeyButton({
  apiKeyId,
  apiKeyName,
}: RevokeApiKeyButtonProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleRevoke = async () => {
    if (!confirm(`¿Estás seguro de que deseas revocar la API key "${apiKeyName}"? Esta acción no se puede deshacer.`)) {
      return
    }

    setLoading(true)

    try {
      const result = await revokeApiKey(apiKeyId)

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
      onClick={handleRevoke}
      disabled={loading}
      title="Revocar API key"
    >
      <X className="h-4 w-4" />
    </Button>
  )
}

