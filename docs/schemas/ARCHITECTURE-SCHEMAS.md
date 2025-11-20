# Arquitectura de Schemas - TuPatrimonio

## 🏗️ Filosofía de Diseño

Cada aplicación/servicio del ecosistema TuPatrimonio tiene **su propio schema** en PostgreSQL para:

- ✅ **Separación de concerns**: Cada servicio es independiente
- ✅ **Escalabilidad**: Servicios pueden crecer sin afectar otros
- ✅ **Permisos granulares**: Control de acceso a nivel de schema
- ✅ **Backups selectivos**: Posibilidad de hacer backup por servicio
- ✅ **Claridad**: Organización lógica del código y datos
- ✅ **Monetización**: Cada schema puede ser un servicio vendible

---

## 📦 Schemas Actuales

### 1. Schema `core`

**Propósito**: Foundation del sistema multi-tenant

**Responsabilidad**: Gestión de organizaciones, usuarios, autenticación, roles, suscripciones y aplicaciones

**Tablas principales**:
```
core.organizations          # Organizaciones (B2C + B2B + Platform)
core.users                  # Usuarios (extensión de auth.users)
core.roles                  # Sistema de roles jerárquico
core.organization_users     # Usuarios en organizaciones (M:N)
core.teams                  # Equipos dentro de organizaciones
core.team_members           # Miembros de equipos
core.applications           # Catálogo de aplicaciones del ecosistema
core.organization_applications  # Apps habilitadas por org
core.subscription_plans     # Planes de suscripción
core.organization_subscriptions # Suscripciones activas
core.invitations            # Sistema de invitaciones
core.api_keys               # API keys para integraciones
core.system_events          # Audit log
```

**Características**:
- Multi-tenancy nativo con `organization_id`
- Sistema de roles con permisos JSONB flexibles
- Modelo híbrido B2C (org personal) + B2B (org empresarial) + Platform (TuPatrimonio)

**Usado por**: Todas las aplicaciones (es el core del sistema)

---

### 2. Schema `marketing`

**Propósito**: Marketing site y generación de leads

**Responsabilidad**: Blog, base de conocimiento, formularios, reviews, contenido público

**Tablas principales**:
```
marketing.blog_posts        # Posts del blog
marketing.blog_categories   # Categorías del blog
marketing.kb_articles       # Artículos de base de conocimiento
marketing.kb_categories     # Categorías de KB
marketing.waitlist_subscribers  # Lista de espera
marketing.contact_messages  # Mensajes de formularios
marketing.faqs              # Preguntas frecuentes
marketing.testimonials      # Testimonios de clientes
marketing.newsletter_subscribers  # Newsletter
marketing.case_studies      # Casos de éxito
marketing.google_reviews    # Reviews de Google Business
marketing.review_stats      # Estadísticas de reviews
```

**Características**:
- Contenido público con RLS para lectura anónima
- Solo platform admins pueden modificar contenido
- Sistema de lead capture integrado

**Usado por**: `apps/marketing` (tupatrimonio.app)

---

### 3. Schema `crm` ⭐ NUEVO

**Propósito**: Sistema CRM multi-tenant como servicio B2B vendible

**Responsabilidad**: Gestión de contactos, deals, comunicaciones, pipeline de ventas

**Tablas principales** (16+):
```
# Core Entities
crm.contacts                # Contactos por organización
crm.companies               # Empresas/Organizaciones
crm.deals                   # Oportunidades de venta
crm.tickets                 # Sistema de soporte con SLA
crm.products                # Catálogo de productos/servicios
crm.quotes                  # Cotizaciones
crm.quote_line_items        # Líneas de detalle de cotizaciones

# Sistema Universal Configurable
crm.entity_properties       # Propiedades personalizables por entidad
crm.pipeline_stages         # Stages de pipelines configurables
crm.pipeline_permissions    # Permisos granulares por pipeline

# Email Multi-Cuenta
crm.email_accounts          # Cuentas IMAP/SMTP por org
crm.email_threads           # Hilos de conversación
crm.email_folders           # Carpetas del sistema
crm.email_labels            # Etiquetas personalizadas

# Soporte y Comunicación
crm.activities              # Timeline universal de interacciones
crm.emails                  # Mensajes individuales de email
crm.notes                   # Notas internas
crm.ticket_contacts         # Relación M:N tickets-contactos

# Configuración
crm.pipelines               # Definición de pipelines personalizados
crm.settings                # Configuración OAuth y general por org
```

**ENUMs**:
```
crm.contact_status          # lead, qualified, customer, inactive, lost
crm.activity_type           # email, call, meeting, note, task, whatsapp, system
crm.deal_stage              # prospecting, qualification, proposal, negotiation, closed_won, closed_lost
crm.email_status            # draft, sent, delivered, opened, clicked, replied, bounced, failed
```

**Características**:
- **Multi-tenant estricto**: Aislamiento total por `organization_id`
- **RLS robusto**: Cada org solo ve sus datos
- **Roles específicos**: `crm_manager`, `sales_rep`
- **Vendible**: Registrado en `core.applications` como servicio de pago
- **Email multi-cuenta**: IMAP/SMTP por organización con folders y labels
- **Email-to-Ticket**: Conversión automática de emails a tickets
- **Sistema Universal**: Propiedades personalizables y pipelines configurables
- **Permisos granulares**: Control por pipeline, stage y rol
- **Auto-numeración**: Tickets (TICK-00001) y Quotes (QUO-00001)

**Usado por**: 
- TuPatrimonio Platform (uso interno)
- Clientes B2B (servicio vendido)

---

## 📦 Schemas Futuros (Roadmap)

