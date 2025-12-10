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

  // Obtener ticket básico sin relaciones cross-schema
  const { data: rawTicket, error: ticketError } = await serviceSupabase
    .from('tickets')
    .select(`
      *,
      contact:contacts(*),
      assigned_user:users!tickets_assigned_to_fkey(*)
    `)
    .eq('id', id)
    .single()

  if (ticketError || !rawTicket) {
    console.error('Error fetching ticket:', ticketError)
    notFound()
  }

  // Fetch all CRM association tables manually with explicit schema
  const { data: ticketOrders } = await serviceSupabase
    .schema('crm')
    .from('ticket_orders')
    .select('*')
    .eq('ticket_id', id)

  const { data: ticketOrganizations } = await serviceSupabase
    .schema('crm')
    .from('ticket_organizations')
    .select('*')
    .eq('ticket_id', id)

  const { data: ticketUsers } = await serviceSupabase
    .schema('crm')
    .from('ticket_users')
    .select('*')
    .eq('ticket_id', id)

  // Fetch orders data
  const orderIds = ticketOrders?.map((to: any) => to.order_id) || []
  let ordersMap = new Map()
  if (orderIds.length > 0) {
    const { data: orders } = await serviceSupabase
      .from('orders')
      .select('*')
      .in('id', orderIds)
    
    if (orders) {
      orders.forEach((o: any) => ordersMap.set(o.id, o))
    }
  }

  // Fetch Core Organizations manually
  const orgIds = ticketOrganizations?.map((to: any) => to.organization_id) || []
  let organizationsMap = new Map()
  if (orgIds.length > 0) {
    const { data: orgs } = await serviceSupabase
       .schema('core')
       .from('organizations')
       .select('id, name, industry, slug')
       .in('id', orgIds)
    
    if (orgs) {
       orgs.forEach((o: any) => organizationsMap.set(o.id, o))
    }
  }

  // Fetch Core Users manually
  const userIds = ticketUsers?.map((tu: any) => tu.user_id) || []
  let usersMap = new Map()
  if (userIds.length > 0) {
    const { data: users } = await serviceSupabase
        .schema('core')
        .from('users')
        .select('id, first_name, last_name, email, avatar_url')
        .in('id', userIds)

    if (users) {
        users.forEach((u: any) => usersMap.set(u.id, u))
    }
  }

  // Reconstruct ticket object with enriched data
  const ticket = {
      ...rawTicket,
      ticket_orders: ticketOrders?.map((to: any) => ({
          ...to,
          order: ordersMap.get(to.order_id) || { id: to.order_id, order_number: 'Desconocido' }
      })) || [],
      ticket_organizations: ticketOrganizations?.map((to: any) => ({
          ...to,
          organization: organizationsMap.get(to.organization_id) || { id: to.organization_id, name: 'Desconocido' }
      })) || [],
      ticket_users: ticketUsers?.map((tu: any) => ({
          ...tu,
          user: usersMap.get(tu.user_id) || { id: tu.user_id, email: 'Desconocido' }
      })) || []
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

  // Obtener adjuntos del ticket (usando RPC por seguridad de schema)
  const { data: attachments } = await serviceSupabase
    .rpc('get_ticket_attachments', { p_ticket_id: id })

  // Add attachments to ticket object
  const ticketWithAttachments = {
    ...ticket,
    attachments: attachments || []
  }

  return (
    <div className="flex flex-1 flex-col">
      <PageHeader
        title={`Ticket ${ticket.ticket_number}`}
        description={ticket.subject}
      />
      <div className="flex-1 px-4 pb-6">
        <TicketDetailClient
          ticket={ticketWithAttachments}
          emails={emails || []}
          activities={activities || []}
        />
      </div>
    </div>
  )
}

