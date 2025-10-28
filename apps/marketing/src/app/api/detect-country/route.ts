import { NextRequest, NextResponse } from 'next/server';

/**
 * API route para detectar país del usuario basado en geolocalización
 * Compatible con Vercel geo headers
 */
export async function GET(request: NextRequest) {
  try {
    // Headers de geolocalización de Vercel
    const countryCode = request.geo?.country || 
                       request.headers.get('x-vercel-ip-country') ||
                       null;
                       
    const city = request.geo?.city || 
                request.headers.get('x-vercel-ip-city') ||
                null;

    const region = request.geo?.region || 
                  request.headers.get('x-vercel-ip-country-region') ||
                  null;

    // Países soportados por TuPatrimonio
    const supportedCountries = ['CL', 'MX', 'CO'];
    const detectedCountry = countryCode?.toUpperCase();
    
    // Determinar país final
    const finalCountry = supportedCountries.includes(detectedCountry || '') 
      ? detectedCountry?.toLowerCase() 
      : 'cl'; // Default a Chile

    // Información adicional para debugging (solo en desarrollo)
    const debugInfo = process.env.NODE_ENV === 'development' ? {
      headers: {
        'x-vercel-ip-country': request.headers.get('x-vercel-ip-country'),
        'x-vercel-ip-city': request.headers.get('x-vercel-ip-city'),
        'x-vercel-ip-country-region': request.headers.get('x-vercel-ip-country-region')
      },
      geo: request.geo,
      userAgent: request.headers.get('user-agent')
    } : undefined;

    const response = {
      country: finalCountry,
      countryCode: detectedCountry || null,
      city: city || null,
      region: region || null,
      source: 'vercel',
      timestamp: new Date().toISOString(),
      supported: supportedCountries.includes(detectedCountry || ''),
      ...(debugInfo && { debug: debugInfo })
    };

    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'public, max-age=300', // Cache 5 minutos
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type'
      },
    });

  } catch (error) {
    console.error('Error in detect-country API:', error);
    
    return NextResponse.json({
      error: 'Internal server error',
      country: 'cl', // Fallback por defecto
      source: 'error',
      timestamp: new Date().toISOString()
    }, { 
      status: 500,
      headers: {
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
}

// Manejar OPTIONS para CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

