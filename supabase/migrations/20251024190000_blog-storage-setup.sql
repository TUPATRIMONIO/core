-- Migration: Blog Storage Setup
-- Description: Create storage buckets for blog images with public access policies
-- Created: 2025-10-24

-- =====================================================
-- STORAGE BUCKETS for Blog Images
-- =====================================================

-- Blog Featured Images (imágenes destacadas de artículos)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'blog-featured',
  'blog-featured',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Blog Content Images (imágenes dentro del contenido)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'blog-content',
  'blog-content',
  true,
  3145728, -- 3MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Blog Categories Icons/Images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'blog-categories',
  'blog-categories',
  true,
  1048576, -- 1MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/svg+xml']
)
ON CONFLICT (id) DO NOTHING;

-- Blog Authors Avatars
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'blog-authors',
  'blog-authors',
  true,
  1048576, -- 1MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Blog Thumbnails (miniaturas optimizadas)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'blog-thumbnails',
  'blog-thumbnails',
  true,
  2097152, -- 2MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Blog Meta Images (og:image, twitter:card)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'blog-meta',
  'blog-meta',
  true,
  2097152, -- 2MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- STORAGE POLICIES - Public Read Access
-- =====================================================

-- Blog Featured Images - Public Read
CREATE POLICY "Public read access for blog featured images"
ON storage.objects FOR SELECT
USING (bucket_id = 'blog-featured');

-- Blog Featured Images - Authenticated Write
CREATE POLICY "Authenticated users can upload blog featured images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'blog-featured' 
  AND auth.role() = 'authenticated'
);

-- Blog Featured Images - Authenticated Update
CREATE POLICY "Authenticated users can update blog featured images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'blog-featured' 
  AND auth.role() = 'authenticated'
);

-- Blog Featured Images - Authenticated Delete
CREATE POLICY "Authenticated users can delete blog featured images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'blog-featured' 
  AND auth.role() = 'authenticated'
);

-- =====================================================
-- Blog Content Images Policies
-- =====================================================

CREATE POLICY "Public read access for blog content images"
ON storage.objects FOR SELECT
USING (bucket_id = 'blog-content');

CREATE POLICY "Authenticated users can upload blog content images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'blog-content' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Authenticated users can update blog content images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'blog-content' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Authenticated users can delete blog content images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'blog-content' 
  AND auth.role() = 'authenticated'
);

-- =====================================================
-- Blog Categories Policies
-- =====================================================

CREATE POLICY "Public read access for blog category images"
ON storage.objects FOR SELECT
USING (bucket_id = 'blog-categories');

CREATE POLICY "Authenticated users can upload blog category images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'blog-categories' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Authenticated users can update blog category images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'blog-categories' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Authenticated users can delete blog category images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'blog-categories' 
  AND auth.role() = 'authenticated'
);

-- =====================================================
-- Blog Authors Policies
-- =====================================================

CREATE POLICY "Public read access for blog author avatars"
ON storage.objects FOR SELECT
USING (bucket_id = 'blog-authors');

CREATE POLICY "Authenticated users can upload blog author avatars"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'blog-authors' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Authenticated users can update blog author avatars"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'blog-authors' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Authenticated users can delete blog author avatars"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'blog-authors' 
  AND auth.role() = 'authenticated'
);

-- =====================================================
-- Blog Thumbnails Policies
-- =====================================================

CREATE POLICY "Public read access for blog thumbnails"
ON storage.objects FOR SELECT
USING (bucket_id = 'blog-thumbnails');

CREATE POLICY "Authenticated users can upload blog thumbnails"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'blog-thumbnails' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Authenticated users can update blog thumbnails"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'blog-thumbnails' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Authenticated users can delete blog thumbnails"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'blog-thumbnails' 
  AND auth.role() = 'authenticated'
);

-- =====================================================
-- Blog Meta Images Policies
-- =====================================================

CREATE POLICY "Public read access for blog meta images"
ON storage.objects FOR SELECT
USING (bucket_id = 'blog-meta');

CREATE POLICY "Authenticated users can upload blog meta images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'blog-meta' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Authenticated users can update blog meta images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'blog-meta' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Authenticated users can delete blog meta images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'blog-meta' 
  AND auth.role() = 'authenticated'
);

-- =====================================================
-- Success message
-- =====================================================
SELECT 'Blog storage buckets created successfully with ' || 
       (SELECT count(*) FROM storage.buckets WHERE id LIKE 'blog-%') || 
       ' buckets configured' as result;

