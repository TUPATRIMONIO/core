import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refrescar la sesión del usuario si existe
  // IMPORTANTE: Obtener usuario debe ser una operación de solo lectura, 
  // no debe escribir en la sesión. Usar getUser() en lugar de getSession() 
  // para evitar issues con las cookies.
  await supabase.auth.getUser()

  // Simplemente mantener la sesión actualizada
  // Ya no hay redirecciones automáticas, solo la página principal
  return supabaseResponse
}

