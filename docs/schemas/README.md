# Documentación de Schemas - TuPatrimonio

## 📋 Overview

Esta carpeta contiene la documentación detallada de cada schema de la base de datos. TuPatrimonio sigue una arquitectura de **schemas separados por aplicación/servicio** para mejor organización y escalabilidad.

## 🏗️ Arquitectura General

Para entender la filosofía completa de schemas, consulta:
- 📄 **[ARCHITECTURE-SCHEMAS.md](./ARCHITECTURE-SCHEMAS.md)** - Visión completa de la arquitectura

## 📦 Schemas Implementados

### 1. Schema `core` (Foundation)

**Estado**: ✅ Completado (Fase 0)

**Propósito**: Base multi-tenant del sistema con organizaciones, usuarios, roles y suscripciones.

**Migración**: `supabase/migrations/20251021120854_schema-core.sql`

**Tablas principales**:
- `organizations` - Organizaciones (B2C + B2B + Platform)
- `users` - Extensión de auth.users con perfil
- `roles` - Sistema de roles jerárquico
- `organization_users` - Usuarios en organizaciones (M:N)
- `teams` y `team_members` - Equipos internos
- `applications` - Catálogo de servicios
- `organization_applications` - Apps habilitadas por org
- `subscription_plans` y `organization_subscriptions`
- `invitations`, `api_keys`, `system_events`

**Ver más**: Pendiente crear `core.md` con detalles completos

---

### 2. Schema `marketing` (Marketing Site)

**Estado**: ✅ Completado (Fase 0)

**Propósito**: Contenido del marketing site, blog, KB, y lead capture.

**Migración**: `supabase/migrations/20251021194734_schema-marketing.sql` + actualizaciones

**Tablas principales**:
- `blog_posts` y `blog_categories` - Sistema de blog
- `kb_articles` y `kb_categories` - Base de conocimiento
- `waitlist_subscribers` - Lista de espera
- `contact_messages` - Formularios de contacto
- `faqs`, `testimonials`, `case_studies`
- `newsletter_subscribers`
- `google_reviews` y `review_stats`

**Ver más**: Pendiente crear `marketing.md` con detalles completos

---

### 3. Schema `crm` (CRM Multi-Tenant B2B) ⭐ COMPLETO - Estilo HubSpot

**Estado**: ✅ Schema completo (10 tablas), UI pendiente

**Propósito**: Sistema CRM completo como servicio B2B vendible. Diseñado estilo HubSpot con todas las entidades principales interconectadas.

**Migraciones**: 
- `20251112190000_schema-crm-multitenant.sql` (Base)
- `20251112202031_crm-base.sql` (Expansión HubSpot)

**Tablas principales** (10):
- `contacts` - Contactos/Personas individuales
- `companies` - Empresas/Organizaciones ⭐ NUEVO
- `deals` - Oportunidades de venta
- `tickets` - Sistema de soporte ⭐ NUEVO
- `products` - Catálogo de productos/servicios ⭐ NUEVO
- `quotes` + `quote_line_items` - Cotizaciones ⭐ NUEVO
- `activities` - Timeline universal (expandido)
- `emails` - Integración Gmail
- `pipelines` - Stages personalizables ⭐ NUEVO
- `settings` - Configuración por org
- `notes` - Notas internas

**Relaciones clave**:
- Contacto → Empresa (N:1)
- Empresa → Contactos, Deals, Tickets (1:N)
- Deal → Contacto/Empresa (N:1)
- Ticket → Contacto/Empresa (N:1)
- Quote → Contacto/Empresa/Deal (N:1)
- Activity → Todo (N:1 universal)

**Características**:
- Multi-tenant estricto (RLS por organization_id)
- Roles específicos: crm_manager, sales_rep
- Vendible como servicio B2B
- Integración Gmail por organización
- Límites por plan de suscripción
- Auto-numeración (tickets, quotes)
- Cálculos automáticos (totales de quotes)
- Pipelines personalizables

**Ver más**: 
- 📄 **[crm.md](./crm.md)** - Implementación técnica
- 📄 **[crm-hubspot-style.md](./crm-hubspot-style.md)** - Arquitectura completa estilo HubSpot

---

## 📋 Schemas Futuros (Roadmap)

### 4. `signatures` (Fase 7)
Servicio de firma electrónica multi-tenant

### 5. `verifications` (Fase 8)
Verificación de identidad (KYC) multi-tenant

### 6. `ai_customer_service` (Fase 9)
Chatbot IA con RAG (requiere pgvector)

### 7. `ai_document_review` (Fase 10)
Análisis de documentos con IA

### 8. `analytics` (Fase 11)
Métricas y reportes del sistema

---

## 🎯 Patrón Multi-Tenant Estándar

Todos los schemas de servicios (excepto `marketing`) siguen este patrón:

```sql
CREATE TABLE <schema>.<tabla> (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES core.organizations(id) ON DELETE CASCADE,
  -- ... campos específicos ...
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS estándar
CREATE POLICY "Users can view own org data"
ON <schema>.<tabla>
FOR SELECT
USING (
  organization_id IN (
    SELECT organization_id 
    FROM core.organization_users 
    WHERE user_id = auth.uid() 
    AND status = 'active'
  )
);
```

---

## 📝 Cómo Crear un Nuevo Schema

1. **Planificar**: Definir propósito y tablas necesarias
2. **Migración**: Crear en `supabase/migrations/YYYYMMDD_schema-<nombre>.sql`
3. **Seguir patrón**:
   - Crear schema: `CREATE SCHEMA IF NOT EXISTS <nombre>;`
   - ENUMs con prefijo: `<schema>.<nombre>`
   - Tablas con `organization_id` (multi-tenant)
   - RLS policies estándar
   - Índices optimizados
   - Triggers para updated_at
   - GRANT permissions
   - Comentarios descriptivos
4. **Roles**: Crear roles específicos en `core.roles` si es necesario
5. **Aplicación**: Registrar en `core.applications` si es vendible
6. **Documentar**: Crear `<schema>.md` en esta carpeta

---

## 🔗 Referencias

- [Arquitectura General](./ARCHITECTURE-SCHEMAS.md)
- [Guía de Desarrollo](../DEVELOPMENT.md)
- [Arquitectura del Proyecto](../ARCHITECTURE.md)

---

**Última actualización**: 12 de Noviembre 2024

