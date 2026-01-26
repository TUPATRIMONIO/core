'use server'

import { revalidatePath } from 'next/cache'
import { createClient, createServiceRoleClient } from '@/lib/supabase/server'

type ActionResult = {
  error?: string
  success?: boolean
  message?: string
  data?: any
}

async function verifyPlatformAdmin(): Promise<boolean> {
  const supabase = await createClient()
  const { data } = await supabase.rpc('is_platform_admin')
  return data === true
}

/**
 * Obtiene todas las dependencias de un usuario en la base de datos
 */
export async function getUserDependencies(userId: string): Promise<ActionResult> {
  if (!(await verifyPlatformAdmin())) {
    return { error: 'No tienes permisos para realizar esta acción' }
  }

  const supabase = await createClient()

  try {
    const { data, error } = await supabase.rpc('get_user_dependencies', {
      p_user_id: userId,
    })

    if (error) {
      return { error: error.message || 'Error al obtener dependencias del usuario' }
    }

    return { success: true, data }
  } catch (err: any) {
    return { error: err.message || 'Error inesperado al obtener dependencias' }
  }
}

/**
 * Elimina un usuario con limpieza o reasignación de datos
 */
export async function deleteUserWithCleanup(params: {
  userId: string
  reassignToUserId?: string
  deleteData: boolean
}): Promise<ActionResult> {
  if (!(await verifyPlatformAdmin())) {
    return { error: 'No tienes permisos para realizar esta acción' }
  }

  const supabase = await createClient()

  try {
    const { data, error } = await supabase.rpc('delete_user_with_cleanup', {
      p_user_id: params.userId,
      p_reassign_to: params.reassignToUserId || null,
      p_delete_data: params.deleteData,
    })

    if (error) {
      return { error: error.message || 'Error al eliminar el usuario' }
    }

    revalidatePath('/admin/users')
    return { success: true, message: 'Usuario eliminado exitosamente' }
  } catch (err: any) {
    return { error: err.message || 'Error inesperado al eliminar el usuario' }
  }
}

/**
 * Obtiene una lista de usuarios administradores para reasignación
 */
export async function getPotentialReassignees(): Promise<ActionResult> {
  if (!(await verifyPlatformAdmin())) {
    return { error: 'No tienes permisos para realizar esta acción' }
  }

  const supabase = await createServiceRoleClient()

  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, full_name, status')
      .eq('status', 'active')
      .limit(50)

    if (error) {
      return { error: error.message || 'Error al obtener usuarios para reasignación' }
    }

    return { success: true, data }
  } catch (err: any) {
    return { error: err.message || 'Error inesperado al obtener usuarios' }
  }
}
