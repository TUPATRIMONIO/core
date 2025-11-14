import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { LoginPageClient } from './LoginPageClient'

/**
 * Página de Login - Server Component
 * Verifica si el usuario ya está autenticado antes de mostrar el formulario
 */
export default async function LoginPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  // Si ya está autenticado, redirigir al dashboard
  if (user) {
    redirect('/dashboard')
  }
  
  // Mostrar el componente cliente de login
  return <LoginPageClient />
}
