import { NextRequest, NextResponse } from 'next/server';
import { handleOneclickInscriptionFinish } from '@/lib/transbank/webhooks';

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');
    
    if (!token) {
      return NextResponse.json(
        { error: 'token es requerido' },
        { status: 400 }
      );
    }
    
    const result = await handleOneclickInscriptionFinish(token);
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Error finalizando inscripción' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      tbkUser: result.tbkUser,
      username: result.username,
      authorizationCode: result.authorizationCode,
    });
  } catch (error: any) {
    console.error('Error finalizando inscripción Oneclick:', error);
    return NextResponse.json(
      { error: error.message || 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

