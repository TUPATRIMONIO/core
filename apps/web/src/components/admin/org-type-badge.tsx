import { Badge } from '@/components/ui/badge'
import { Building2, User, Shield, Stamp } from 'lucide-react'

type OrgType = 'personal' | 'business' | 'platform' | 'notary'

const orgTypeConfig: Record<OrgType, { label: string; icon: any; className: string }> = {
  personal: {
    label: 'Personal',
    icon: User,
    className: 'bg-blue-100 text-blue-800 border-blue-200',
  },
  business: {
    label: 'Business',
    icon: Building2,
    className: 'bg-green-100 text-green-800 border-green-200',
  },
  notary: {
    label: 'Notaría',
    icon: Stamp,
    className: 'bg-amber-100 text-amber-800 border-amber-200',
  },
  platform: {
    label: 'Platform',
    icon: Shield,
    className: 'bg-purple-100 text-purple-800 border-purple-200',
  },
}

interface OrgTypeBadgeProps {
  type: OrgType
}

export function OrgTypeBadge({ type }: OrgTypeBadgeProps) {
  const config = orgTypeConfig[type]
  const Icon = config.icon

  return (
    <Badge variant="outline" className={config.className}>
      <Icon className="mr-1 h-3 w-3" />
      {config.label}
    </Badge>
  )
}

