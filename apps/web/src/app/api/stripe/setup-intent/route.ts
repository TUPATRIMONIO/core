import { NextRequest, NextResponse } from 'next/server';
import { createSetupIntent } from '@/lib/stripe/payment-methods';
import { createClient } from '@/lib/supabase/server';
import { getActiveOrganizationId } from '@/lib/organization/get-active-org';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Verificar autenticación
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Obtener organización del usuario
    const { organizationId, error: orgError } = await getActiveOrganizationId(supabase, user.id);
    
    if (orgError || !organizationId) {
      return NextResponse.json(
        { error: orgError || 'No organization found' },
        { status: 400 }
      );
    }
    
    const setupIntent = await createSetupIntent(organizationId);
    
    return NextResponse.json({
      client_secret: setupIntent.client_secret,
      setup_intent_id: setupIntent.id,
    });
  } catch (error: any) {
    console.error('Error creating setup intent:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

