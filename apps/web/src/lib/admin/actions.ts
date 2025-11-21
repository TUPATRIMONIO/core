'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

type ActionResult = {
  error?: string
  success?: boolean
  message?: string
  data?: any
}

// ============================================================================
// HELPER: Verificar si es platform admin
// ============================================================================

async function verifyPlatformAdmin(): Promise<boolean> {
  const supabase = await createClient()
  const { data } = await supabase.rpc('is_platform_admin')
  return data === true
}

// ============================================================================
// ORGANIZACIONES
// ============================================================================

export async function createOrganization(formData: FormData): Promise<ActionResult> {
  if (!(await verifyPlatformAdmin())) {
    return { error: 'No tienes permisos para realizar esta acción' }
  }

  const name = formData.get('name') as string
  const slug = formData.get('slug') as string
  const orgType = formData.get('org_type') as string
  const email = formData.get('email') as string | null
  const phone = formData.get('phone') as string | null
  const country = formData.get('country') as string | null
  const status = formData.get('status') as string || 'trial'

  if (!name || !slug || !orgType) {
    return { error: 'Nombre, slug y tipo son campos requeridos' }
  }

  // Validar formato de slug
  if (!/^[a-z0-9][a-z0-9-]*[a-z0-9]$/.test(slug)) {
    return { error: 'El slug debe contener solo letras minúsculas, números y guiones' }
  }

  // Validar email si se proporciona
  if (email && !/^[^@]+@[^@]+\.[^@]+$/.test(email)) {
    return { error: 'Email inválido' }
  }

  const supabase = await createClient()

  try {
    const { data, error } = await supabase
      .from('organizations')
      .insert({
        name,
        slug,
        org_type: orgType,
        email: email || null,
        phone: phone || null,
        country: country || null,
        status,
      })
      .select()
      .single()

    if (error) {
      if (error.code === '23505') {
        return { error: 'El slug ya está en uso' }
      }
      return { error: error.message || 'Error al crear la organización' }
    }

    revalidatePath('/admin/organizations')
    return { success: true, message: 'Organización creada exitosamente', data }
  } catch (err: any) {
    return { error: err.message || 'Error inesperado al crear la organización' }
  }
}

