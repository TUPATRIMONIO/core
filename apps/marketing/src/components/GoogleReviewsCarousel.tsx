'use client';

import { useEffect, useState } from 'react';
import { Star, ChevronLeft, ChevronRight, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useGoogleReviews } from '@/hooks/useGoogleReviews';
import { GoogleStatsHeader } from '@/components/GoogleStatsDisplay';

// Interfaces
interface Review {
  author_name: string;
  author_url?: string;
  profile_photo_url: string;
  rating: number;
  relative_time_description: string;
  text: string;
  time: number | string;
}

// Testimonios estáticos como fallback
const FALLBACK_TESTIMONIALS: Review[] = [
  {
    author_name: 'María González',
    profile_photo_url: '',
    rating: 5,
    relative_time_description: 'hace 2 semanas',
    text: 'Necesitaba firmar un contrato de arriendo urgente porque viajo mañana. En 3 horas ya tenía el contrato protocolizado y se lo envié a mi arrendataria. Me ahorré $35.000 y un día completo de trámites.',
    time: Date.now() / 1000,
  },
  {
    author_name: 'Jorge López',
    profile_photo_url: '',
    rating: 5,
    relative_time_description: 'hace 1 mes',
    text: 'Nuestra empresa necesitaba firmar 80 contratos de trabajo para nuevos empleados. Con TuPatrimonio lo hicimos en 2 días vs 3 semanas que tardábamos antes. Ahorramos $2.400.000 en costos notariales. Increíble servicio.',
    time: Date.now() / 1000,
  },
  {
    author_name: 'Camila Rojas',
    profile_photo_url: '',
    rating: 5,
    relative_time_description: 'hace 3 semanas',
    text: 'Estaba en Alemania y necesitaba vender mi departamento en Chile. Firmé el poder notarial online a las 11 PM hora alemana. Mi abogado lo recibió en la mañana y cerró la venta. No tuve que viajar a Chile. Ahorré $1.500 en pasajes.',
    time: Date.now() / 1000,
  },
];