### 4. Schema `signatures` (Fase 7)

**Propósito**: Servicio de firma electrónica

**Tablas estimadas**:
```
signatures.documents
signatures.signers
signatures.workflows
signatures.templates
signatures.certificates
```

---

### 5. Schema `verifications` (Fase 8)

**Propósito**: Verificación de identidad (KYC)

**Tablas estimadas**:
```
verifications.requests
verifications.results
verifications.documents
verifications.identity_records
```

---

### 6. Schema `ai_customer_service` (Fase 9)

**Propósito**: Chatbot IA con RAG

**Tablas estimadas**:
```
ai_customer_service.chatbot_configurations
ai_customer_service.knowledge_bases
ai_customer_service.knowledge_base_chunks  (con VECTOR)
ai_customer_service.conversations
ai_customer_service.messages
ai_customer_service.feedback
```

**Requiere**: pgvector extension (ya habilitada)

---

### 7. Schema `ai_document_review` (Fase 10)

**Propósito**: Análisis de documentos con IA

**Tablas estimadas**:
```
ai_document_review.templates
ai_document_review.reviews
ai_document_review.results
ai_document_review.annotations
ai_document_review.comparisons
```

---

### 8. Schema `analytics` (Fase 11)

**Propósito**: Métricas y reportes

**Tablas estimadas**:
```
analytics.usage_metrics
analytics.ai_usage_metrics
analytics.revenue_metrics
analytics.report_templates
```

---

## 🔐 Relaciones Entre Schemas

### Dependencias Permitidas

```
┌──────────┐
│   core   │ ← Base (no depende de nadie)
└────┬─────┘
     │
     ├─→ marketing         (puede leer core.users para autores)
     ├─→ crm               (usa core.organizations, core.users)
     ├─→ signatures        (usa core.organizations, core.users)
     ├─→ verifications     (usa core.organizations, core.users)
     ├─→ ai_*              (usa core.organizations, core.users)
     └─→ analytics         (lee de todos los schemas)
```

### Reglas de Diseño

1. **`core` no debe referenciar otros schemas** (es la base)
2. **Todos los schemas referencian `core`** (para multi-tenancy)
3. **Schemas de aplicaciones NO se referencian entre sí** (desacoplados)
4. **`analytics` puede leer de todos** (es el único caso especial)

---

## 🎯 Patrón Multi-Tenant Estándar

Todas las tablas de aplicaciones (excepto `core` y `marketing`) siguen este patrón:

```sql
CREATE TABLE <schema>.<tabla> (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Multi-tenancy (OBLIGATORIO)
  organization_id UUID NOT NULL REFERENCES core.organizations(id) ON DELETE CASCADE,
  
  -- ... otros campos ...
  
  -- Metadata estándar
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES core.users(id)
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

## 📊 Estado Actual de Schemas

| Schema | Estado | Tablas | Propósito | Multi-Tenant |
|--------|--------|--------|-----------|--------------|
| `core` | ✅ Completo | 13 | Foundation del sistema | Nativo |
| `marketing` | ✅ Completo | 11 | Marketing site y leads | No (público) |
| `crm` | ✅ Schema completo | 16+ | CRM B2B vendible estilo HubSpot | ✅ Sí |
| `signatures` | 📋 Pendiente | - | Firma electrónica | ✅ Sí |
| `verifications` | 📋 Pendiente | - | KYC/Identidad | ✅ Sí |
| `ai_customer_service` | 📋 Pendiente | - | Chatbot IA | ✅ Sí |
| `ai_document_review` | 📋 Pendiente | - | Análisis documentos | ✅ Sí |
| `analytics` | 📋 Pendiente | - | Métricas y reportes | ✅ Sí |

---

## 🚀 Ventajas de esta Arquitectura

### Para Desarrollo

1. **Claridad**: Sabes exactamente dónde vive cada funcionalidad
2. **Testing**: Puedes testear servicios de forma aislada
3. **Migraciones**: Organizadas por servicio, fáciles de seguir
4. **Code organization**: Carpetas de código mapean a schemas

### Para Operaciones

1. **Backups selectivos**: Backup solo el CRM si es crítico
2. **Escalamiento independiente**: Mover schema a otra DB si crece mucho
3. **Monitoreo**: Métricas por servicio
4. **Debugging**: Logs y queries más claros

### Para Negocio

1. **Monetización modular**: Cada schema = servicio vendible
2. **Pricing flexible**: Cobra por servicio habilitado
3. **Upselling**: Fácil agregar nuevos servicios a clientes
4. **Analytics**: Métricas de uso por servicio

---

## 📝 Convenciones de Naming

### Schemas
```
<nombre_servicio>          # singular, snake_case
Ejemplos: core, marketing, crm, signatures
```

### Tablas
```
<nombre_plural>            # plural, snake_case
Ejemplos: contacts, activities, blog_posts
```

### ENUMs
```
<contexto>_<nombre>        # schema_context, snake_case
Ejemplos: crm.contact_status, marketing.subscriber_status
```

### Funciones
```
<verbo>_<objeto>           # snake_case, descriptivo
Ejemplos: get_stats, import_leads, can_access_crm
```

---

## 🔮 Evolución Futura

A medida que el producto crece:

1. **Nuevos servicios = Nuevos schemas**
2. **Microservicios**: Un schema puede convertirse en servicio separado
3. **Multi-DB**: Schemas pesados pueden moverse a DBs dedicadas
4. **Replicación**: Schemas críticos con réplicas

---

**Última actualización**: 20 de Noviembre 2024  
**Schemas implementados**: 3 de 8 planificados  
**Tablas totales**: 40+ (13 core + 11 marketing + 16+ crm)

