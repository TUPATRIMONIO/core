import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const AUTH_EVENTS_TO_SYNC = new Set(['SIGNED_IN', 'TOKEN_REFRESHED', 'USER_UPDATED'])

export async function POST(request: Request) {
  try {
    const { event, session } = await request.json().catch(() => ({}))

    if (!event) {
      return NextResponse.json(
        { success: false, error: 'EVENT_REQUIRED' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    if (AUTH_EVENTS_TO_SYNC.has(event)) {
      if (!session?.access_token || !session?.refresh_token) {
        return NextResponse.json(
          { success: false, error: 'SESSION_TOKENS_REQUIRED' },
          { status: 400 }
        )
      }

      const { error } = await supabase.auth.setSession({
        access_token: session.access_token,
        refresh_token: session.refresh_token,
      })

      if (error) {
        console.error('Error syncing session:', error)
        return NextResponse.json(
          { success: false, error: 'SESSION_SYNC_FAILED' },
          { status: 500 }
        )
      }
    } else if (event === 'SIGNED_OUT') {
      const { error } = await supabase.auth.signOut()

      if (error) {
        console.error('Error clearing session:', error)
        return NextResponse.json(
          { success: false, error: 'SESSION_CLEAR_FAILED' },
          { status: 500 }
        )
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Unexpected session sync error:', error)
    return NextResponse.json(
      { success: false, error: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}

export function GET() {
  return NextResponse.json({ success: false, error: 'METHOD_NOT_ALLOWED' }, { status: 405 })
}


