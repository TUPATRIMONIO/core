import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireApplicationAccess } from "@/lib/access/api-access-guard";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { sendEmailWithSharedAccount } from "@/lib/gmail/client";

export const runtime = "nodejs";

/**
 * GET /api/crm/tickets
 * Obtener lista de tickets
 */
export async function GET(request: NextRequest) {
  // Verificar acceso a CRM
  const denied = await requireApplicationAccess(request, "crm_sales");
  if (denied) return denied;

  try {
    const supabase = await createClient();

    // Verificar autenticación
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 },
      );
    }

    // Obtener organización del usuario
    const { data: orgUser } = await supabase
      .from("organization_users")
      .select("organization_id")
      .eq("user_id", user.id)
      .eq("status", "active")
      .single();

    if (!orgUser) {
      return NextResponse.json(
        { error: "Organización no encontrada" },
        { status: 400 },
      );
    }

    // Obtener tickets
    const { data: tickets, error } = await supabase
      .from("tickets")
      .select("*")
      .eq("organization_id", orgUser.organization_id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching tickets:", error);
      return NextResponse.json(
        { error: error.message || "Error obteniendo tickets" },
        { status: 500 },
      );
    }

    return NextResponse.json(tickets || []);
  } catch (error: any) {
    console.error("Error fetching tickets:", error);
    return NextResponse.json(
      { error: error.message || "Error interno del servidor" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/crm/tickets
 * Crear un nuevo ticket
 */
export async function POST(request: NextRequest) {
  // Verificar acceso a CRM
  const denied = await requireApplicationAccess(request, "crm_sales");
  if (denied) return denied;

  try {
    const supabase = await createClient();
    const serviceSupabase = createServiceRoleClient(); // Para operaciones privilegiadas (email history, associations)
    const body = await request.json();

    // Verificar autenticación
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 },
      );
    }

    // Obtener organización del usuario
    const { data: orgUser } = await supabase
      .from("organization_users")
      .select("organization_id")
      .eq("user_id", user.id)
      .eq("status", "active")
      .single();

    let organizationId = orgUser?.organization_id;

    // Si no tiene organización, verificar si es platform admin
    if (!organizationId) {
      const { data: isPlatformAdmin } = await supabase.rpc("is_platform_admin");

      if (isPlatformAdmin) {
        // Usar la organización platform para platform admins
        const { data: platformOrg } = await supabase
          .from("organizations")
          .select("id")
          .eq("org_type", "platform")
          .eq("status", "active")
          .single();

        organizationId = platformOrg?.id;
      }
    }

    if (!organizationId) {
      return NextResponse.json(
        { error: "Organización no encontrada" },
        { status: 400 },
      );
    }

    // Validar campos requeridos
    if (!body.subject || !body.description) {
      return NextResponse.json(
        { error: "El asunto y la descripción son requeridos" },
        { status: 400 },
      );
    }

    // Generar número de ticket (usar función SQL si existe, sino generar manualmente)
    const { count } = await supabase
      .from("tickets")
      .select("*", { count: "exact", head: true })
      .eq("organization_id", organizationId);

    const ticketNumber = `TICK-${String((count || 0) + 1).padStart(5, "0")}`;

    // Preparar datos para insertar
    const insertData: any = {
      organization_id: organizationId,
      ticket_number: ticketNumber,
      subject: body.subject,
      description: body.description,
      status: body.status || "new",
      priority: body.priority || "medium",
      category: body.category || "general",
      contact_id: body.contact_id || null, // CRM Contact ID if passed
      company_id: body.company_id || null, // CRM Company ID if passed
      due_date: body.due_date || null,
      created_by: user.id,
    };

    // Crear ticket
    const { data: newTicket, error } = await supabase
      .from("tickets")
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error("Error creating ticket:", error);
      return NextResponse.json(
        { error: error.message || "Error creando ticket" },
        { status: 500 },
      );
    }

    // Manejar Asociaciones
    const associations = body.associations || {};
    const recipients = body.recipients || [];
    let toEmails: string[] = [];

    // 1. Link Order (Always if present)
    if (associations.orderId) {
      await serviceSupabase.rpc("link_ticket_order", {
        p_ticket_id: newTicket.id,
        p_order_id: associations.orderId,
      });
    }

    // 2. Handle Linking based on Recipients or Fallback
    if (recipients.length > 0) {
      // Use recipients list
      toEmails = recipients.map((r: any) => r.email);
      
      for (const recipient of recipients) {
        if (recipient.id) {
          if (recipient.type === 'user') {
            await serviceSupabase.rpc("link_ticket_user", {
              p_ticket_id: newTicket.id,
              p_user_id: recipient.id,
            });
          } else if (recipient.type === 'organization') {
            await serviceSupabase.rpc("link_ticket_organization", {
              p_ticket_id: newTicket.id,
              p_organization_id: recipient.id,
            });
          } else if (recipient.type === 'contact') {
            // Check if not already linked by main insert
            if (insertData.contact_id !== recipient.id) {
                await serviceSupabase.rpc("link_ticket_contact", {
                  p_ticket_id: newTicket.id,
                  p_contact_id: recipient.id,
                });
            }
          }
        }
      }

    } else {
      // Legacy behavior: Use associations param
      
      // Auto-link from Order context if no specific user/org provided
      if (associations.orderId) {
        const { data: orderData } = await serviceSupabase
            .from("orders")
            .select("user_id, organization_id")
            .eq("id", associations.orderId)
            .single();

        if (orderData?.user_id && !associations.userId) {
            associations.userId = orderData.user_id;
        }
        if (orderData?.organization_id && !associations.organizationId) {
            associations.organizationId = orderData.organization_id;
        }
      }

      if (associations.userId) {
        await serviceSupabase.rpc("link_ticket_user", {
          p_ticket_id: newTicket.id,
          p_user_id: associations.userId,
        });
        
        // Resolve email
        const { data: userData } = await serviceSupabase.auth.admin.getUserById(associations.userId);
        if (userData?.user?.email) toEmails.push(userData.user.email);
      }

      if (associations.organizationId) {
        await serviceSupabase.rpc("link_ticket_organization", {
          p_ticket_id: newTicket.id,
          p_organization_id: associations.organizationId,
        });
        
        // Resolve email if no user email found (or add to list?)
        // Legacy only sent to ONE email. Prioritizing User > Contact > Org.
        if (toEmails.length === 0) {
             const { data: org } = await serviceSupabase
              .from("organizations")
              .select("email")
              .eq("id", associations.organizationId)
              .single();
             if (org?.email) toEmails.push(org.email);
        }
      }

      if (associations.contactId) {
        if (!insertData.contact_id) {
            await serviceSupabase.rpc("link_ticket_contact", {
                p_ticket_id: newTicket.id,
                p_contact_id: associations.contactId,
            });
        }
        // Resolve email if no user email found
        if (toEmails.length === 0) {
             const { data: contact } = await serviceSupabase
              .schema("crm") // Explicit schema just in case
              .from("contacts")
              .select("email")
              .eq("id", associations.contactId)
              .single();
             if (contact?.email) toEmails.push(contact.email);
        }
      }
      
      if (associations.companyId) {
          if (!insertData.company_id) {
            await serviceSupabase.rpc("link_ticket_company", {
              p_ticket_id: newTicket.id,
              p_company_id: associations.companyId,
            });
          }
      }
    }

    // Manejar Envío de Email
    if (body.sendEmailNotification && toEmails.length > 0) {
      const toEmailString = toEmails.join(', ');

      try {
        // Get platform org for email sending context
        const { data: platformOrg } = await supabase
          .from("organizations")
          .select("id")
          .eq("org_type", "platform")
          .eq("status", "active")
          .single();

        if (platformOrg) {
          // Send Email with Threading Support
          const { messageId, threadId } = await sendEmailWithSharedAccount(
            platformOrg.id,
            user.id,
            toEmailString, // Comma separated list
            `[TICKET #${newTicket.ticket_number}] ${body.subject}`,
            body.description,
            undefined, // Text body auto-generated
            true, // Include signature
            undefined, // No In-Reply-To
            undefined, // No References
            undefined, // New Thread
          );

          // Create CRM Thread
          let threadIdCrm = null;
          if (threadId) {
            const { data: newThread } = await serviceSupabase
              .from("email_threads")
              .insert({
                organization_id: platformOrg.id,
                gmail_thread_id: threadId,
                contact_id: insertData.contact_id || null, // Link to CRM contact if available
                subject: body.subject,
                snippet: body.description.substring(0, 100),
                participants: toEmails,
                last_email_at: new Date().toISOString(),
                last_email_from: toEmails[0], // First recipient as proxy? or 'me'? 
                // DB expects string? "last_email_from" usually is the sender of the last email.
                // If outbound, it should be us. But here we are initializing the thread.
                // Let's use the first 'to' email as the "other party" or just leave it.
                // Actually, if we sent it, `last_email_from` should be our email.
                // But typically this field is used to show "who replied last".
                // I'll leave as is or use the first recipient.
                email_count: 1,
              })
              .select("id")
              .single();
            threadIdCrm = newThread?.id;
          }

          // Save Email to DB for Threading History
          const { data: gmailAccount } = await serviceSupabase
            .from("email_accounts")
            .select("id, email_address")
            .eq("organization_id", platformOrg.id)
            .eq("account_type", "shared")
            .eq("is_active", true)
            .single();

          await serviceSupabase
            .from("emails")
            .insert({
              organization_id: platformOrg.id,
              contact_id: insertData.contact_id || null,
              ticket_id: newTicket.id,
              thread_id_crm: threadIdCrm,
              gmail_message_id: messageId,
              thread_id: threadId,
              from_email: gmailAccount?.email_address ||
                "contacto@tupatrimonio.app",
              to_emails: toEmails,
              subject: body.subject,
              body_html: body.description.replace(/\n/g, "<br>"),
              body_text: body.description,
              direction: "outbound",
              status: "sent",
              sent_at: new Date().toISOString(),
              sent_by: user.id,
              sent_from_account_id: gmailAccount?.id || null,
              is_read: true,
              snippet: body.description.substring(0, 100),
            });

          console.log(
            `Ticket creation email sent. Ticket: ${newTicket.id}, Thread: ${threadId}, Recipients: ${toEmails.length}`,
          );
        }
      } catch (emailError) {
        console.error("Failed to send ticket creation email:", emailError);
        // Don't fail the request, just log error. Ticket is created.
      }
    }

    return NextResponse.json(newTicket, { status: 201 });
  } catch (error: any) {
    console.error("Error creating ticket:", error);
    return NextResponse.json(
      { error: error.message || "Error interno del servidor" },
      { status: 500 },
    );
  }
}
