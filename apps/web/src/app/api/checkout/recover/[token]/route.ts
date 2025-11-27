import { NextRequest, NextResponse } from 'next/server';
import { validateRecoveryToken, invalidateRecoveryToken } from '@/lib/checkout/recovery';
import { redirect } from 'next/navigation';

interface RouteParams {
  params: Promise<{ token: string }>;
}

/**
 * GET /api/checkout/recover/[token]
 * Valida token y redirige a checkout de la orden
 */
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { token } = await params;
    
    if (!token) {
      return NextResponse.json(
        { error: 'Token es requerido' },
        { status: 400 }
      );
    }
    
    // Validar token
    const orderId = await validateRecoveryToken(token);
    
    if (!orderId) {
      // Token inválido o expirado
      return NextResponse.redirect(
        new URL('/checkout/recover/error?reason=invalid_token', request.url)
      );
    }
    
    // Invalidar token después de usarlo (opcional, para seguridad)
    await invalidateRecoveryToken(orderId);
    
    // Redirigir a checkout
    return NextResponse.redirect(
      new URL(`/checkout/${orderId}`, request.url)
    );
  } catch (error: any) {
    console.error('Error validando token de recuperación:', error);
    return NextResponse.redirect(
      new URL('/checkout/recover/error?reason=server_error', request.url)
    );
  }
}

