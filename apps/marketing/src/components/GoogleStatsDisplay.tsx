'use client';

import { Star, Users } from 'lucide-react';
import { useGoogleStats } from '@/hooks/useGoogleStats';

/**
 * Badge compacto con rating y total de reseñas de Google
 * Para usar en Hero sections y headers
 */
export function GoogleStatsBadge() {
  const { stats, loading } = useGoogleStats();
  
  if (loading) {
    return (
      <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-sm border border-[var(--tp-lines-20)] animate-pulse">
        <div className="w-4 h-4 bg-gray-200 rounded"></div>
        <div className="h-4 w-32 bg-gray-200 rounded"></div>
      </div>
    );
  }
  
  return (
    <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-sm border border-[var(--tp-lines-20)]">
      <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
      <span className="text-sm font-medium text-gray-700">
        {stats?.rating.toFixed(1) || '4.8'}/5 ({stats?.total_reviews.toLocaleString('es-CL') || '550'} reseñas)
      </span>
    </div>
  );
}

/**
 * Métricas grandes de Google para secciones de Social Proof
 */
export function GoogleStatsMetrics() {
  const { stats, loading } = useGoogleStats();
  
  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-12 bg-gray-200 rounded w-32 mb-2 mx-auto"></div>
        <div className="h-4 bg-gray-200 rounded w-40 mb-1 mx-auto"></div>
        <div className="h-3 bg-gray-200 rounded w-24 mx-auto"></div>
      </div>
    );
  }
  
  return (
    <div>
      <div className="text-5xl font-bold text-[var(--tp-brand)] mb-2">
        {stats?.rating.toFixed(1) || '4.9'}/5
      </div>
      <p className="text-gray-700 font-medium">Calificación en Google</p>
      <p className="text-sm text-gray-600 mt-1">
        {stats?.total_reviews.toLocaleString('es-CL') || '550'} reseñas verificadas
      </p>
    </div>
  );
}

/**
 * Header completo con rating visual y badge de verificación
 * Para usar sobre el carrusel de reseñas
 */
export function GoogleStatsHeader() {
  const { stats, loading } = useGoogleStats();
  
  if (loading) {
    return (
      <div className="mb-8 flex flex-col items-center gap-4 animate-pulse">
        <div className="flex items-center gap-4">
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="w-7 h-7 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-8 w-16 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!stats) return null;
  
  return (
    <div className="mb-8 flex flex-col items-center gap-4">
      {/* Rating principal */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="flex">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star 
                key={star} 
                className={`w-7 h-7 ${
                  star <= Math.round(stats.rating) 
                    ? 'text-yellow-500 fill-yellow-500' 
                    : 'text-gray-300'
                }`} 
              />
            ))}
          </div>
          <div className="flex flex-col">
            <span className="text-3xl font-bold text-gray-900">
              {stats.rating.toFixed(1)}
            </span>
            <span className="text-xs text-gray-500">de Google</span>
          </div>
        </div>
        
        <div className="h-12 w-px bg-gray-300"></div>
        
        <div className="text-center">
          <p className="text-2xl font-bold text-gray-900">
            {stats.total_reviews.toLocaleString('es-CL')}
          </p>
          <p className="text-xs text-gray-600">reseñas verificadas</p>
        </div>
      </div>

      {/* Badge de verificación de Google */}
      <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 rounded-full border border-green-200">
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
        </svg>
        <span className="text-sm font-medium text-gray-700">
          Reseñas verificadas por Google
        </span>
      </div>
    </div>
  );
}

