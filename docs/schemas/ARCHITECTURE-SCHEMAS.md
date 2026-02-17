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

### 4. Schema `notarial_services` ⭐ NUEVO

**Propósito**: Servicios notariales multi-tenant (copia legalizada, protocolización, firma autorizada)

**Responsabilidad**: Gestión de servicios notariales, notarios, solicitudes, documentos y seguimiento de procesos

**Tablas principales**:
```
# Core Entities
notarial_services.notaries              # Notarios registrados en el sistema
notarial_services.notary_offices        # Notarías asociadas
notarial_services.service_requests      # Solicitudes de servicios notariales
notarial_services.service_documents     # Documentos asociados a solicitudes

# Tipos de Servicios
notarial_services.legalized_copies      # Copias legalizadas
notarial_services.protocolizations      # Protocolizaciones
notarial_services.authorized_signatures # Firmas autorizadas por notario

# Gestión de Proceso
notarial_services.request_status_history  # Historial de estados
notarial_services.notary_assignments       # Asignación de notarios a solicitudes
notarial_services.service_timeline         # Timeline de eventos del servicio

# Configuración
notarial_services.service_types         # Tipos de servicios configurables
notarial_services.service_pricing       # Precios por tipo de servicio y región
notarial_services.notary_availability   # Disponibilidad de notarios
notarial_services.service_settings      # Configuración por organización
```

**ENUMs**:
```
notarial_services.service_type          # legalized_copy, protocolization, authorized_signature
notarial_services.request_status        # pending, assigned, in_progress, completed, cancelled, rejected
notarial_services.document_type         # original, copy, certificate, authorization
notarial_services.priority_level        # low, normal, high, urgent
```

**Características**:
- **Multi-tenant estricto**: Aislamiento total por `organization_id`
- **RLS robusto**: Cada org solo ve sus solicitudes y datos
- **Roles específicos**: `notary`, `notary_admin`, `service_coordinator`
- **Vendible**: Registrado en `core.applications` como servicio de pago
- **Gestión de notarios**: Registro y disponibilidad de notarios por región
- **Seguimiento completo**: Timeline y estados de cada solicitud
- **Auto-numeración**: Solicitudes (NS-00001, LC-00001, PRO-00001)
- **Integración con pagos**: Vinculación con sistema de pagos
- **Notificaciones**: Alertas por WhatsApp y email en cambios de estado

**Usado por**: 
- TuPatrimonio Platform (servicio principal)
- Clientes B2C y B2B que requieren servicios notariales

---

### 5. Schema `identity_verifications` ⭐ NUEVO

**Propósito**: Sistema de verificación de identidad (KYC) independiente del proveedor

**Responsabilidad**: Gestión de verificaciones de identidad con biometría, documentos y liveness checks. Repositorio centralizado para auditorías judiciales e internas.

**Tablas principales** (7):
```
# Proveedores y Configuración
identity_verifications.providers              # Catálogo de proveedores (Veriff, Onfido, etc.)
identity_verifications.provider_configs       # Configuración por organización

# Sesiones de Verificación
identity_verifications.verification_sessions  # Sesión principal de verificación
identity_verifications.verification_attempts  # Intentos dentro de una sesión
identity_verifications.verification_documents # Documentos de identidad capturados
identity_verifications.verification_media     # Archivos multimedia (fotos, selfies, videos)

# Auditoría
identity_verifications.audit_log              # Log inmutable para auditorías
```

**ENUMs**:
```
identity_verifications.verification_purpose   # fes_signing, fea_signing, kyc_onboarding, etc.
identity_verifications.session_status         # pending, started, submitted, approved, declined, etc.
identity_verifications.attempt_status         # pending, in_progress, completed, failed
identity_verifications.document_type          # national_id, passport, drivers_license, etc.
identity_verifications.media_type             # face_photo, document_front, selfie, liveness_video
identity_verifications.provider_type          # biometric, document, liveness, combined
identity_verifications.actor_type             # system, webhook, user, admin
```

**Edge Functions**:
```
veriff-webhook                                # Procesa webhooks de Veriff
identity-verification                         # API interna para gestión de verificaciones
```

**Storage**:
```
Bucket: identity-verifications                # Archivos multimedia (privado, 50MB max)
Estructura: /{org_id}/{session_id}/{media_type}_{timestamp}.{ext}
```

**Características**:
- **Multi-tenant estricto**: Aislamiento total por `organization_id`
- **RLS robusto**: Cada org solo ve sus verificaciones
- **Independiente del proveedor**: Arquitectura agnóstica con Veriff como proveedor inicial
- **Retención indefinida**: Almacenamiento completo de evidencia para auditorías
- **Audit log inmutable**: Registro completo de eventos sin UPDATE/DELETE
- **Integración con signing**: Vinculación con firmantes para FES/FEA
- **Reutilizable**: Sistema KYC general para múltiples servicios

**Usado por**: 
- Schema `signing` (FES y FEA)
- Servicios futuros que requieran KYC

---

## 📦 Schemas Futuros (Roadmap)

### 6. Schema `signatures` (Fase 7)

**Propósito**: Servicio de firma electrónica

**Estado**: ✅ IMPLEMENTADO (ver schema `signing` actual)

---

### 7. Schema `verifications` (Fase 8)

**Propósito**: Verificación de identidad (KYC)

**Estado**: ✅ IMPLEMENTADO como `identity_verifications`

---

### 7. Schema `ai_customer_service` (Fase 9)

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

### 8. Schema `ai_document_review` (Fase 10)

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

### 9. Schema `analytics` (Fase 11)

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
     ├─→ notarial_services (usa core.organizations, core.users)
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
| `crm` | ✅ Completo | 16+ | CRM B2B vendible estilo HubSpot | ✅ Sí |
| `signing` | ✅ Completo | 11 | Firma electrónica (FES/FEA) y procesos notariales | ✅ Sí |
| `identity_verifications` | ✅ Completo | 7 | KYC/Verificación de identidad (Veriff) | ✅ Sí |
| `notarial_services` | ✅ Operativo | 12+ | Servicios notariales | ✅ Sí |
| `ai_customer_service` | 📋 Pendiente | - | Chatbot IA | ✅ Sí |
| `ai_document_review` | ✅ Operativo | - | Análisis documentos | ✅ Sí |
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

**Última actualización**: 17 Febrero 2026  
**Schemas implementados**: 6 de 9 planificados  
**Tablas totales**: 70+ (13 core + 11 marketing + 16+ crm + 11 signing + 7 identity_verifications + 12+ notarial_services)

