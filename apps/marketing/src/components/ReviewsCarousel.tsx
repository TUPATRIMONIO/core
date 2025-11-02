'use client';

import { useState, useEffect, useCallback } from 'react';
import { Star, ChevronLeft, ChevronRight, User } from 'lucide-react';
import { useGoogleReviews } from '@/hooks/useGoogleReviews';

interface ReviewCardProps {
  author_name: string;
  author_photo_url: string | null;
  rating: number;
  text: string;
  relative_time_description: string;
}

function ReviewCard({ author_name, author_photo_url, rating, text, relative_time_description }: ReviewCardProps) {
  // Generar iniciales del nombre
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Truncar texto largo
  const truncateText = (text: string, maxLength: number = 200) => {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength) + '...';
  };

  return (
    <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100 h-full flex flex-col">
      {/* Header con foto y nombre */}
      <div className="flex items-center gap-4 mb-4">
        <div className="flex-shrink-0">
          {author_photo_url ? (
            <img 
              src={author_photo_url} 
              alt={author_name}
              className="w-12 h-12 rounded-full object-cover"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-[var(--tp-buttons)] text-white flex items-center justify-center font-bold text-sm">
              {getInitials(author_name)}
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-bold text-gray-900 truncate">{author_name}</h4>
          <p className="text-sm text-gray-500">{relative_time_description}</p>
        </div>
      </div>

      {/* Estrellas */}
      <div className="flex gap-1 mb-3">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-5 h-5 ${
              star <= rating
                ? 'text-yellow-500 fill-yellow-500'
                : 'text-gray-300'
            }`}
          />
        ))}
      </div>

      {/* Texto de la reseña */}
      <p className="text-gray-700 text-sm leading-relaxed flex-1">
        {truncateText(text)}
      </p>

      {/* Badge de Google */}
      <div className="mt-4 pt-4 border-t border-gray-100">
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          <span>Reseña de Google</span>
        </div>
      </div>
    </div>
  );
}

export default function ReviewsCarousel() {
  const { reviews, stats, loading, error } = useGoogleReviews({ 
    limit: 12,
    minRating: 1 
  });

  const [currentIndex, setCurrentIndex] = useState(0);
  const [itemsPerView, setItemsPerView] = useState(3);

  // Determinar items por vista según el tamaño de pantalla
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setItemsPerView(1);
      } else if (window.innerWidth < 1024) {
        setItemsPerView(2);
      } else {
        setItemsPerView(3);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Auto-scroll cada 5 segundos
  useEffect(() => {
    if (reviews.length <= itemsPerView) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => {
        const maxIndex = reviews.length - itemsPerView;
        return prev >= maxIndex ? 0 : prev + 1;
      });
    }, 5000);

    return () => clearInterval(interval);
  }, [reviews.length, itemsPerView]);

  const goToPrevious = useCallback(() => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : 0));
  }, []);

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => {
      const maxIndex = reviews.length - itemsPerView;
      return prev < maxIndex ? prev + 1 : maxIndex;
    });
  }, [reviews.length, itemsPerView]);

  const maxIndex = Math.max(0, reviews.length - itemsPerView);
  const totalDots = maxIndex + 1;

  // Estados de carga y error
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--tp-buttons)]"></div>
        <p className="mt-4 text-gray-600">Cargando opiniones...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">No pudimos cargar las opiniones en este momento.</p>
        <p className="text-sm text-gray-500 mt-2">Por favor, intenta nuevamente más tarde.</p>
      </div>
    );
  }

  if (!reviews || reviews.length === 0) {
    return (
      <div className="text-center py-12">
        <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600">Aún no hay opiniones disponibles.</p>
        <p className="text-sm text-gray-500 mt-2">Pronto encontrarás aquí las opiniones de nuestros clientes.</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Estadísticas superiores */}
      {stats && stats.total_reviews > 0 && (
        <div className="flex items-center justify-center gap-6 mb-8">
          <div className="text-center">
            <div className="flex items-center gap-2 justify-center">
              <span className="text-4xl font-bold text-gray-900">{stats.average_rating}</span>
              <Star className="w-8 h-8 text-yellow-500 fill-yellow-500" />
            </div>
            <p className="text-sm text-gray-600 mt-1">Calificación promedio</p>
          </div>
          <div className="h-12 w-px bg-gray-300"></div>
          <div className="text-center">
            <div className="text-4xl font-bold text-gray-900">{stats.total_reviews}</div>
            <p className="text-sm text-gray-600 mt-1">Reseñas totales</p>
          </div>
        </div>
      )}

      {/* Contenedor del carrusel */}
      <div className="relative">
        {/* Botón anterior */}
        {currentIndex > 0 && (
          <button
            onClick={goToPrevious}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 bg-white rounded-full p-2 shadow-lg border border-gray-200 hover:bg-gray-50 transition-colors"
            aria-label="Anterior"
          >
            <ChevronLeft className="w-6 h-6 text-gray-700" />
          </button>
        )}

        {/* Botón siguiente */}
        {currentIndex < maxIndex && (
          <button
            onClick={goToNext}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 bg-white rounded-full p-2 shadow-lg border border-gray-200 hover:bg-gray-50 transition-colors"
            aria-label="Siguiente"
          >
            <ChevronRight className="w-6 h-6 text-gray-700" />
          </button>
        )}

        {/* Grid de reseñas */}
        <div className="overflow-hidden px-1">
          <div 
            className="grid transition-transform duration-500 ease-out gap-6"
            style={{
              gridTemplateColumns: `repeat(${reviews.length}, minmax(0, 1fr))`,
              transform: `translateX(-${currentIndex * (100 / reviews.length)}%)`,
              width: `${(reviews.length / itemsPerView) * 100}%`
            }}
          >
            {reviews.map((review) => (
              <div key={review.id} className="min-w-0">
                <ReviewCard {...review} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Indicadores (dots) */}
      {totalDots > 1 && (
        <div className="flex justify-center gap-2 mt-8">
          {Array.from({ length: totalDots }).map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`h-2 rounded-full transition-all ${
                index === currentIndex
                  ? 'w-8 bg-[var(--tp-buttons)]'
                  : 'w-2 bg-gray-300 hover:bg-gray-400'
              }`}
              aria-label={`Ir a grupo ${index + 1}`}
            />
          ))}
        </div>
      )}

      {/* Link a todas las reseñas en Google */}
      <div className="text-center mt-8">
        <a
          href={`https://search.google.com/local/reviews?placeid=${process.env.NEXT_PUBLIC_GOOGLE_PLACE_ID || ''}`}
          target="_blank"
          rel="noopener noreferrer nofollow"
          className="inline-flex items-center gap-2 text-[var(--tp-buttons)] hover:text-[var(--tp-buttons-hover)] font-medium transition-colors"
        >
          <span>Ver todas las opiniones en Google</span>
          <ChevronRight className="w-4 h-4" />
        </a>
      </div>
    </div>
  );
}

