-- Script para agregar reseñas manualmente a la base de datos
-- Uso: Ejecuta esto en el SQL Editor de Supabase

INSERT INTO marketing.google_reviews (
  author_name,
  author_photo_url,
  profile_photo_url,
  author_url,
  rating,
  text,
  time,
  relative_time_description,
  language,
  place_id,
  is_active,
  is_featured -- TRUE para destacar esta reseña
) VALUES (
  'Nombre del Autor', -- Nombre del autor
  NULL, -- URL de foto (opcional)
  NULL, -- URL de foto (opcional)
  NULL, -- URL del perfil (opcional)
  5, -- Rating (1-5)
  'Texto de la reseña aquí...', -- Texto de la reseña
  '2024-01-15T10:30:00Z', -- Fecha de la reseña (formato ISO)
  'hace 6 meses', -- Descripción relativa del tiempo
  'es', -- Idioma
  'ChIJGX8FH23PYpYRDr0UaKsxwZE', -- Tu Google Place ID
  true, -- Activa
  false -- Destacada (true para mostrar prioritariamente)
);

-- Ejemplo con una reseña real:
-- INSERT INTO marketing.google_reviews (
--   author_name, rating, text, time, relative_time_description, 
--   language, place_id, is_active, is_featured
-- ) VALUES (
--   'Juan Pérez', 
--   5, 
--   'Excelente servicio, muy rápido y confiable. Pude hacer todo desde mi casa sin complicaciones.',
--   '2024-10-15T14:20:00Z',
--   'hace 2 semanas',
--   'es',
--   'ChIJGX8FH23PYpYRDr0UaKsxwZE',
--   true,
--   true
-- );

