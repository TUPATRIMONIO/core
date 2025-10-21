import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const supabase = await createClient()
    
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      // Redirigir al dashboard después de confirmación exitosa
      return NextResponse.redirect(new URL(next, request.url))
    }
  }

  // Si hay error, redirigir al login con mensaje de error
  return NextResponse.redirect(
    new URL('/login?error=Error al confirmar el email', request.url)
  )
}

