// Edge Function: Enviar webhooks a clientes externos
// Endpoint: POST /functions/v1/send-webhook

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface WebhookPayload {
  webhookId: string
  event: string
  data: any
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create Supabase client with service role
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Parse request body
    const { webhookId, event, data }: WebhookPayload = await req.json()

    if (!webhookId || !event || !data) {
      throw new Error('Missing required fields')
    }

    // Get webhook configuration
    const { data: webhook, error: webhookError } = await supabase
      .schema('signatures')
      .from('webhooks')
      .select('*')
      .eq('id', webhookId)
      .eq('is_active', true)
      .single()

    if (webhookError || !webhook) {
      throw new Error('Webhook not found or inactive')
    }

    // Check if this event is enabled
    const eventTypes = webhook.event_types as string[]
    if (!eventTypes.includes(event) && !eventTypes.includes('*')) {
      console.log(`Webhook ${webhookId} not configured for event ${event}`)
      return new Response(
        JSON.stringify({ success: true, message: 'Event not configured' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      )
    }

    // Prepare webhook payload
    const webhookPayload = {
      event,
      timestamp: new Date().toISOString(),
      data,
    }

    // Send webhook with retry logic
    let attempt = 0
    const maxAttempts = 3
    let lastError: Error | null = null
    let response: Response | null = null

    while (attempt < maxAttempts) {
      attempt++

      try {
        response = await fetch(webhook.url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Webhook-Signature': await generateSignature(webhookPayload, webhook.secret),
            'X-Webhook-Event': event,
            'X-Webhook-Attempt': attempt.toString(),
          },
          body: JSON.stringify(webhookPayload),
        })

        if (response.ok) {
          // Success!
          await supabase
            .schema('signatures')
            .from('webhook_deliveries')
            .insert({
              webhook_id: webhookId,
              event_type: event,
              payload: webhookPayload,
              response_status: response.status,
              response_body: await response.text(),
              attempt_number: attempt,
              delivered: true,
            })

          return new Response(
            JSON.stringify({
              success: true,
              attempt,
              status: response.status,
            }),
            {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 200,
            }
          )
        } else {
          lastError = new Error(`HTTP ${response.status}: ${await response.text()}`)
        }
      } catch (error) {
        lastError = error as Error
        console.error(`Webhook attempt ${attempt} failed:`, error)
      }

      // Wait before retry (exponential backoff)
      if (attempt < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000))
      }
    }

    // All attempts failed
    await supabase
      .schema('signatures')
      .from('webhook_deliveries')
      .insert({
        webhook_id: webhookId,
        event_type: event,
        payload: webhookPayload,
        response_status: response?.status || 0,
        response_body: lastError?.message || 'Unknown error',
        attempt_number: maxAttempts,
        delivered: false,
      })

    throw new Error(`Failed after ${maxAttempts} attempts: ${lastError?.message}`)
  } catch (error) {
    console.error('Error in send-webhook:', error)
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Internal server error',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})

async function generateSignature(payload: any, secret: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(JSON.stringify(payload))
  const key = encoder.encode(secret)

  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    key,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )

  const signature = await crypto.subtle.sign('HMAC', cryptoKey, data)
  const hashArray = Array.from(new Uint8Array(signature))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

