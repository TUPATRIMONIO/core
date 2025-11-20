import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

type Status = 'active' | 'inactive' | 'suspended' | 'pending' | 'trial' | 'cancelled' | 'expired' | 'past_due'

const statusStyles: Record<Status, string> = {
  active: 'bg-green-100 text-green-800 border-green-200',
  inactive: 'bg-gray-100 text-gray-800 border-gray-200',
  suspended: 'bg-red-100 text-red-800 border-red-200',
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  trial: 'bg-blue-100 text-blue-800 border-blue-200',
  cancelled: 'bg-gray-100 text-gray-800 border-gray-200',
  expired: 'bg-red-100 text-red-800 border-red-200',
  past_due: 'bg-orange-100 text-orange-800 border-orange-200',
}

const statusLabels: Record<Status, string> = {
  active: 'Activo',
  inactive: 'Inactivo',
  suspended: 'Suspendido',
  pending: 'Pendiente',
  trial: 'Trial',
  cancelled: 'Cancelado',
  expired: 'Expirado',
  past_due: 'Vencido',
}

interface StatusBadgeProps {
  status: Status
  className?: string
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={cn(statusStyles[status], className)}
    >
      {statusLabels[status]}
    </Badge>
  )
}

