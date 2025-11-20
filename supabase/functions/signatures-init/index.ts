// Edge Function: Iniciar proceso de firma con proveedor
// Endpoint: POST /functions/v1/signatures-init

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface InitSignatureRequest {
  documentId: string
  organizationId: string
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('No authorization header')
    }

    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    )

    // Verify user
    const {
      data: { user },
    } = await supabaseClient.auth.getUser()

    if (!user) {
      throw new Error('Unauthorized')
    }

    // Parse request body
    const { documentId, organizationId }: InitSignatureRequest = await req.json()

    if (!documentId || !organizationId) {
      throw new Error('Missing required fields')
    }

    // Verify organization membership
    const { data: membership } = await supabaseClient
      .schema('core')
      .from('organization_users')
      .select('id')
      .eq('user_id', user.id)
      .eq('organization_id', organizationId)
      .eq('status', 'active')
      .single()

    if (!membership) {
      throw new Error('Not a member of this organization')
    }

    // Get document with provider info
    const { data: document, error: docError } = await supabaseClient
      .schema('signatures')
      .from('documents')
      .select(`
        *,
        provider:providers(*)
      `)
      .eq('id', documentId)
      .eq('organization_id', organizationId)
      .single()

    if (docError || !document) {
      throw new Error('Document not found')
    }

    // Get signers
    const { data: signers } = await supabaseClient
      .schema('signatures')
      .from('document_signers')
      .select('*')
      .eq('document_id', documentId)
      .order('signing_order')

    if (!signers || signers.length === 0) {
      throw new Error('No signers found')
    }

    // Call provider API based on provider slug
    let externalId: string | null = null

    switch (document.provider.slug) {
      case 'certificadora-sur':
        // TODO: Integrate with Certificadora del Sur API
        externalId = `cs-${documentId.slice(0, 8)}`
        break

      case 'tupatrimonio-simple':
        // TODO: Integrate with TuPatrimonio simple signature service
        externalId = `tp-${documentId.slice(0, 8)}`
        break

      default:
        throw new Error(`Provider ${document.provider.slug} not implemented`)
    }

    // Update document with external ID and status
    const { error: updateError } = await supabaseClient
      .schema('signatures')
      .from('documents')
      .update({
        external_id: externalId,
        status: 'pending_signatures',
      })
      .eq('id', documentId)

    if (updateError) {
      throw new Error('Failed to update document')
    }

    // Create event
    await supabaseClient
      .schema('signatures')
      .from('document_events')
      .insert({
        document_id: documentId,
        organization_id: organizationId,
        event_type: 'document_sent',
        description: 'Documento enviado para firma',
        performed_by: user.id,
      })

    // Update signers to notified
    await supabaseClient
      .schema('signatures')
      .from('document_signers')
      .update({ status: 'notified' })
      .eq('document_id', documentId)
      .eq('status', 'pending')

    // Create notification events for each signer
    for (const signer of signers) {
      await supabaseClient
        .schema('signatures')
        .from('document_events')
        .insert({
          document_id: documentId,
          organization_id: organizationId,
          signer_id: signer.id,
          event_type: 'signer_notified',
          description: `Notificación enviada a ${signer.name}`,
          performed_by: user.id,
        })
    }

    return new Response(
      JSON.stringify({
        success: true,
        documentId,
        externalId,
        message: 'Proceso de firma iniciado',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Error in signatures-init:', error)
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

