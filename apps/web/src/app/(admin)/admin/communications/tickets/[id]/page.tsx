import { createClient, createServiceRoleClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/admin/page-header'
import { redirect, notFound } from 'next/navigation'
import { TicketDetailClient } from './ticket-detail-client'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function TicketDetailPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()
  const serviceSupabase = createServiceRoleClient()

  // Verificar autenticación
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Verificar si es platform admin
  const { data: isPlatformAdmin } = await supabase.rpc('is_platform_admin')
  if (!isPlatformAdmin) {
    return (
      <div className="flex flex-1 flex-col">
        <PageHeader
          title="Ticket"
          description="Detalle del ticket"
        />
        <div className="flex-1 px-4 pb-6">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-yellow-800">
              Solo los platform admins pueden acceder a tickets.
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Obtener ticket con relaciones
  const { data: ticket, error: ticketError } = await serviceSupabase
    .from('tickets')
    .select(`
      *,
      contact:contacts(*),
      assigned_user:users!tickets_assigned_to_fkey(*),
      order:orders(*)
    `)
    .eq('id', id)
    .single()

  if (ticketError || !ticket) {
    notFound()
  }

  // Obtener emails del ticket
  const { data: emails } = await serviceSupabase
    .from('emails')
    .select('*')
    .eq('ticket_id', id)
    .order('sent_at', { ascending: true })

  // Obtener actividades del ticket
  const { data: activities } = await serviceSupabase
    .from('activities')
    .select(`
      *,
      performed_by_user:users!activities_performed_by_fkey(id, email, first_name, last_name)
    `)
    .eq('ticket_id', id)
    .order('performed_at', { ascending: false })

  return (
    <div className="flex flex-1 flex-col">
      <PageHeader
        title={`Ticket ${ticket.ticket_number}`}
        description={ticket.subject}
      />
      <div className="flex-1 px-4 pb-6">
        <TicketDetailClient
          ticket={ticket}
          emails={emails || []}
          activities={activities || []}
        />
      </div>
    </div>
  )
}

