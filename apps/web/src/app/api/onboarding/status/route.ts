/**
 * API Route: /api/onboarding/status
 * Verifica si el usuario ya completó el onboarding
 */

import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Verificar si tiene organización
    const { data: hasOrg, error } = await supabase.rpc('user_has_organization', {
      user_id: user.id
    });

    if (error) {
      console.error('Error checking organization:', error);
      return NextResponse.json({ has_organization: false });
    }

    return NextResponse.json({ has_organization: hasOrg || false });
  } catch (error) {
    console.error('Error in GET /api/onboarding/status:', error);
    return NextResponse.json({ has_organization: false });
  }
}


