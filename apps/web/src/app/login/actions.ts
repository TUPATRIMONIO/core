'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

// Tipos para las respuestas de las acciones
interface AuthResult {
  error?: string
  success?: boolean
  message?: string
}

// Acción para iniciar sesión
export async function signIn(prevState: AuthResult | null, formData: FormData): Promise<AuthResult> {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const rememberMe = formData.get('rememberMe') === 'on'

  // Validaciones básicas del lado del servidor
  if (!email) {
    return { error: 'El email es requerido' }
  }
  
  if (!password) {
    return { error: 'La contraseña es requerida' }
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    return { error: 'Email no válido' }
  }

  try {
    const supabase = await createClient()
    
    // Si "remember me", la sesión persiste; sino solo durante la sesión del navegador
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
      options: {
        persistSession: rememberMe,
      },
    })

    if (error) {
      // Manejo de errores específicos de Supabase
      switch (error.message) {
        case 'Invalid login credentials':
          return { error: 'Credenciales incorrectas' }
        case 'Email not confirmed':
          return { error: 'Por favor confirma tu email antes de iniciar sesión' }
        case 'Too many requests':
          return { error: 'Demasiados intentos. Inténtalo más tarde' }
        default:
          return { error: error.message || 'Error al iniciar sesión' }
      }
    }

    if (data.user) {
      // Verificar si hay un redirect pendiente (cuando el usuario intentó acceder a una ruta protegida)
      const redirectTo = formData.get('redirectTo') as string | null
      let targetPath = redirectTo || '/dashboard'

      // Si no hay redirect específico, manejar la lógica de organizaciones
      if (!redirectTo) {
        // Obtener organizaciones activas del usuario
        const { data: memberships, error: membershipsError } = await supabase
          .schema('core')
          .from('organization_users')
          .select('organization_id')
          .eq('user_id', data.user.id)
          .eq('status', 'active')

        if (!membershipsError && memberships) {
          if (memberships.length === 1) {
            const singleOrgId = memberships[0]?.organization_id
            if (singleOrgId) {
              await supabase
                .schema('core')
                .from('users')
                .update({ last_active_organization_id: singleOrgId })
                .eq('id', data.user.id)
            }
          } else if (memberships.length > 1) {
            const { data: userProfile } = await supabase
              .schema('core')
              .from('users')
              .select('last_active_organization_id')
              .eq('id', data.user.id)
              .maybeSingle()

            if (!userProfile?.last_active_organization_id) {
              targetPath = '/dashboard/select-organization'
            }
          }
        }
      }

      revalidatePath('/', 'layout')
      redirect(targetPath)
    }

    return { error: 'Error inesperado al iniciar sesión' }
  } catch (error) {
    // No capturar errores de redirección de Next.js
    if (error && typeof error === 'object' && 'digest' in error && String(error.digest).includes('NEXT_REDIRECT')) {
      throw error // Re-lanzar para que Next.js lo maneje
    }
    
    console.error('Error in signIn:', error)
    return { error: 'Error interno del servidor' }
  }
}

