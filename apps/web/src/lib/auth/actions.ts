'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { headers } from 'next/headers'

// Función helper para obtener origin URL
async function getURL() {
  const headersList = await headers()
  const host = headersList.get('host')
  const protocol = process.env.NODE_ENV === 'development' ? 'http' : 'https'
  return `${protocol}://${host}`
}

// Tipos para retorno de acciones
type ActionResult = {
  error?: string
  success?: boolean
  message?: string
}

// ============================================================================
// PASSWORD-BASED AUTH
// ============================================================================

/**
 * Registro de usuario con email y password
 * Referencia: https://supabase.com/docs/guides/auth/passwords
 */
export async function signUp(formData: FormData): Promise<ActionResult> {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  if (!email || !password) {
    return { error: 'Por favor completa todos los campos' }
  }

  const supabase = await createClient()
  const origin = await getURL()

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${origin}/auth/callback`,
    },
  })

  if (error) {
    console.error('Error en signUp:', error)
    return { error: translateError(error.message) }
  }

  // Redirigir a onboarding (el usuario completará el onboarding antes de usar el sistema)
  redirect('/onboarding')
}

/**
 * Login de usuario con email y password
 * Referencia: https://supabase.com/docs/guides/auth/passwords
 */
export async function signIn(formData: FormData): Promise<ActionResult> {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  if (!email || !password) {
    return { error: 'Por favor completa todos los campos' }
  }

  const supabase = await createClient()

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    console.error('Error en signIn:', error)
    return { error: translateError(error.message) }
  }

  // Obtener usuario autenticado
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Verificar si tiene organización
  if (user) {
    const { data: hasOrg } = await supabase.rpc('user_has_organization', {
      user_id: user.id,
    })

    revalidatePath('/', 'layout')

    // Si no tiene organización, redirigir a onboarding
    if (!hasOrg) {
      redirect('/onboarding')
      return
    }
  }

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}

/**
 * Solicitar reset de password
 * Referencia: https://supabase.com/docs/guides/auth/passwords#resetting-a-password
 */
export async function resetPassword(formData: FormData): Promise<ActionResult> {
  const email = formData.get('email') as string

  if (!email) {
    return { error: 'Por favor ingresa tu email' }
  }

  const supabase = await createClient()
  const origin = await getURL()

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/reset-password`,
  })

  if (error) {
    console.error('Error en resetPassword:', error)
    return { error: translateError(error.message) }
  }

  return { 
    success: true, 
    message: 'Te enviamos un email con instrucciones para restablecer tu contraseña' 
  }
}

/**
 * Actualizar password del usuario autenticado
 * Referencia: https://supabase.com/docs/guides/auth/passwords
 */
export async function updatePassword(formData: FormData): Promise<ActionResult> {
  const password = formData.get('password') as string

  if (!password) {
    return { error: 'Por favor ingresa una nueva contraseña' }
  }

  if (password.length < 6) {
    return { error: 'La contraseña debe tener al menos 6 caracteres' }
  }

  const supabase = await createClient()

  const { error } = await supabase.auth.updateUser({
    password,
  })

  if (error) {
    console.error('Error en updatePassword:', error)
    return { error: translateError(error.message) }
  }

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}

// ============================================================================
// PASSWORDLESS AUTH (MAGIC LINK & OTP)
// ============================================================================

/**
 * Login con Magic Link
 * Referencia: https://supabase.com/docs/guides/auth/auth-email-passwordless#with-magic-link
 */
export async function signInWithMagicLink(formData: FormData): Promise<ActionResult> {
  const email = formData.get('email') as string

  if (!email) {
    return { error: 'Por favor ingresa tu email' }
  }

  const supabase = await createClient()
  const origin = await getURL()

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: true,
      emailRedirectTo: `${origin}/auth/callback`,
    },
  })

  if (error) {
    console.error('Error en signInWithMagicLink:', error)
    return { error: translateError(error.message) }
  }

  return { 
    success: true, 
    message: 'Revisa tu email, te enviamos un link mágico para iniciar sesión' 
  }
}

/**
 * Solicitar código OTP por email
 * Referencia: https://supabase.com/docs/guides/auth/auth-email-passwordless#with-email-otp
 */
export async function signInWithEmailOTP(formData: FormData): Promise<ActionResult> {
  const email = formData.get('email') as string

  if (!email) {
    return { error: 'Por favor ingresa tu email' }
  }

  const supabase = await createClient()

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: false,
    },
  })

  if (error) {
    console.error('Error en signInWithEmailOTP:', error)
    return { error: translateError(error.message) }
  }

  return { 
    success: true, 
    message: 'Te enviamos un código de 6 dígitos a tu email' 
  }
}

