-- =====================================================
-- Migration: Create order history system
-- Description: Sistema de trazabilidad completo para órdenes
-- Created: 2025-12-01
-- =====================================================

-- Set search path
SET search_path TO billing, credits, core, public, extensions;

-- =====================================================
-- ENUMS
-- =====================================================

CREATE TYPE billing.order_event_type AS ENUM (
  'order_created',        -- Orden creada
  'status_changed',       -- Cambio de estado
  'invoice_created',      -- Factura creada
  'payment_initiated',    -- Pago iniciado
  'payment_succeeded',    -- Pago exitoso
  'payment_failed',       -- Pago fallido
  'order_cancelled',      -- Orden cancelada
  'order_expired',        -- Orden expirada
  'order_completed',      -- Orden completada
  'order_refunded',       -- Orden reembolsada
  'order_modified'        -- Orden modificada
);

-- =====================================================
-- ORDER HISTORY TABLE
-- =====================================================

CREATE TABLE billing.order_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES billing.orders(id) ON DELETE CASCADE,
  
  -- Event details
  event_type billing.order_event_type NOT NULL,
  event_description TEXT NOT NULL,
  event_metadata JSONB NOT NULL DEFAULT '{}',
  
  -- User tracking
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Status change tracking
  from_status billing.order_status,
  to_status billing.order_status,
  
  -- Timestamp
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- INDEXES
-- =====================================================

