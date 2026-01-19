"use server"

import type { SupabaseClient } from '@supabase/supabase-js'
import { sendEmail as sendSendGridEmailMultiOrg } from '@/lib/sendgrid/client'

interface NotaryRegistrationInput {
  organizationId: string
  notaryName: string
  countryCode: string
  city: string
  address: string
  contactEmail: string
  contactPhone: string
  createdByEmail: string
}

export async function sendNotaryRegistrationNotification(
  supabase: SupabaseClient,
  input: NotaryRegistrationInput
) {
  const adminEmail = process.env.PLATFORM_ADMIN_EMAIL

  if (!adminEmail) {
    throw new Error('PLATFORM_ADMIN_EMAIL no configurado')
  }

  const { data: platformOrg, error: platformError } = await supabase
    .from('organizations')
    .select('id, name')
    .eq('org_type', 'platform')
    .eq('status', 'active')
    .single()

  if (platformError || !platformOrg) {
    throw new Error('No se encontró la organización platform activa')
  }

  const subject = `Nueva notaría registrada: ${input.notaryName}`
  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
      <h2 style="margin-bottom: 8px;">Nueva notaría pendiente de aprobación</h2>
      <p>Se registró una nueva notaría y está pendiente de revisión.</p>
      <div style="background: #f7f7f7; padding: 12px; border-radius: 8px; margin: 12px 0;">
        <p><strong>Notaría:</strong> ${input.notaryName}</p>
        <p><strong>País:</strong> ${input.countryCode}</p>
        <p><strong>Ciudad:</strong> ${input.city}</p>
        <p><strong>Dirección:</strong> ${input.address}</p>
        <p><strong>Email:</strong> ${input.contactEmail}</p>
        <p><strong>Teléfono:</strong> ${input.contactPhone}</p>
        <p><strong>Creado por:</strong> ${input.createdByEmail || '—'}</p>
      </div>
      <p>Revisa la notaría en el panel de administración.</p>
      <p style="margin-top: 24px;">Tu Tranquilidad, Nuestra Prioridad.</p>
    </div>
  `
  const text = `Nueva notaría pendiente de aprobación

Notaría: ${input.notaryName}
País: ${input.countryCode}
Ciudad: ${input.city}
Dirección: ${input.address}
Email: ${input.contactEmail}
Teléfono: ${input.contactPhone}
Creado por: ${input.createdByEmail || '—'}

Revisa la notaría en el panel de administración.`

  const sendResult = await sendSendGridEmailMultiOrg(
    platformOrg.id,
    {
      to: adminEmail,
      from: '',
      subject,
      html,
      text,
    },
    {
      purpose: 'transactional',
      customArgs: {
        notification_type: 'notary_registration',
        notary_org_id: input.organizationId,
      },
    }
  )

  await supabase.rpc('insert_email_history', {
    p_organization_id: platformOrg.id,
    p_to_email: adminEmail,
    p_subject: subject,
    p_body_html: html,
    p_provider: 'sendgrid',
    p_order_id: null,
    p_body_text: text,
  })

  return sendResult
}
