-- Migration: Expandir CRM a estilo HubSpot
-- Description: Agrega Companies, Tickets, Products y Quotes para CRM completo
-- Created: 2024-11-12
-- Depends on: 20251112190000_schema-crm-multitenant.sql

SET search_path TO crm, core, public, extensions;

-- =====================================================
-- NUEVOS ENUMS
-- =====================================================

CREATE TYPE crm.company_type AS ENUM (
  'prospect',       -- Prospecto
  'customer',       -- Cliente activo
  'partner',        -- Partner/Aliado
  'vendor',         -- Proveedor
  'competitor',     -- Competidor
  'other'           -- Otro
);

CREATE TYPE crm.ticket_status AS ENUM (
  'new',            -- Nuevo
  'open',           -- Abierto
  'in_progress',    -- En progreso
  'waiting',        -- Esperando respuesta
  'resolved',       -- Resuelto
  'closed'          -- Cerrado
);

CREATE TYPE crm.ticket_priority AS ENUM (
  'low',
  'medium',
  'high',
  'urgent'
);

CREATE TYPE crm.ticket_category AS ENUM (
  'technical',      -- Soporte técnico
  'billing',        -- Facturación
  'sales',          -- Ventas/Comercial
  'general',        -- General
  'feature_request',-- Solicitud de feature
  'bug_report'      -- Reporte de bug
);

CREATE TYPE crm.quote_status AS ENUM (
  'draft',          -- Borrador
  'sent',           -- Enviada
  'viewed',         -- Vista por cliente
  'accepted',       -- Aceptada
  'rejected',       -- Rechazada
  'expired'         -- Expirada
);

-- =====================================================
-- EMPRESAS / COMPANIES
-- =====================================================

CREATE TABLE crm.companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Multi-tenancy
  organization_id UUID NOT NULL REFERENCES core.organizations(id) ON DELETE CASCADE,
  
  -- Información básica
  name TEXT NOT NULL CHECK (length(name) >= 2 AND length(name) <= 200),
  legal_name TEXT CHECK (length(legal_name) <= 200),
  domain TEXT, -- empresa.com
  
  -- Clasificación
  type crm.company_type NOT NULL DEFAULT 'prospect',
  industry TEXT,
  company_size TEXT CHECK (company_size IN ('1-10', '11-50', '51-200', '201-500', '501-1000', '1000+')),
  
  -- Información de contacto corporativo
  website TEXT,
  phone TEXT CHECK (length(phone) <= 20),
  email TEXT CHECK (email ~ '^[^@]+@[^@]+\.[^@]+$'),
  
  -- Dirección corporativa
  address TEXT,
  city TEXT,
  state TEXT,
  country TEXT,
  postal_code TEXT,
  
  -- Información financiera
  annual_revenue DECIMAL(15,2) CHECK (annual_revenue >= 0),
  currency TEXT DEFAULT 'CLP' CHECK (currency ~ '^[A-Z]{3}$'),
  
  -- Relaciones
  parent_company_id UUID REFERENCES crm.companies(id), -- Para subsidiarias
  
  -- Asignación
  assigned_to UUID REFERENCES core.users(id),
  
  -- Social media
  linkedin_url TEXT,
  twitter_handle TEXT,
  
  -- Custom fields
  custom_fields JSONB DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES core.users(id),
  
  -- Constraints
  CONSTRAINT unique_name_per_org UNIQUE (organization_id, name)
);

-- =====================================================
-- TICKETS (Sistema de Soporte)
-- =====================================================

CREATE TABLE crm.tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Multi-tenancy
  organization_id UUID NOT NULL REFERENCES core.organizations(id) ON DELETE CASCADE,
  
  -- Número de ticket (auto-generado)
  ticket_number TEXT NOT NULL,
  
  -- Información básica
  subject TEXT NOT NULL CHECK (length(subject) >= 3 AND length(subject) <= 500),
  description TEXT NOT NULL,
  
  -- Estado y prioridad
  status crm.ticket_status NOT NULL DEFAULT 'new',
  priority crm.ticket_priority NOT NULL DEFAULT 'medium',
  category crm.ticket_category NOT NULL DEFAULT 'general',
  
  -- Relaciones
  contact_id UUID REFERENCES crm.contacts(id) ON DELETE SET NULL,
  company_id UUID REFERENCES crm.companies(id) ON DELETE SET NULL,
  related_deal_id UUID REFERENCES crm.deals(id) ON DELETE SET NULL,
  
  -- Asignación
  assigned_to UUID REFERENCES core.users(id),
  team_id UUID REFERENCES core.teams(id),
  
  -- SLA y tiempos
  due_date TIMESTAMPTZ,
  first_response_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  closed_at TIMESTAMPTZ,
  
  -- Tags y categorización
  tags TEXT[] DEFAULT '{}',
  
  -- Custom fields
  custom_fields JSONB DEFAULT '{}',
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES core.users(id),
  
  -- Constraints
  CONSTRAINT unique_ticket_number_per_org UNIQUE (organization_id, ticket_number),
  CONSTRAINT valid_resolution CHECK (
    (status IN ('resolved', 'closed') AND resolved_at IS NOT NULL) OR
    (status NOT IN ('resolved', 'closed'))
  )
);

