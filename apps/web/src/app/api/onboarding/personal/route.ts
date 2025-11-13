/**
 * API Route: /api/onboarding/personal
 * Crea organización personal para usuario B2C
 */

import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Verificar que no tenga ya una organización
    const { data: hasOrg, error: checkError } = await supabase.rpc('user_has_organization', {
      user_id: user.id
    });

    // Si la función no existe, asumir que no tiene org
    if (checkError) {
      console.warn('Function user_has_organization not found, skipping check:', checkError);
    } else if (hasOrg) {
      return NextResponse.json({ 
        error: 'User already has an organization' 
      }, { status: 400 });
    }

    // Crear organización personal
    const { data: organizationId, error } = await supabase.rpc(
      'create_personal_organization',
      {
        user_id: user.id,
        user_email: user.email!,
        user_first_name: user.user_metadata?.first_name || null
      }
    );

    if (error) {
      console.error('Error creating personal organization:', error);
      
      // Mensaje más detallado
      const errorMessage = error.message || 'Unknown error';
      console.error('Error details:', {
        code: error.code,
        message: errorMessage,
        hint: error.hint,
        details: error.details
      });
      
      return NextResponse.json({ 
        error: `Failed to create organization: ${errorMessage}`,
        details: error.hint || error.details || 'No additional details'
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true,
      organization_id: organizationId,
      type: 'personal'
    });
  } catch (error) {
    console.error('Error in POST /api/onboarding/personal:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

