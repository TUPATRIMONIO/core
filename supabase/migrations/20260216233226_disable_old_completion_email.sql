-- =====================================================
-- Migration: Disable old completion email
-- Description: Desactiva el envío de email en on_document_completed para evitar duplicados
--              Ahora las notificaciones se manejan en billing.notify_order_completed
-- Created: 2026-02-16
-- =====================================================

SET search_path TO signing, core, public, extensions;

-- =====================================================
-- FUNCTION: on_document_completed (Updated)
-- =====================================================

CREATE OR REPLACE FUNCTION signing.on_document_completed()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Esta función ya no envía correos directamente.
  -- La notificación de finalización ahora es manejada por el trigger 'trigger_notify_order_completed'
  -- en la tabla 'billing.orders', que invoca a la Edge Function 'send-order-completed-notification'.
  -- Esto permite enviar un correo más completo con links de descarga y solicitud de reseña,
  -- y evita enviar correos duplicados.
  
  -- Solo mantenemos el trigger activo por si se necesita agregar lógica adicional en el futuro
  -- relacionada con el cambio de estado del documento, pero por ahora es un no-op para notificaciones.

  RETURN NEW;
END;
$$;

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

DO $$ 
BEGIN 
  RAISE NOTICE '✅ Función signing.on_document_completed actualizada: envío de emails desactivado (delegado a billing.orders)';
END $$;
