import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { WithdrawForm } from '@/components/wallet/withdraw-form'
import { getCreditAccount } from '@/lib/credits/core'

export default async function WithdrawPage() {
    const supabase = await createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        redirect('/auth/login')
    }

    // Obtener organización del usuario
    const { data: orgUser } = await supabase
        .from('organization_users')
        .select('organization_id')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single()

    if (!orgUser) {
        redirect('/dashboard')
    }

    // Obtener cuenta de créditos
    const account = await getCreditAccount(orgUser.organization_id)

    return (
        <div className="container mx-auto py-8 max-w-2xl">
            <Card>
                <CardHeader>
                    <CardTitle>Solicitar Retiro de Créditos</CardTitle>
                    <CardDescription>
                        Retira tus créditos a tu cuenta bancaria. El proceso puede tardar entre 3-5 días hábiles.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="mb-6 p-4 bg-muted rounded-lg">
                        <div className="text-sm text-muted-foreground mb-1">Saldo disponible</div>
                        <div className="text-2xl font-bold">
                            {account?.balance?.toLocaleString('es-CL') || '0'} créditos
                        </div>
                    </div>
                    <WithdrawForm 
                        organizationId={orgUser.organization_id}
                        availableCredits={account?.balance || 0}
                    />
                </CardContent>
            </Card>
        </div>
    )
}

