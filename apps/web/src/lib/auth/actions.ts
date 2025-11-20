'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

/**
 * Cierra la sesión del usuario actual
 */
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