/**
 * Verificar código OTP
 * Referencia: https://supabase.com/docs/guides/auth/auth-email-passwordless
 */
export async function verifyOTP(formData: FormData): Promise<ActionResult> {
  const email = formData.get('email') as string
  const token = formData.get('token') as string

  if (!email || !token) {
    return { error: 'Por favor completa todos los campos' }
  }

  const supabase = await createClient()

  const { error } = await supabase.auth.verifyOtp({
    email,
    token,
    type: 'email',
  })

  if (error) {
    console.error('Error en verifyOTP:', error)
    return { error: translateError(error.message) }
  }

  // Obtener usuario autenticado
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Verificar si tiene organización
  if (user) {
    const { data: hasOrg } = await supabase.rpc('user_has_organization', {
      user_id: user.id,
    })

    revalidatePath('/', 'layout')

    // Si no tiene organización, redirigir a onboarding
    if (!hasOrg) {
      redirect('/onboarding')
      return
    }
  }

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}

// ============================================================================
// OAUTH SOCIAL LOGIN
// ============================================================================

/**
 * Login con OAuth provider (Google, Facebook, GitHub, Apple)
 * Referencias:
 * - Google: https://supabase.com/docs/guides/auth/social-login/auth-google
 * - Facebook: https://supabase.com/docs/guides/auth/social-login/auth-facebook
 * - GitHub: https://supabase.com/docs/guides/auth/social-login/auth-github
 * - Apple: https://supabase.com/docs/guides/auth/social-login/auth-apple
 */
export async function signInWithOAuth(provider: 'google' | 'facebook' | 'github' | 'apple') {
  const supabase = await createClient()
  const origin = await getURL()

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: `${origin}/auth/callback`,
    },
  })

  if (error) {
    console.error('Error en signInWithOAuth:', error)
    redirect(`/login?error=${encodeURIComponent(translateError(error.message))}`)
  }

  if (data.url) {
    redirect(data.url)
  }
}

// ============================================================================
// SIGN OUT
// ============================================================================

/**
 * Cerrar sesión del usuario
 * Referencia: https://supabase.com/docs/guides/auth/signout
 */
export async function signOut() {
  const supabase = await createClient()

  const { error } = await supabase.auth.signOut()

  if (error) {
    console.error('Error en signOut:', error)
    redirect(`/login?error=${encodeURIComponent('Error al cerrar sesión')}`)
  }

  revalidatePath('/', 'layout')
  redirect('/login')
}

// ============================================================================
// UTILIDADES
// ============================================================================

/**
 * Reenviar email de verificación
 */
export async function resendVerificationEmail(formData: FormData): Promise<ActionResult> {
  const email = formData.get('email') as string

  if (!email) {
    return { error: 'Por favor ingresa tu email' }
  }

  const supabase = await createClient()
  const origin = await getURL()

  const { error } = await supabase.auth.resend({
    type: 'signup',
    email,
    options: {
      emailRedirectTo: `${origin}/auth/callback`,
    },
  })

  if (error) {
    console.error('Error en resendVerificationEmail:', error)
    return { error: translateError(error.message) }
  }

  return { 
    success: true, 
    message: 'Email de verificación enviado. Revisa tu bandeja de entrada' 
  }
}

/**
 * Traducir errores de Supabase a español amigable
 */
function translateError(error: string): string {
  const errorMap: Record<string, string> = {
    'Invalid login credentials': 'Email o contraseña incorrectos',
    'Email not confirmed': 'Por favor verifica tu email antes de iniciar sesión',
    'User already registered': 'Este email ya está registrado',
    'Password should be at least 6 characters': 'La contraseña debe tener al menos 6 caracteres',
    'Unable to validate email address': 'Email inválido',
    'Signups not allowed for otp': 'No se permiten registros con este método',
    'Email rate limit exceeded': 'Has solicitado demasiados emails. Intenta de nuevo en unos minutos',
    'Invalid OTP': 'Código incorrecto o expirado',
    'Token has expired': 'El código ha expirado. Solicita uno nuevo',
  }

  // Buscar coincidencia parcial
  for (const [key, value] of Object.entries(errorMap)) {
    if (error.includes(key)) {
      return value
    }
  }

  // Si no hay traducción, retornar mensaje genérico
  return 'Ocurrió un error. Por favor intenta de nuevo'
}

