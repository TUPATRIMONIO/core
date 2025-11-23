import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

/**
 * Layout de Onboarding
 * Verifica que el usuario esté autenticado y NO tenga organización
 */
export default async function OnboardingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  // Verificar autenticación
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  // Si no está autenticado, redirigir a login
  if (userError || !user) {
    redirect('/login')
  }

  // Verificar si ya tiene organización con retry para manejar problemas de timing
  let hasOrg: boolean | null = null
  let checkError: any = null

  // Intentar verificar organización (con un pequeño retry si falla la primera vez)
  for (let attempt = 0; attempt < 2; attempt++) {
    const result = await supabase.rpc('user_has_organization', {
      user_id: user.id,
    })

    if (result.error) {
      checkError = result.error
      
      // Si es el primer intento y hay error, esperar un poco y reintentar
      if (attempt === 0) {
        await new Promise(resolve => setTimeout(resolve, 100))
        continue
      }
    } else {
      hasOrg = result.data === true
      break
    }
  }

  // Si hay error después de los reintentos, loggear detalles y tratar como "no tiene organización"
  // Esto es seguro porque el usuario puede crear su organización en la página de onboarding
  if (checkError) {
    // Log detallado solo en desarrollo para debugging
    if (process.env.NODE_ENV === 'development') {
      console.error('Error verificando organización en layout:', {
        error: checkError,
        message: checkError.message || 'Sin mensaje',
        details: checkError.details || 'Sin detalles',
        hint: checkError.hint || 'Sin hint',
        code: checkError.code || 'Sin código',
        user_id: user.id,
      })
    }
    // Tratar como "no tiene organización" - permitir acceso al onboarding
    // Esto es seguro porque el usuario puede crear su organización aquí
    hasOrg = false
  }

  // Si ya tiene organización, redirigir al dashboard
  if (hasOrg === true) {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen bg-[var(--tp-background-light)]">
      {children}
    </div>
  )
}