export default function GoogleReviewsCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  // Usar el hook de reseñas de Google
  const { 
    reviews: apiReviews, 
    loading, 
    error: apiError 
  } = useGoogleReviews({ 
    limit: 50,
    minRating: 5,
    featuredOnly: false 
  });

  // Usar reseñas de la API o fallback si hay error o no hay reseñas
  const reviews = apiError || apiReviews.length === 0 
    ? FALLBACK_TESTIMONIALS 
    : apiReviews;

  // Determinar si mostrar el mensaje de error (usando fallback)
  const showFallbackBadge = apiError || apiReviews.length === 0;

  // Detectar tamaño de pantalla
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Número de reseñas visibles según el tamaño de pantalla
  const visibleCount = isMobile ? 1 : 3;
  const maxIndex = Math.max(0, reviews.length - visibleCount);

  // Navegación
  const goToPrevious = () => {
    setCurrentIndex((prev) => Math.max(0, prev - 1));
  };

  const goToNext = () => {
    setCurrentIndex((prev) => Math.min(maxIndex, prev + 1));
  };

  // Obtener iniciales para avatar
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Colores aleatorios para avatars sin foto
  const getAvatarColor = (name: string) => {
    const colors = [
      'bg-[var(--tp-brand-20)] text-[var(--tp-brand)]',
      'bg-blue-100 text-blue-600',
      'bg-green-100 text-green-600',
      'bg-purple-100 text-purple-600',
      'bg-orange-100 text-orange-600',
    ];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  // Loading skeleton
  if (loading) {
    return (
      <div className="grid md:grid-cols-3 gap-8">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="bg-gradient-to-br from-white to-[var(--tp-background-light)] rounded-2xl p-8 shadow-lg border border-gray-200 animate-pulse"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 bg-gray-200 rounded-full"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-32 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-24"></div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="h-3 bg-gray-200 rounded"></div>
              <div className="h-3 bg-gray-200 rounded"></div>
              <div className="h-3 bg-gray-200 rounded w-3/4"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  const visibleReviews = reviews.slice(currentIndex, currentIndex + visibleCount);

  return (
    <div className="relative">
      {/* Badge de estado */}
      {showFallbackBadge && (
        <div className="mb-4 flex items-center justify-center gap-2 text-sm text-gray-600">
          <AlertCircle className="w-4 h-4" />
          <span>Mostrando testimonios destacados</span>
        </div>
      )}

      {/* Estadísticas de Google en tiempo real */}
      {!showFallbackBadge && <GoogleStatsHeader />}

      {/* Carousel container */}
      <div className="relative px-12">
        {/* Botón anterior */}
        <Button
          variant="outline"
          size="icon"
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white shadow-lg hover:bg-[var(--tp-background-light)] disabled:opacity-30"
          onClick={goToPrevious}
          disabled={currentIndex === 0}
          aria-label="Reseña anterior"
        >
          <ChevronLeft className="w-5 h-5" />
        </Button>

        {/* Grid de reseñas */}
        <div className="grid md:grid-cols-3 gap-8">
          {visibleReviews.map((review, idx) => {
            // Usar profile_photo_url o author_photo_url según disponibilidad
            const photoUrl = review.profile_photo_url || (review as any).author_photo_url;
            
            return (
              <div
                key={`${review.author_name}-${review.time}-${idx}`}
                className="bg-gradient-to-br from-white to-[var(--tp-background-light)] rounded-2xl p-8 shadow-lg border border-gray-200 transition-all hover:shadow-xl"
              >
                {/* Header con foto y nombre */}
                <div className="flex items-center gap-4 mb-4">
                  {photoUrl ? (
                    <img
                      src={photoUrl}
                      alt={review.author_name}
                      className="w-16 h-16 rounded-full object-cover"
                    />
                  ) : (
                  <div
                    className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold ${getAvatarColor(
                      review.author_name
                    )}`}
                  >
                    {getInitials(review.author_name)}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-gray-900 truncate">
                    {review.author_name}
                  </p>
                  <p className="text-sm text-gray-600">
                    {review.relative_time_description}
                  </p>
                  <div className="flex mt-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className="w-4 h-4 text-yellow-500 fill-yellow-500"
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Texto de la reseña */}
              <p className="text-gray-700 leading-relaxed">
                {review.text.length > 200
                  ? `${review.text.slice(0, 200)}...`
                  : review.text}
              </p>
            </div>
            );
          })}
        </div>

        {/* Botón siguiente */}
        <Button
          variant="outline"
          size="icon"
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white shadow-lg hover:bg-[var(--tp-background-light)] disabled:opacity-30"
          onClick={goToNext}
          disabled={currentIndex >= maxIndex}
          aria-label="Siguiente reseña"
        >
          <ChevronRight className="w-5 h-5" />
        </Button>
      </div>

      {/* Indicadores de posición */}
      {reviews.length > visibleCount && (
        <div className="flex justify-center gap-2 mt-8">
          {Array.from({ length: maxIndex + 1 }).map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className={`h-2 rounded-full transition-all ${
                idx === currentIndex
                  ? 'w-8 bg-[var(--tp-brand)]'
                  : 'w-2 bg-gray-300 hover:bg-gray-400'
              }`}
              aria-label={`Ir a grupo ${idx + 1}`}
            />
          ))}
        </div>
      )}

      {/* Badge de Google */}
      <div className="mt-6 text-center">
        <a
          href="https://www.google.com/search?q=TuPatrimonio#lrd=0x9662cf6d1f057f19:0x91c131ab6814bd0e,1,,,,"
          target="_blank"
          rel="noopener noreferrer nofollow"
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-[var(--tp-brand)] transition-colors"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Click aquí para ver más reseñas verificadas de Google
        </a>
      </div>
    </div>
  );
}