export async function updateOrganization(id: string, formData: FormData): Promise<ActionResult> {
  if (!(await verifyPlatformAdmin())) {
    return { error: 'No tienes permisos para realizar esta acción' }
  }

  const name = formData.get('name') as string
  const slug = formData.get('slug') as string
  const email = formData.get('email') as string | null
  const phone = formData.get('phone') as string | null
  const country = formData.get('country') as string | null
  const status = formData.get('status') as string

  if (!name || !slug || !status) {
    return { error: 'Nombre, slug y estado son campos requeridos' }
  }

  // Validar formato de slug
  if (!/^[a-z0-9][a-z0-9-]*[a-z0-9]$/.test(slug)) {
    return { error: 'El slug debe contener solo letras minúsculas, números y guiones' }
  }

  // Validar email si se proporciona
  if (email && !/^[^@]+@[^@]+\.[^@]+$/.test(email)) {
    return { error: 'Email inválido' }
  }

  const supabase = await createClient()

  try {
    const { error } = await supabase
      .from('organizations')
      .update({
        name,
        slug,
        email: email || null,
        phone: phone || null,
        country: country || null,
        status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)

    if (error) {
      if (error.code === '23505') {
        return { error: 'El slug ya está en uso' }
      }
      return { error: error.message || 'Error al actualizar la organización' }
    }

    revalidatePath('/admin/organizations')
    revalidatePath(`/admin/organizations/${id}`)
    return { success: true, message: 'Organización actualizada exitosamente' }
  } catch (err: any) {
    return { error: err.message || 'Error inesperado al actualizar la organización' }
  }
}

// ============================================================================
// ROLES Y USUARIOS
// ============================================================================

export async function assignRoleToUser(
  organizationId: string,
  userId: string,
  roleId: string
): Promise<ActionResult> {
  if (!(await verifyPlatformAdmin())) {
    return { error: 'No tienes permisos para realizar esta acción' }
  }

  const supabase = await createClient()

  try {
    const { error } = await supabase.rpc('assign_role_to_user', {
      p_organization_id: organizationId,
      p_user_id: userId,
      p_role_id: roleId,
    })

    if (error) {
      return { error: error.message || 'Error al asignar el rol' }
    }

    revalidatePath('/admin/users')
    revalidatePath(`/admin/organizations/${organizationId}`)
    return { success: true, message: 'Rol asignado exitosamente' }
  } catch (err: any) {
    return { error: err.message || 'Error inesperado al asignar el rol' }
  }
}

export async function removeUserFromOrganization(
  organizationId: string,
  userId: string
): Promise<ActionResult> {
  if (!(await verifyPlatformAdmin())) {
    return { error: 'No tienes permisos para realizar esta acción' }
  }

  const supabase = await createClient()

  try {
    const { error } = await supabase.rpc('remove_user_from_organization', {
      p_organization_id: organizationId,
      p_user_id: userId,
    })

    if (error) {
      return { error: error.message || 'Error al remover el usuario' }
    }

    revalidatePath('/admin/users')
    revalidatePath(`/admin/organizations/${organizationId}`)
    return { success: true, message: 'Usuario removido exitosamente' }
  } catch (err: any) {
    return { error: err.message || 'Error inesperado al remover el usuario' }
  }
}

// ============================================================================
// INVITACIONES
// ============================================================================

export async function sendInvitation(formData: FormData): Promise<ActionResult> {
  if (!(await verifyPlatformAdmin())) {
    return { error: 'No tienes permisos para realizar esta acción' }
  }

  const organizationId = formData.get('organization_id') as string
  const email = formData.get('email') as string
  const roleId = formData.get('role_id') as string
  const message = formData.get('message') as string | null

  if (!organizationId || !email || !roleId) {
    return { error: 'Organización, email y rol son campos requeridos' }
  }

  // Validar email
  if (!/^[^@]+@[^@]+\.[^@]+$/.test(email)) {
    return { error: 'Email inválido' }
  }

  const supabase = await createClient()

  try {
    const { data, error } = await supabase.rpc('send_organization_invitation', {
      org_id: organizationId,
      invite_email: email,
      role_id: roleId,
      invitation_message: message || null,
    })

    if (error) {
      return { error: error.message || 'Error al enviar la invitación' }
    }

    revalidatePath('/admin/invitations')
    return { success: true, message: 'Invitación enviada exitosamente', data }
  } catch (err: any) {
    return { error: err.message || 'Error inesperado al enviar la invitación' }
  }
}

export async function cancelInvitation(invitationId: string): Promise<ActionResult> {
  if (!(await verifyPlatformAdmin())) {
    return { error: 'No tienes permisos para realizar esta acción' }
  }

  const supabase = await createClient()

  try {
    // Obtener la invitación para usar la función helper
    const { data: invitation } = await supabase
      .from('invitations')
      .select('id, token')
      .eq('id', invitationId)
      .single()

    if (!invitation) {
      return { error: 'Invitación no encontrada' }
    }

    const { error } = await supabase.rpc('cancel_invitation', {
      invitation_token: invitation.token,
    })

    if (error) {
      return { error: error.message || 'Error al cancelar la invitación' }
    }

    revalidatePath('/admin/invitations')
    return { success: true, message: 'Invitación cancelada exitosamente' }
  } catch (err: any) {
    return { error: err.message || 'Error inesperado al cancelar la invitación' }
  }
}

// ============================================================================
// TEAMS
// ============================================================================

export async function createTeam(formData: FormData): Promise<ActionResult> {
  if (!(await verifyPlatformAdmin())) {
    return { error: 'No tienes permisos para realizar esta acción' }
  }

  const organizationId = formData.get('organization_id') as string
  const name = formData.get('name') as string
  const description = formData.get('description') as string | null
  const leadUserId = formData.get('lead_user_id') as string | null
  const color = formData.get('color') as string | null

  if (!organizationId || !name) {
    return { error: 'Organización y nombre son campos requeridos' }
  }

  // Validar color si se proporciona
  if (color && !/^#[0-9A-Fa-f]{6}$/.test(color)) {
    return { error: 'Color inválido. Debe ser un código hexadecimal (ej: #FF5733)' }
  }

  const supabase = await createClient()

  try {
    const { data, error } = await supabase
      .from('teams')
      .insert({
        organization_id: organizationId,
        name,
        description: description || null,
        lead_user_id: leadUserId || null,
        color: color || null,
      })
      .select()
      .single()

    if (error) {
      if (error.code === '23505') {
        return { error: 'Ya existe un team con ese nombre en esta organización' }
      }
      return { error: error.message || 'Error al crear el team' }
    }

    revalidatePath('/admin/teams')
    return { success: true, message: 'Team creado exitosamente', data }
  } catch (err: any) {
    return { error: err.message || 'Error inesperado al crear el team' }
  }
}

export async function updateTeam(id: string, formData: FormData): Promise<ActionResult> {
  if (!(await verifyPlatformAdmin())) {
    return { error: 'No tienes permisos para realizar esta acción' }
  }

  const name = formData.get('name') as string
  const description = formData.get('description') as string | null
  const leadUserId = formData.get('lead_user_id') as string | null
  const color = formData.get('color') as string | null

  if (!name) {
    return { error: 'El nombre es requerido' }
  }

  // Validar color si se proporciona
  if (color && !/^#[0-9A-Fa-f]{6}$/.test(color)) {
    return { error: 'Color inválido. Debe ser un código hexadecimal (ej: #FF5733)' }
  }

  const supabase = await createClient()

  try {
    const { error } = await supabase
      .from('teams')
      .update({
        name,
        description: description || null,
        lead_user_id: leadUserId || null,
        color: color || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)

    if (error) {
      if (error.code === '23505') {
        return { error: 'Ya existe un team con ese nombre en esta organización' }
      }
      return { error: error.message || 'Error al actualizar el team' }
    }

    revalidatePath('/admin/teams')
    revalidatePath(`/admin/teams/${id}`)
    return { success: true, message: 'Team actualizado exitosamente' }
  } catch (err: any) {
    return { error: err.message || 'Error inesperado al actualizar el team' }
  }
}

export async function deleteTeam(id: string): Promise<ActionResult> {
  if (!(await verifyPlatformAdmin())) {
    return { error: 'No tienes permisos para realizar esta acción' }
  }

  const supabase = await createClient()

  try {
    const { error } = await supabase.from('teams').delete().eq('id', id)

    if (error) {
      return { error: error.message || 'Error al eliminar el team' }
    }

    revalidatePath('/admin/teams')
    return { success: true, message: 'Team eliminado exitosamente' }
  } catch (err: any) {
    return { error: err.message || 'Error inesperado al eliminar el team' }
  }
}

export async function addTeamMember(teamId: string, userId: string, teamRole: string): Promise<ActionResult> {
  if (!(await verifyPlatformAdmin())) {
    return { error: 'No tienes permisos para realizar esta acción' }
  }

  const supabase = await createClient()

  try {
    const { data, error } = await supabase
      .from('team_members')
      .insert({
        team_id: teamId,
        user_id: userId,
        team_role: teamRole || 'member',
      })
      .select()
      .single()

    if (error) {
      if (error.code === '23505') {
        return { error: 'El usuario ya es miembro de este team' }
      }
      return { error: error.message || 'Error al agregar el miembro' }
    }

    revalidatePath('/admin/teams')
    revalidatePath(`/admin/teams/${teamId}`)
    return { success: true, message: 'Miembro agregado exitosamente', data }
  } catch (err: any) {
    return { error: err.message || 'Error inesperado al agregar el miembro' }
  }
}

export async function removeTeamMember(teamId: string, userId: string): Promise<ActionResult> {
  if (!(await verifyPlatformAdmin())) {
    return { error: 'No tienes permisos para realizar esta acción' }
  }

  const supabase = await createClient()

  try {
    const { error } = await supabase
      .from('team_members')
      .delete()
      .eq('team_id', teamId)
      .eq('user_id', userId)

    if (error) {
      return { error: error.message || 'Error al remover el miembro' }
    }

    revalidatePath('/admin/teams')
    revalidatePath(`/admin/teams/${teamId}`)
    return { success: true, message: 'Miembro removido exitosamente' }
  } catch (err: any) {
    return { error: err.message || 'Error inesperado al remover el miembro' }
  }
}

// ============================================================================
// API KEYS
// ============================================================================

export async function createApiKey(formData: FormData): Promise<ActionResult> {
  if (!(await verifyPlatformAdmin())) {
    return { error: 'No tienes permisos para realizar esta acción' }
  }

  const organizationId = formData.get('organization_id') as string
  const name = formData.get('name') as string
  const scopesStr = formData.get('scopes') as string
  const expiresAt = formData.get('expires_at') as string | null

  if (!organizationId || !name) {
    return { error: 'Organización y nombre son campos requeridos' }
  }

  // Parsear scopes
  let scopes: string[] = []
  if (scopesStr) {
    try {
      scopes = JSON.parse(scopesStr)
    } catch {
      scopes = scopesStr.split(',').map((s) => s.trim()).filter(Boolean)
    }
  }

  const supabase = await createClient()

  try {
    // Generar API key aleatoria usando Node.js crypto
    const nodeCrypto = require('crypto')
    const randomBytes = nodeCrypto.randomBytes(32)
    const apiKey = `sk_${randomBytes.toString('base64url')}`
    
    // Hash de la key usando SHA-256
    const keyHash = nodeCrypto.createHash('sha256').update(apiKey).digest('hex')
    const keyPrefix = apiKey.substring(0, 8) // Primeros 8 caracteres para identificación

    const { data, error } = await supabase
      .from('api_keys')
      .insert({
        organization_id: organizationId,
        name,
        key_hash: keyHash,
        key_prefix: keyPrefix,
        scopes,
        expires_at: expiresAt || null,
        is_active: true,
      })
      .select()
      .single()

    if (error) {
      return { error: error.message || 'Error al crear la API key' }
    }

    revalidatePath('/admin/api-keys')
    
    // Retornar la key completa solo una vez (en producción, esto debe ser más seguro)
    return {
      success: true,
      message: 'API key creada exitosamente. Guarda esta key, no se mostrará nuevamente.',
      data: { ...data, api_key: apiKey }, // Solo se muestra una vez
    }
  } catch (err: any) {
    return { error: err.message || 'Error inesperado al crear la API key' }
  }
}

export async function revokeApiKey(id: string): Promise<ActionResult> {
  if (!(await verifyPlatformAdmin())) {
    return { error: 'No tienes permisos para realizar esta acción' }
  }

  const supabase = await createClient()

  try {
    const { data: { user } } = await supabase.auth.getUser()

    const { error } = await supabase
      .from('api_keys')
      .update({
        is_active: false,
        revoked_at: new Date().toISOString(),
        revoked_by: user?.id || null,
      })
      .eq('id', id)

    if (error) {
      return { error: error.message || 'Error al revocar la API key' }
    }

    revalidatePath('/admin/api-keys')
    return { success: true, message: 'API key revocada exitosamente' }
  } catch (err: any) {
    return { error: err.message || 'Error inesperado al revocar la API key' }
  }
}

