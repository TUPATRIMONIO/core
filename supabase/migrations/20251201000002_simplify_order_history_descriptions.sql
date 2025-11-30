-- =====================================================
-- Migration: Simplify order history descriptions
-- Description: Hacer las descripciones más simples y amigables para el cliente
-- Created: 2025-12-01
-- =====================================================

SET search_path TO billing, credits, core, public, extensions;

-- Función helper para obtener descripción amigable de estado
CREATE OR REPLACE FUNCTION billing.get_friendly_status_label(status_text TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN CASE status_text
    WHEN 'pending_payment' THEN 'Pendiente de pago'
    WHEN 'paid' THEN 'Pagada'
    WHEN 'completed' THEN 'Completada'
    WHEN 'cancelled' THEN 'Cancelada'
    WHEN 'refunded' THEN 'Reembolsada'
    ELSE status_text
  END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Actualizar función de creación de orden
CREATE OR REPLACE FUNCTION billing.log_order_created()
RETURNS TRIGGER AS $$
BEGIN
  -- Registrar evento de creación con descripción simple
  INSERT INTO billing.order_history (
    order_id,
    event_type,
    event_description,
    event_metadata,
    to_status
  ) VALUES (
    NEW.id,
    'order_created',
    'Tu pedido fue creado',
    jsonb_build_object(
      'order_number', NEW.order_number,
      'product_type', NEW.product_type,
      'amount', NEW.amount,
      'currency', NEW.currency
    ),
    NEW.status
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Actualizar función de cambio de estado con descripciones amigables
CREATE OR REPLACE FUNCTION billing.log_order_status_changed()
RETURNS TRIGGER AS $$
DECLARE
  v_description TEXT;
  v_metadata JSONB := '{}';
BEGIN
  -- Solo registrar si el estado cambió
  IF NEW.status != OLD.status THEN
    -- Construir descripción amigable según el nuevo estado
    v_description := CASE NEW.status
      WHEN 'pending_payment' THEN 'Pedido pendiente de pago'
      WHEN 'paid' THEN 'Pago confirmado'
      WHEN 'completed' THEN 'Pedido completado'
      WHEN 'cancelled' THEN 'Pedido cancelado'
      WHEN 'refunded' THEN 'Pedido reembolsado'
      ELSE 'Estado actualizado'
    END;
    
    -- Agregar metadata según el nuevo estado (sin IDs técnicos visibles)
    v_metadata := jsonb_build_object(
      'previous_status', OLD.status,
      'new_status', NEW.status
    );
    
    -- Registrar evento
    INSERT INTO billing.order_history (
      order_id,
      event_type,
      event_description,
      event_metadata,
      from_status,
      to_status
    ) VALUES (
      NEW.id,
      'status_changed',
      v_description,
      v_metadata,
      OLD.status,
      NEW.status
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Actualizar función de cancelación
CREATE OR REPLACE FUNCTION billing.log_order_cancelled()
RETURNS TRIGGER AS $$
BEGIN
  -- Solo registrar si cancelled_at se establece por primera vez
  IF NEW.cancelled_at IS NOT NULL AND (OLD.cancelled_at IS NULL OR OLD.cancelled_at IS DISTINCT FROM NEW.cancelled_at) THEN
    INSERT INTO billing.order_history (
      order_id,
      event_type,
      event_description,
      event_metadata,
      from_status,
      to_status
    ) VALUES (
      NEW.id,
      'order_cancelled',
      'Pedido cancelado',
      jsonb_build_object(
        'cancelled_at', NEW.cancelled_at
      ),
      OLD.status,
      NEW.status
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Actualizar función de completado
CREATE OR REPLACE FUNCTION billing.log_order_completed()
RETURNS TRIGGER AS $$
BEGIN
  -- Solo registrar si completed_at se establece por primera vez
  IF NEW.completed_at IS NOT NULL AND (OLD.completed_at IS NULL OR OLD.completed_at IS DISTINCT FROM NEW.completed_at) THEN
    INSERT INTO billing.order_history (
      order_id,
      event_type,
      event_description,
      event_metadata,
      from_status,
      to_status
    ) VALUES (
      NEW.id,
      'order_completed',
      'Pedido completado exitosamente',
      jsonb_build_object(
        'completed_at', NEW.completed_at
      ),
      OLD.status,
      NEW.status
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;



