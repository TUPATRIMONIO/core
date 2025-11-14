/**
 * API Route: /api/crm/emails/send
 * Envía emails usando Gmail API
 */

import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { getCurrentUserWithOrg } from '@/lib/crm/permissions';
import { sendEmail } from '@/lib/gmail/service';
import type { EmailMessage } from '@/lib/gmail/types';

export async function POST(request: Request) {
  const supabase = await createClient();
  const userWithOrg = await getCurrentUserWithOrg();
  
  if (!userWithOrg || !userWithOrg.organizationId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { to, cc, bcc, subject, body: emailBody, contact_id } = body;

    // Obtener tokens de Gmail de la organización
    const { data: settings, error: settingsError } = await supabase
      .schema('crm')
      .from('settings')
      .select('gmail_oauth_tokens')
      .eq('organization_id', userWithOrg.organizationId)
      .single();

    if (settingsError || !settings?.gmail_oauth_tokens) {
      return NextResponse.json({ 
        error: 'Gmail not connected. Please connect Gmail in settings.' 
      }, { status: 400 });
    }

    // Preparar mensaje
    const message: EmailMessage = {
      to: Array.isArray(to) ? to : [to],
      cc,
      bcc,
      subject,
      body: emailBody
    };

    // Enviar email
    const result = await sendEmail(settings.gmail_oauth_tokens, message);

    // Guardar en crm.emails
    const { data: emailRecord, error: emailError } = await supabase
      .schema('crm')
      .from('emails')
      .insert({
        organization_id: userWithOrg.organizationId,
        contact_id: contact_id || null,
        gmail_message_id: result.id,
        thread_id: result.threadId,
        from_email: 'me', // Obtener del perfil de Gmail
        to_emails: Array.isArray(to) ? to : [to],
        cc_emails: cc || [],
        bcc_emails: bcc || [],
        subject,
        body_html: emailBody,
        direction: 'outbound',
        status: 'sent',
        sent_at: new Date().toISOString(),
        sent_by: userWithOrg.user.id
      })
      .select()
      .single();

    if (emailError) {
      console.error('Error saving email record:', emailError);
      // Email fue enviado pero no se guardó en BD
    }

    // Crear actividad si hay contact_id
    if (contact_id) {
      await supabase
        .schema('crm')
        .from('activities')
        .insert({
          organization_id: userWithOrg.organizationId,
          contact_id,
          type: 'email',
          subject: `Email enviado: ${subject}`,
          description: emailBody.substring(0, 500), // Primeros 500 chars
          performed_by: userWithOrg.user.id,
          email_id: result.id
        });
    }

    return NextResponse.json({
      success: true,
      email_id: result.id,
      thread_id: result.threadId
    });
  } catch (error) {
    console.error('Error in POST /api/crm/emails/send:', error);
    return NextResponse.json({ 
      error: 'Failed to send email', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}






