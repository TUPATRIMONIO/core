"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'

interface NotaryApprovalActionsProps {
  notaryId: string
  currentStatus: 'pending' | 'approved' | 'rejected'
}

export function NotaryApprovalActions({
  notaryId,
  currentStatus,
}: NotaryApprovalActionsProps) {
  const router = useRouter()
  const [isApproving, setIsApproving] = useState(false)
  const [isRejecting, setIsRejecting] = useState(false)
  const [showRejectDialog, setShowRejectDialog] = useState(false)
  const [rejectionReason, setRejectionReason] = useState('')

  const handleApprove = async () => {
    setIsApproving(true)
    try {
      const response = await fetch(`/api/admin/organizations/notaries/${notaryId}/approve`, {
        method: 'POST',
      })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'No se pudo aprobar la notaría')
      }

      toast.success('Notaría aprobada')
      router.refresh()
    } catch (error: any) {
      toast.error(error.message || 'No se pudo aprobar la notaría')
    } finally {
      setIsApproving(false)
    }
  }

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      toast.error('Escribe un motivo de rechazo')
      return
    }

    setIsRejecting(true)
    try {
      const response = await fetch(`/api/admin/organizations/notaries/${notaryId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: rejectionReason.trim() }),
      })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'No se pudo rechazar la notaría')
      }

      toast.success('Notaría rechazada')
      setShowRejectDialog(false)
      setRejectionReason('')
      router.refresh()
    } catch (error: any) {
      toast.error(error.message || 'No se pudo rechazar la notaría')
    } finally {
      setIsRejecting(false)
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Button
        onClick={handleApprove}
        disabled={isApproving || currentStatus === 'approved'}
        className="bg-[var(--tp-buttons)] hover:bg-[var(--tp-buttons-hover)] text-white"
      >
        {currentStatus === 'approved' ? 'Aprobada' : isApproving ? 'Aprobando...' : 'Aprobar'}
      </Button>
      <Button
        variant="outline"
        onClick={() => setShowRejectDialog(true)}
        disabled={currentStatus === 'rejected'}
      >
        {currentStatus === 'rejected' ? 'Rechazada' : 'Rechazar'}
      </Button>

      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>Rechazar notaría</DialogTitle>
            <DialogDescription>
              Indica el motivo para dejar registro y notificar al equipo.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label>Motivo</Label>
              <Textarea
                value={rejectionReason}
                onChange={(event) => setRejectionReason(event.target.value)}
                placeholder="Ej: Falta información de contacto o documentación incompleta."
                className="min-h-[120px]"
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
                Cancelar
              </Button>
              <Button
                onClick={handleReject}
                disabled={isRejecting || !rejectionReason.trim()}
                className="bg-[var(--tp-buttons)] hover:bg-[var(--tp-buttons-hover)] text-white"
              >
                {isRejecting ? 'Rechazando...' : 'Confirmar rechazo'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
