import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Types para Places API (New)
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

interface SyncStats {
  reviews_fetched: number;
  reviews_new: number;
  reviews_updated: number;
  reviews_skipped: number;
  duration_seconds: number;
}

export async function POST(request: NextRequest) {
  const syncStartTime = Date.now();
  
  try {
    // Verificar variables de entorno
    const GOOGLE_API_KEY = process.env.GOOGLE_PLACES_API_KEY;
    const GOOGLE_PLACE_ID = process.env.GOOGLE_PLACE_ID;
    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

    // Debug: Log para verificar configuración
    console.log('🔍 Verificando configuración:');
    console.log('- Google API Key:', GOOGLE_API_KEY ? '✅ Configurada' : '❌ Falta');
    console.log('- Google Place ID:', GOOGLE_PLACE_ID || '❌ Falta');
    console.log('- Supabase URL:', SUPABASE_URL ? '✅ Configurada' : '❌ Falta');

    if (!GOOGLE_API_KEY || !GOOGLE_PLACE_ID) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Missing required environment variables: GOOGLE_PLACES_API_KEY or GOOGLE_PLACE_ID' 
        },
        { status: 500 }
      );
    }

    if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Missing Supabase configuration' 
        },
        { status: 500 }
      );
    }

    // Crear cliente de Supabase con service role para bypass RLS
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    // Verificar parámetro force
    const url = new URL(request.url);
    const forceSync = url.searchParams.get('force') === 'true';
    console.log('🚀 Force sync:', forceSync);

    // Verificar si necesita sincronización (última sync hace >24h)
    console.log('📊 Verificando si necesita sincronización...');
    const { data: needsSyncData, error: needsSyncError } = await supabase
      .schema('marketing')
      .rpc('needs_sync', { p_place_id: GOOGLE_PLACE_ID });

    if (needsSyncError) {
      console.error('❌ Error en needs_sync:', needsSyncError);
    }
    console.log('✅ needs_sync result:', needsSyncData);

    if (!needsSyncData && !forceSync) {
      // Obtener última sync para información
      const { data: lastSync } = await supabase
        .schema('marketing')
        .from('google_sync_logs')
        .select('sync_completed_at, reviews_fetched')
        .eq('place_id', GOOGLE_PLACE_ID)
        .eq('success', true)
        .order('sync_completed_at', { ascending: false })
        .limit(1)
        .single();

      return NextResponse.json({
        success: true,
        message: 'Sync not needed. Last sync was less than 24 hours ago.',
        last_sync: lastSync,
        skipped: true
      });
    }

    // Crear log de inicio de sincronización
    const { data: syncLog, error: logError } = await supabase
      .schema('marketing')
      .from('google_sync_logs')
      .insert({
        place_id: GOOGLE_PLACE_ID,
        sync_started_at: new Date().toISOString(),
        success: false
      })
      .select()
      .single();

    if (logError) {
      console.error('Error creating sync log:', logError);
    }

    const syncLogId = syncLog?.id;
    console.log('📝 Sync log ID:', syncLogId);

    // Llamar a Google Places API (New)
    console.log('🌐 Llamando a Google Places API (New)...');
    const googleApiUrl = `https://places.googleapis.com/v1/places/${GOOGLE_PLACE_ID}`;
    
    const googleResponse = await fetch(googleApiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': GOOGLE_API_KEY,
        'X-Goog-FieldMask': 'reviews,rating,userRatingCount,displayName',
        'Accept-Language': 'es-419', // Español de Latinoamérica
      },
    });
    
    console.log('📡 Google API status:', googleResponse.status);
    
    if (!googleResponse.ok) {
      const errorText = await googleResponse.text();
      console.error('Google API error response:', errorText);
      throw new Error(`Google API request failed: ${googleResponse.status} - ${errorText}`);
    }

    const data: GooglePlacesNewResponse = await googleResponse.json();

    if (!data.reviews || data.reviews.length === 0) {
      console.warn('⚠️ No reviews returned from Google API');
    }

    const reviews = data.reviews || [];
    const placeName = data.displayName?.text || 'TuPatrimonio';

    console.log(`📦 Procesando ${reviews.length} reseñas...`);

    // Estadísticas
    const stats: SyncStats = {
      reviews_fetched: reviews.length,
      reviews_new: 0,
      reviews_updated: 0,
      reviews_skipped: 0,
      duration_seconds: 0
    };

    // Procesar cada reseña
    for (const review of reviews) {
      try {
        // Convertir publishTime a ISO string
        const reviewTime = new Date(review.publishTime).toISOString();

        // Preparar datos de la reseña con la nueva estructura
        const reviewData = {
          author_name: review.authorAttribution?.displayName || 'Usuario',
          author_photo_url: review.authorAttribution?.photoUri || null,
          profile_photo_url: review.authorAttribution?.photoUri || null,
          author_url: review.authorAttribution?.uri || null,
          rating: review.rating,
          text: review.text?.text || review.originalText?.text || '',
          time: reviewTime,
          relative_time_description: review.relativePublishTimeDescription || '',
          language: 'es',
          place_id: GOOGLE_PLACE_ID,
          is_active: true
        };

        // Intentar insertar (si ya existe por constraint único, se saltará)
        const { error: insertError } = await supabase
          .schema('marketing')
          .from('google_reviews')
          .insert(reviewData);

        if (insertError) {
          // Si es error de duplicado (violación de unique constraint), es esperado
          if (insertError.code === '23505') {
            stats.reviews_skipped++;
          } else {
            console.error('Error inserting review:', insertError);
            stats.reviews_skipped++;
          }
        } else {
          stats.reviews_new++;
        }
      } catch (reviewError) {
        console.error('Error processing review:', reviewError);
        stats.reviews_skipped++;
      }
    }

    // Calcular duración
    stats.duration_seconds = Math.round((Date.now() - syncStartTime) / 1000);

    console.log('✅ Sincronización completada:', stats);

    // Actualizar log de sincronización
    if (syncLogId) {
      await supabase
        .schema('marketing')
        .from('google_sync_logs')
        .update({
          sync_completed_at: new Date().toISOString(),
          place_name: placeName,
          reviews_fetched: stats.reviews_fetched,
          reviews_new: stats.reviews_new,
          reviews_updated: stats.reviews_updated,
          reviews_skipped: stats.reviews_skipped,
          success: true,
          api_response_metadata: {
            rating: data.rating,
            user_ratings_total: data.userRatingCount
          }
        })
        .eq('id', syncLogId);
    }

    return NextResponse.json({
      success: true,
      message: `Sync completed successfully. ${stats.reviews_new} new reviews added.`,
      stats,
      place_name: placeName,
      google_rating: data.rating,
      google_total_reviews: data.userRatingCount
    });

  } catch (error: any) {
    console.error('❌ Sync error:', error);

    // Intentar registrar el error en el log si tenemos la referencia
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
      );

      await supabase
        .schema('marketing')
        .from('google_sync_logs')
        .insert({
          place_id: process.env.GOOGLE_PLACE_ID || 'unknown',
          sync_started_at: new Date(syncStartTime).toISOString(),
          sync_completed_at: new Date().toISOString(),
          success: false,
          error_message: error.message || 'Unknown error',
          error_code: error.code || 'UNKNOWN'
        });
    }

    return NextResponse.json(
      { 
        success: false,
        error: error.message || 'Sync failed',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

// GET endpoint para verificar estado
export async function GET(request: NextRequest) {
  try {
    const GOOGLE_PLACE_ID = process.env.GOOGLE_PLACE_ID;
    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY || !GOOGLE_PLACE_ID) {
      return NextResponse.json(
        { error: 'Missing configuration' },
        { status: 500 }
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    // Obtener última sincronización
    const { data: lastSync } = await supabase
      .schema('marketing')
      .from('google_sync_logs')
      .select('*')
      .eq('place_id', GOOGLE_PLACE_ID)
      .order('sync_started_at', { ascending: false })
      .limit(1)
      .single();

    // Verificar si necesita sync
    const { data: needsSync } = await supabase
      .schema('marketing')
      .rpc('needs_sync', { p_place_id: GOOGLE_PLACE_ID });

    // Obtener estadísticas de reseñas
    const { data: stats } = await supabase
      .schema('marketing')
      .rpc('get_reviews_stats', { p_place_id: GOOGLE_PLACE_ID });

    return NextResponse.json({
      last_sync: lastSync,
      needs_sync: needsSync,
      reviews_stats: stats?.[0] || null,
      configured: true
    });

  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

