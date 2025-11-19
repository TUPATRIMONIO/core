/**
 * API Route: /api/onboarding/business
 * Crea organización empresarial para usuario B2B
 */

import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { name, industry, size } = body;

    if (!name || name.trim().length < 2) {
      return NextResponse.json({ 
        error: 'Company name is required' 
      }, { status: 400 });
    }

    // Verificar que no tenga ya una organización
    const { data: hasOrg } = await supabase.rpc('user_has_organization', {
      user_id: user.id
    });

    if (hasOrg) {
      return NextResponse.json({ 
        error: 'User already has an organization' 
      }, { status: 400 });
    }

    // Crear organización empresarial
    const { data: organizationId, error } = await supabase.rpc(
      'create_business_organization',
      {
        user_id: user.id,
        user_email: user.email!,
        org_name: name.trim(),
        org_industry: industry || null,
        org_size: size || null
      }
    );

    if (error) {
      console.error('Error creating business organization:', error);
      return NextResponse.json({ 
        error: error.message 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true,
      organization_id: organizationId,
      type: 'business',
      name: name.trim()
    });
  } catch (error) {
    console.error('Error in POST /api/onboarding/business:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}
