import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

/**
 * Ruta de callback para reset de contraseña
 * Maneja el código enviado por email y redirige a la página de cambio de contraseña
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')

  if (code) {
    const supabase = await createClient()
    
    // Intercambiar código por sesión
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      // Redirigir a página para establecer nueva contraseña
      return NextResponse.redirect(new URL('/reset-password', request.url))
    }
  }

  // Si hay error, redirigir al login con mensaje
  return NextResponse.redirect(
    new URL('/login?error=Enlace de recuperación inválido o expirado', request.url)
  )
}




