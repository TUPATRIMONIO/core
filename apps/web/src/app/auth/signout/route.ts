import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { NextRequest } from 'next/server'

/**
 * Ruta para cerrar sesión
 * Maneja POST requests desde formularios HTML
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Cerrar sesión en Supabase
    const { error } = await supabase.auth.signOut()
    
    if (error) {
      console.error('Error signing out:', error)
    }
    
    // Revalidar todas las rutas para limpiar caché
    revalidatePath('/', 'layout')
    
    // Redirigir a login
    redirect('/login')
  } catch (error) {
    console.error('Error in signout route:', error)
    // En caso de error, aún redirigir al login
    redirect('/login')
  }
}




