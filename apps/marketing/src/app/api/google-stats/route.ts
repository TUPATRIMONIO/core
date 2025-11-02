import { NextResponse } from 'next/server';

interface GooglePlacesNewResponse {
  rating?: number;
  userRatingCount?: number;
  displayName?: {
    text: string;
  };
}

export const revalidate = 43200; // Cache de 12 horas (43200 segundos)

export async function GET() {
  try {
    const apiKey = process.env.GOOGLE_PLACES_API_KEY;
    const placeId = process.env.GOOGLE_PLACE_ID;

    if (!apiKey || !placeId) {
      console.error('Missing Google Places API credentials');
      return NextResponse.json(
        { 
          error: 'Configuración de API incompleta',
          fallback: true,
          rating: 4.8,
          total_reviews: 550,
        },
        { status: 200 }
      );
    }

    // Usar la nueva API de Google Places (Places API New)
    const url = `https://places.googleapis.com/v1/places/${placeId}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': 'rating,userRatingCount,displayName',
      },
      next: {
        revalidate: 43200, // Cachear por 12 horas
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Google API error:', response.status, errorText);
      throw new Error(`Google API responded with status: ${response.status}`);
    }

    const data: GooglePlacesNewResponse = await response.json();

    return NextResponse.json(
      {
        success: true,
        rating: data.rating || 4.8,
        total_reviews: data.userRatingCount || 550,
        place_name: data.displayName?.text || 'TuPatrimonio',
        fallback: false,
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=43200, stale-while-revalidate=86400',
        },
      }
    );

  } catch (error) {
    console.error('❌ Error fetching Google stats:', error);
    
    // Retornar fallback en caso de error
    return NextResponse.json(
      { 
        error: 'Error al obtener estadísticas',
        fallback: true,
        rating: 4.8,
        total_reviews: 550,
        place_name: 'TuPatrimonio',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 200 }
    );
  }
}

