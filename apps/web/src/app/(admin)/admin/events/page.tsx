import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/admin/page-header'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { FileText, AlertCircle, AlertTriangle, Info, XCircle } from 'lucide-react'
import { EmptyState } from '@/components/admin/empty-state'

async function getSystemEvents() {
  const supabase = await createClient()

  const { data: events, error } = await supabase
    .from('system_events')
    .select(`
      *,
      organizations(name),
      users(full_name)
    `)
    .order('created_at', { ascending: false })
    .limit(100)

  if (error) {
    console.error('Error fetching events:', error)
    return []
  }

  return events || []
}

const eventLevelConfig: Record<string, { icon: any; className: string }> = {
  info: {
    icon: Info,
    className: 'bg-blue-100 text-blue-800 border-blue-200',
  },
  warning: {
    icon: AlertTriangle,
    className: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  },
  error: {
    icon: XCircle,
    className: 'bg-red-100 text-red-800 border-red-200',
  },
  critical: {
    icon: AlertCircle,
    className: 'bg-red-100 text-red-800 border-red-200',
  },
}

export default async function SystemEventsPage() {
  const events = await getSystemEvents()

  return (
    <div className="flex flex-1 flex-col">
      <PageHeader
        title="System Events"
        description="Audit log de eventos del sistema"
      />

      <div className="flex-1 px-4 pb-6">
        {events.length === 0 ? (
          <Card>
            <CardContent className="p-0">
              <EmptyState
                icon={FileText}
                title="No hay eventos"
                description="Aún no se han registrado eventos en el sistema"
              />
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Nivel</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Mensaje</TableHead>
                    <TableHead>Usuario</TableHead>
                    <TableHead>Organización</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {events.map((event: any) => {
                    const config = eventLevelConfig[event.event_level]
                    const Icon = config.icon

                    return (
                      <TableRow key={event.id}>
                        <TableCell className="text-xs">
                          {new Date(event.created_at).toLocaleString('es-CL')}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={config.className}>
                            <Icon className="mr-1 h-3 w-3" />
                            {event.event_level}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <code className="text-xs bg-muted px-1 py-0.5 rounded">
                            {event.event_type}
                          </code>
                        </TableCell>
                        <TableCell className="max-w-md truncate">
                          {event.message}
                        </TableCell>
                        <TableCell className="text-sm">
                          {event.users?.full_name || 'Sistema'}
                        </TableCell>
                        <TableCell className="text-sm">
                          {event.organizations?.name || '-'}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