CREATE INDEX idx_order_history_order_id ON billing.order_history(order_id);
CREATE INDEX idx_order_history_created_at ON billing.order_history(created_at DESC);
CREATE INDEX idx_order_history_event_type ON billing.order_history(event_type);
CREATE INDEX idx_order_history_order_created ON billing.order_history(order_id, created_at DESC);

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Function to log order events manually
CREATE OR REPLACE FUNCTION billing.log_order_event(
  p_order_id UUID,
  p_event_type TEXT,
  p_description TEXT,
  p_metadata JSONB DEFAULT '{}',
  p_user_id UUID DEFAULT NULL,
  p_from_status billing.order_status DEFAULT NULL,
  p_to_status billing.order_status DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_event_id UUID;
  v_event_type_enum billing.order_event_type;
BEGIN
  -- Convertir texto a enum
  v_event_type_enum := p_event_type::billing.order_event_type;
  
  -- Insertar evento
  INSERT INTO billing.order_history (
    order_id,
    event_type,
    event_description,
    event_metadata,
    user_id,
    from_status,
    to_status
  ) VALUES (
    p_order_id,
    v_event_type_enum,
    p_description,
    p_metadata,
    p_user_id,
    p_from_status,
    p_to_status
  )
  RETURNING id INTO v_event_id;
  
  RETURN v_event_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Wrapper público para log_order_event
CREATE OR REPLACE FUNCTION public.log_order_event(
  p_order_id UUID,
  p_event_type TEXT,
  p_description TEXT,
  p_metadata JSONB DEFAULT '{}',
  p_user_id UUID DEFAULT NULL,
  p_from_status TEXT DEFAULT NULL,
  p_to_status TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_from_status_enum billing.order_status;
  v_to_status_enum billing.order_status;
BEGIN
  -- Convertir status de texto a enum si se proporcionan
  IF p_from_status IS NOT NULL THEN
    v_from_status_enum := p_from_status::billing.order_status;
  END IF;
  
  IF p_to_status IS NOT NULL THEN
    v_to_status_enum := p_to_status::billing.order_status;
  END IF;
  
  RETURN billing.log_order_event(
    p_order_id,
    p_event_type,
    p_description,
    p_metadata,
    p_user_id,
    v_from_status_enum,
    v_to_status_enum
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.log_order_event(UUID, TEXT, TEXT, JSONB, UUID, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.log_order_event(UUID, TEXT, TEXT, JSONB, UUID, TEXT, TEXT) TO service_role;

COMMENT ON FUNCTION public.log_order_event IS
'Registra un evento en el historial de una orden. Usado para trazabilidad completa.';

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Trigger para registrar creación de orden
CREATE OR REPLACE FUNCTION billing.log_order_created()
RETURNS TRIGGER AS $$
DECLARE
  v_product_name TEXT;
BEGIN
  -- Extraer nombre del producto desde product_data si existe
  v_product_name := COALESCE(
    (NEW.product_data->>'name')::TEXT,
    'Producto ' || NEW.product_type
  );
  
  -- Registrar evento de creación
  INSERT INTO billing.order_history (
    order_id,
    event_type,
    event_description,
    event_metadata,
    to_status
  ) VALUES (
    NEW.id,
    'order_created',
    'Orden creada: ' || v_product_name || ' - Monto: ' || NEW.amount || ' ' || NEW.currency,
    jsonb_build_object(
      'order_number', NEW.order_number,
      'product_type', NEW.product_type,
      'amount', NEW.amount,
      'currency', NEW.currency,
      'expires_at', NEW.expires_at
    ),
    NEW.status
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_log_order_created
  AFTER INSERT ON billing.orders
  FOR EACH ROW
  EXECUTE FUNCTION billing.log_order_created();

-- Trigger para registrar cambios de estado
CREATE OR REPLACE FUNCTION billing.log_order_status_changed()
RETURNS TRIGGER AS $$
DECLARE
  v_description TEXT;
  v_metadata JSONB := '{}';
BEGIN
  -- Solo registrar si el estado cambió
  IF NEW.status != OLD.status THEN
    -- Construir descripción según el cambio
    v_description := 'Estado cambiado de ' || OLD.status || ' a ' || NEW.status;
    
    -- Agregar metadata según el nuevo estado
    v_metadata := jsonb_build_object(
      'order_number', NEW.order_number,
      'previous_status', OLD.status,
      'new_status', NEW.status
    );
    
    -- Agregar información adicional según el estado
    IF NEW.status = 'paid' AND NEW.payment_id IS NOT NULL THEN
      v_metadata := v_metadata || jsonb_build_object('payment_id', NEW.payment_id);
    END IF;
    
    IF NEW.status = 'paid' AND NEW.invoice_id IS NOT NULL THEN
      v_metadata := v_metadata || jsonb_build_object('invoice_id', NEW.invoice_id);
    END IF;
    
    IF NEW.status = 'cancelled' AND NEW.cancelled_at IS NOT NULL THEN
      v_metadata := v_metadata || jsonb_build_object('cancelled_at', NEW.cancelled_at);
    END IF;
    
    IF NEW.status = 'completed' AND NEW.completed_at IS NOT NULL THEN
      v_metadata := v_metadata || jsonb_build_object('completed_at', NEW.completed_at);
    END IF;
    
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

CREATE TRIGGER trigger_log_order_status_changed
  AFTER UPDATE ON billing.orders
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION billing.log_order_status_changed();

-- Trigger para registrar cuando se establece cancelled_at
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
      'Orden cancelada',
      jsonb_build_object(
        'order_number', NEW.order_number,
        'cancelled_at', NEW.cancelled_at,
        'reason', COALESCE((NEW.metadata->>'cancellation_reason')::TEXT, 'No especificada')
      ),
      OLD.status,
      NEW.status
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_log_order_cancelled
  AFTER UPDATE ON billing.orders
  FOR EACH ROW
  WHEN (OLD.cancelled_at IS DISTINCT FROM NEW.cancelled_at AND NEW.cancelled_at IS NOT NULL)
  EXECUTE FUNCTION billing.log_order_cancelled();

-- Trigger para registrar cuando se establece completed_at
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
      'Orden completada',
      jsonb_build_object(
        'order_number', NEW.order_number,
        'completed_at', NEW.completed_at
      ),
      OLD.status,
      NEW.status
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_log_order_completed
  AFTER UPDATE ON billing.orders
  FOR EACH ROW
  WHEN (OLD.completed_at IS DISTINCT FROM NEW.completed_at AND NEW.completed_at IS NOT NULL)
  EXECUTE FUNCTION billing.log_order_completed();

-- =====================================================
-- RLS POLICIES
-- =====================================================

ALTER TABLE billing.order_history ENABLE ROW LEVEL SECURITY;

-- Users can view order history for orders they have access to
CREATE POLICY "Users can view own org order history"
ON billing.order_history
FOR SELECT
USING (
  order_id IN (
    SELECT o.id
    FROM billing.orders o
    WHERE o.organization_id IN (
      SELECT organization_id 
      FROM core.organization_users 
      WHERE user_id = auth.uid() 
      AND status = 'active'
    )
  )
);

-- Service role can insert (for triggers and webhooks)
CREATE POLICY "Service role can insert order history"
ON billing.order_history
FOR INSERT
WITH CHECK (true);

-- Authenticated users can insert (for manual logging)
CREATE POLICY "Authenticated users can insert order history"
ON billing.order_history
FOR INSERT
WITH CHECK (
  order_id IN (
    SELECT o.id
    FROM billing.orders o
    WHERE o.organization_id IN (
      SELECT organization_id 
      FROM core.organization_users 
      WHERE user_id = auth.uid() 
      AND status = 'active'
    )
  )
);

-- =====================================================
-- PUBLIC VIEW
-- =====================================================

CREATE OR REPLACE VIEW public.order_history AS 
SELECT 
  oh.id,
  oh.order_id,
  oh.event_type,
  oh.event_description,
  oh.event_metadata,
  oh.user_id,
  oh.from_status,
  oh.to_status,
  oh.created_at
FROM billing.order_history oh;

-- Grant permissions
GRANT SELECT ON public.order_history TO authenticated;
GRANT SELECT ON public.order_history TO anon;

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE billing.order_history IS 'Historial completo de eventos de órdenes para trazabilidad';
COMMENT ON COLUMN billing.order_history.event_type IS 'Tipo de evento ocurrido en la orden';
COMMENT ON COLUMN billing.order_history.event_description IS 'Descripción legible del evento';
COMMENT ON COLUMN billing.order_history.event_metadata IS 'Metadatos adicionales específicos del evento (JSON)';
COMMENT ON COLUMN billing.order_history.user_id IS 'Usuario que realizó la acción (si aplica)';
COMMENT ON COLUMN billing.order_history.from_status IS 'Estado anterior (para cambios de estado)';
COMMENT ON COLUMN billing.order_history.to_status IS 'Estado nuevo (para cambios de estado)';