-- =====================================================
-- PRODUCTOS (Catálogo)
-- =====================================================

CREATE TABLE crm.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Multi-tenancy
  organization_id UUID NOT NULL REFERENCES core.organizations(id) ON DELETE CASCADE,
  
  -- Información básica
  name TEXT NOT NULL CHECK (length(name) >= 2 AND length(name) <= 200),
  sku TEXT, -- Código del producto
  description TEXT,
  
  -- Categorización
  category TEXT,
  tags TEXT[] DEFAULT '{}',
  
  -- Pricing
  price DECIMAL(12,2) NOT NULL CHECK (price >= 0),
  currency TEXT NOT NULL DEFAULT 'CLP' CHECK (currency ~ '^[A-Z]{3}$'),
  cost DECIMAL(12,2) CHECK (cost >= 0), -- Costo para calcular margen
  
  -- Billing
  billing_type TEXT CHECK (billing_type IN ('one_time', 'recurring', 'usage_based')),
  billing_frequency TEXT CHECK (billing_frequency IN ('monthly', 'yearly', 'quarterly', NULL)),
  
  -- Status
  is_active BOOLEAN NOT NULL DEFAULT true,
  
  -- Inventory (opcional)
  track_inventory BOOLEAN DEFAULT false,
  stock_quantity INTEGER CHECK (stock_quantity >= 0),
  
  -- Imagen
  image_url TEXT,
  
  -- Custom fields
  custom_fields JSONB DEFAULT '{}',
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES core.users(id),
  
  -- Constraints
  CONSTRAINT unique_sku_per_org UNIQUE (organization_id, sku)
);

-- =====================================================
-- COTIZACIONES / QUOTES
-- =====================================================

CREATE TABLE crm.quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Multi-tenancy
  organization_id UUID NOT NULL REFERENCES core.organizations(id) ON DELETE CASCADE,
  
  -- Número de cotización (auto-generado)
  quote_number TEXT NOT NULL,
  
  -- Información básica
  title TEXT NOT NULL CHECK (length(title) >= 3 AND length(title) <= 200),
  description TEXT,
  
  -- Relaciones
  contact_id UUID REFERENCES crm.contacts(id) ON DELETE SET NULL,
  company_id UUID REFERENCES crm.companies(id) ON DELETE SET NULL,
  deal_id UUID REFERENCES crm.deals(id) ON DELETE SET NULL,
  
  -- Status
  status crm.quote_status NOT NULL DEFAULT 'draft',
  
  -- Totales
  subtotal DECIMAL(12,2) NOT NULL DEFAULT 0 CHECK (subtotal >= 0),
  tax_amount DECIMAL(12,2) DEFAULT 0 CHECK (tax_amount >= 0),
  discount_amount DECIMAL(12,2) DEFAULT 0 CHECK (discount_amount >= 0),
  total DECIMAL(12,2) NOT NULL DEFAULT 0 CHECK (total >= 0),
  currency TEXT NOT NULL DEFAULT 'CLP' CHECK (currency ~ '^[A-Z]{3}$'),
  
  -- Términos
  payment_terms TEXT,
  delivery_terms TEXT,
  notes TEXT,
  
  -- Fechas
  valid_until TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  viewed_at TIMESTAMPTZ,
  accepted_at TIMESTAMPTZ,
  rejected_at TIMESTAMPTZ,
  
  -- Asignación
  assigned_to UUID REFERENCES core.users(id),
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES core.users(id),
  
  -- Constraints
  CONSTRAINT unique_quote_number_per_org UNIQUE (organization_id, quote_number),
  CONSTRAINT quote_needs_contact_or_company CHECK (
    contact_id IS NOT NULL OR company_id IS NOT NULL
  )
);

-- =====================================================
-- LÍNEAS DE COTIZACIÓN (Quote Line Items)
-- =====================================================

