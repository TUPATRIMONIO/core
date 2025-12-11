import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { CrmTicketDetailClient } from '@/components/crm/tickets/CrmTicketDetailClient'
import { getUserActiveOrganization } from '@/lib/organization/utils'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function CrmTicketDetailPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()

  // Verificar autenticación
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Verificar organización activa
  const { organization } = await getUserActiveOrganization(supabase)
  
  if (!organization) {
    return (
        <div className="flex flex-1 flex-col">
            <div className="flex-1 px-4 pb-6 pt-6">
                <p>No se encontró organización activa.</p>
            </div>
        </div>
    )
  }

  // Obtener ticket (verificando organization_id)
  const { data: rawTicket, error: ticketError } = await supabase
    .from('tickets')
    .select(`
      *,
      contact:contacts(*),
      assigned_user:users!tickets_assigned_to_fkey(*)
    `)
    .eq('id', id)
    .eq('organization_id', organization.id)
    .single()

  if (ticketError || !rawTicket) {
    console.error('Error fetching ticket:', ticketError)
    notFound()
  }

  // Obtener asociaciones (RPC debe manejar seguridad, o si es la misma función, debería filtrar por org... 
  // Al haber validado que el ticket pertenece a la org, es seguro llamar a la RPC con ese ID)
  const { data: associations, error: assocError } = await supabase.rpc(
    "get_ticket_associations",
    { p_ticket_id: id }
  );

  if (assocError) {
    console.error("Error fetching associations:", assocError);
  }

  const ticket = {
      ...rawTicket,
      ...(associations || {})
  }

  // Obtener emails del ticket
  // Asegurarnos de filtrar por organization_id también por seguridad extra
  const { data: emails } = await supabase
    .from('emails')
    .select('*')
    .eq('ticket_id', id)
    .eq('organization_id', organization.id)
    .order('sent_at', { ascending: true })

  // Obtener actividades
  const { data: activities } = await supabase
    .from('activities')
    .select(`
      *,
      performed_by_user:users!activities_performed_by_fkey(id, email, first_name, last_name)
    `)
    .eq('ticket_id', id)
    .eq('organization_id', organization.id)
    .order('performed_at', { ascending: false })

  // Obtener adjuntos (usando RPC)
  const { data: attachments } = await supabase
    .rpc('get_ticket_attachments', { p_ticket_id: id })

  const ticketWithAttachments = {
    ...ticket,
    attachments: attachments || []
  }

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex-1 px-4 pb-6 pt-6">
        <CrmTicketDetailClient
          ticket={ticketWithAttachments}
          emails={emails || []}
          activities={activities || []}
        />
      </div>
    </div>
  )
}
