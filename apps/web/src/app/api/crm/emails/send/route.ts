/**
 * API Route: /api/crm/emails/send
 * Envía emails usando Gmail API
 */

import { createClient } from '@/lib/supabase/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { getCurrentUserWithOrg } from '@/lib/crm/permissions';
import { sendEmail } from '@/lib/gmail/service';
import { sendEmailSMTP } from '@/lib/email/smtp-service';
import { decryptObject } from '@/lib/crypto';
import type { EmailMessage } from '@/lib/gmail/types';
import type { SMTPConfig } from '@/lib/email/smtp-service';

export async function POST(request: Request) {
  const supabase = await createClient();
  const userWithOrg = await getCurrentUserWithOrg();
  
  if (!userWithOrg || !userWithOrg.organizationId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Usar Service Role para bypasear RLS
  const supabaseAdmin = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    const body = await request.json();
    const { to, cc, bcc, subject, body: emailBody, contact_id, from_account_id, attachments } = body;

    // Obtener cuenta de email a usar
    let emailAccount;
    
    if (from_account_id) {
      // Usar cuenta específica
      const { data: account } = await supabaseAdmin
        .schema('crm')
        .from('email_accounts')
        .select('*')
        .eq('id', from_account_id)
        .eq('organization_id', userWithOrg.organizationId)
        .eq('is_active', true)
        .single();
      
      emailAccount = account;
    } else {
      // Usar cuenta por defecto del usuario
      // Primero buscar cuenta marcada como default
      const { data: defaultAccount } = await supabaseAdmin
        .schema('crm')
        .from('email_accounts')
        .select('*')
        .eq('organization_id', userWithOrg.organizationId)
        .eq('is_active', true)
        .eq('is_default', true)
        .single();

      if (defaultAccount) {
        emailAccount = defaultAccount;
      } else {
        // Si no hay default, usar la primera disponible
        const { data: firstAccount } = await supabaseAdmin
          .schema('crm')
          .from('email_accounts')
          .select('*')
          .eq('organization_id', userWithOrg.organizationId)
          .eq('is_active', true)
          .limit(1)
          .single();
        
        emailAccount = firstAccount;
      }
    }

    if (!emailAccount) {
      return NextResponse.json({ 
        error: 'No email account available. Please connect an email account first.' 
      }, { status: 400 });
    }

    // Validar que tenga credenciales según su tipo
    const hasCredentials = emailAccount.connection_type === 'oauth' 
      ? emailAccount.gmail_oauth_tokens 
      : (emailAccount.imap_config && emailAccount.smtp_config);

    if (!hasCredentials) {
      return NextResponse.json({ 
        error: 'Email account credentials not found. Please reconnect the account.' 
      }, { status: 400 });
    }

    // Los adjuntos ya vienen en base64 desde el frontend
    const processedAttachments = attachments || [];

    // Detectar tipo de conexión y enviar según corresponda
    let result: any;
    
    if (emailAccount.connection_type === 'oauth') {
      // Enviar vía Gmail API (OAuth)
      const message: EmailMessage = {
        to: Array.isArray(to) ? to : [to],
        cc,
        bcc,
        subject,
        body: emailBody,
        attachments: processedAttachments
      };
      
      result = await sendEmail(emailAccount.gmail_oauth_tokens, message);
    } else {
      // Enviar vía SMTP
      const smtpConfig: SMTPConfig = decryptObject(emailAccount.smtp_config);
      
      result = await sendEmailSMTP(smtpConfig, {
        to: Array.isArray(to) ? to : [to],
        cc,
        bcc,
        subject,
        body: emailBody,
        attachments: processedAttachments
      });
      
      // Adaptar resultado de SMTP a formato esperado
      result = {
        id: result.messageId,
        threadId: result.messageId // IMAP no tiene threadId, usar messageId
      };
    }

    // Guardar en crm.emails
    const { data: emailRecord, error: emailError } = await supabase
      .schema('crm')
      .from('emails')
      .insert({
        organization_id: userWithOrg.organizationId,
        contact_id: contact_id || null,
        gmail_message_id: result.id,
        thread_id: result.threadId,
        from_email: emailAccount.email_address,
        to_emails: Array.isArray(to) ? to : [to],
        cc_emails: cc || [],
        bcc_emails: bcc || [],
        subject,
        body_html: emailBody,
        direction: 'outbound',
        status: 'sent',
        sent_at: new Date().toISOString(),
        sent_by: userWithOrg.user.id,
        sent_from_account_id: emailAccount.id,
        has_attachments: attachments && attachments.length > 0,
        attachments: attachments || []
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