CREATE TABLE crm.quote_line_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Relación con cotización
  quote_id UUID NOT NULL REFERENCES crm.quotes(id) ON DELETE CASCADE,
  
  -- Producto (opcional, puede ser servicio personalizado)
  product_id UUID REFERENCES crm.products(id) ON DELETE SET NULL,
  
  -- Información del item
  name TEXT NOT NULL CHECK (length(name) >= 2 AND length(name) <= 200),
  description TEXT,
  
  -- Cantidad y precio
  quantity DECIMAL(10,2) NOT NULL DEFAULT 1 CHECK (quantity > 0),
  unit_price DECIMAL(12,2) NOT NULL CHECK (unit_price >= 0),
  discount_percent DECIMAL(5,2) DEFAULT 0 CHECK (discount_percent >= 0 AND discount_percent <= 100),
  
  -- Subtotal calculado
  line_total DECIMAL(12,2) GENERATED ALWAYS AS (
    quantity * unit_price * (1 - discount_percent / 100)
  ) STORED,
  
  -- Orden
  sort_order INTEGER DEFAULT 0,
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- ACTUALIZAR TABLA contacts
-- =====================================================

-- Agregar relación con empresa (solo si no existe)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'crm' 
    AND table_name = 'contacts' 
    AND column_name = 'company_id'
  ) THEN
    ALTER TABLE crm.contacts
    ADD COLUMN company_id UUID REFERENCES crm.companies(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Índice para búsqueda por empresa
CREATE INDEX IF NOT EXISTS idx_contacts_company ON crm.contacts(company_id) WHERE company_id IS NOT NULL;

-- =====================================================
-- ACTUALIZAR TABLA deals
-- =====================================================

-- Permitir deals a nivel de empresa sin contacto específico
DO $$ 
BEGIN
  -- Hacer contact_id nullable si no lo es
  BEGIN
    ALTER TABLE crm.deals ALTER COLUMN contact_id DROP NOT NULL;
  EXCEPTION
    WHEN invalid_table_definition THEN
      RAISE NOTICE 'Column contact_id already nullable';
  END;
  
  -- Agregar company_id si no existe
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'crm' 
    AND table_name = 'deals' 
    AND column_name = 'company_id'
  ) THEN
    ALTER TABLE crm.deals
    ADD COLUMN company_id UUID REFERENCES crm.companies(id) ON DELETE SET NULL;
  END IF;
  
  -- Agregar constraint si no existe
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_schema = 'crm'
    AND table_name = 'deals'
    AND constraint_name = 'deal_needs_contact_or_company'
  ) THEN
    ALTER TABLE crm.deals
    ADD CONSTRAINT deal_needs_contact_or_company CHECK (
      contact_id IS NOT NULL OR company_id IS NOT NULL
    );
  END IF;
END $$;

-- Índice para búsqueda por empresa
CREATE INDEX IF NOT EXISTS idx_deals_company ON crm.deals(company_id) WHERE company_id IS NOT NULL;

-- =====================================================
-- ACTUALIZAR TABLA activities
-- =====================================================

-- Permitir actividades relacionadas con tickets y empresas
DO $$ 
BEGIN
  -- Agregar company_id si no existe
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'crm' 
    AND table_name = 'activities' 
    AND column_name = 'company_id'
  ) THEN
    ALTER TABLE crm.activities
    ADD COLUMN company_id UUID REFERENCES crm.companies(id) ON DELETE SET NULL;
  END IF;
  
  -- Agregar ticket_id si no existe
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'crm' 
    AND table_name = 'activities' 
    AND column_name = 'ticket_id'
  ) THEN
    ALTER TABLE crm.activities
    ADD COLUMN ticket_id UUID REFERENCES crm.tickets(id) ON DELETE SET NULL;
  END IF;
  
  -- Agregar deal_id si no existe
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'crm' 
    AND table_name = 'activities' 
    AND column_name = 'deal_id'
  ) THEN
    ALTER TABLE crm.activities
    ADD COLUMN deal_id UUID REFERENCES crm.deals(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Índices
CREATE INDEX IF NOT EXISTS idx_activities_company ON crm.activities(company_id) WHERE company_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_activities_ticket ON crm.activities(ticket_id) WHERE ticket_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_activities_deal ON crm.activities(deal_id) WHERE deal_id IS NOT NULL;

-- =====================================================
-- PIPELINES PERSONALIZABLES
-- =====================================================

CREATE TABLE crm.pipelines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Multi-tenancy
  organization_id UUID NOT NULL REFERENCES core.organizations(id) ON DELETE CASCADE,
  
  -- Información
  name TEXT NOT NULL CHECK (length(name) >= 2 AND length(name) <= 100),
  type TEXT NOT NULL CHECK (type IN ('deals', 'tickets')),
  
  -- Stages (array de objetos JSON)
  stages JSONB NOT NULL DEFAULT '[]',
  -- Ejemplo: [
  --   {"id": "1", "name": "Prospecting", "probability": 10, "order": 1},
  --   {"id": "2", "name": "Qualification", "probability": 25, "order": 2}
  -- ]
  
  -- Status
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_default BOOLEAN NOT NULL DEFAULT false,
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES core.users(id),
  
  -- Constraints
  CONSTRAINT unique_pipeline_name_per_org UNIQUE (organization_id, type, name)
);

