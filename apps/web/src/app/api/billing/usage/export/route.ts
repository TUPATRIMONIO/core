import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const searchParams = request.nextUrl.searchParams;
    const period = searchParams.get('period') || 'month';
    
    // Verificar autenticación
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }
    
    // Obtener organización del usuario
    const { data: orgUser } = await supabase
      .from('organization_users')
      .select('organization_id')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single();
    
    if (!orgUser) {
      return NextResponse.json(
        { error: 'Organización no encontrada' },
        { status: 400 }
      );
    }
    
    // Calcular fechas según período
    const now = new Date();
    let startDate: Date;
    
    switch (period) {
      case 'day':
        startDate = new Date(now);
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'week':
        startDate = new Date(now);
        startDate.setDate(startDate.getDate() - 30);
        break;
      case 'month':
        startDate = new Date(now);
        startDate.setMonth(startDate.getMonth() - 6);
        break;
      default:
        startDate = new Date(now);
        startDate.setMonth(startDate.getMonth() - 6);
    }
    
    // Obtener transacciones (usar vista pública)
    const { data: transactions } = await supabase
      .from('credit_transactions')
      .select('*')
      .eq('organization_id', orgUser.organization_id)
      .eq('type', 'spent')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', now.toISOString())
      .order('created_at', { ascending: false });
    
    // Generar CSV
    const headers = ['Fecha', 'Cantidad', 'Servicio', 'Aplicación', 'Descripción'];
    const rows = (transactions || []).map((t) => [
      new Date(t.created_at).toLocaleDateString('es-CL'),
      t.amount.toString(),
      t.service_code || '',
      t.application_code || '',
      t.description || '',
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
    ].join('\n');
    
    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="uso-creditos-${period}-${new Date().toISOString().split('T')[0]}.csv"`,
      },
    });
  } catch (error: any) {
    console.error('Error exportando uso:', error);
    return NextResponse.json(
      { error: error.message || 'Error exportando datos' },
      { status: 500 }
    );
  }
}

