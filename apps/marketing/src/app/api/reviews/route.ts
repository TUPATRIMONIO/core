import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const revalidate = 3600; // Revalidar cada hora

interface Review {
  id: string;
  author_name: string;
  author_photo_url: string | null;
  profile_photo_url: string | null;
  author_url: string | null;
  rating: number;
  text: string;
  time: string;
  relative_time_description: string;
  language: string;
  is_featured: boolean;
}

export async function GET(request: NextRequest) {
  try {
    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const GOOGLE_PLACE_ID = process.env.GOOGLE_PLACE_ID;

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      return NextResponse.json(
        { error: 'Supabase configuration missing' },
        { status: 500 }
      );
    }

    // Crear cliente de Supabase con anon key (usa RLS)
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    // Obtener parámetros de query
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const minRating = parseInt(searchParams.get('min_rating') || '1');
    const featured = searchParams.get('featured') === 'true';

    // Construir query
    let query = supabase
      .schema('marketing')
      .from('google_reviews')
      .select('*')
      .eq('is_active', true)
      .gte('rating', minRating)
      .order('time', { ascending: false })
      .limit(Math.min(limit, 50)); // Máximo 50 reseñas por request

    // Filtrar por lugar específico si está configurado
    if (GOOGLE_PLACE_ID) {
      query = query.eq('place_id', GOOGLE_PLACE_ID);
    }

    // Filtrar solo featured si se solicita
    if (featured) {
      query = query.eq('is_featured', true);
    }

    const { data: reviews, error } = await query;

    if (error) {
      console.error('Error fetching reviews:', error);
      return NextResponse.json(
        { error: 'Failed to fetch reviews', details: error.message },
        { status: 500 }
      );
    }

    // Obtener estadísticas si tenemos place_id
    let stats = null;
    if (GOOGLE_PLACE_ID) {
      const { data: statsData } = await supabase
        .schema('marketing')
        .rpc('get_reviews_stats', { p_place_id: GOOGLE_PLACE_ID });
      
      stats = statsData?.[0] || null;
    }

    return NextResponse.json({
      success: true,
      count: reviews?.length || 0,
      reviews: reviews || [],
      stats: stats,
      meta: {
        limit,
        min_rating: minRating,
        featured_only: featured
      }
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200'
      }
    });

  } catch (error: any) {
    console.error('Reviews API error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error.message || 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

