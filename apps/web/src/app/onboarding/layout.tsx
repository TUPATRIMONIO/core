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

  // Verificar si ya tiene organización
  const { data: hasOrg, error: checkError } = await supabase.rpc(
    'user_has_organization',
    {
      user_id: user.id,
    }
  )

  // Si hay error al verificar, permitir acceso (mejor UX que bloquear)
  if (checkError) {
    console.error('Error verificando organización en layout:', checkError)
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

