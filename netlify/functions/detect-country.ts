import { Handler } from '@netlify/functions';

/**
 * Función Netlify para detectar país basado en IP del usuario
 * Utiliza headers automáticos que proporciona Netlify
 */
export const handler: Handler = async (event, context) => {
  try {
    // Headers que Netlify proporciona automáticamente
    const countryCode = event.headers['x-nf-country-code'] || 
                       event.headers['x-country-code'] ||
                       context.clientContext?.geo?.country?.code;
                       
    const city = event.headers['x-nf-geo-city'] || 
                context.clientContext?.geo?.city;

    const region = event.headers['x-nf-geo-subdivision-1-iso-code'] ||
                  context.clientContext?.geo?.subdivision?.code;

    // Países soportados por TuPatrimonio
    const supportedCountries = ['CL', 'MX', 'CO'];
    const detectedCountry = countryCode?.toUpperCase();
    
    // Determinar país final
    const finalCountry = supportedCountries.includes(detectedCountry || '') 
      ? detectedCountry?.toLowerCase() 
      : 'cl'; // Default a Chile

    // Información adicional para debugging (opcional)
    const debugInfo = process.env.NODE_ENV === 'development' ? {
      headers: {
        'x-nf-country-code': event.headers['x-nf-country-code'],
        'x-country-code': event.headers['x-country-code'],
        'x-nf-geo-city': event.headers['x-nf-geo-city'],
        'x-nf-geo-subdivision-1-iso-code': event.headers['x-nf-geo-subdivision-1-iso-code']
      },
      clientContext: context.clientContext?.geo,
      userAgent: event.headers['user-agent']
    } : undefined;

    const response = {
      country: finalCountry,
      countryCode: detectedCountry || null,
      city: city || null,
      region: region || null,
      source: 'netlify',
      timestamp: new Date().toISOString(),
      supported: supportedCountries.includes(detectedCountry || ''),
      ...(debugInfo && { debug: debugInfo })
    };

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=300', // Cache 5 minutos
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type'
      },
      body: JSON.stringify(response)
    };

  } catch (error) {
    console.error('Error in detect-country function:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        error: 'Internal server error',
        country: 'cl', // Fallback por defecto
        source: 'error',
        timestamp: new Date().toISOString()
      })
    };
  }
};
