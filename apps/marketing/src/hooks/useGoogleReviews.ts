'use client';

import { useState, useEffect } from 'react';

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

interface ReviewStats {
  total_reviews: number;
  average_rating: number;
  five_star: number;
  four_star: number;
  three_star: number;
  two_star: number;
  one_star: number;
  latest_review_date: string;
}

interface ReviewsResponse {
  success: boolean;
  count: number;
  reviews: Review[];
  stats: ReviewStats | null;
  meta: {
    limit: number;
    min_rating: number;
    featured_only: boolean;
  };
}

interface UseGoogleReviewsOptions {
  limit?: number;
  minRating?: number;
  featuredOnly?: boolean;
  autoRefresh?: boolean;
  refreshInterval?: number; // en milisegundos
}

interface UseGoogleReviewsReturn {
  reviews: Review[];
  stats: ReviewStats | null;
  loading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
}

export function useGoogleReviews(options: UseGoogleReviewsOptions = {}): UseGoogleReviewsReturn {
  const {
    limit = 10,
    minRating = 1,
    featuredOnly = false,
    autoRefresh = false,
    refreshInterval = 300000, // 5 minutos por defecto
  } = options;

  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<ReviewStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      setError(null);

      // Construir URL con parámetros
      const params = new URLSearchParams({
        limit: limit.toString(),
        min_rating: minRating.toString(),
        ...(featuredOnly && { featured: 'true' }),
      });

      const response = await fetch(`/api/reviews?${params.toString()}`);

      if (!response.ok) {
        throw new Error(`Failed to fetch reviews: ${response.statusText}`);
      }

      const data: ReviewsResponse = await response.json();

      if (!data.success) {
        throw new Error('Failed to load reviews');
      }

      setReviews(data.reviews);
      setStats(data.stats);
    } catch (err) {
      console.error('Error fetching reviews:', err);
      setError(err instanceof Error ? err : new Error('Unknown error'));
      // En caso de error, mantener los datos anteriores si existen
    } finally {
      setLoading(false);
    }
  };

  // Fetch inicial
  useEffect(() => {
    fetchReviews();
  }, [limit, minRating, featuredOnly]); // Re-fetch si cambian los parámetros

  // Auto-refresh opcional
  useEffect(() => {
    if (!autoRefresh) return;

    const intervalId = setInterval(() => {
      fetchReviews();
    }, refreshInterval);

    return () => clearInterval(intervalId);
  }, [autoRefresh, refreshInterval, limit, minRating, featuredOnly]);

  return {
    reviews,
    stats,
    loading,
    error,
    refresh: fetchReviews,
  };
}

