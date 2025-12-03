import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface RouteParams {
  params: Promise<{ id: string; overrideId: string }>
}

/**
 * DELETE /api/admin/applications/[id]/overrides/[overrideId]
 * Eliminar un override específico
 */
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { overrideId } = await params
    const supabase = await createClient()

    // Verificar autenticación
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      )
    }

    // Verificar si es platform admin
    const { data: isPlatformAdmin } = await supabase.rpc('is_platform_admin')
    if (!isPlatformAdmin) {
      return NextResponse.json(
        { error: 'No tienes permiso para eliminar overrides' },
        { status: 403 }
      )
    }

    // Eliminar override
    const { error } = await supabase
      .from('application_overrides')
      .delete()
      .eq('id', overrideId)

    if (error) {
      console.error('Error deleting override:', error)
      return NextResponse.json(
        { error: 'Error al eliminar override' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error en DELETE /api/admin/applications/[id]/overrides/[overrideId]:', error)
    return NextResponse.json(
      { error: error.message || 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

