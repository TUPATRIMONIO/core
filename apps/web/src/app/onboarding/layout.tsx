import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

/**
 * Layout de Onboarding
 * Verifica que el usuario esté autenticado
 * El control de creación adicional se maneja en la página (?new=true)
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

  // NOTA: La redirección cuando ya tiene organización se maneja en la página
  // para permitir el parámetro ?new=true que permite crear organizaciones adicionales

  return (
    <div className="min-h-screen bg-[var(--tp-background-light)]">
      {children}
    </div>
  )
}


