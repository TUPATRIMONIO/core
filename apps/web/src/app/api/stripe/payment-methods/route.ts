import { NextRequest, NextResponse } from 'next/server';
import { 
  listPaymentMethods, 
  attachPaymentMethod, 
  setDefaultPaymentMethod,
  deletePaymentMethod 
} from '@/lib/stripe/payment-methods';
import { createClient } from '@/lib/supabase/server';
import { getActiveOrganizationId } from '@/lib/organization/get-active-org';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const { organizationId, error: orgError } = await getActiveOrganizationId(supabase, user.id);
    
    if (orgError || !organizationId) {
      return NextResponse.json(
        { error: orgError || 'No organization found' },
        { status: 400 }
      );
    }
    
    const methods = await listPaymentMethods(organizationId);
    
    return NextResponse.json({ methods });
  } catch (error: any) {
    console.error('Error listing payment methods:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const { organizationId, error: orgError } = await getActiveOrganizationId(supabase, user.id);
    
    if (orgError || !organizationId) {
      return NextResponse.json(
        { error: orgError || 'No organization found' },
        { status: 400 }
      );
    }
    
    const body = await request.json();
    const { payment_method_id, set_as_default } = body;
    
    if (!payment_method_id) {
      return NextResponse.json(
        { error: 'payment_method_id is required' },
        { status: 400 }
      );
    }
    
    const method = await attachPaymentMethod(
      organizationId,
      payment_method_id,
      set_as_default || false
    );
    
    return NextResponse.json({ method });
  } catch (error: any) {
    console.error('Error saving payment method:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const { organizationId, error: orgError } = await getActiveOrganizationId(supabase, user.id);
    
    if (orgError || !organizationId) {
      return NextResponse.json(
        { error: orgError || 'No organization found' },
        { status: 400 }
      );
    }
    
    const { searchParams } = new URL(request.url);
    const paymentMethodId = searchParams.get('id');
    
    if (!paymentMethodId) {
      return NextResponse.json(
        { error: 'id parameter is required' },
        { status: 400 }
      );
    }
    
    await deletePaymentMethod(organizationId, paymentMethodId);
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting payment method:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

