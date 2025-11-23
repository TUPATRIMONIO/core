/**
 * API Route: Verificar API Key de SendGrid
 * 
 * POST: Verifica si una API key de SendGrid es válida
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifySendGridApiKey } from '@/lib/sendgrid/accounts';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { api_key } = body;

    if (!api_key) {
      return NextResponse.json({ error: 'api_key es requerido' }, { status: 400 });
    }

    // Verificar API key
    const isValid = await verifySendGridApiKey(api_key);

    return NextResponse.json({
      valid: isValid,
      message: isValid
        ? 'API key válida'
        : 'API key inválida. Por favor, verifica que sea correcta.',
    });
  } catch (error: any) {
    console.error('Error al verificar API key:', error);
    return NextResponse.json(
      { error: error.message || 'Error al verificar API key' },
      { status: 500 }
    );
  }
}

