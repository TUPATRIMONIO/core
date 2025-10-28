-- =====================================================
-- AUTO-UPDATE published_at cuando published cambia a true
-- =====================================================
-- Descripción: Agrega trigger para establecer automáticamente published_at
--              cuando un post se publica (published cambia de false a true)
-- Fecha: 2025-10-28

-- Función para actualizar published_at automáticamente
CREATE OR REPLACE FUNCTION marketing.auto_set_published_at()
RETURNS TRIGGER AS $$
BEGIN
  -- Si published cambia de false a true, establecer published_at
  IF NEW.published = true AND (OLD.published = false OR OLD.published IS NULL) THEN
    -- Si published_at es NULL, establecer ahora
    IF NEW.published_at IS NULL THEN
      NEW.published_at = NOW();
    END IF;
  END IF;
  
  -- Si published cambia de true a false, mantener published_at
  -- (para poder saber cuándo se publicó originalmente)
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear trigger BEFORE UPDATE
CREATE TRIGGER auto_set_published_at_trigger
  BEFORE UPDATE ON marketing.blog_posts
  FOR EACH ROW
  EXECUTE FUNCTION marketing.auto_set_published_at();

-- También crear trigger para INSERT (por si acaso)
CREATE TRIGGER auto_set_published_at_insert_trigger
  BEFORE INSERT ON marketing.blog_posts
  FOR EACH ROW
  EXECUTE FUNCTION marketing.auto_set_published_at();

-- Comentarios
COMMENT ON FUNCTION marketing.auto_set_published_at() IS 
  'Establece automáticamente published_at cuando published cambia a true';

-- Success message
SELECT 'Trigger auto_set_published_at creado exitosamente' as result;

