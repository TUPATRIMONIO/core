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
  waitSeconds?: number // Tiempo en segundos que debe esperar antes de intentar de nuevo
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
    const translated = translateError(error.message)
    return { error: translated.message, waitSeconds: translated.waitSeconds }
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
    const translated = translateError(error.message)
    return { error: translated.message, waitSeconds: translated.waitSeconds }
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
    const translated = translateError(error.message)
    return { error: translated.message, waitSeconds: translated.waitSeconds }
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
  try {
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
      // Log detallado para diagnosticar errores no mapeados
      console.error('Error completo en updatePassword:', {
        message: error.message,
        status: error.status,
        name: error.name,
        code: (error as any).code, // Código de error si existe
      })
      const translated = translateError(error.message)
      return { error: translated.message, waitSeconds: translated.waitSeconds }
    }

    // La contraseña se actualizó correctamente, intentar revalidar cache
    // Si falla, no es crítico porque la contraseña ya está actualizada
    try {
      revalidatePath('/', 'layout')
    } catch (revalidateError) {
      // revalidatePath puede fallar en algunos casos, pero no es crítico
      // La contraseña ya se actualizó correctamente en Supabase
      console.warn('Error al revalidar path (no crítico, contraseña actualizada):', revalidateError)
    }
    
    // NO redirigir aquí para evitar errores NEXT_REDIRECT en el cliente
    // Retornamos éxito y dejamos que el cliente redirija
    return { success: true }
  } catch (error: any) {
    console.error('Error inesperado en updatePassword:', error)
    return { error: 'Ocurrió un error inesperado al actualizar la contraseña. Por favor intenta de nuevo.' }
  }
}

// ============================================================================
// PASSWORDLESS AUTH (OTP)
// ============================================================================

/**
 * Solicitar código OTP por email
 * Referencia: https://supabase.com/docs/guides/auth/auth-email-passwordless#with-email-otp
 * 
 * Step 1: Send the user an OTP code
 * Si la solicitud es exitosa, recibes una respuesta con error: null y un objeto data
 * donde tanto user como session son null. Informa al usuario que revise su email.
 */
export async function signInWithEmailOTP(formData: FormData): Promise<ActionResult> {
  const email = formData.get('email') as string

  if (!email) {
    return { error: 'Por favor ingresa tu email' }
  }

  const supabase = await createClient()

  const { data, error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: false,
    },
  })

  if (error) {
    console.error('Error en signInWithEmailOTP:', error)
    const translated = translateError(error.message)
    return { error: translated.message, waitSeconds: translated.waitSeconds }
  }

  // Según documentación: { data: { user: null, session: null }, error: null }
  return { 
    success: true, 
    message: 'Te enviamos un código de 6 dígitos a tu email' 
  }
}

/**
 * Verificar código OTP
 * Referencia: https://supabase.com/docs/guides/auth/auth-email-passwordless#with-email-otp
 * 
 * Step 2: Verify the OTP to create a session
 * Si es exitoso, el usuario ahora está autenticado y recibes una sesión válida.
 */
export async function verifyOTP(formData: FormData): Promise<ActionResult> {
  const email = formData.get('email') as string
  const token = formData.get('token') as string

  if (!email || !token) {
    return { error: 'Por favor completa todos los campos' }
  }

  const supabase = await createClient()

  const {
    data: { session },
    error,
  } = await supabase.auth.verifyOtp({
    email,
    token,
    type: 'email',
  })

  if (error) {
    console.error('Error en verifyOTP:', error)
    const translated = translateError(error.message)
    return { error: translated.message, waitSeconds: translated.waitSeconds }
  }

  if (!session) {
    return { error: 'No se pudo establecer la sesión. Por favor intenta de nuevo' }
  }

  // Usar la sesión retornada directamente (según documentación)
  // El usuario ya está autenticado en este punto
  const user = session.user

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
    const translated = translateError(error.message)
    redirect(`/login?error=${encodeURIComponent(translated.message)}`)
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
    const translated = translateError(error.message)
    return { error: translated.message, waitSeconds: translated.waitSeconds }
  }

  return { 
    success: true, 
    message: 'Email de verificación enviado. Revisa tu bandeja de entrada' 
  }
}

/**
 * Traducir errores de Supabase a español amigable
 * Retorna un objeto con el mensaje y opcionalmente el tiempo restante en segundos
 */
function translateError(error: string): { message: string; waitSeconds?: number } {
  const errorMap: Record<string, { message: string; extractWaitTime?: (error: string) => number | undefined }> = {
    'Invalid login credentials': { message: 'Email o contraseña incorrectos' },
    'Email not confirmed': { message: 'Por favor verifica tu email antes de iniciar sesión' },
    'User already registered': { message: 'Este email ya está registrado' },
    'Password should be at least 6 characters': { message: 'La contraseña debe tener al menos 6 caracteres' },
    'Unable to validate email address': { message: 'Email inválido' },
    'Signups not allowed for otp': { message: 'No se permiten registros con este método' },
    'Email rate limit exceeded': {
      message: 'Debes esperar unos minutos antes de intentar nuevamente.',
      extractWaitTime: (err: string) => {
        // Buscar patrones como "60 seconds", "wait 60s", etc.
        const match = err.match(/(\d+)\s*(?:second|segundo|s)/i)
        return match ? parseInt(match[1], 10) : undefined
      },
    },
    'Invalid OTP': { message: 'Código incorrecto o expirado' },
    'Token has expired': { message: 'El enlace o código ha expirado. Por favor solicita uno nuevo' },
    'For security purposes, you can only request': {
      message: 'Debes esperar un momento antes de solicitar un nuevo enlace.',
      extractWaitTime: (err: string) => {
        // Buscar patrones como "request once every 60 seconds"
        const match = err.match(/(\d+)\s*(?:second|segundo|s)/i)
        return match ? parseInt(match[1], 10) : undefined
      },
    },
    // Errores específicos de reset de contraseña
    'New password should be different from the old password': {
      message: 'La nueva contraseña debe ser diferente a la anterior',
    },
    'User not found': {
      message: 'Sesión expirada. Por favor solicita un nuevo enlace de recuperación',
    },
    'Session expired': {
      message: 'Tu sesión ha expirado. Por favor solicita un nuevo enlace de recuperación',
    },
    'Invalid session': {
      message: 'Sesión inválida. Por favor solicita un nuevo enlace de recuperación',
    },
    'JWT expired': {
      message: 'El enlace de recuperación ha expirado. Por favor solicita uno nuevo',
    },
  }

  // Buscar coincidencia parcial
  for (const [key, config] of Object.entries(errorMap)) {
    if (error.includes(key)) {
      const waitSeconds = config.extractWaitTime ? config.extractWaitTime(error) : undefined
      return { message: config.message, waitSeconds }
    }
  }

  // Si no hay traducción, retornar mensaje genérico
  return { message: 'Ocurrió un error. Por favor intenta de nuevo' }
}

