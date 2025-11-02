'use client';

import { useState, useEffect } from 'react';

interface GoogleStats {
  success: boolean;
  rating: number;
  total_reviews: number;
  place_name: string;
  fallback: boolean;
}

interface UseGoogleStatsReturn {
  stats: GoogleStats | null;
  loading: boolean;
  error: Error | null;
}

export function useGoogleStats(): UseGoogleStatsReturn {
  const [stats, setStats] = useState<GoogleStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch('/api/google-stats');
        const data = await response.json();

        if (response.ok) {
          setStats(data);
        } else {
          throw new Error('Failed to fetch Google stats');
        }
      } catch (err) {
        console.error('Error fetching Google stats:', err);
        setError(err instanceof Error ? err : new Error('Unknown error'));
        // Fallback stats
        setStats({
          success: false,
          rating: 4.8,
          total_reviews: 550,
          place_name: 'TuPatrimonio',
          fallback: true,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  return { stats, loading, error };
}