-- =====================================================
-- TRIGGERS para Updated Timestamps (nuevas tablas)
-- =====================================================

CREATE TRIGGER update_companies_updated_at 
  BEFORE UPDATE ON crm.companies 
  FOR EACH ROW EXECUTE FUNCTION crm.update_updated_at();

CREATE TRIGGER update_tickets_updated_at 
  BEFORE UPDATE ON crm.tickets 
  FOR EACH ROW EXECUTE FUNCTION crm.update_updated_at();

CREATE TRIGGER update_products_updated_at 
  BEFORE UPDATE ON crm.products 
  FOR EACH ROW EXECUTE FUNCTION crm.update_updated_at();

CREATE TRIGGER update_quotes_updated_at 
  BEFORE UPDATE ON crm.quotes 
  FOR EACH ROW EXECUTE FUNCTION crm.update_updated_at();

CREATE TRIGGER update_pipelines_updated_at 
  BEFORE UPDATE ON crm.pipelines 
  FOR EACH ROW EXECUTE FUNCTION crm.update_updated_at();

-- =====================================================
-- FUNCIÓN para auto-generar número de ticket
-- =====================================================

CREATE OR REPLACE FUNCTION crm.generate_ticket_number()
RETURNS TRIGGER AS $$
DECLARE
  next_number INTEGER;
  new_ticket_number TEXT;
BEGIN
  -- Obtener el siguiente número para esta organización
  SELECT COALESCE(MAX(CAST(SUBSTRING(ticket_number FROM '[0-9]+$') AS INTEGER)), 0) + 1
  INTO next_number
  FROM crm.tickets
  WHERE organization_id = NEW.organization_id;
  
  -- Generar número con formato TICK-00001
  new_ticket_number := 'TICK-' || LPAD(next_number::TEXT, 5, '0');
  
  NEW.ticket_number := new_ticket_number;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER generate_ticket_number_trigger
  BEFORE INSERT ON crm.tickets
  FOR EACH ROW
  WHEN (NEW.ticket_number IS NULL OR NEW.ticket_number = '')
  EXECUTE FUNCTION crm.generate_ticket_number();

-- =====================================================
-- FUNCIÓN para auto-generar número de cotización
-- =====================================================

CREATE OR REPLACE FUNCTION crm.generate_quote_number()
RETURNS TRIGGER AS $$
DECLARE
  next_number INTEGER;
  new_quote_number TEXT;
BEGIN
  -- Obtener el siguiente número para esta organización
  SELECT COALESCE(MAX(CAST(SUBSTRING(quote_number FROM '[0-9]+$') AS INTEGER)), 0) + 1
  INTO next_number
  FROM crm.quotes
  WHERE organization_id = NEW.organization_id;
  
  -- Generar número con formato QUO-00001
  new_quote_number := 'QUO-' || LPAD(next_number::TEXT, 5, '0');
  
  NEW.quote_number := new_quote_number;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER generate_quote_number_trigger
  BEFORE INSERT ON crm.quotes
  FOR EACH ROW
  WHEN (NEW.quote_number IS NULL OR NEW.quote_number = '')
  EXECUTE FUNCTION crm.generate_quote_number();

-- =====================================================
-- FUNCIÓN para actualizar total de cotización
-- =====================================================

CREATE OR REPLACE FUNCTION crm.update_quote_total()
RETURNS TRIGGER AS $$
BEGIN
  -- Actualizar subtotal sumando todos los line items
  UPDATE crm.quotes
  SET 
    subtotal = (
      SELECT COALESCE(SUM(line_total), 0)
      FROM crm.quote_line_items
      WHERE quote_id = NEW.quote_id
    ),
    total = (
      SELECT COALESCE(SUM(line_total), 0)
      FROM crm.quote_line_items
      WHERE quote_id = NEW.quote_id
    ) + COALESCE((SELECT tax_amount FROM crm.quotes WHERE id = NEW.quote_id), 0)
      - COALESCE((SELECT discount_amount FROM crm.quotes WHERE id = NEW.quote_id), 0)
  WHERE id = NEW.quote_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_quote_total_on_insert
  AFTER INSERT ON crm.quote_line_items
  FOR EACH ROW EXECUTE FUNCTION crm.update_quote_total();

