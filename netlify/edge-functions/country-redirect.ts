import type { Context } from "@netlify/edge-functions";

/**
 * Edge Function para redirects automáticos por país en marketing app
 * Se ejecuta en el edge, más rápido que functions normales
 */
export default async (request: Request, context: Context) => {
  const url = new URL(request.url);
  const { pathname } = url;
  
  // Solo aplicar a páginas específicas que necesitan redirect por país
  const needsCountryRedirect = [
    '/firmas-electronicas',
    '/notaria-digital',
    '/verificacion-identidad',
    '/precios'
  ].includes(pathname);

  if (!needsCountryRedirect) {
    return; // Continuar con la request normal
  }

  // Verificar si ya tiene código de país en la URL
  if (pathname.match(/^\/[a-z]{2}\//)) {
    return; // Ya tiene código de país, no redirect
  }

  try {
    // Obtener país desde headers de Netlify (automáticos)
    const countryCode = context.geo?.country?.code?.toLowerCase();
    
    // Países soportados
    const supportedCountries = ['cl', 'mx', 'co'];
    const targetCountry = supportedCountries.includes(countryCode || '') 
      ? countryCode 
      : 'cl'; // Default a Chile

    // Construir nueva URL con código de país
    const newUrl = `${url.origin}/${targetCountry}${pathname}${url.search}`;
    
    // Log para debugging (solo en desarrollo)
    if (context.geo?.country?.code) {
      console.log(`Edge redirect: ${pathname} -> /${targetCountry}${pathname} (detected: ${context.geo.country.code})`);
    }

    // Redirect 302 (temporal) para preservar SEO
    return Response.redirect(newUrl, 302);

  } catch (error) {
    console.error('Error in country-redirect edge function:', error);
    
    // En caso de error, redirect a Chile por defecto
    const fallbackUrl = `${url.origin}/cl${pathname}${url.search}`;
    return Response.redirect(fallbackUrl, 302);
  }
};

/**
 * Configuración de la Edge Function
 * Define en qué rutas debe ejecutarse
 */
export const config = {
  path: [
    "/firmas-electronicas",
    "/notaria-digital", 
    "/verificacion-identidad",
    "/precios"
  ]
};
