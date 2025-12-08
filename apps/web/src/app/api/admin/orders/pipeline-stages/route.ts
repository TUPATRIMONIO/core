import { NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'

export async function GET() {
    try {
        const supabase = createServiceRoleClient()

        const { data: stages, error } = await supabase
            .from('order_pipeline_stages')
            .select('*')
            .order('position', { ascending: true })

        if (error) {
            console.error('Error obteniendo stages:', error)
            return NextResponse.json(
                { error: 'Error al obtener los estados' },
                { status: 500 }
            )
        }

        return NextResponse.json({
            success: true,
            stages: stages || [],
        })
    } catch (error: any) {
        console.error('Error en GET /api/admin/orders/pipeline-stages:', error)
        return NextResponse.json(
            { error: error.message || 'Error interno del servidor' },
            { status: 500 }
        )
    }
}