CREATE TRIGGER update_quote_total_on_update
  AFTER UPDATE ON crm.quote_line_items
  FOR EACH ROW EXECUTE FUNCTION crm.update_quote_total();

CREATE TRIGGER update_quote_total_on_delete
  AFTER DELETE ON crm.quote_line_items
  FOR EACH ROW EXECUTE FUNCTION crm.update_quote_total();

-- =====================================================
-- ÍNDICES para Performance
-- =====================================================

-- Companies
CREATE INDEX IF NOT EXISTS idx_companies_org ON crm.companies(organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_companies_type ON crm.companies(organization_id, type);
CREATE INDEX IF NOT EXISTS idx_companies_assigned ON crm.companies(assigned_to) WHERE assigned_to IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_companies_domain ON crm.companies(organization_id, domain) WHERE domain IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_companies_parent ON crm.companies(parent_company_id) WHERE parent_company_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_companies_search ON crm.companies USING gin(to_tsvector('spanish', 
  COALESCE(name, '') || ' ' || 
  COALESCE(legal_name, '') || ' ' ||
  COALESCE(domain, '')
));

-- Tickets
CREATE INDEX IF NOT EXISTS idx_tickets_org ON crm.tickets(organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON crm.tickets(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_tickets_priority ON crm.tickets(organization_id, priority);
CREATE INDEX IF NOT EXISTS idx_tickets_contact ON crm.tickets(contact_id) WHERE contact_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tickets_company ON crm.tickets(company_id) WHERE company_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tickets_assigned ON crm.tickets(assigned_to) WHERE assigned_to IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tickets_number ON crm.tickets(organization_id, ticket_number);
CREATE INDEX IF NOT EXISTS idx_tickets_due ON crm.tickets(organization_id, due_date) WHERE due_date IS NOT NULL;

-- Products
CREATE INDEX IF NOT EXISTS idx_products_org ON crm.products(organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_products_sku ON crm.products(organization_id, sku);
CREATE INDEX IF NOT EXISTS idx_products_category ON crm.products(organization_id, category);
CREATE INDEX IF NOT EXISTS idx_products_active ON crm.products(organization_id, is_active) WHERE is_active = true;

-- Quotes
CREATE INDEX IF NOT EXISTS idx_quotes_org ON crm.quotes(organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_quotes_status ON crm.quotes(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_quotes_contact ON crm.quotes(contact_id) WHERE contact_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_quotes_company ON crm.quotes(company_id) WHERE company_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_quotes_deal ON crm.quotes(deal_id) WHERE deal_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_quotes_number ON crm.quotes(organization_id, quote_number);

-- Quote line items
CREATE INDEX IF NOT EXISTS idx_quote_items_quote ON crm.quote_line_items(quote_id);
CREATE INDEX IF NOT EXISTS idx_quote_items_product ON crm.quote_line_items(product_id) WHERE product_id IS NOT NULL;

-- Pipelines
CREATE INDEX IF NOT EXISTS idx_pipelines_org ON crm.pipelines(organization_id, type);
CREATE INDEX IF NOT EXISTS idx_pipelines_default ON crm.pipelines(organization_id, type, is_default) WHERE is_default = true;

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================

-- Habilitar RLS
ALTER TABLE crm.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm.tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm.quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm.quote_line_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm.pipelines ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- POLÍTICAS RLS: companies
-- =====================================================

CREATE POLICY "Users can view own org companies"
ON crm.companies FOR SELECT
USING (
  organization_id IN (
    SELECT organization_id FROM core.organization_users 
    WHERE user_id = auth.uid() AND status = 'active'
  )
);

CREATE POLICY "Users can create companies in own org"
ON crm.companies FOR INSERT
WITH CHECK (
  organization_id IN (
    SELECT organization_id FROM core.organization_users 
    WHERE user_id = auth.uid() AND status = 'active'
  )
);

CREATE POLICY "Users can update own org companies"
ON crm.companies FOR UPDATE
USING (
  organization_id IN (
    SELECT organization_id FROM core.organization_users 
    WHERE user_id = auth.uid() AND status = 'active'
  )
);

CREATE POLICY "Org admins can delete companies"
ON crm.companies FOR DELETE
USING (
  organization_id IN (
    SELECT ou.organization_id FROM core.organization_users ou
    JOIN core.roles r ON r.id = ou.role_id
    WHERE ou.user_id = auth.uid() AND r.level >= 7
  )
);

-- =====================================================
-- POLÍTICAS RLS: tickets
-- =====================================================

CREATE POLICY "Users can view own org tickets"
ON crm.tickets FOR SELECT
USING (
  organization_id IN (
    SELECT organization_id FROM core.organization_users 
    WHERE user_id = auth.uid() AND status = 'active'
  )
);

CREATE POLICY "Users can create tickets in own org"
ON crm.tickets FOR INSERT
WITH CHECK (
  organization_id IN (
    SELECT organization_id FROM core.organization_users 
    WHERE user_id = auth.uid() AND status = 'active'
  )
);

CREATE POLICY "Users can update own org tickets"
ON crm.tickets FOR UPDATE
USING (
  organization_id IN (
    SELECT organization_id FROM core.organization_users 
    WHERE user_id = auth.uid() AND status = 'active'
  )
);

CREATE POLICY "Org admins can delete tickets"
ON crm.tickets FOR DELETE
USING (
  organization_id IN (
    SELECT ou.organization_id FROM core.organization_users ou
    JOIN core.roles r ON r.id = ou.role_id
    WHERE ou.user_id = auth.uid() AND r.level >= 7
  )
);

-- =====================================================
-- POLÍTICAS RLS: products
-- =====================================================

CREATE POLICY "Users can view own org products"
ON crm.products FOR SELECT
USING (
  organization_id IN (
    SELECT organization_id FROM core.organization_users 
    WHERE user_id = auth.uid() AND status = 'active'
  )
);

CREATE POLICY "Users can create products in own org"
ON crm.products FOR INSERT
WITH CHECK (
  organization_id IN (
    SELECT organization_id FROM core.organization_users 
    WHERE user_id = auth.uid() AND status = 'active'
  )
);

CREATE POLICY "Users can update own org products"
ON crm.products FOR UPDATE
USING (
  organization_id IN (
    SELECT organization_id FROM core.organization_users 
    WHERE user_id = auth.uid() AND status = 'active'
  )
);

CREATE POLICY "Org admins can delete products"
ON crm.products FOR DELETE
USING (
  organization_id IN (
    SELECT ou.organization_id FROM core.organization_users ou
    JOIN core.roles r ON r.id = ou.role_id
    WHERE ou.user_id = auth.uid() AND r.level >= 7
  )
);

-- =====================================================
-- POLÍTICAS RLS: quotes
-- =====================================================

CREATE POLICY "Users can view own org quotes"
ON crm.quotes FOR SELECT
USING (
  organization_id IN (
    SELECT organization_id FROM core.organization_users 
    WHERE user_id = auth.uid() AND status = 'active'
  )
);

CREATE POLICY "Users can create quotes in own org"
ON crm.quotes FOR INSERT
WITH CHECK (
  organization_id IN (
    SELECT organization_id FROM core.organization_users 
    WHERE user_id = auth.uid() AND status = 'active'
  )
);

CREATE POLICY "Users can update own org quotes"
ON crm.quotes FOR UPDATE
USING (
  organization_id IN (
    SELECT organization_id FROM core.organization_users 
    WHERE user_id = auth.uid() AND status = 'active'
  )
);

CREATE POLICY "Org admins can delete quotes"
ON crm.quotes FOR DELETE
USING (
  organization_id IN (
    SELECT ou.organization_id FROM core.organization_users ou
    JOIN core.roles r ON r.id = ou.role_id
    WHERE ou.user_id = auth.uid() AND r.level >= 7
  )
);

-- =====================================================
-- POLÍTICAS RLS: quote_line_items
-- =====================================================

CREATE POLICY "Users can view own org quote items"
ON crm.quote_line_items FOR SELECT
USING (
  quote_id IN (
    SELECT id FROM crm.quotes
    WHERE organization_id IN (
      SELECT organization_id FROM core.organization_users 
      WHERE user_id = auth.uid() AND status = 'active'
    )
  )
);

CREATE POLICY "Users can manage own org quote items"
ON crm.quote_line_items FOR ALL
USING (
  quote_id IN (
    SELECT id FROM crm.quotes
    WHERE organization_id IN (
      SELECT organization_id FROM core.organization_users 
      WHERE user_id = auth.uid() AND status = 'active'
    )
  )
);

-- =====================================================
-- POLÍTICAS RLS: pipelines
-- =====================================================

CREATE POLICY "Users can view own org pipelines"
ON crm.pipelines FOR SELECT
USING (
  organization_id IN (
    SELECT organization_id FROM core.organization_users 
    WHERE user_id = auth.uid() AND status = 'active'
  )
);

CREATE POLICY "Org admins can manage pipelines"
ON crm.pipelines FOR ALL
USING (
  organization_id IN (
    SELECT ou.organization_id FROM core.organization_users ou
    JOIN core.roles r ON r.id = ou.role_id
    WHERE ou.user_id = auth.uid() AND r.level >= 7
  )
);

-- =====================================================
-- FUNCIONES ADICIONALES
-- =====================================================

-- Obtener todos los contactos de una empresa
CREATE OR REPLACE FUNCTION crm.get_company_contacts(company_uuid uuid)
RETURNS SETOF crm.contacts AS $$
BEGIN
  RETURN QUERY
  SELECT * FROM crm.contacts
  WHERE company_id = company_uuid
  ORDER BY created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION crm.get_company_contacts(uuid) TO authenticated;

-- Obtener estadísticas de una empresa
CREATE OR REPLACE FUNCTION crm.get_company_stats(company_uuid uuid)
RETURNS JSON AS $$
DECLARE
  contact_count INTEGER;
  active_deals INTEGER;
  open_tickets INTEGER;
  total_revenue DECIMAL;
BEGIN
  SELECT COUNT(*) INTO contact_count
  FROM crm.contacts WHERE company_id = company_uuid;
  
  SELECT COUNT(*) INTO active_deals
  FROM crm.deals 
  WHERE company_id = company_uuid 
  AND stage NOT IN ('closed_won', 'closed_lost');
  
  SELECT COUNT(*) INTO open_tickets
  FROM crm.tickets 
  WHERE company_id = company_uuid 
  AND status NOT IN ('resolved', 'closed');
  
  SELECT COALESCE(SUM(value), 0) INTO total_revenue
  FROM crm.deals 
  WHERE company_id = company_uuid 
  AND stage = 'closed_won';
  
  RETURN json_build_object(
    'contact_count', contact_count,
    'active_deals', active_deals,
    'open_tickets', open_tickets,
    'total_revenue', total_revenue
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION crm.get_company_stats(uuid) TO authenticated;

-- Actualizar función get_stats para incluir nuevas métricas
CREATE OR REPLACE FUNCTION crm.get_stats(org_id uuid)
RETURNS JSON AS $$
DECLARE
  total_contacts INTEGER;
  total_companies INTEGER;
  new_contacts INTEGER;
  active_deals INTEGER;
  open_tickets INTEGER;
  deals_value DECIMAL;
  unread_emails INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_contacts FROM crm.contacts WHERE organization_id = org_id;
  SELECT COUNT(*) INTO total_companies FROM crm.companies WHERE organization_id = org_id;
  SELECT COUNT(*) INTO new_contacts FROM crm.contacts WHERE organization_id = org_id AND created_at > NOW() - INTERVAL '7 days';
  SELECT COUNT(*) INTO active_deals FROM crm.deals WHERE organization_id = org_id AND stage NOT IN ('closed_won', 'closed_lost');
  SELECT COUNT(*) INTO open_tickets FROM crm.tickets WHERE organization_id = org_id AND status NOT IN ('resolved', 'closed');
  SELECT COALESCE(SUM(value), 0) INTO deals_value FROM crm.deals WHERE organization_id = org_id AND stage NOT IN ('closed_won', 'closed_lost');
  SELECT COUNT(*) INTO unread_emails FROM crm.emails WHERE organization_id = org_id AND direction = 'inbound' AND replied_at IS NULL AND created_at > NOW() - INTERVAL '30 days';
  
  RETURN json_build_object(
    'total_contacts', total_contacts,
    'total_companies', total_companies,
    'new_contacts', new_contacts,
    'active_deals', active_deals,
    'open_tickets', open_tickets,
    'deals_value', deals_value,
    'unread_emails', unread_emails
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- PIPELINES PREDETERMINADOS
-- =====================================================

-- Pipeline de Deals predeterminado
INSERT INTO crm.pipelines (organization_id, name, type, stages, is_default)
SELECT 
  id,
  'Pipeline de Ventas',
  'deals',
  jsonb_build_array(
    jsonb_build_object('id', '1', 'name', 'Prospección', 'probability', 10, 'order', 1, 'color', '#94a3b8'),
    jsonb_build_object('id', '2', 'name', 'Calificación', 'probability', 25, 'order', 2, 'color', '#60a5fa'),
    jsonb_build_object('id', '3', 'name', 'Propuesta', 'probability', 50, 'order', 3, 'color', '#fbbf24'),
    jsonb_build_object('id', '4', 'name', 'Negociación', 'probability', 75, 'order', 4, 'color', '#fb923c'),
    jsonb_build_object('id', '5', 'name', 'Ganado', 'probability', 100, 'order', 5, 'color', '#22c55e'),
    jsonb_build_object('id', '6', 'name', 'Perdido', 'probability', 0, 'order', 6, 'color', '#ef4444')
  ),
  true
FROM core.organizations
WHERE org_type = 'platform'
ON CONFLICT (organization_id, type, name) DO NOTHING;

-- Pipeline de Tickets predeterminado
INSERT INTO crm.pipelines (organization_id, name, type, stages, is_default)
SELECT 
  id,
  'Soporte al Cliente',
  'tickets',
  jsonb_build_array(
    jsonb_build_object('id', '1', 'name', 'Nuevo', 'order', 1, 'color', '#3b82f6'),
    jsonb_build_object('id', '2', 'name', 'En Progreso', 'order', 2, 'color', '#f59e0b'),
    jsonb_build_object('id', '3', 'name', 'Esperando Cliente', 'order', 3, 'color', '#8b5cf6'),
    jsonb_build_object('id', '4', 'name', 'Resuelto', 'order', 4, 'color', '#10b981'),
    jsonb_build_object('id', '5', 'name', 'Cerrado', 'order', 5, 'color', '#6b7280')
  ),
  true
FROM core.organizations
WHERE org_type = 'platform'
ON CONFLICT (organization_id, type, name) DO NOTHING;

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================

GRANT ALL ON ALL TABLES IN SCHEMA crm TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA crm TO anon;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA crm TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA crm TO authenticated;

-- =====================================================
-- COMENTARIOS
-- =====================================================

COMMENT ON TABLE crm.companies IS 'Empresas/Organizaciones en el CRM. Agrupan contactos y deals. Similar a Companies de HubSpot.';
COMMENT ON TABLE crm.tickets IS 'Sistema de tickets de soporte estilo HubSpot. Con SLA, prioridades y asignación.';
COMMENT ON TABLE crm.products IS 'Catálogo de productos/servicios para usar en cotizaciones y deals.';
COMMENT ON TABLE crm.quotes IS 'Cotizaciones enviadas a clientes con line items y totales calculados.';
COMMENT ON TABLE crm.quote_line_items IS 'Items individuales de una cotización (productos/servicios).';
COMMENT ON TABLE crm.pipelines IS 'Pipelines personalizables para deals y tickets. Cada org puede tener múltiples pipelines.';

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

DO $$ 
BEGIN 
  RAISE NOTICE '🎉 ================================================';
  RAISE NOTICE '✅ CRM Expandido - Estilo HubSpot Completo';
  RAISE NOTICE '🎉 ================================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Nuevas tablas creadas:';
  RAISE NOTICE '  ✅ crm.companies - Empresas/Organizaciones';
  RAISE NOTICE '  ✅ crm.tickets - Sistema de soporte';
  RAISE NOTICE '  ✅ crm.products - Catálogo de productos';
  RAISE NOTICE '  ✅ crm.quotes + quote_line_items - Cotizaciones';
  RAISE NOTICE '  ✅ crm.pipelines - Pipelines personalizables';
  RAISE NOTICE '';
  RAISE NOTICE 'Relaciones actualizadas:';
  RAISE NOTICE '  ✅ contacts.company_id - Contacto pertenece a empresa';
  RAISE NOTICE '  ✅ deals.company_id - Deal a nivel de empresa';
  RAISE NOTICE '  ✅ activities - Ahora relaciona con companies, tickets, deals';
  RAISE NOTICE '';
  RAISE NOTICE 'Nuevos ENUMs:';
  RAISE NOTICE '  - crm.company_type (prospect, customer, partner, etc.)';
  RAISE NOTICE '  - crm.ticket_status (new, open, in_progress, resolved, closed)';
  RAISE NOTICE '  - crm.ticket_priority (low, medium, high, urgent)';
  RAISE NOTICE '  - crm.quote_status (draft, sent, accepted, rejected)';
  RAISE NOTICE '';
  RAISE NOTICE 'Funciones automáticas:';
  RAISE NOTICE '  ✅ Auto-generación de ticket numbers (TICK-00001)';
  RAISE NOTICE '  ✅ Auto-generación de quote numbers (QUO-00001)';
  RAISE NOTICE '  ✅ Auto-cálculo de totales en quotes';
  RAISE NOTICE '  ✅ get_company_stats() - Estadísticas por empresa';
  RAISE NOTICE '  ✅ get_stats() actualizado con companies y tickets';
  RAISE NOTICE '';
  RAISE NOTICE 'Pipelines predeterminados creados:';
  RAISE NOTICE '  ✅ Pipeline de Ventas (6 stages)';
  RAISE NOTICE '  ✅ Pipeline de Tickets (5 stages)';
  RAISE NOTICE '';
  RAISE NOTICE '🎯 CRM ahora tiene 10 tablas principales:';
  RAISE NOTICE '   contacts, companies, deals, tickets, activities,';
  RAISE NOTICE '   emails, products, quotes, pipelines, settings';
  RAISE NOTICE '';
  RAISE NOTICE '✨ Estructura completa estilo HubSpot lista!';
  RAISE NOTICE '';
END $$;

