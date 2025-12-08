import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceRoleClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient()
        
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            return NextResponse.json(
                { error: 'No autenticado' },
                { status: 401 }
            )
        }

        const body = await request.json()
        const {
            organization_id,
            credits_amount,
            currency,
            exchange_rate,
            final_amount,
            bank_name,
            bank_country,
            account_number,
            account_holder,
            notes,
        } = body

        if (!organization_id || !credits_amount || !currency || !bank_name || !account_number || !account_holder) {
            return NextResponse.json(
                { error: 'Faltan campos requeridos' },
                { status: 400 }
            )
        }

        // Verificar que el usuario pertenece a la organización
        const { data: orgUser } = await supabase
            .from('organization_users')
            .select('organization_id')
            .eq('user_id', user.id)
            .eq('organization_id', organization_id)
            .eq('status', 'active')
            .single()

        if (!orgUser) {
            return NextResponse.json(
                { error: 'No tienes permiso para realizar esta acción' },
                { status: 403 }
            )
        }

        // Verificar saldo disponible
        const serviceSupabase = createServiceRoleClient()
        const { data: account } = await serviceSupabase
            .from('credit_accounts')
            .select('balance')
            .eq('organization_id', organization_id)
            .single()

        if (!account || account.balance < credits_amount) {
            return NextResponse.json(
                { error: 'Saldo insuficiente' },
                { status: 400 }
            )
        }

        // Crear solicitud de retiro
        const { data: withdrawalRequest, error: createError } = await serviceSupabase
            .from('withdrawal_requests')
            .insert({
                organization_id,
                requested_by: user.id,
                credits_amount,
                currency,
                exchange_rate: exchange_rate || 1,
                final_amount: final_amount || credits_amount,
                bank_name,
                bank_country: bank_country || 'CL',
                account_number,
                account_holder,
                notes: notes || null,
                status: 'pending',
            })
            .select()
            .single()

        if (createError) {
            console.error('Error creando solicitud de retiro:', createError)
            return NextResponse.json(
                { error: 'Error al crear la solicitud de retiro' },
                { status: 500 }
            )
        }

        return NextResponse.json({
            success: true,
            withdrawal_request: withdrawalRequest,
        })
    } catch (error: any) {
        console.error('Error en POST /api/wallet/withdraw:', error)
        return NextResponse.json(
            { error: error.message || 'Error interno del servidor' },
            { status: 500 }
        )
    }
}