// Acción para registrarse
export async function signUp(prevState: AuthResult | null, formData: FormData): Promise<AuthResult> {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const confirmPassword = formData.get('confirmPassword') as string

  // Validaciones básicas del lado del servidor
  if (!email) {
    return { error: 'El email es requerido' }
  }
  
  if (!password) {
    return { error: 'La contraseña es requerida' }
  }

  if (!confirmPassword) {
    return { error: 'Debes confirmar tu contraseña' }
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    return { error: 'Email no válido' }
  }

  if (password.length < 6) {
    return { error: 'La contraseña debe tener al menos 6 caracteres' }
  }

  if (password !== confirmPassword) {
    return { error: 'Las contraseñas no coinciden' }
  }

  try {
    const supabase = await createClient()
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}auth/callback`,
      },
    })

    if (error) {
      // Manejo de errores específicos de Supabase
      switch (error.message) {
        case 'User already registered':
          return { error: 'Ya existe una cuenta con este email' }
        case 'Password should be at least 6 characters':
          return { error: 'La contraseña debe tener al menos 6 caracteres' }
        case 'Invalid email':
          return { error: 'Email no válido' }
        default:
          return { error: error.message || 'Error al crear la cuenta' }
      }
    }

    if (data.user) {
      // Si se requiere confirmación de email
      if (!data.session) {
        return { 
          success: true, 
          message: 'Cuenta creada exitosamente. Por favor revisa tu email para confirmar tu cuenta.' 
        }
      }

      // Si no se requiere confirmación, redirigir a onboarding
      revalidatePath('/', 'layout')
      redirect('/onboarding')
    }

    return { error: 'Error inesperado al crear la cuenta' }
  } catch (error) {
    // No capturar errores de redirección de Next.js
    if (error && typeof error === 'object' && 'digest' in error && String(error.digest).includes('NEXT_REDIRECT')) {
      throw error // Re-lanzar para que Next.js lo maneje
    }
    
    console.error('Error in signUp:', error)
    return { error: 'Error interno del servidor' }
  }
}

// Acción para iniciar sesión con GitHub OAuth
export async function signInWithGitHub(): Promise<void> {
  const supabase = await createClient()
  
  // Construir URL del callback eliminando barras duplicadas
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  const callbackUrl = `${baseUrl.replace(/\/$/, '')}/auth/callback`
  
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'github',
    options: {
      redirectTo: callbackUrl,
    },
  })

  if (error) {
    console.error('Error signing in with GitHub:', error)
    redirect('/login?error=Error al iniciar sesión con GitHub')
  }

  if (data.url) {
    redirect(data.url)
  }
  
  // Si llegamos aquí sin URL, hay un problema
  redirect('/login?error=Error al iniciar sesión con GitHub')
}

// Acción para cerrar sesión
export async function signOut(): Promise<void> {
  try {
    const supabase = await createClient()
    
    const { error } = await supabase.auth.signOut()

    if (error) {
      console.error('Error signing out:', error)
    }

    revalidatePath('/', 'layout')
    redirect('/login')
  } catch (error) {
    console.error('Error in signOut:', error)
    // En caso de error, aún redirigir al login
    redirect('/login')
  }
}

// Acción para restablecer contraseña
export async function resetPassword(prevState: AuthResult | null, formData: FormData): Promise<AuthResult> {
  const email = formData.get('email') as string

  if (!email) {
    return { error: 'El email es requerido' }
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    return { error: 'Email no válido' }
  }

  try {
    const supabase = await createClient()
    
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}auth/reset-password`,
    })

    if (error) {
      return { error: error.message || 'Error al enviar el email de recuperación' }
    }

    return { 
      success: true, 
      message: 'Se ha enviado un email para restablecer tu contraseña' 
    }
  } catch (error) {
    // No capturar errores de redirección de Next.js
    if (error && typeof error === 'object' && 'digest' in error && String(error.digest).includes('NEXT_REDIRECT')) {
      throw error // Re-lanzar para que Next.js lo maneje
    }
    
    console.error('Error in resetPassword:', error)
    return { error: 'Error interno del servidor' }
  }
}

// Acción para reenviar email de confirmación
export async function resendConfirmationEmail(prevState: AuthResult | null, formData: FormData): Promise<AuthResult> {
  const email = formData.get('email') as string

  if (!email) {
    return { error: 'El email es requerido' }
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    return { error: 'Email no válido' }
  }

  try {
    const supabase = await createClient()
    
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}auth/callback`,
      }
    })

    if (error) {
      return { error: error.message || 'Error al reenviar email de confirmación' }
    }

    return { 
      success: true, 
      message: 'Email de confirmación reenviado. Por favor revisa tu bandeja de entrada.' 
    }
  } catch (error) {
    console.error('Error in resendConfirmationEmail:', error)
    return { error: 'Error interno del servidor' }
  }
}
