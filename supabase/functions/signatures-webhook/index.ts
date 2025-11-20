// Edge Function: Recibir webhooks de proveedores de firma
// Endpoint: POST /functions/v1/signatures-webhook

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create Supabase client with service role (bypass RLS)
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get provider from query params or headers
    const url = new URL(req.url)
    const provider = url.searchParams.get('provider') || req.headers.get('x-provider')

    if (!provider) {
      throw new Error('Provider not specified')
    }

    // Parse webhook payload
    const payload = await req.json()

    console.log('Webhook received from provider:', provider)
    console.log('Payload:', JSON.stringify(payload, null, 2))

    // Process webhook based on provider
    switch (provider) {
      case 'certificadora-sur':
        await processCertificadoraSurWebhook(supabaseAdmin, payload)
        break

      case 'tupatrimonio-simple':
        await processTuPatrimonioWebhook(supabaseAdmin, payload)
        break

      default:
        throw new Error(`Unknown provider: ${provider}`)
    }

    return new Response(
      JSON.stringify({ success: true }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Error in signatures-webhook:', error)
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Internal server error',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})

// Process Certificadora del Sur webhook
async function processCertificadoraSurWebhook(supabase: any, payload: any) {
  const { external_id, event_type, signer_email, signed_document_url } = payload

  // Find document by external_id
  const { data: document } = await supabase
    .schema('signatures')
    .from('documents')
    .select('*')
    .eq('external_id', external_id)
    .single()

  if (!document) {
    throw new Error('Document not found')
  }

  // Process based on event type
  switch (event_type) {
    case 'signer_viewed':
      // Update signer status
      await supabase
        .schema('signatures')
        .from('document_signers')
        .update({ status: 'viewed' })
        .eq('document_id', document.id)
        .eq('email', signer_email)

      // Create event
      await supabase
        .schema('signatures')
        .from('document_events')
        .insert({
          document_id: document.id,
          organization_id: document.organization_id,
          event_type: 'signer_viewed',
          description: `${signer_email} vio el documento`,
        })
      break

    case 'signer_signed':
      // Update signer status
      await supabase
        .schema('signatures')
        .from('document_signers')
        .update({
          status: 'signed',
          signed_at: new Date().toISOString(),
        })
        .eq('document_id', document.id)
        .eq('email', signer_email)

      // Create event
      await supabase
        .schema('signatures')
        .from('document_events')
        .insert({
          document_id: document.id,
          organization_id: document.organization_id,
          event_type: 'signer_signed',
          description: `${signer_email} firmó el documento`,
        })

      // Check if all signed
      const { data: allSigners } = await supabase
        .schema('signatures')
        .from('document_signers')
        .select('status')
        .eq('document_id', document.id)

      const allSigned = allSigners?.every((s: any) => s.status === 'signed')

      if (allSigned) {
        // Update document status
        await supabase
          .schema('signatures')
          .from('documents')
          .update({
            status: 'fully_signed',
            signed_file_url: signed_document_url,
          })
          .eq('id', document.id)

        // Create event
        await supabase
          .schema('signatures')
          .from('document_events')
          .insert({
            document_id: document.id,
            organization_id: document.organization_id,
            event_type: 'document_fully_signed',
            description: 'Documento completamente firmado',
          })

        // TODO: Send webhook to client if configured
        // TODO: Send to notary if configured
      } else {
        // Update to partially signed
        await supabase
          .schema('signatures')
          .from('documents')
          .update({ status: 'partially_signed' })
          .eq('id', document.id)
      }
      break

    case 'signer_rejected':
      // Update signer status
      await supabase
        .schema('signatures')
        .from('document_signers')
        .update({
          status: 'rejected',
          rejected_at: new Date().toISOString(),
        })
        .eq('document_id', document.id)
        .eq('email', signer_email)

      // Update document status
      await supabase
        .schema('signatures')
        .from('documents')
        .update({ status: 'rejected' })
        .eq('id', document.id)

      // Create event
      await supabase
        .schema('signatures')
        .from('document_events')
        .insert({
          document_id: document.id,
          organization_id: document.organization_id,
          event_type: 'signer_rejected',
          description: `${signer_email} rechazó firmar el documento`,
        })
      break
  }
}

// Process TuPatrimonio webhook
async function processTuPatrimonioWebhook(supabase: any, payload: any) {
  // Similar logic to Certificadora del Sur
  // Implementation specific to TuPatrimonio's simple signature service
  await processCertificadoraSurWebhook(supabase, payload)
}

