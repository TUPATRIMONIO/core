/**
 * API Route: Google Reviews
 * 
 * Obtiene reseñas de Google Places API, filtra solo las de 5 estrellas
 * y cachea la respuesta para optimizar el uso de la API.
 */

import { NextResponse } from 'next/server';

// Interfaces para la respuesta de Google Places API (New)
interface GoogleReviewNew {
  authorAttribution?: {
    displayName: string;
    uri?: string;
    photoUri?: string;
  };
  rating: number;
  relativePublishTimeDescription?: string;
  text?: {
    text: string;
  };
  originalText?: {
    text: string;
  };
  publishTime: string;
}

interface GooglePlacesNewResponse {
  reviews?: GoogleReviewNew[];
  rating?: number;
  userRatingCount?: number;
  displayName?: {
    text: string;
  };
}

// Interface para reseñas formateadas
interface FormattedReview {
  author_name: string;
  author_url?: string;
  profile_photo_url: string;
  rating: number;
  relative_time_description: string;
  text: string;
  time: number;
}

export async function GET() {
  try {
    const apiKey = process.env.GOOGLE_PLACES_API_KEY;
    const placeId = process.env.GOOGLE_PLACE_ID;

    // Validar que existan las credenciales
    if (!apiKey || !placeId) {
      console.error('Missing Google Places API credentials');
      return NextResponse.json(
        { 
          error: 'Configuración de API incompleta',
          reviews: [],
          fallback: true 
        },
        { status: 200 } // Devolver 200 para que el frontend use fallback
      );
    }

    // Usar la nueva API de Google Places (Places API New)
    const url = `https://places.googleapis.com/v1/places/${placeId}`;
    
    // Hacer la petición a Google Places API (New)
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': 'reviews,rating,userRatingCount,displayName',
        'Accept-Language': 'es-419', // Español de Latinoamérica
      },
      next: {
        revalidate: 86400, // Cachear por 24 horas
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Google API error:', response.status, errorText);
      throw new Error(`Google API responded with status: ${response.status}`);
    }

    const data: GooglePlacesNewResponse = await response.json();

    // Verificar que haya reviews
    if (!data.reviews || data.reviews.length === 0) {
      return NextResponse.json(
        { 
          error: 'Sin reseñas disponibles',
          reviews: [],
          fallback: true 
        },
        { status: 200 }
      );
    }

    // Filtrar solo reseñas de 5 estrellas y ordenar por fecha
    // La nueva API usa diferentes nombres de campos
    const fiveStarReviews: FormattedReview[] = (data.reviews || [])
      .filter((review: GoogleReviewNew) => review.rating === 5)
      .sort((a: GoogleReviewNew, b: GoogleReviewNew) => {
        const timeA = new Date(a.publishTime).getTime();
        const timeB = new Date(b.publishTime).getTime();
        return timeB - timeA; // Más recientes primero
      })
      .map((review: GoogleReviewNew): FormattedReview => ({
        author_name: review.authorAttribution?.displayName || 'Usuario',
        author_url: review.authorAttribution?.uri || '',
        profile_photo_url: review.authorAttribution?.photoUri || '',
        rating: review.rating,
        relative_time_description: review.relativePublishTimeDescription || '',
        text: review.text?.text || review.originalText?.text || '',
        time: new Date(review.publishTime).getTime() / 1000, // Convertir a timestamp
      }));

    // Información adicional del lugar
    const placeInfo = {
      rating: data.rating || 0,
      total_reviews: data.userRatingCount || 0,
      five_star_count: fiveStarReviews.length,
    };

    return NextResponse.json(
      {
        reviews: fiveStarReviews,
        place_info: placeInfo,
        fallback: false,
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=172800',
        },
      }
    );

  } catch (error) {
    console.error('❌ Error fetching Google reviews:', error);
    
    return NextResponse.json(
      { 
        error: 'Error al obtener reseñas',
        reviews: [],
        fallback: true,
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 200 } // Devolver 200 para permitir fallback en el frontend
    );
  }
}

