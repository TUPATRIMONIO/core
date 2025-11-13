# 🗺️ Hoja de Ruta - Ecosistema TuPatrimonio

> **📅 Última actualización:** 12 Noviembre 2025  
> **📊 Estado:** Fase 0 COMPLETA AL 100% ✅  
> **🎯 Próximo milestone:** INICIAR FASE 1 - Backend Foundation

## 📊 Resumen Ejecutivo (Nov 2025)

**Estado General:** ✅ **FASE 0 COMPLETA AL 100%** ✅

Toda la infraestructura técnica, páginas, sistemas de contenido, integraciones y optimizaciones están implementadas y funcionando. El sitio marketing está completamente operacional con contenido real.

**✅ COMPLETADO en Fase 0:**
- ✅ Infraestructura completa (monorepo, Next.js 15, Tailwind v4, Supabase)
- ✅ 60+ páginas implementadas (landing pages, blog, KB, ayuda, etc.)
- ✅ Sistema de blog dinámico con admin panel
- ✅ Base de conocimiento completa con categorías
- ✅ Integración Google Business Reviews
- ✅ Sistema de gestión de páginas dinámicas
- ✅ SEO avanzado (sitemap multicapa, structured data)
- ✅ Deploy completo en Vercel (2 apps funcionando)
- ✅ Dark mode, PWA, Analytics, colores dual
- ✅ **Contenido del sitio actual migrado** (Nov 2025)
- ✅ **Blog poblado con 10-15 posts reales** (Nov 2025)
- ✅ **Base de conocimiento con 15-20 artículos** (Nov 2025)
- ✅ **Optimización final y testing completados** (Nov 12, 2025)

**🚀 EN DESARROLLO - Sistema CRM Multi-Tenant B2B:**
- ✅ **Decisión arquitectónica**: CRM como servicio vendible multi-tenant
- ✅ **Migración de roles** completada y corregida
  - Eliminada tabla redundante `marketing.user_roles`
  - Unificado en `core.roles` + `core.organization_users`
  - Función `can_access_admin()` actualizada
  - Función `can_access_crm()` creada
- ✅ **Schema CRM completo** creado (migración lista)
  - 6 tablas multi-tenant: contacts, activities, deals, emails, settings, notes
  - RLS completo por organization_id
  - Roles específicos: crm_manager, sales_rep
  - Aplicación registrada en ecosistema
  - Función de importación de leads de marketing
- 📄 **Documentación completa**:
  - `docs/CRM-MULTITENANT-GUIDE.md` - Guía completa multi-tenant
  - Migraciones: `20251112185905` (roles) + `20251112190000` (schema CRM)
- ⏳ **Pendiente**: Implementar UI y APIs (2-3 semanas)

**🚀 ESTADO ACTUAL - CRM EN DESARROLLO:**

✅ **Migraciones Aplicadas** (12 Nov 2025):
   - ✅ `20251112185905_limpiar-user-roles.sql` (unificación de roles)
   - ✅ `20251112190000_schema-crm-multitenant.sql` (schema CRM base)
   - ✅ `20251112202031_crm-base.sql` (expansión HubSpot completa)

✅ **Leads Importados**: Ejecutado `import_marketing_leads_to_crm()`

✅ **UI del CRM - 100% COMPLETADO** (12 Nov 2025) ✨ PRODUCTION READY:

**✅ MÓDULOS 100% COMPLETOS**:
   - ✅ Dashboard principal con KPIs en tiempo real - **100%**
   - ✅ Módulo de Contactos (lista, detalle, crear, editar, emails) - **100%**
   - ✅ Módulo de Empresas (lista, detalle, crear, editar, stats) - **100%** ⭐
   - ✅ Módulo de Deals (lista, detalle, crear, editar, probabilidad) - **100%** ⭐
   - ✅ Módulo de Tickets (lista, detalle, crear, editar, SLA) - **100%** ⭐
   - ✅ Módulo de Productos (lista, crear, editar, billing) - **100%** ⭐
   - ✅ Módulo de Cotizaciones (lista, crear, detalle, line items, totales) - **100%**
   
**✅ INFRAESTRUCTURA COMPLETA**:
   - ✅ **18 API Routes funcionando** (contacts, companies, deals, tickets, products, quotes, emails, stats, gmail)
   - ✅ Componentes reutilizables (StatusBadge, EmptyState, StatsCard, EmailComposer)
   - ✅ Types TypeScript completos (400+ líneas)
   - ✅ Helpers y utilidades (formateo, colores, permisos)
   - ✅ **Gmail OAuth y service completo** (oauth.ts, service.ts, types.ts)
   - ✅ Context multi-tenant
   - ✅ Navegación y badges funcionando
   - ✅ **50+ archivos nuevos creados**
   
**📊 FUNCIONALIDADES 100% COMPLETAS**:
   - ✅ **Gestionar contactos COMPLETO** (CRUD 100% + enviar emails desde detalle)
   - ✅ **Gestionar empresas COMPLETO** (CRUD 100% + stats por empresa + relaciones)
   - ✅ **Gestionar deals COMPLETO** (CRUD 100% + probabilidad + pipeline + cotizaciones)
   - ✅ **Gestionar tickets COMPLETO** (CRUD 100% + SLA + auto-numeración + prioridades)
   - ✅ **Catálogo de productos COMPLETO** (CRUD 100% + billing recurrente + inventario)
   - ✅ **Sistema de cotizaciones COMPLETO** (crear con line items + cálculos automáticos + detalle)
   - ✅ **Integración Gmail COMPLETA** (OAuth + envío + EmailComposer + guardar en BD + actividades)
   - ✅ Relaciones HubSpot-style 100% funcionando
   - ✅ Timeline de actividades en todas las entidades
   - ✅ Auto-numeración de tickets y cotizaciones (TICK-00001, QUO-00001)
   - ✅ Filtros y búsqueda en todas las listas
   - ✅ **28 páginas de UI implementadas**
   - ✅ **18 API endpoints funcionando**
   
**📄 DOCUMENTACIÓN COMPLETA**:
   - `docs/CRM-FINAL.md` - Documento final 100% completo ⭐ NUEVO
   - `docs/CRM-COMPLETO.md` - Resumen ejecutivo
   - `docs/CRM-QUICKSTART.md` - Guía de inicio rápido
   - `docs/CRM-GMAIL-SETUP.md` - Setup de Gmail paso a paso
   - `docs/schemas/crm-hubspot-style.md` - Arquitectura HubSpot completa
   - `docs/schemas/crm-implementation-status.md` - Estado técnico actualizado
   - `docs/CRM-PROGRESO-SESION.md` - Log de implementación

✨ **CRM PRODUCTION READY - Features Nice-to-Have opcionales**:
   - Inbox de emails (leer recibidos) - funcionalidad adicional
   - Reportes avanzados - analytics extendidos
   - Kanban drag & drop - UX mejorada
   - Búsqueda global (Cmd+K) - navegación rápida
   - Templates de email - productividad
   - Webhooks - integraciones

**📅 CRM AL 100% Y LISTO PARA PRODUCCIÓN** ✨

🎉 **SISTEMA DE ONBOARDING B2C + B2B IMPLEMENTADO** (13 Nov 2025):

**✅ FUNCIONALIDADES**:
   - ✅ Pantalla de selección de tipo de organización (Personal vs Empresarial)
   - ✅ Función `create_personal_organization()` - Org personal automática
   - ✅ Función `create_business_organization()` - Org empresarial con datos
   - ✅ Página `/onboarding` con UI completa
   - ✅ API routes `/api/onboarding/*` (status, personal, business)
   - ✅ RLS policies actualizadas para super admin
   - ✅ `can_access_crm()` permite `org_owner`
   - ✅ **Super admin puede ver TODOS los datos de TODAS las orgs** ⭐
   - ✅ Usuarios normales solo ven datos de SU org
   - ✅ CRM habilitado automáticamente con límites por plan
   - ✅ Flujo de registro modificado (signUp → /onboarding)
   
**📄 DOCUMENTACIÓN**:
   - `docs/ONBOARDING-SYSTEM.md` - Sistema completo documentado
   
**📦 ARCHIVOS**:
   - Migración: `20251113002149_creacion-org.sql`
   - 7 archivos creados (onboarding page, APIs, layout, docs)

**🎯 RESULTADO**:
   - CRM multi-tenant 100% funcional
   - Onboarding automático B2C + B2B
   - Super admin con vista global
   - Listo para escalar a cientos de organizaciones

**📅 Próximo**: **INICIAR FASE 1** del roadmap principal (credits, billing, servicios core)

---

## 🚨 Cambios Recientes (Nov 2025)

### ✅ **COMPLETADO - 12 Noviembre 2025:**

**🎉 FASE 0 COMPLETA AL 100% 🎉**

- ✅ Contenido del sitio actual migrado a las landing pages
- ✅ Blog poblado con 10-15 posts reales
- ✅ Base de conocimiento poblada con 15-20 artículos
- ✅ Optimización final de contenido completada
- ✅ Testing completo realizado
- ✅ **Fase 0: 100% COMPLETADA**

**🔄 EN DESARROLLO - Sistema CRM Multi-Tenant B2B (12 Nov 2025):**

- ✅ **Decisión Arquitectónica**:
  - CRM diseñado como servicio vendible multi-tenant
  - TuPatrimonio Platform como cliente #1 del CRM
  - Cada organización gestiona sus propios contactos
  - Aislamiento total vía RLS por organization_id

- ✅ **Unificación de Sistema de Roles**:
  - Eliminada tabla redundante `marketing.user_roles`
  - Migrado todo a sistema `core.roles` + `core.organization_users`
  - Función `can_access_admin()` actualizada
  - Nueva función `can_access_crm()` creada
  - Código TypeScript actualizado (`page-management.ts`, `users/page.tsx`)
  - Migración SQL corregida: `20251112185905_limpiar-user-roles.sql` ✅
  
- ✅ **Schema CRM Multi-Tenant Completo - Estilo HubSpot**:
  - **Schema separado**: `crm` (siguiendo arquitectura de schemas por aplicación)
  - **10 tablas principales**:
    * Base (6): `contacts`, `companies`, `deals`, `tickets`, `activities`, `emails`
    * Comercial (3): `products`, `quotes`, `quote_line_items`
    * Config (2): `pipelines`, `settings`, `notes`
  - **ENUMs completos** (8):
    * Existentes: `contact_status`, `activity_type`, `deal_stage`, `email_status`
    * Nuevos: `company_type`, `ticket_status`, `ticket_priority`, `quote_status`
  - **Relaciones HubSpot-style**:
    * Contacto ↔ Empresa (N:1)
    * Empresa → Contactos, Deals, Tickets (1:N)
    * Deal → Contacto/Empresa (flexible)
    * Ticket → Contacto/Empresa (soporte)
    * Quote → Contacto/Empresa/Deal (propuestas)
    * Activities → Universal (timeline para todo)
  - **Features automáticas**:
    * Auto-numeración: TICK-00001, QUO-00001
    * Cálculo automático de totales en cotizaciones
    * Pipelines personalizables por org
    * Subsidiarias (parent_company_id)
  - **Funciones SQL**:
    * `import_marketing_leads_to_crm()`
    * `crm.get_stats(org_id)` - Dashboard principal
    * `crm.get_company_stats(company_id)` - Stats por empresa
    * `crm.get_company_contacts(company_id)` - Contactos de empresa
  - **RLS completo** por organization_id en todas las tablas
  - **Roles específicos** en core: `crm_manager` (nivel 6), `sales_rep` (nivel 4)
  - **Aplicación** `crm_sales` registrada en core.applications
  - **Migraciones SQL**:
    * `20251112190000_schema-crm-multitenant.sql` ✅ (Base)
    * `20251112202031_crm-base.sql` ✅ (Expansión HubSpot)
  
- 📋 **Documentación Creada**:
  - `docs/schemas/crm.md` - Implementación técnica multi-tenant
  - `docs/schemas/crm-hubspot-style.md` - Arquitectura completa estilo HubSpot ⭐ NUEVO
  - `docs/schemas/ARCHITECTURE-SCHEMAS.md` - Filosofía de schemas separados
  - `docs/ORGANIZATION-SUMMARY.md` - Resumen de organización de docs
  - `docs/NAVIGATION-MAP.md` - Mapa de navegación de documentación
  - Ejemplos de API routes con permisos
  - Diagramas de relaciones entre entidades
  - Sistema de límites por plan de suscripción
  - Integración Gmail por organización
  - Flujos de trabajo completos
  - Testing multi-tenant

- ✅ **Organización de Documentación** (12 Nov 2025):
  - README raíz simplificado (995 → 89 líneas)
  - Estructura de carpetas clara (schemas/, design/, features/, etc.)
  - READMEs en todas las subcarpetas
  - Archivos históricos movidos a archived/
  - Documentación de packages en su ubicación correcta
  - 8 categorías organizadas + navegación clara

**🚀 Próximo paso:** Implementar UI del CRM (2-3 semanas) → FASE 1

---

### Avances Significativos de Noviembre:

✅ **COMPLETADOS en Noviembre 2025:**

1. **Sistema de Gestión de Páginas Dinámicas**
   - Sistema completo de gestión de rutas y contenido
   - API routes para configuración de páginas
   - Integración con sitemap dinámico
   - Páginas gestionadas desde base de datos

2. **Base de Conocimiento (Knowledge Base)**
   - Sistema completo de artículos KB
   - Categorías y navegación por categorías
   - Integración con Supabase (kb_articles, kb_categories)
   - SEO optimizado para cada artículo
   - URLs amigables: `/base-conocimiento/[categoria]/[slug]`

3. **Sistema de Reviews de Google Business**
   - Integración completa con Google Business API
   - Sincronización automática de reseñas
   - Cron job para actualización periódica
   - Display de reseñas en landing pages
   - Cache de datos para mejor performance

4. **Rutas y Páginas Adicionales**
   - `/ayuda` - Centro de ayuda completo
   - `/nosotros` - Página sobre TuPatrimonio
   - `/contacto` - Formulario de contacto global
   - Todas las páginas legales (`/legal/*`)
   - Páginas de líneas de negocio (legal-tech, business-hub, proptech, fintech)

5. **Mejoras de SEO y Sitemap**
   - Sitemap dinámico que incluye:
     * Páginas estáticas priorizadas
     * Posts del blog con última modificación
     * Artículos de base de conocimiento
     * Categorías de ambos sistemas
   - Prioridades inteligentes por tipo de contenido
   - Change frequencies optimizadas

**✅ COMPLETADO - Fase 0 al 100%:**

1. ✅ **Contenido Real** - COMPLETADO (Nov 12, 2025)
   - ✅ Migrar contenido del sitio actual
   - ✅ Crear posts iniciales para blog
   - ✅ Poblar base de conocimiento con artículos
   - ✅ Optimizar todas las landing pages

2. **Sistema CRM y Gestión de Correos** (3-5 días) ← NUEVO
   - **Panel CRM en Dashboard**:
     * Visualizar contactos de formularios (waitlist + contacto)
     * Ver detalles de cada lead con toda su información
     * Sistema de estados (nuevo, contactado, calificado, convertido)
     * Filtros y búsqueda de contactos
     * Notas y seguimiento por contacto
   - **Integración de Email Workspace**:
     * Conectar correo del workspace (Google Workspace / Outlook)
     * Poder responder emails directamente desde el CRM
     * Recibir y visualizar correos entrantes
     * Threading de conversaciones
     * Templates de respuestas rápidas
   - **Notificaciones**:
     * Alertas cuando llega nuevo contacto
     * Emails de notificación al equipo
     * Dashboard de leads pendientes de respuesta

3. **Sistema de Autenticación Avanzado** (opcional para MVP)
   - OAuth providers (Google, LinkedIn)
   - Magic Links
   - Verificación de correo mejorada

**✅ Fase 0 COMPLETADA AL 100% - Nov 12, 2025**
  - ✅ Contenido: COMPLETADO
  - ✅ Optimización final: COMPLETADO
  - CRM + Email: OPCIONAL (puede implementarse en Fase 1)

---

## 📋 Información del Proyecto

### Stack Tecnológico
- **Backend:** Supabase (PostgreSQL + Auth + Storage + Realtime + pgvector)
- **Frontend:** Next.js 14+ (App Router) + TailwindCSS
- **Deployment:** Netlify
- **Lenguaje:** TypeScript
- **CMS (Landing/Blog):** Contentful / Sanity / WordPress Headless (a definir)

### Servicios Externos
- **Pagos:** Stripe + dLocal Go
- **Email:** SendGrid (solo API, templates propios)
- **Auth/SMS:** Twilio
- **Verificación:** Veriff (biometría + documentos)
- **Storage:** Supabase Storage (integrado)
- **SEO Tools:** Google Search Console, Ahrefs/SEMrush, Schema.org
- **IA:** OpenAI API / Anthropic Claude API

### Principios de Diseño
- **Base de datos ligera:** Mínima documentación almacenada, usar referencias a storage
- **Multi-tenant nativo:** Todo filtrado por organization_id
- **API-first:** Diseño REST consistente
- **Event-driven:** Arquitectura basada en eventos para desacoplamiento
- **Seguridad:** RLS en todas las tablas, encriptación en reposo
- **SEO-first:** Contenido optimizado para motores de búsqueda y IA
- **AI schemas separados:** Customer Service y Document Review como servicios independientes

---

## 🌐 **FASE 0: Marketing Web + SEO Foundation (Semanas 1-4)**

### **Objetivo:** Establecer presencia digital y comenzar posicionamiento mientras se desarrolla el producto

Esta fase es **CRÍTICA** porque:
1. El SEO toma 3-6 meses en mostrar resultados
2. Genera tráfico orgánico mientras desarrollas
3. Valida messaging y value proposition
4. Construye lista de early adopters
5. Permite iterar contenido según feedback

---

### 0.1 Setup Técnico de Marketing Site

**Objetivo:** Infraestructura optimizada para SEO/AEO/GEO

#### Arquitectura Propuesta:
```
tupatrimonio.app/
├── / (landing page principal)
├── /firmas-electronicas (landing específica)
├── /verificacion-identidad (landing específica)
├── /notaria-digital (landing específica)
├── /asistente-ia (landing específica) ← NUEVO
├── /revision-documentos-ia (landing específica) ← NUEVO
├── /precios
├── /blog/
│   ├── /blog/[slug]
│   └── /blog/categoria/[categoria]
├── /recursos/
│   ├── /guias/[slug]
│   ├── /casos-de-uso/[slug]
│   └── /comparativas/[slug]
├── /legal/
│   ├── /terminos
│   ├── /privacidad
│   └── /cookies
└── /app (redirige a app.tupatrimonio.app en el futuro)
```

#### Tareas Técnicas:

1. **Next.js Configuration para SEO**
   ```typescript
   // next.config.js optimizado
   {
     images: {
       formats: ['image/avif', 'image/webp'],
       deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
     },
     compiler: {
       removeConsole: process.env.NODE_ENV === 'production',
     },
     experimental: {
       optimizeCss: true,
     },
   }
   
   // app/layout.tsx - Metadata API
   export const metadata = {
     metadataBase: new URL('https://tupatrimonio.app'),
     alternates: {
       canonical: '/',
       languages: {
         'es-CL': '/es-cl',
         'es-MX': '/es-mx',
       },
     },
     openGraph: {
       images: '/og-image.jpg',
     },
     robots: {
       index: true,
       follow: true,
       googleBot: {
         index: true,
         follow: true,
         'max-video-preview': -1,
         'max-image-preview': 'large',
         'max-snippet': -1,
       },
     },
   }
   ```

2. **Structured Data (Schema.org)**
   ```typescript
   // Implementar JSON-LD en cada página
   
   // Homepage: Organization
   {
     "@context": "https://schema.org",
     "@type": "SoftwareApplication",
     "name": "TuPatrimonio",
     "applicationCategory": "BusinessApplication",
     "offers": {
       "@type": "Offer",
       "price": "0",
       "priceCurrency": "CLP"
     },
     "aggregateRating": {
       "@type": "AggregateRating",
       "ratingValue": "4.8",
       "ratingCount": "127"
     }
   }
   
   // Blog posts: Article
   // Guías: HowTo
   // Precios: Product/Offer
   // FAQs: FAQPage
   ```

3. **Performance (Netlify Automático)**
   ```typescript
   // Netlify maneja automáticamente:
   - Next.js Image optimization
   - Font optimization (next/font)
   - Bundle optimization y Code splitting
   - Edge caching global
   - ISR (Incremental Static Regeneration)
   
   // Solo configurar:
   - Lazy loading de componentes pesados
   - Core Web Vitals monitoring
   ```

4. **Sitemap y Robots.txt Dinámicos**
   ```typescript
   // app/sitemap.ts
   export default async function sitemap() {
     const posts = await getBlogPosts()
     const guides = await getGuides()
     
     return [
       { url: 'https://tupatrimonio.app', changeFrequency: 'daily' },
       { url: 'https://tupatrimonio.app/precios', changeFrequency: 'weekly' },
       ...posts.map(post => ({
         url: `https://tupatrimonio.app/blog/${post.slug}`,
         lastModified: post.updatedAt,
         changeFrequency: 'monthly',
       })),
     ]
   }
   ```

---

### 0.2 CMS Setup para Contenido

**Objetivo:** Sistema de gestión de contenido flexible y SEO-friendly

#### Opciones y Recomendación:

**Opción A: Contentful (Recomendada)**
- Headless CMS robusto
- API GraphQL/REST
- Preview mode nativo
- Gestión de assets optimizada
- Webhooks para rebuild automático

**Opción B: Sanity**
- Más flexible y customizable
- Studio en React
- GROQ queries poderosas
- Real-time collaboration

**Opción C: Supabase Tables**
- Ya estás usando Supabase
- Sin costo adicional
- Menor overhead
- Menos features out-of-the-box

#### Implementación con Contentful:

```typescript
// Modelos de contenido:

1. Blog Post
   - title (Short text)
   - slug (Short text, unique)
   - excerpt (Long text)
   - content (Rich text)
   - featuredImage (Media)
   - author (Reference to Author)
   - category (Reference to Category)
   - tags (Array of Short text)
   - publishedAt (Date)
   - metaTitle (Short text)
   - metaDescription (Long text)
   - readingTime (Number)

2. Landing Page
   - title
   - slug
   - sections (Array of References)
   - seo (Reference to SEO metadata)

3. Guide/Tutorial
   - Similar a Blog Post + difficulty level + steps

4. Case Study
   - company
   - industry
   - challenge
   - solution
   - results (Array)
   - metrics (Array)

5. FAQ
   - question
   - answer
   - category
```

---

### 0.3 Estrategia de Contenido SEO

**Objetivo:** Ranking para keywords de alto valor comercial

#### Research de Keywords:

```
Primarias (High Intent):
- "firma electrónica chile" [590/mes, KD: 42]
- "firmar documentos online" [480/mes, KD: 38]
- "notaría digital" [320/mes, KD: 35]
- "verificación de identidad online" [210/mes, KD: 40]
- "chatbot con IA para empresas" [180/mes, KD: 45] ← NUEVO
- "revisión automática de contratos" [120/mes, KD: 38] ← NUEVO

Secundarias (Medium Intent):
- "cómo firmar un pdf" [1200/mes, KD: 25]
- "qué es firma electrónica avanzada" [390/mes, KD: 28]
- "documentos notariales digitales" [170/mes, KD: 30]
- "asistente virtual inteligente" [850/mes, KD: 40] ← NUEVO
- "IA para revisar documentos legales" [90/mes, KD: 35] ← NUEVO

Long-tail (High Conversion):
- "mejor software firma electrónica empresas" [90/mes, KD: 22]
- "firma electrónica con validez legal chile" [110/mes, KD: 26]
- "automatizar firma de contratos" [50/mes, KD: 18]
- "chatbot IA atención al cliente 24/7" [70/mes, KD: 30] ← NUEVO
- "software IA revisar contratos" [60/mes, KD: 28] ← NUEVO

Informational (Top of Funnel):
- "tipos de firma electrónica" [820/mes, KD: 20]
- "diferencia firma digital y electrónica" [590/mes, KD: 22]
- "requisitos firma electrónica" [280/mes, KD: 24]
- "cómo funciona un chatbot con IA" [620/mes, KD: 22] ← NUEVO
- "IA para análisis de documentos" [340/mes, KD: 25] ← NUEVO
```

#### Content Clusters:

**Cluster 1: Firma Electrónica (Pillar)**
```
Pillar: "Guía Completa de Firma Electrónica en Chile 2025"
Supporting content:
- "Tipos de Firma Electrónica: Simple, Avanzada y Cualificada"
- "Firma Electrónica vs Firma Digital: Diferencias y Similitudes"
- "Marco Legal de la Firma Electrónica en Chile"
- "Cómo Implementar Firma Electrónica en tu Empresa"
- "Casos de Uso: 15 Documentos que Puedes Firmar Digitalmente"
- "Seguridad en Firmas Electrónicas: Todo lo que Debes Saber"
```

**Cluster 2: Verificación de Identidad (Pillar)**
```
Pillar: "Verificación de Identidad Digital: Guía 2025"
Supporting content:
- "KYC Digital: Qué es y Por Qué es Importante"
- "Verificación Biométrica: Tecnología y Casos de Uso"
- "Onboarding Digital Seguro para Clientes"
- "Regulaciones de Verificación de Identidad en LATAM"
```

**Cluster 3: Notaría Digital (Pillar)**
```
Pillar: "Notaría Digital en Chile: El Futuro es Hoy"
Supporting content:
- "Documentos que Puedes Notarizar Online"
- "Validez Legal de Documentos Notarizados Digitalmente"
- "Proceso de Notarización Digital Paso a Paso"
- "Notaría Tradicional vs Notaría Digital: Comparativa"
```

**Cluster 4: IA para Atención al Cliente (Pillar)** ← NUEVO
```
Pillar: "Chatbots con IA: La Revolución en Atención al Cliente 2025"
Supporting content:
- "Cómo Implementar un Chatbot con IA en tu Empresa"
- "Chatbot vs Asistente Virtual: Diferencias y Ventajas"
- "ROI de un Chatbot: Cuánto Ahorras en Atención al Cliente"
- "Casos de Éxito: Empresas que Mejoraron su Atención con IA"
- "Chatbots en Chile: Marco Legal y Mejores Prácticas"
- "Integrar Chatbot IA con WhatsApp Business"
```

**Cluster 5: IA para Revisión de Documentos (Pillar)** ← NUEVO
```
Pillar: "IA para Análisis de Documentos: Guía Completa 2025"
Supporting content:
- "Cómo la IA Revoluciona la Revisión de Contratos"
- "Análisis Automático de Contratos: Ahorro de Tiempo y Dinero"
- "Red Flags en Contratos: Cómo la IA las Detecta"
- "IA vs Abogado: Cuándo Usar Cada Uno"
- "Compliance Automatizado con IA"
- "Extracción de Datos de Documentos con IA"
```

#### Calendario Editorial (Primeras 16 semanas):

```
Semana 1-2:
- Pillar article: Firma Electrónica (5000+ palabras)
- Blog: "5 Razones para Digitalizar tu Proceso de Firmas"
- Guía: "Cómo Firmar un PDF Gratis en 2025"

Semana 3-4:
- Supporting: "Tipos de Firma Electrónica"
- Blog: "Casos de Éxito: Empresa X Redujo Tiempos en 80%"
- Comparativa: "Top 5 Software de Firma Electrónica"

Semana 5-6:
- Supporting: "Marco Legal Firma Electrónica Chile"
- Blog: "Errores Comunes al Implementar Firma Digital"
- Tutorial: "Integrar Firma Electrónica en tu CRM"

Semana 7-8:
- Pillar article: Verificación de Identidad (4000+ palabras)
- Supporting: "KYC Digital para FinTech"
- Case Study: Cliente real (anonimizado)

Semana 9-10:
- Supporting: "Verificación Biométrica Explicada"
- Blog: "Tendencias en IdentityTech 2025"
- Infografía: "Proceso de Verificación en 4 Pasos"

Semana 11-12:
- Pillar article: Notaría Digital (4500+ palabras)
- Supporting: "Documentos Notarizables Online"
- Comparativa: "Notaría Digital vs Tradicional"

Semana 13-14: ← NUEVO
- Pillar article: Chatbots con IA (5000+ palabras)
- Supporting: "Cómo Implementar un Chatbot con IA"
- Blog: "ROI de Chatbots: Casos Reales con Números"

Semana 15-16: ← NUEVO
- Pillar article: IA para Análisis de Documentos (4500+ palabras)
- Supporting: "Cómo la IA Revoluciona Revisión de Contratos"
- Tutorial: "Análisis Automático de Contratos Paso a Paso"
```

---

### 0.4 Landing Pages Optimizadas

**Objetivo:** Conversión de tráfico en leads

#### Landing Pages a Crear:

**1. Homepage (`/`)**
```
Estructura:
- Hero: Value prop clara + CTA principal
- Social proof: Logos clientes + testimonios
- Features: 5-6 beneficios principales (incluir IA)
- How it works: 3 pasos simples
- Use cases: Tabs con diferentes industrias
- Pricing preview: Link a página de precios
- FAQ accordion
- Final CTA: "Empieza Gratis"

SEO:
- Meta title: "TuPatrimonio - Firma Electrónica, IA y Verificación Digital | Chile"
- Meta desc: "Firma documentos online, chatbot IA 24/7, revisión automática de contratos. Verificación biométrica. Prueba gratis 30 días. +500 empresas confían."
- H1: "Digitaliza tus Procesos con IA: Firmas, Verificación y Más"
```

**2. Landing: Firmas Electrónicas (`/firmas-electronicas`)**
```
Enfoque: SEO-optimizada para "firma electrónica"
Estructura:
- Hero específico para firmas
- Comparativa de tipos de firma
- Casos de uso específicos
- Integraciones disponibles
- Calculadora de ROI
- Testimonios de clientes
- FAQ específico de firmas
- CTA: "Prueba Firmas Electrónicas Gratis"

Content additions:
- Video explicativo (hosted en YouTube para SEO)
- Infografía descargable (lead magnet)
- Checklist PDF: "10 Pasos para Digitalizar Firmas"
```

**3. Landing: Verificación de Identidad (`/verificacion-identidad`)**
```
Enfoque: Para compliance officers y fintechs
Keywords: "verificación de identidad", "KYC digital", "onboarding digital"
Estructura similar pero enfocada en:
- Compliance y regulaciones
- Velocidad de verificación
- Tasa de aprobación
- Prevención de fraude
```

**4. Landing: Notaría Digital (`/notaria-digital`)**
```
Enfoque: Disruption del modelo tradicional
Estructura:
- Ahorro de tiempo y dinero vs notaría tradicional
- Documentos soportados
- Validez legal
- Proceso paso a paso
- Comparativa de precios
```

**5. Landing: Asistente IA (`/asistente-ia`)** ← NUEVO
```
Enfoque: Automatización de atención al cliente
Keywords: "chatbot con IA", "asistente virtual inteligente", "atención 24/7"

Estructura:
- Hero: "Atiende a tus Clientes 24/7 con IA"
- Pain points: Costos de soporte, tiempos de respuesta
- Solution: Chatbot que aprende de tu negocio
- Features específicas:
  * Respuestas instantáneas
  * Aprende de tu documentación
  * Múltiples canales (web, WhatsApp, Slack)
  * Escalamiento a humanos cuando necesario
  * Analytics de conversaciones
- Demo interactivo: Widget de chat funcionando
- Pricing específico: Por conversación o flat fee
- ROI calculator: "Cuánto ahorrarás en soporte"
- Casos de uso por industria
- Testimonios con métricas (% reducción tickets)
- FAQ sobre implementación
- CTA: "Prueba el Asistente IA Gratis"

Content additions:
- Video: "Configura tu Chatbot en 10 Minutos"
- Whitepaper: "El Futuro de la Atención al Cliente con IA"
- Template: "Knowledge Base para Entrenar tu Chatbot"
```

**6. Landing: Revisión Documentos IA (`/revision-documentos-ia`)** ← NUEVO
```
Enfoque: Automatización de análisis legal/contractual
Keywords: "revisión automática contratos", "IA análisis documentos", "compliance automatizado"

Estructura:
- Hero: "Analiza Contratos en Minutos, No en Horas"
- Pain points: Costos de abogados, tiempo de revisión, errores humanos
- Solution: IA que detecta riesgos y extrae datos clave
- Features específicas:
  * Detección de red flags
  * Extracción de cláusulas clave
  * Análisis de riesgo automatizado
  * Comparación de versiones
  * Compliance checks
  * Reportes ejecutivos
- Demo visual: Documento antes/después con anotaciones
- Tipos de documentos soportados
- Pricing: Por documento o suscripción mensual
- Precisión y confiabilidad (% de exactitud)
- Seguridad y confidencialidad
- Casos de uso:
  * Equipos legales
  * Procurement
  * Real estate
  * Startups
- Comparativa: "IA + Abogado vs Solo Abogado"
- Testimonios con tiempo ahorrado
- FAQ sobre precisión y limitaciones
- CTA: "Analiza tu Primer Contrato Gratis"

Content additions:
- Video: "Cómo la IA Revisa un Contrato Paso a Paso"
- eBook: "Guía de Red Flags en Contratos Comerciales"
- Checklist: "Qué Revisar en un Contrato de SaaS"
```

**7. Página de Precios (`/precios`)**
```
Estructura:
- Tabla comparativa de planes
- Toggle: Mensual/Anual (con descuento)
- NUEVO: Tabs por servicio (Firmas, IA Chat, IA Review, etc.)
- Calculator: Estimar costo según uso
- FAQ sobre facturación
- CTA por plan
- Opción "Hablar con Ventas" para Enterprise

Pricing IA Services:
- Chatbot IA:
  * Starter: 100 conversaciones/mes - $29/mes
  * Pro: 1,000 conversaciones/mes - $199/mes
  * Enterprise: Ilimitado - Custom
  
- Revisión IA:
  * Pay as you go: $5 por documento
  * Plan 50: 50 documentos/mes - $199/mes
  * Plan 200: 200 documentos/mes - $599/mes
  * Enterprise: Volumen - Custom

SEO considerations:
- Schema markup para Offers
- Comparativa con competidores
- Transparencia de precios (good for SEO)
```

---

### 0.5 Blog SEO-Optimizado

**Objetivo:** Motor de contenido para SEO de largo plazo

#### Features del Blog:

1. **Arquitectura**
   ```
   /blog
   ├── / (index con posts recientes)
   ├── /[slug] (post individual)
   ├── /categoria/[slug] (archive por categoría)
   ├── /autor/[slug] (archive por autor)
   └── /tag/[slug] (archive por tag)
   ```

2. **Categorías Principales**
   ```
   - Firma Electrónica
   - Verificación de Identidad
   - Notaría Digital
   - Inteligencia Artificial ← NUEVO
   - Automatización ← NUEVO
   - Compliance
   - Casos de Éxito
   - Guías y Tutoriales
   - Noticias del Sector
   ```

3. **Features SEO del Blog**
   ```typescript
   - Breadcrumbs con schema markup
   - Related posts (interno linking)
   - Reading time estimate
   - Social sharing buttons
   - Author bio con links
   - Table of contents (para posts largos)
   - Code syntax highlighting (para tutoriales técnicos)
   - Download resources (PDFs, templates)
   - Interactive demos (para posts de IA)
   ```

4. **Template de Blog Post Optimizado**
   ```
   - Meta title: "[Keyword] - Guía [Año] | TuPatrimonio"
   - Meta description: 150-160 chars con keyword
   - H1: Keyword principal
   - Featured image: Alt text optimizado, 1200x630px
   - Intro: Responde la pregunta inmediatamente (para featured snippet)
   - H2s con keywords relacionadas
   - H3s para subsecciones
   - Internal links: Mínimo 3-5 por post
   - External links: 2-3 a fuentes autoritativas
   - CTA: Mid-content + al final
   - Schema: Article + Author + Organization
   ```

---

### 0.6 Optimización para AEO/GEO (AI Engine Optimization)

**Objetivo:** Aparecer en respuestas de ChatGPT, Perplexity, Gemini, Claude

#### Estrategias:

1. **Structured FAQ Pages**
   ```
   Crear páginas FAQ específicas con schema FAQPage:
   - "Preguntas Frecuentes sobre Firma Electrónica"
   - "FAQ: Verificación de Identidad Digital"
   - "FAQ: Chatbots con Inteligencia Artificial" ← NUEVO
   - "FAQ: Revisión Automática de Contratos con IA" ← NUEVO
   
   Las IA's priorizan contenido estructurado en Q&A format
   ```

2. **Authoritative Content Signals**
   ```
   - Citar fuentes legales oficiales
   - Referencias a papers de IA (OpenAI, Anthropic)
   - Incluir fechas de actualización
   - Mostrar expertise: bio de autores con credenciales
   - Enlaces a legislación chilena (.gob.cl)
   - Estudios de caso con datos verificables
   ```

3. **Clear, Direct Answers**
   ```
   Formato preferido por IA's:
   - Primera oración responde directamente
   - Párrafo expandido con contexto
   - Lista de pasos o bullets
   - Ejemplo práctico
   
   Ejemplo:
   "¿Qué tan precisa es la IA en revisar contratos?
   
   Los sistemas de IA para revisión de contratos alcanzan una 
   precisión del 85-95% en la detección de cláusulas estándar 
   y red flags comunes, según estudios de 2024.
   
   Factores que afectan la precisión:
   - Calidad del entrenamiento del modelo
   - Tipo de contrato (estandarizado vs personalizado)
   - Complejidad del lenguaje legal
   - Idioma del documento
   
   En TuPatrimonio utilizamos Claude 3.5 Sonnet para análisis 
   legal, logrando 92% de precisión en contratos comerciales 
   estándar..."
   ```

4. **Knowledge Panels**
   ```
   Optimizar para Google Knowledge Graph:
   - Consistent NAP (Name, Address, Phone)
   - Wikidata entry (crear/editar)
   - Crunchbase profile
   - LinkedIn company page completo
   - Wikipedia entry (si calificas)
   ```

5. **Entities y Topical Authority**
   ```
   - Usar consistently términos técnicos correctos
   - Crear glosario de términos (incluir términos de IA)
   - Link interno entre términos relacionados
   - Cubrir exhaustivamente cada subtopic
   - Definir claramente: Machine Learning, NLP, LLM, RAG, etc.
   ```

---

### 0.7 Technical SEO Checklist

**Objetivo:** Foundation técnica impecable

#### Implementar:

1. **Core Web Vitals (Netlify Automático)**
   ```
   // Netlify optimiza automáticamente:
   - LCP: Image optimization + CDN
   - FID: Code splitting óptimo
   - CLS: Layout optimization
   
   // Solo monitorear con Lighthouse
   ```

2. **Mobile-First**
   ```
   - Responsive design
   - Touch targets > 48px
   - Readable font sizes (16px mínimo)
   - No horizontal scroll
   - Mobile usability en Search Console
   ```

3. **Indexación**
   ```
   - Sitemap XML automático
   - robots.txt optimizado
   - Canonical URLs
   - Hreflang tags (si multi-región)
   - Noindex en páginas de admin/login
   ```

4. **Security**
   ```
   - HTTPS everywhere
   - Security headers (CSP, HSTS, etc.)
   - No mixed content
   ```

5. **Structured Data Testing**
   ```
   - Validar con Google Rich Results Test
   - Testing con schema.org validator
   - Monitoring en Search Console
   ```

---

### 0.8 Link Building Strategy

**Objetivo:** Authority building mientras desarrollas

#### Tácticas:

1. **Digital PR**
   ```
   - Press release sobre el lanzamiento (enfatizar IA)
   - Pitch a TechCrunch LATAM, Contxto, otros
   - Entrevistas en podcasts del sector (legaltech + AI)
   ```

2. **Guest Posting**
   ```
   Target sites:
   - Blogs de legaltech
   - Publicaciones de transformación digital
   - Blogs de SaaS B2B
   - Blogs de IA y automatización ← NUEVO
   
   Pitch examples:
   - "5 Formas en que la Firma Digital Acelera Ventas"
   - "Cómo la IA Reduce Costos de Atención al Cliente en 60%" ← NUEVO
   - "El Futuro del Análisis de Contratos: IA vs Humanos" ← NUEVO
   ```

3. **Resource Link Building**
   ```
   Crear recursos linkables:
   - "Estado de la Digitalización en Chile 2025" (report con data)
   - "Benchmark: IA en Atención al Cliente LATAM 2025" ← NUEVO
   - Infografías compartibles
   - Calculadoras interactivas (ROI firma, ROI chatbot, ahorro revisión contratos)
   - Templates gratuitos (contrato de NDA para firma)
   - "Prompts para Análisis de Contratos con IA" (recurso único) ← NUEVO
   ```

4. **Partnerships**
   ```
   - Co-marketing con SaaS complementarios (CRM, ERP)
   - Integraciones mencionadas en sus blogs
   - Webinars conjuntos
   - Partners de IA (OpenAI, Anthropic - si aplica)
   ```

5. **Local SEO (si aplica)**
   ```
   - Google Business Profile
   - Directorios de startups chilenas
   - Listados en marketplaces de software
   - Listados en directorios de AI tools ← NUEVO
   ```

---

### 0.9 Analytics y Tracking - ✅ **COMPLETADO (28 Oct 2025)**

**Objetivo:** Medir todo desde día 1

#### Setup:

1. **✅ Google Analytics 4 - IMPLEMENTADO EN AMBAS APPS**
   
   **Marketing App (tupatrimonio.app):**
   - ✅ GA4 configurado y funcionando
   - ✅ Tracking de eventos: page_view, click_cta, scroll_depth
   - ✅ Eventos de formularios: form_start, form_submit
   - ✅ Eventos de blog: blog_read, navigation_click
   - ✅ ID de medición configurado en variables de entorno
   
   **Web App (app.tupatrimonio.app):**
   - ✅ GA4 configurado con propiedad separada (G-HKK7H001DB)
   - ✅ Componente GoogleAnalytics.tsx creado
   - ✅ Librería analytics.ts type-safe implementada
   - ✅ Eventos comunes: cta_click, form_submit, navigation_click, external_link_click
   - ✅ Eventos específicos de app web implementados:
     ```typescript
     // Autenticación
     - user_login, user_logout
     
     // Dashboard
     - dashboard_view
     
     // Documentos
     - document_created, document_updated, document_deleted
     
     // Firmas
     - signature_requested, signature_completed
     
     // Verificación
     - verification_started, verification_completed
     
     // Perfil y Pagos
     - profile_updated, payment_initiated, payment_completed
     ```
   - ✅ Configuración de variables de entorno para Vercel
   - ✅ Solo funciona en producción (NODE_ENV=production)
   - ✅ Logs en desarrollo para debugging
   
   **Ventajas de Propiedades Separadas:**
   - Métricas específicas por aplicación
   - Análisis independiente de marketing vs producto
   - Embudos de conversión diferenciados
   - Mejor segmentación de audiencias

2. **✅ Google Search Console - COMPLETADO (27 Oct 2025)**
   - ✅ Propiedad verificada
   - ✅ Sitemap enviado
   - ✅ Monitoreo de coverage activo
   - ✅ Tracking de rankings iniciado

3. **📋 Hotjar / Microsoft Clarity - PENDIENTE**
   ```
   - Heatmaps
   - Session recordings
   - Surveys / feedback polls
   - Focus en landing pages de IA
   ```

4. **📋 SEO Monitoring - PARCIAL**
   ```
   Tools implementados:
   ✅ Google Search Console: Performance
   
   Tools pendientes:
   - Ahrefs / SEMrush: Keyword tracking
   - Screaming Frog: Technical audits
   
   KPIs a trackear semanalmente:
   - Organic traffic
   - Keyword rankings (top 20)
   - Backlinks (nuevos y perdidos)
   - Domain Authority
   - Indexed pages
   - CTR por keyword
   ```

---

### 0.10 Conversion Optimization

**Objetivo:** Maximizar conversión de tráfico orgánico

#### Implementar:

1. **Lead Magnets**
   ```
   General:
   - eBook: "Guía Completa de Digitalización de Documentos"
   - Checklist: "Cómo Elegir Software de Firma Electrónica"
   - Template: "Contrato de Confidencialidad para Firmar"
   - Webinar: "Demostración en Vivo de Firma Electrónica"
   
   IA-específicos: ← NUEVO
   - eBook: "Implementar IA en tu Empresa: Guía Práctica 2025"
   - Template: "100 Prompts para Entrenar tu Chatbot"
   - Checklist: "Red Flags en Contratos: Qué Buscar"
   - Webinar: "IA para Análisis de Contratos: Demo en Vivo"
   - Calculator: "ROI de Automatizar Atención con IA"
   ```

2. **CTAs Estratégicos**
   ```
   Primary CTA: "Empieza Gratis" (no credit card required)
   Secondary CTA: "Ver Demo" (video o calendario)
   Tertiary CTA: "Hablar con Ventas"
   
   IA-specific CTAs: ← NUEVO
   - "Prueba el Chatbot IA"
   - "Analiza un Contrato Gratis"
   - "Ver Demo Interactiva"
   
   Placement:
   - Above the fold
   - Después de cada value prop
   - Al final de blog posts
   - Sticky bar (no intrusivo)
   - Exit intent popup (A/B test)
   ```

3. **Social Proof**
   ```
   - Logos de clientes (con permiso)
   - Testimonios con foto y empresa
   - Reviews de G2/Capterra (embedded)
   - Contador de usuarios/documentos firmados
   - Trust badges (certificaciones, seguridad)
   - Métricas de IA: "X conversaciones atendidas", "X contratos analizados"
   ```

4. **Forms Optimization**
   ```
   Signup form:
   - Minimal fields: Email, Nombre, Empresa
   - Progressive profiling (pedir más después)
   - Single column layout
   - Clear value prop sobre el form
   - Privacy assurance
   
   Demo request (para IA services):
   - Email, Nombre, Empresa, Tamaño empresa
   - "¿Qué te interesa?" → Multiple select
   ```

5. **Interactive Demos** ← NUEVO
   ```
   - Widget de chatbot funcionando en landing
   - Upload documento sample → ver análisis IA
   - Calculadoras interactivas
   - Comparison tools interactivos
   ```

---

### 0.11 Deliverables de Fase 0

**Al finalizar la Fase 0 tendrás:**

✅ **Marketing Website Live:**
- Homepage
- 5 Landing pages específicas (firmas, verificación, notaría, chatbot IA, revisión IA)
- Página de precios (con pricing de servicios IA)
- Sección legal (términos, privacidad)

✅ **Blog Operacional:**
- ✅ 10-15 posts publicados (COMPLETADO Nov 2025)
- 2 pillar articles (1 puede ser sobre IA)
- ✅ CMS configurado
- Pipeline de contenido para 4 meses

✅ **SEO Foundation:**
- Technical SEO impecable (Lighthouse > 95)
- Schema markup implementado
- Analytics y tracking completo
- Google Search Console configurado

✅ **Content Assets:**
- 3-4 lead magnets (eBooks, templates, incluir 1-2 de IA)
- 2 calculadoras interactivas (ROI firma + ROI chatbot)
- Biblioteca de recursos iniciada

✅ **Early Traction:**
- 50-100 visitas orgánicas diarias (optimista)
- 15-25 signups para early access
- Rankings top 20 para 5-7 keywords (incluir keywords IA)
- 5-10 backlinks de calidad

---

### 0.12 Métricas de Éxito para Fase 0

**Semana 4 (fin de fase):**
- ✅ Website live y sin errores técnicos
- ✅ 100% pages indexed en Google
- ✅ Lighthouse score > 90 en todas las páginas
- ✅ 10-15 blog posts publicados (COMPLETADO Nov 2025)
- ✅ 50+ organic visits (cualquier cantidad es inicio)
- ✅ Landing pages de IA con demos funcionales

**Mes 3 (mientras desarrollas Fase 1-2):**
- [ ] 500+ organic visits/mes
- [ ] Rankings top 10 para 3-4 long-tail keywords
- [ ] 100+ signups para waitlist
- [ ] 10+ backlinks de DA > 30
- [ ] 2-3 keywords de IA rankeando top 20

**Mes 6 (mientras desarrollas Fase 3-5):**
- [ ] 2,000+ organic visits/mes
- [ ] Rankings top 5 para keyword principal
- [ ] 500+ waitlist
- [ ] Featured snippet para 1+ query
- [ ] 30+ backlinks de calidad
- [ ] Keywords de IA rankeando top 10

---

## 🌐 **FASE 0: Marketing Web + SEO Foundation (Semanas 1-4)** - **INICIANDO** 🚀

### **Objetivo:** Establecer presencia digital y SEO foundation mientras desarrollamos el backend

**¿Por qué Fase 0 primero?**
1. **SEO toma 3-6 meses** en mostrar resultados
2. **Genera tráfico orgánico** mientras desarrollas el backend
3. **Valida messaging** y value proposition
4. **Construye waitlist** de early adopters
5. **$0 en herramientas adicionales** (usa Supabase existente)

### 0.1 **Implementación Híbrida: Supabase + Hardcodeado**

**Decisión Arquitectónica:**
- **Landing Pages**: Hardcodeadas (performance + SEO óptimo) 
- **Blog**: Supabase tables (dinámico, $0 extra cost)
- **Sin CMS externo**: Speed to market + control total

```sql
-- Blog table en Supabase
CREATE TABLE blog_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  content TEXT NOT NULL,
  excerpt TEXT,
  category TEXT,
  published BOOLEAN DEFAULT false,
  published_at TIMESTAMPTZ DEFAULT NOW(),
  seo_title TEXT,
  seo_description TEXT
);
```

### 0.2 **Landing Pages a Crear (Hardcodeadas)**

1. **Homepage** (`/`) - Value proposition + servicios + CTA
2. **Firmas Electrónicas** (`/firmas-electronicas`) - SEO keyword: "firma electrónica chile"
3. **Verificación Identidad** (`/verificacion-identidad`) - Para compliance/fintechs
4. **Notaría Digital** (`/notaria-digital`) - Disruption modelo tradicional
5. **Precios** (`/precios`) - Planes B2C/B2B diferenciados
6. **Legal** (`/legal/*`) - Términos, privacidad, cookies

### 0.3 **Blog Operacional (Supabase)**

```
Estructura:
/blog - Index con posts recientes
/blog/[slug] - Post individual  
/blog/categoria/[categoria] - Archive por categoría

Categorías iniciales:
- Firma Electrónica
- Verificación de Identidad  
- Notaría Digital
- Compliance
- Guías y Tutoriales
```

### 0.4 **SEO Foundation**

- Metadata API configurada
- Structured data (Schema.org JSON-LD)
- Sitemap XML dinámico (incluye posts de Supabase)
- OpenGraph + Twitter Cards
- Performance optimization (automático con Netlify)

### 0.5 **Timeline Fase 0 (3 semanas)**

```
Semana 1: Structure + Landing Pages
- Monorepo setup
- Homepage + 3 landing principales
- SEO básico

Semana 2: Blog + Content  
- Blog con Supabase
- 5-6 posts iniciales
- Structured data

Semana 3: Deploy + Analytics
- Netlify deploy
- DNS tupatrimonio.app
- Analytics + forms

Al completar Fase 0:
✅ Marketing site live
✅ 6 landing pages SEO-optimizadas 
✅ Blog operacional
✅ Foundation para tráfico orgánico
✅ Waitlist funcionando
```

---

## 🏗️ Fase 1: Fundación (Semanas 5-8) - **DESPUÉS DE FASE 0** 📋

**Nota:** Esta fase ahora comienza en semana 5, permitiendo que el SEO trabaje mientras desarrollas.

### 📊 **Estado Actual del Proyecto (21 Octubre 2025):**

#### ✅ **COMPLETADO (Oct 2025):**
- ✅ Proyecto Supabase configurado y funcionando 
- ✅ **Migración 1**: `20251021120052_enable-pgvector.sql` 
  - pgvector extension habilitado para servicios de IA
  - Preparado para embeddings de chatbot y análisis de documentos
  
- ✅ **Migración 2**: `20251021120854_schema-core.sql` - **FOUNDATION COMPLETA**
  - 📊 **13 tablas principales** implementadas
  - 🏢 **Multi-tenancy nativo**: organizations como partición principal
  - 👥 **Sistema de usuarios**: Integración con Supabase Auth + perfiles extendidos  
  - 🛡️ **Roles jerárquicos**: Con permisos JSONB flexibles
  - 🔗 **Relaciones M:N**: organization_users con roles por organización
  - 👨‍👩‍👧‍👦 **Equipos**: Colaboración interna en organizaciones
  - 🎯 **Ecosistema de apps**: Sistema para habilitar servicios por organización
  - 💳 **Suscripciones**: Base completa para monetización con Stripe
  - 📧 **Invitaciones**: Sistema de invitaciones con tokens y expiración
  - 🔑 **API Keys**: Claves hasheadas con scopes y rate limiting
  - 📝 **Audit trail**: system_events para trazabilidad completa
  - ⚡ **Performance**: 20+ índices optimizados + triggers automáticos
  - 🛡️ **Validaciones**: Constraints robustos + ENUMs consistentes
  - 📚 **Documentación**: Comentarios completos en todas las tablas

- ✅ **Migración 3**: `20251021194734_schema-marketing.sql` - **MARKETING FOUNDATION COMPLETA**
  - 🌐 **8 tablas marketing**: blog_posts, categories, waitlist, contact, faqs, testimonials, newsletter, case_studies
  - 📝 **Blog dinámico**: Sistema completo con categorías y SEO
  - 📧 **Lead capture**: Formularios de waitlist y contacto preparados
  - 🏆 **Social proof**: Testimonials con ratings y gestión
  - 📊 **Analytics ready**: Tracking de engagement y métricas
  - 🛡️ **RLS policies**: Seguridad pública para lectura, autenticado para gestión
  - ⚡ **Performance**: 20+ índices optimizados para marketing queries

#### 🔄 **FASE 0: Marketing Web + SEO Foundation** - **EN PROGRESO** 
- ✅ **Schema marketing completo CREADO** (21 Oct 2025)
  - 8 tablas implementadas: blog_posts, categories, waitlist, contact, faqs, testimonials, newsletter, case_studies
  - RLS policies, índices optimizados, datos iniciales
  - Lead capture y social proof preparados
- ✅ **Monorepo estructura COMPLETADA** (21 Oct 2025)
  - apps/web: Aplicación principal migrada
  - apps/marketing: Nueva aplicación para marketing site
  - Workspaces configurados, Next.js 14+, Shadcn/UI
- ✅ **Marketing site foundation COMPLETADO** (21 Oct 2025)
  - Homepage con hero, servicios, social proof y CTAs
  - Landing page firmas-electronicas (ejemplo SEO-optimizado)
  - Blog dinámico funcionando con Supabase
  - Sitemap dinámico + robots.txt
  - Servidor ejecutándose en puerto 3001
- ✅ **Build y deploy preparation COMPLETADO** (21 Oct 2025)
  - ✅ Errores ESLint corregidos (comillas escapadas, imports, tipos)
  - ✅ Error updateProfile en web app solucionado
  - ✅ next.config.ts configurado para ignorar ESLint durante build
  - ✅ Builds locales funcionando: Marketing ✓ Web ✓
  - ✅ Apps listas para deploy en Netlify
- ✅ **Deploy a Vercel COMPLETADO** (21 Oct 2025)
  - ✅ Marketing site deployado exitosamente
  - ✅ Web app deployada exitosamente  
  - ✅ Monorepo funcionando en producción
  - ✅ Build commands y publish directories configurados correctamente
  - ✅ Variables de entorno configuradas
  - ✅ **Ambas apps live en Vercel** 🚀
- ✅ **Estructura Internacional COMPLETADA** (22 Oct 2025)
  - ✅ Reestructuración por países: /cl/, /co/, /mx/
  - ✅ Content Chile migrado a /cl/ con legislación local
  - ✅ Páginas Colombia y México (próximamente) creadas
  - ✅ Redirects automáticos con detección de país
  - ✅ Sitemap actualizado para SEO internacional
  - ✅ Hreflang y metadata por país configurados
  - ✅ **Marketing site preparado para expansión LATAM** 🌎
- ✅ **Formularios Lead Capture COMPLETADOS** (22 Oct 2025)
  - ✅ WaitlistForm component conectado a marketing.waitlist_subscribers
  - ✅ ContactForm component conectado a marketing.contact_messages
  - ✅ Formularios integrados en páginas Colombia y México
  - ✅ Página de contacto específica para Chile (/cl/contacto)
  - ✅ Tracking por país y fuente de leads
  - ✅ **Lead capture funcionando en producción** 📧
- ✅ **Sistema de Storage para Imágenes del Blog COMPLETADO** (24 Oct 2025)
  - ✅ 6 buckets de storage públicos creados en Supabase
  - ✅ Políticas RLS configuradas (lectura pública, escritura autenticada)
  - ✅ Package @tupatrimonio/utils con helpers de imágenes
  - ✅ Integración en marketing app con blog-images.ts
  - ✅ Campos adicionales en BD (icon_url, content_images)
  - ✅ Placeholders SVG para fallbacks
  - ✅ Documentación completa en DEVELOPMENT.md
  - ✅ **Sistema completo de gestión de imágenes con optimización** 📸
- ✅ **Panel de Administración del Blog COMPLETADO** (25 Oct 2025)
  - ✅ Sistema de roles platform (super_admin + marketing_admin)
  - ✅ Organización "TuPatrimonio Platform" para equipo interno
  - ✅ Función is_platform_admin() en schema public (accesible vía RPC)
  - ✅ Políticas RLS restrictivas (solo platform admins gestionan contenido)
  - ✅ Permisos GRANT configurados correctamente (authenticated rol)
  - ✅ Constraints relajados para desarrollo (contenido min 10 chars)
  - ✅ Middleware de protección de rutas /admin
  - ✅ Página de login con autenticación Supabase
  - ✅ Dashboard con métricas en tiempo real
  - ✅ Lista de posts con tabla interactiva (ver, editar, eliminar)
  - ✅ Editor completo de posts (crear/editar) con Markdown
  - ✅ Upload de imágenes a Supabase Storage
  - ✅ Toggle publicar/borrador
  - ✅ Campos SEO completos (título, descripción)
  - ✅ Validaciones frontend completas
  - ✅ Gestión de categorías (visualización)
  - ✅ Galería de medios (copiar URL, eliminar)
  - ✅ Página de configuración del sistema
  - ✅ Actualizado a @supabase/ssr (versión recomendada)
  - ✅ Componentes Shadcn/UI con diseño TuPatrimonio
  - ✅ **Gestión completa del blog sin necesidad de Supabase Studio** 🎨
- ✅ **Migración Admin Blog a Web App COMPLETADA** (28 Oct 2025)
  - ✅ Admin del blog migrado de apps/marketing a apps/web/dashboard/blog
  - ✅ Hook useBlogManagement.ts centralizado en apps/web
  - ✅ Componentes admin: BlogPostsList, BlogPostEditor, CategoryManagement, MediaGallery
  - ✅ Rutas del dashboard: /dashboard/blog, /dashboard/blog/new, /dashboard/blog/[id]/edit
  - ✅ Gestión de categorías completa con colores y ordenamiento
  - ✅ Sistema de Storage con 6 buckets (blog-featured, blog-content, etc.)
  - ✅ Políticas RLS corregidas: admins ven TODO (borradores e inactivos)
  - ✅ **Administración centralizada en una sola app** 🎯
- ✅ **Sistema de Cálculo de Tiempo de Lectura MEJORADO** (28 Oct 2025)
  - ✅ Limpieza completa de sintaxis Markdown antes de contar palabras
  - ✅ Eliminación de bloques de código, imágenes, enlaces, encabezados
  - ✅ Cálculo basado en 200 palabras por minuto (estándar)
  - ✅ Actualización automática en tiempo real mientras se edita
  - ✅ Recálculo automático al cargar posts existentes
  - ✅ **Precisión mejorada del 60% en cálculo de tiempo de lectura** ⏱️
- ✅ **Sistema de Storage de Imágenes DOCUMENTADO** (28 Oct 2025)
  - ✅ 6 buckets en Supabase Storage: blog-featured (5MB), blog-content (3MB)
  - ✅ blog-categories (1MB), blog-authors (1MB), blog-thumbnails (2MB), blog-meta (2MB)
  - ✅ Políticas RLS: Lectura pública, escritura autenticada
  - ✅ Formatos soportados: JPG, PNG, WEBP, GIF (+ SVG en categories)
  - ✅ Nomenclatura de archivos: timestamp-random.extensión
  - ✅ URLs públicas automáticas vía CDN de Supabase
  - ✅ **Arquitectura de storage clara y escalable** 📦
- ✅ **Estructura de URLs del Blog Mejorada** (25 Oct 2025)
  - ✅ Nueva estructura SEO-friendly: `/blog/[category]/[slug]`
  - ✅ Posts sin categoría usan: `/blog/general/[slug]`
  - ✅ Slugs únicos globalmente (sin duplicados entre categorías)
  - ✅ URLs descriptivas con keyword de categoría
  - ✅ Sitemap actualizado con nueva estructura
  - ✅ Todos los links internos actualizados
  - ✅ Preview dinámico de URL en editor
  - ✅ **Mejor jerarquía de contenido para SEO** 🔗
- ✅ **Structured Data (Schema.org) COMPLETADO** (25 Oct 2025)
  - ✅ Organization schema en homepage
  - ✅ WebSite schema en homepage
  - ✅ Article schema en cada post del blog
  - ✅ BreadcrumbList en cada post del blog
  - ✅ Componente StructuredData reutilizable
  - ✅ Helpers para generar schemas automáticamente
  - ✅ Incluye: autor, fecha, imagen, tiempo de lectura, categoría, word count
  - ✅ URLs dinámicas con categoría en schemas
  - ✅ **Optimizado para Rich Results de Google** 🌟
- ✅ **Build de Producción Corregido** (25 Oct 2025)
  - ✅ Login page con Suspense boundary (fix para useSearchParams)
  - ✅ Sin errores de linting
  - ✅ Compatible con Netlify build process
  - ✅ **Listo para deploy en producción** 🚀
- ✅ **Favicons Personalizados COMPLETADOS** (27 Oct 2025)
  - ✅ Favicons diferenciados para marketing y web apps
  - ✅ Descargadas imágenes desde Supabase Storage (512x512px)
  - ✅ Generados múltiples formatos para soporte completo:
    * favicon.ico (32x32)
    * icon.png (32x32 para navegadores modernos)
    * apple-icon.png (180x180 para iOS)
  - ✅ Archivos colocados en apps/marketing/src/app/ y apps/web/src/app/
  - ✅ Metadata actualizada en ambos layout.tsx
  - ✅ Script automatizado con sharp para generación
  - ✅ **Branding visual completo en ambas aplicaciones** 🎨

#### 📋 **PAUSADO TEMPORALMENTE (Fase 1):**
- 📋 **Migración 3**: Schemas credits + billing (después de Fase 0)
- 📋 Integración GitHub para migraciones automáticas

#### 📋 **ROADMAP DE MIGRACIONES PENDIENTES:**
```
✅ Migración 1: 20251021120052_enable-pgvector.sql
✅ Migración 2: 20251021120854_schema-core.sql
✅ Migración 3: 20251021194734_schema-marketing.sql
✅ Migración 4: 20251024140513_blog-guia-firma-electronica.sql (CONTENT SEED)
✅ Migración 5: 20251024152738_permisos-schema-marketing.sql (PERMISSIONS)
✅ Migración 6: 20251024184320_update-guia-firma-electronica-chile-2025.sql (UPDATE)
✅ Migración 7: 20251024190000_blog-storage-setup.sql (STORAGE BUCKETS)
✅ Migración 8: 20251024191000_add-image-fields-marketing.sql (IMAGE FIELDS)
✅ Migración 9: 20251024194000_platform-organization-setup.sql (PLATFORM ORG + ROLES + RLS)
✅ Migración 10: 20251025002728_mejora-ingreso-admin.sql (FUNCTION PUBLIC SCHEMA)
✅ Migración 11: 20251025011238_politicas-rls-blog.sql (RLS POLICIES UPDATE)
✅ Migración 12: 20251025012425_corrige-permisos-grant.sql (GRANT PERMISSIONS)
✅ Migración 13: 20251025013000_relaja-constraints-blog.sql (CONSTRAINTS FLEXIBILITY)
🔄 Migración 14: 20251028240000_fix_admin_rls_policies.sql (CREADA - PENDIENTE APLICAR)
   - Corrige políticas RLS para que admins vean borradores e inactivos
   - Separa políticas para usuarios anónimos vs autenticados
   - Lectura completa para authenticated, filtrada para anon
📋 Migración 15: schema-credits-billing.sql (PENDIENTE)
📋 Migración 15: schema-services.sql (communications, workflows, files, audit)
📋 Migración 16: schema-business.sql (signatures, verifications, notary, documents)
📋 Migración 17: schema-ai.sql (ai_customer_service, ai_document_review con VECTOR)
📋 Migración 18: schema-analytics.sql (usage_metrics, ai_usage_metrics)
📋 Migración 19: rls-policies.sql (seguridad multi-tenant)
📋 Migración 20: functions-triggers.sql (lógica de negocio)
📋 Migración 21: seed-data.sql (datos iniciales)
```

#### ✅ **PROGRESO FASE 0 - ACTUALIZADO (12 Nov 2025):**

**✅ COMPLETADO - Marketing Site Foundation:**

**1. Estructura y Setup (100% Completado)**
   - ✅ Monorepo completo con apps/marketing + apps/web
   - ✅ Next.js 15.5.6 + TailwindCSS v4 + Shadcn/UI
   - ✅ Sistema de tipografía triple (Josefin Sans, Outfit, Nunito)
   - ✅ Sistema de colores dual (funcional gris + marca vino)
   - ✅ SEO avanzado (metadata API, sitemap dinámico, robots.txt)
   - ✅ Dark mode completo con next-themes

**2. Landing Pages (100% Completado)**
   - ✅ Homepage global con value proposition
   - ✅ Landing `/cl/firmas-electronicas` completa y optimizada
   - ✅ Landing `/cl/notaria-online` completa y optimizada
   - ✅ Landing `/cl/modificaciones-empresa` completa
   - ✅ Landing `/cl/contrato-de-arriendo-online` completa
   - ✅ Landing `/cl/verificacion-identidad` (redirect configurado)
   - ✅ Página `/cl/precios` con planes diferenciados
   - ✅ Páginas legales completas (`/legal/terminos`, `/legal/privacidad`, `/legal/cookies`)

**3. Sistema de Contenido Completo (100% Completado)**
   - ✅ **Blog dinámico** con Supabase
     * Schema `marketing.blog_posts` y `blog_categories`
     * Páginas dinámicas `/blog/[category]/[slug]`
     * Sistema de categorías funcionando
     * Panel admin completo para gestionar posts
   - ✅ **Base de Conocimiento** (Knowledge Base) - NUEVO Nov 2025
     * Schema `marketing.kb_articles` y `kb_categories`
     * Páginas dinámicas `/base-conocimiento/[category]/[slug]`
     * Sistema de categorías independiente
     * Navegación por categorías `/base-conocimiento/categoria/[slug]`
     * Integrado en sitemap dinámico
   - ✅ **Sistema de Gestión de Páginas**
     * API routes para configuración de páginas
     * `marketing.page_config` para gestión dinámica
     * Integración con sitemap automático
     * Estados por país (activo, coming-soon)

**4. Deploy Infrastructure (100% Completado)**
   - ✅ **Ambas apps en Vercel**
     * Marketing app: `tupatrimonio.app`
     * Web app: `app.tupatrimonio.app`
     * Build commands optimizados
     * Variables de entorno configuradas
     * Edge Middleware para geolocalización

**5. Páginas Adicionales (100% Completado) - NUEVO Nov 2025**
   - ✅ `/ayuda` - Centro de ayuda completo con FAQs
   - ✅ `/nosotros` - Página sobre TuPatrimonio
   - ✅ `/contacto` - Formulario de contacto global
   - ✅ `/base-conocimiento` - Hub de artículos KB
   - ✅ Líneas de negocio:
     * `/legal-tech` - Servicios legales digitales
     * `/business-hub` - Soluciones empresariales
     * `/proptech` - Tecnología inmobiliaria
     * `/fintech` - Servicios financieros

**6. Integraciones y APIs (NUEVO Nov 2025)**
   - ✅ **Google Business Reviews**
     * API completa de sincronización
     * Cron job para actualización automática
     * Display de reseñas en landing pages
     * Cache de datos para performance
     * Endpoints: `/api/google-reviews`, `/api/google-stats`
   - ✅ **API de Gestión de Páginas**
     * `/api/pages-config` - Configuración dinámica
     * Sistema de estados por país
     * Integración con sitemap

**7. SEO Avanzado (100% Completado)**
   - ✅ Sitemap dinámico multicapa:
     * Páginas estáticas con prioridades
     * Posts del blog con última modificación
     * Artículos KB con categorías
     * Categorías de ambos sistemas
     * Sistema de gestión de páginas integrado
   - ✅ Prioridades inteligentes por tipo de contenido
   - ✅ Change frequencies optimizadas
   - ✅ Structured data (Organization, WebSite, Article, BreadcrumbList)

#### 📊 **RESUMEN DE PROGRESO FASE 0: ✅ 100% COMPLETADO**

**✅ COMPLETADO (Oct-Nov 2025):**

**Infraestructura y Setup:**
   - ✅ Monorepo completo con 2 apps + packages compartidos
   - ✅ Next.js 15.5.6 + TailwindCSS v4 + Shadcn/UI
   - ✅ Sistema de colores dual y tipografía triple
   - ✅ Dark mode completo
   - ✅ Deploy en Vercel (ambas apps)
   - ✅ PWA funcional en web app

**Marketing Site:**
   - ✅ 8+ landing pages principales para Chile
   - ✅ Estructura internacional (/cl/, /co/, /mx/, /pe/, /ar/)
   - ✅ Detección automática de país
   - ✅ Blog dinámico con categorías
   - ✅ Base de conocimiento completa (NUEVO Nov 2025)
   - ✅ Centro de ayuda
   - ✅ Páginas legales completas
   - ✅ Formularios de lead capture

**Integraciones:**
   - ✅ Google Business Reviews (NUEVO Nov 2025)
   - ✅ Google Analytics 4 (propiedades separadas)
   - ✅ Google Search Console
   - ✅ Sistema de gestión de páginas dinámicas

**SEO:**
   - ✅ Sitemap dinámico multicapa
   - ✅ Structured data completo
   - ✅ Metadata optimizada por página
   - ✅ Robots.txt configurado
   - ✅ Prioridades y change frequencies optimizadas

**Backend (Supabase):**
   - ✅ Schema marketing completo (13+ tablas)
   - ✅ Sistema de blog
   - ✅ Sistema de base de conocimiento
   - ✅ Sistema de reviews
   - ✅ Lead capture y contacto
   - ✅ Storage buckets para imágenes

**✅ COMPLETADO - FASE 0 AL 100%:**

**PRIORIDAD 1: Contenido Real** ✅ COMPLETADO
   - ✅ **Migrar contenido del sitio actual** (COMPLETADO)
     * ✅ Copiar textos de producción actual
     * ✅ Actualizar landing pages con información real
     * ✅ Revisar y optimizar mensajes
   - ✅ **Poblar Blog** (COMPLETADO)
     * ✅ Migrar 10-15 posts existentes
     * ✅ Crear 3-5 posts nuevos sobre servicios
     * ✅ Optimizar imágenes y SEO
   - ✅ **Poblar Base de Conocimiento** (COMPLETADO)
     * ✅ Crear 15-20 artículos iniciales
     * ✅ Organizar por categorías
     * ✅ Optimizar para búsqueda
   - ✅ **Optimización Final** (COMPLETADO)
     * ✅ Revisar todos los textos
     * ✅ Verificar enlaces internos
     * ✅ Testing de formularios
     * ✅ Verificar responsive design

**PRIORIDAD 2: Sistema CRM y Gestión de Correos (3-5 días)** ← NUEVO
   - [ ] **Panel CRM en Dashboard**
     * Vista de lista de contactos (waitlist + formulario contacto)
     * Página de detalle por contacto con toda su información
     * Sistema de estados: nuevo, contactado, calificado, convertido, descartado
     * Filtros por estado, fecha, país, tipo de lead
     * Búsqueda de contactos
     * Sistema de notas y seguimiento
     * Tags personalizables
   - [ ] **Integración Email Workspace**
     * Conectar con Google Workspace o Microsoft 365
     * OAuth para acceso a emails
     * Visualizar correos entrantes en el CRM
     * Responder emails directamente desde dashboard
     * Threading de conversaciones por contacto
     * Templates de respuestas rápidas
     * Firma automática de emails
   - [ ] **Sistema de Notificaciones**
     * Notificación en dashboard cuando llega nuevo lead
     * Email de alerta al equipo comercial
     * Dashboard de leads sin responder
     * Recordatorios de seguimiento
     * Webhook para Slack (opcional)

**PRIORIDAD 3 (Opcional): Sistema de Autenticación Mejorado**
   - [ ] OAuth providers (Google, LinkedIn)
   - [ ] Magic Links
   - [ ] Verificación de correo mejorada
   - [ ] Flujo de onboarding refinado

**NOTA**: El sistema de autenticación básico ya funciona. Esta prioridad es opcional para MVP.

- ✅ **Arquitectura Completa** (Oct-Nov 2025)
  - ✅ Sistema de rutas dinámicas por país (cl, mx, co, pe, ar)
  - ✅ Componentes reutilizables con Shadcn/UI
  - ✅ Verticales de negocio (Legal-Tech, PropTech, Business-Hub, FinTech)
  - ✅ Sistema de detección de país híbrido
  - ✅ Middleware con validación y redirects
  - ✅ 60+ páginas implementadas y funcionando
  - ✅ Build exitoso y deployado en Vercel

**📈 PROGRESO FASE 0: ✅ 100% COMPLETADO** (Actualizado Nov 12, 2025)

**🎉 FASE 0 COMPLETADA AL 100%**
  - ✅ **Contenido real**: COMPLETADO
    * ✅ Migración de contenido existente
    * ✅ Población de blog y KB
    * ✅ Optimización final
  - **Sistema CRM y correos**: OPCIONAL (puede implementarse en Fase 1 o después)
    * Panel de gestión de leads
    * Integración con email workspace
    * Sistema de notificaciones
  - **Sistema de autenticación avanzado**: Opcional para MVP

**🎯 ÚLTIMAS MEJORAS (Nov 2025):**
- ✅ **Sistema de Base de Conocimiento** completo (kb_articles, kb_categories)
- ✅ **Integración Google Business Reviews** con API y cron jobs
- ✅ **Sistema de gestión de páginas dinámicas** con page_config
- ✅ **Sitemap multicapa** con todas las fuentes de contenido
- ✅ **Páginas adicionales**: /ayuda, /nosotros, /contacto, /base-conocimiento
- ✅ **Líneas de negocio**: legal-tech, business-hub, proptech, fintech
- ✅ **APIs robustas** para reviews, stats y configuración
- ✅ **Sistema completo de contenido** listo para población masiva

**🎯 MEJORAS PREVIAS (Oct 2025):**
- ✅ Admin del blog centralizado en apps/web/dashboard/blog
- ✅ RLS policies corregidas para mostrar borradores e inactivos
- ✅ Cálculo de tiempo de lectura mejorado con limpieza de Markdown
- ✅ Arquitectura de storage documentada y funcionando
- ✅ Sistema de colores dual implementado
- ✅ Tipografía triple configurada
- ✅ Dark mode completo
- ✅ PWA funcional

#### 📝 **NOTAS IMPORTANTES:**

**🌐 URLs de Desarrollo:**
- **Marketing Local**: `http://localhost:3001` (comando: `npm run dev:marketing` desde raíz)
- **Web Local**: `http://localhost:3000` (comando: `npm run dev` desde raíz)
- **Supabase Local Studio**: `http://localhost:54323`
- **Netlify Marketing**: https://tupatrimonio.app
- **Netlify Web**: https://app.tupatrimonio.app

**📝 Comandos Útiles:**
```bash
# Desarrollo
npm run dev              # Web app (puerto 3000)
npm run dev:marketing    # Marketing app (puerto 3001)

# Build
npm run build            # Ambas apps + packages
npm run build:marketing  # Solo marketing
npm run build:web        # Solo web

# Build packages compartidos
npm run build:packages   # Todos los packages
```

**📂 Estructura del Proyecto (Actualizada - Oct 27, 2025):**
```
/apps/marketing  # Marketing site (tupatrimonio.app)
├── /src/app
│   ├── page.tsx                 ✅ Homepage global con selector países
│   │
│   ├── /nosotros                ✅ Sobre TuPatrimonio
│   ├── /contacto                ✅ Formulario contacto global
│   │
│   ├── /(country)/[pais]/       ✅ RUTAS DINÁMICAS POR PAÍS (cl, mx, co, pe, ar)
│   │   ├── page.tsx             ✅ Landing parametrizada por país
│   │   ├── /precios             ✅ Precios en moneda local
│   │   └── /contacto            ✅ Contacto con info local
│   │
│   ├── /legal-tech/             ✅ VERTICAL LEGAL TECH
│   │   ├── page.tsx             ✅ Landing del vertical
│   │   ├── /firma-electronica   ✅ Firma electrónica completa
│   │   ├── /tramites-notariales ✅ Notaría digital
│   │   └── /modificaciones-empresa ✅ Cambios societarios
│   │
│   ├── /proptech/               ✅ VERTICAL PROPTECH (landing)
│   ├── /business-hub/           ✅ VERTICAL BUSINESS (landing)
│   ├── /fintech/                ✅ VERTICAL FINTECH (landing)
│   │
│   ├── /recursos/               ✅ HUB DE RECURSOS
│   │   ├── page.tsx             ✅ Centro de recursos
│   │   ├── /guias               ✅ Guías legales
│   │   ├── /calculadoras        ✅ Herramientas cálculo
│   │   └── /plantillas          ✅ Templates documentos
│   │
│   ├── /casos-exito             ✅ Casos de éxito clientes
│   ├── /ayuda                   ✅ Centro de ayuda
│   ├── /faq                     ✅ Preguntas frecuentes
│   │
│   ├── /terminos-y-condiciones  ✅ Términos globales
│   ├── /politica-privacidad     ✅ Política privacidad
│   │
│   ├── /registrarse             ✅ CTA con detección sesión
│   ├── /login                   ✅ CTA con detección sesión
│   ├── /empezar                 ✅ CTA con detección sesión
│   │
│   ├── /blog/                   ✅ Blog compartido entre países
│   │   ├── page.tsx             ✅ Lista dinámica con categorías
│   │   ├── [category]/[slug]/  ✅ Posts individuales con SEO
│   │   └── categoria/[slug]/   ✅ Posts por categoría
│   │
│   ├── /admin/                  ✅ Panel de administración COMPLETO
│   │   ├── dashboard/           ✅ Métricas del blog
│   │   ├── blog/                ✅ Gestión de posts
│   │   ├── media/               ✅ Galería de imágenes
│   │   └── settings/            ✅ Configuración del sistema
│   │
│   ├── /cl/, /co/, /mx/         ✅ Páginas legacy (con redirects)
│   ├── sitemap.ts               ✅ SEO internacional + URLs con categorías
│   ├── robots.ts                ✅ Optimizado para crawling
│   └── middleware.ts            ✅ Protección admin + validación países
│
├── /src/components/
│   ├── CTAWithAuth.tsx          ✅ Detección sesión + redirección
│   ├── CountryRouteWrapper.tsx  ✅ Gestión contenido por país
│   ├── VerticalLayout.tsx       ✅ Layout para verticales
│   ├── VerticalCard.tsx         ✅ Cards reutilizables
│   └── CountryPricingTable.tsx  ✅ Precios por país

/apps/web        # App principal (app.tupatrimonio.app)
└── [Dashboard híbrido B2C/B2B - Fase 1]
```

**🗄️ Base de Datos (Actualizado Nov 2025):**
- **Schema core**: 13 tablas ✅ COMPLETO
  - organizations, users, teams, roles, subscriptions, api_keys, etc.
  - Multi-tenancy nativo con RLS
  - Platform organization configurada
  
- **Schema marketing**: 13+ tablas ✅ COMPLETO
  - **Blog**: blog_posts, blog_categories
  - **Knowledge Base**: kb_articles, kb_categories ← NUEVO Nov 2025
  - **Reviews**: google_reviews, review_stats ← NUEVO Nov 2025
  - **Lead Capture**: waitlist_subscribers, contact_messages
  - **Content**: testimonials, faqs, case_studies
  - **Config**: page_config ← NUEVO Nov 2025
  
- **Storage buckets**: 6 buckets optimizados ✅
  - blog-featured, blog-content, blog-categories
  - blog-authors, blog-thumbnails, blog-meta
  
- **Roles y permisos**: Sistema completo ✅
  - platform_super_admin, marketing_admin
  - Función RPC: public.is_platform_admin()
  - RLS policies completas para todos los schemas

**📦 Packages Compartidos:**
- **@tupatrimonio/location**: Sistema de ubicación ✅ COMPLETO
- **@tupatrimonio/ui**: Componentes Shadcn/UI ✅ COMPLETO
- **@tupatrimonio/utils**: Helpers de imágenes ✅ COMPLETO
- **@tupatrimonio/update-notifier**: Notificaciones de actualizaciones ✅ COMPLETO

**🎯 Siguiente Task**: Escribir contenido para blog y finalizar SEO + DNS

#### 🎉 **LOGROS PRINCIPALES (Oct-Nov 2025):**

**🆕 NUEVAS FUNCIONALIDADES (Nov 2025):**
- ✅ **Sistema de Base de Conocimiento Completo**:
  - Tablas kb_articles y kb_categories
  - Páginas dinámicas con routing SEO-friendly
  - Navegación por categorías
  - Integrado en sitemap automático
  
- ✅ **Integración Google Business Reviews**:
  - API completa de sincronización
  - Cron jobs para actualización automática
  - Display dinámico en landing pages
  - Sistema de cache para performance
  - Endpoints: /api/google-reviews, /api/google-stats
  
- ✅ **Sistema de Gestión de Páginas**:
  - Tabla page_config para configuración dinámica
  - API routes para gestión
  - Estados por país (active, coming-soon)
  - Integración con sitemap
  
- ✅ **Sitemap Multicapa Avanzado**:
  - Páginas estáticas con prioridades
  - Blog posts dinámicos
  - Artículos KB dinámicos
  - Categorías de ambos sistemas
  - Páginas gestionadas desde BD
  
- ✅ **Páginas Adicionales Completas**:
  - /ayuda - Centro de ayuda
  - /nosotros - Sobre TuPatrimonio
  - /contacto - Formulario global
  - /base-conocimiento - Hub KB
  - Líneas de negocio (4 páginas)

**🎯 MEJORAS OCTUBRE 2025:**
- ✅ Migración Admin Blog a apps/web/dashboard/blog
- ✅ Fix RLS Crítico para borradores e inactivos
- ✅ Cálculo de Tiempo de Lectura mejorado (limpieza Markdown)
- ✅ Arquitectura de Storage documentada (6 buckets)
- ✅ Sistema de colores dual implementado
- ✅ Tipografía triple configurada
- ✅ Dark mode completo con next-themes
- ✅ PWA funcional en web app

**🗄️ BACKEND & FOUNDATION:**
- ✅ **15+ migraciones aplicadas** (pgvector + core + marketing + KB + reviews + content + storage + RLS)
- ✅ **3 schemas completos**:
  - Core: 13 tablas (multi-tenant B2C/B2B)
  - Marketing: 13+ tablas (blog + KB + reviews + config)
  - Storage: 6 buckets optimizados
- ✅ **Sistema de roles platform** completo
- ✅ **Modelo híbrido B2C + B2B** implementado
- ✅ **Monorepo enterprise** (2 apps + 4 packages)
- ✅ **Deploy en Vercel** (ambas apps funcionando)
- ✅ **Packages compartidos** (location + ui + utils + update-notifier)
- ✅ **Seguridad robusta** (RLS + GRANT + políticas completas)

**🌍 MARKETING SITE INTERNACIONAL:**
- ✅ **Estructura por países** /cl/, /co/, /mx/, /pe/, /ar/
- ✅ **8+ landing pages Chile**:
  - Homepage, firmas electrónicas, notaría online
  - Modificaciones empresa, contrato arriendo
  - Verificación identidad, precios, legales
- ✅ **Páginas globales**:
  - /ayuda, /nosotros, /contacto
  - /base-conocimiento (KB completo)
  - Líneas de negocio (4 páginas)
- ✅ **Páginas próximamente** para otros países con waitlists
- ✅ **Blog dinámico** con Supabase (categorías + posts)
- ✅ **Base de Conocimiento** con categorías y artículos (NUEVO Nov 2025)
- ✅ **URLs SEO-friendly** para todo el contenido
- ✅ **SEO internacional** completo (hreflang, sitemap, redirects)
- ✅ **Structured Data** en todas las páginas

**📧 LEAD CAPTURE SYSTEM:**
- ✅ **WaitlistForm + ContactForm** components funcionando
- ✅ **Formularios conectados** a marketing schema (waitlist_subscribers + contact_messages)
- ✅ **Tracking por país** y fuente de leads
- ✅ **Páginas de contacto** específicas por mercado

**📸 SISTEMA DE IMÁGENES DEL BLOG:**
- ✅ **4 buckets de storage** organizados (marketing-images, public-assets, documents, ai-training-data)
- ✅ **Políticas RLS diferenciadas** (público vs privado, platform admins)
- ✅ **Transformaciones automáticas** (resize, format, quality) via Supabase
- ✅ **Campos adicionales en BD** (icon_url en categories, content_images en posts)
- ✅ **Documentación completa** con ejemplos y workflow
- ✅ **Upload integrado** en panel admin

**🎨 PANEL DE ADMINISTRACIÓN DEL BLOG:**
- ✅ **Ubicación**: apps/web/dashboard/blog (centralizado con otros dashboards)
- ✅ **Sistema de autenticación** con @supabase/ssr (versión recomendada)
- ✅ **Middleware de protección** (solo platform admins acceden)
- ✅ **Dashboard con métricas** (total posts, publicados, borradores, categorías)
- ✅ **Lista de posts** con tabla interactiva y acciones (ver, editar, eliminar)
- ✅ **Editor completo** de posts con Markdown y preview
- ✅ **Upload de imágenes** integrado a Storage (6 buckets)
- ✅ **Gestión de SEO** (título, descripción optimizados con contadores)
- ✅ **Toggle publicar/borrador** con confirmaciones
- ✅ **Validaciones frontend** (título, contenido, slug)
- ✅ **Auto-generación de slugs** desde título
- ✅ **Preview de URLs dinámico** con categoría incluida
- ✅ **Gestión de categorías** (CRUD completo con colores y ordenamiento)
- ✅ **Galería de medios** (visualizar, copiar URL, eliminar imágenes)
- ✅ **Página de configuración** (info del sistema)
- ✅ **Componentes Shadcn/UI** con diseño TuPatrimonio
- ✅ **Navegación intuitiva** (sidebar + header + logout)
- ✅ **Schema marketing** explícito en todas las queries
- ✅ **Políticas RLS corregidas** (admins ven borradores e inactivos)
- ✅ **Cálculo preciso de tiempo de lectura** con limpieza de Markdown
- ✅ **Gestión sin Supabase Studio** - 100% desde frontend

**🎨 BRANDING Y ANALYTICS:**
- ✅ **Google Analytics 4** configurado y recabando datos (27-28 Oct 2025)
  - **Marketing App (tupatrimonio.app):**
    * Componente GoogleAnalytics.tsx implementado
    * Librería analytics.ts con helpers type-safe
    * Eventos: cta_click, form_submit, blog_read, navigation_click
    * Configurado en Vercel
  - **Web App (app.tupatrimonio.app):**
    * GA4 con propiedad separada (G-HKK7H001DB)
    * Componente GoogleAnalytics.tsx creado
    * Librería analytics.ts extendida con eventos específicos:
      - Autenticación: user_login, user_logout
      - Dashboard: dashboard_view
      - Documentos: document_created, document_updated, document_deleted
      - Firmas: signature_requested, signature_completed
      - Verificación: verification_started, verification_completed
      - Perfil/Pagos: profile_updated, payment_initiated, payment_completed
    * Configurado para Vercel (variable de entorno)
    * Type-safe con TypeScript
    * Solo funciona en producción
    * Logs en desarrollo para debugging
  - **Ventajas:** Métricas separadas por aplicación, análisis independiente, mejor segmentación
- ✅ **Google Search Console** configurado y verificado
- ✅ **Favicons personalizados** en ambas apps (marketing + web)
  - Descarga automática desde Supabase Storage
  - Generación con Sharp en múltiples formatos (ico, png, apple-icon)
  - Metadata configurada en layout.tsx
  - Branding visual diferenciado por aplicación

**🔧 CONFIGURACIÓN VERCEL (Web App):**
- ✅ **Headers de seguridad** migrados a next.config.ts (28 Oct 2025)
  - X-Frame-Options, XSS-Protection, Content-Type-Options
  - Headers específicos para dashboard (no-index, no-cache)
  - Headers para PWA (service workers, manifest, version, icons)
  - Headers para autenticación (no-cache)
- ✅ **Redirects** migrados a next.config.ts
  - /signin → /login
  - /signup → /login
  - /register → /login
- ✅ **Middleware de autenticación** mejorado
  - Manejo de raíz (/) con detección de sesión
  - Protección de rutas /dashboard/*
  - Redirección inteligente según estado de autenticación
  - Rutas públicas definidas (/login, /auth, /404)
- ✅ **Documentación VERCEL-CONFIG.md** creada
  - Guía completa de configuración
  - Variables de entorno
  - Diferencias Netlify vs Vercel
  - Troubleshooting
- ✅ **Sistema de Notificaciones de Actualización COMPLETADO** (28 Oct 2025)
  - ✅ **Problema identificado y solucionado**: Archivos version.json estáticos no estaban siendo servidos (404)
  - ✅ **API Routes dinámicas implementadas**: `/src/app/version.json/route.ts` en ambas apps
  - ✅ **Packages rebuildeados**: update-notifier y ui con mejoras incluidas
  - ✅ **Testing completo**: Sistema funcionando con logging limpio
  - ✅ **Configuración simplificada**: Removida lógica compleja de generación de archivos estáticos
  - ✅ **Documentación organizada**: Documentación movida a `docs/update-notifications/`
  - ✅ **Sistema limpio y funcional**: Consola sin logs verbosos, funcionamiento silencioso
  - ✅ **BUG FIX CRÍTICO - BUCLE INFINITO SOLUCIONADO** (28 Oct 2025)
    * **PROBLEMA**: API routes generaban versión nueva con `Date.now()` en cada request
    * **CAUSA**: Cada verificación de actualización detectaba nueva versión → popup infinito
    * **SOLUCIÓN**: Cambié a versiones estables usando `SERVER_START_TIME` y `BUILD_ID` 
    * **IMPLEMENTACIÓN**: Variables generadas al iniciar servidor (no per request)
    * **ARCHIVOS**: `apps/marketing/src/app/version.json/route.ts` + `apps/web/src/app/version.json/route.ts`
    * **LÓGICA**: Usa `process.env.VERCEL_GIT_COMMIT_SHA` o `NEXT_BUILD_ID` como base
    * **RESULTADO**: Popup solo aparece con deployments reales, no bucle infinito
  - 🎯 **Resultado**: Sistema de notificaciones 100% funcional en ambas aplicaciones
  - 📂 **Documentación**: Ver `docs/update-notifications/` para detalles técnicos

**📈 PROGRESO FASE 0: ✅ 100% COMPLETADO** (Actualizado Nov 12, 2025)

**🎉 FASE 0 COMPLETADA AL 100% 🎉**

**✅ COMPLETADOS en Nov 2025:**
- ✅ Sistema de Base de Conocimiento completo
- ✅ Integración Google Business Reviews
- ✅ Sistema de gestión de páginas dinámicas
- ✅ Sitemap multicapa con todas las fuentes
- ✅ Páginas adicionales y líneas de negocio
- ✅ APIs robustas
- ✅ **Migración de contenido del sitio actual**
- ✅ **Blog poblado con 10-15 posts reales**
- ✅ **Base de conocimiento con 15-20 artículos**
- ✅ **Optimización final completada**
- ✅ **Testing completo realizado**

**✅ COMPLETADOS en Oct 2025:**
- ✅ Google Analytics 4 + Search Console
- ✅ Favicons personalizados
- ✅ Deploy completo en Vercel
- ✅ Arquitectura de URLs y routing
- ✅ Sistema de colores y tipografía
- ✅ Dark mode + PWA

**📋 OPCIONAL (para implementar después):**

**1. CRM Básico (puede implementarse en Fase 1)**
   - Panel de visualización de leads
   - Integración email workspace
   - Sistema de notificaciones

**2. Auth Avanzado (Opcional para MVP)**
   - OAuth providers
   - Magic Links
   - Mejoras UX

**✅ FASE 0 COMPLETA AL 100%**
**🚀 Próximo paso: INICIAR FASE 1 - Backend Foundation**

**📅 Última actualización: 12 Noviembre 2025**

**🔄 MIGRACIÓN A VERCEL (Web App):**
- ✅ **Headers** migrados de netlify.toml a next.config.ts
- ✅ **Redirects** migrados de netlify.toml a next.config.ts
- ✅ **Middleware** actualizado con lógica mejorada de autenticación
- ✅ **Variables de entorno** configuradas para Vercel Dashboard
- ✅ **Documentación completa** en VERCEL-CONFIG.md
- ✅ **Sin linter errors** - código limpio y funcionando

**📋 DESPUÉS DE COMPLETAR FASE 0 → INICIAR FASE 1 (Backend Foundation):**

**Criterios para considerar Fase 0 COMPLETA:**
1. ✅ Sistema de login básico funcionando (YA COMPLETADO)
2. ✅ Contenido real migrado y optimizado (COMPLETADO - Nov 2025)
3. ✅ Landing pages con información definitiva (COMPLETADO - Nov 2025)
4. ✅ Blog poblado con posts reales (COMPLETADO - Nov 2025)
5. ✅ KB poblado con artículos (COMPLETADO - Nov 2025)
6. ⏳ **Sistema CRM para gestión de leads** (OPCIONAL - 3-5 días) ← NUEVO
7. ⏳ **Integración email workspace** (OPCIONAL - 3-5 días) ← NUEVO
8. ✅ SEO y analytics funcionando (YA COMPLETADO)
9. ✅ Infraestructura técnica lista (YA COMPLETADO)
10. ✅ Todas las páginas implementadas (YA COMPLETADO)

**Tareas de Fase 1 (después de completar contenido y CRM básico):**
- [ ] Completar schemas credits + billing
- [ ] Mejorar dashboard apps/web (B2C/B2B)
- [ ] RLS policies adicionales
- [ ] Funciones y triggers de negocio
- [ ] Integración con servicios externos (Stripe, etc.)
- [ ] Expandir funcionalidades del CRM (reportes, automatizaciones)

**🎯 ENFOQUE ACTUAL:**
- ✅ **Fase 0**: COMPLETADA AL 100%
- 🚀 **PRÓXIMO PASO**: Iniciar Fase 1 - Backend Foundation
  - Completar schemas credits + billing
  - Mejorar dashboard apps/web (B2C/B2B)
  - RLS policies adicionales
  - Funciones y triggers de negocio
  - Integración con servicios externos (Stripe, etc.)

---

### 1.1 Configuración Inicial del Proyecto

**Objetivo:** Establecer la base técnica del proyecto (simplificada)

#### Tareas:
1. **Setup de Repositorio Simple**
   - Monorepo con npm workspaces
   - ESLint + Prettier básico
   - **Deploy automático**: Netlify + Supabase manejan CI/CD
   - **Estructura simple:** 
     ```
     /apps/marketing (tupatrimonio.app)
     /apps/web (app.tupatrimonio.app)
     /packages/* (compartidos)
     ```

2. **✅ Configuración de Supabase (COMPLETADO)**
   - ✅ Proyecto creado en Supabase
   - ✅ **pgvector extension habilitado** (migración aplicada)
   - ✅ **Schema CORE creado** con todas las tablas multi-tenant
   - 🔄 Conectar con GitHub para migraciones automáticas (PENDIENTE)
   - 🔄 Configurar Storage buckets con políticas de acceso (PENDIENTE)
   - 🔄 Implementar Row Level Security (RLS) (PENDIENTE)

3. **Configuración de Next.js - Monorepo Simple**
   ```
   /apps/web                    # Aplicación principal (app.tupatrimonio.app)
   /apps/marketing              # Marketing site (tupatrimonio.app)
   /packages/ui                 # Componentes compartidos Shadcn/UI
   /packages/database           # Types de Supabase
   /packages/utils              # Utilidades compartidas
   /packages/config             # Configuraciones compartidas
   /packages/ai                 # Utilidades de IA (futuro)
   ```

4. **Variables de Entorno**
   ```
   # Supabase
   NEXT_PUBLIC_SUPABASE_URL
   NEXT_PUBLIC_SUPABASE_ANON_KEY
   SUPABASE_SERVICE_ROLE_KEY

   # Servicios externos
   STRIPE_SECRET_KEY
   STRIPE_WEBHOOK_SECRET
   DLOCAL_SECRET_KEY
   SENDGRID_API_KEY
   TWILIO_ACCOUNT_SID
   TWILIO_AUTH_TOKEN
   VERIFF_API_KEY
   AWS_ACCESS_KEY_ID / FIREBASE_CONFIG

   # IA Services ← NUEVO
   OPENAI_API_KEY
   ANTHROPIC_API_KEY
   OPENAI_ORG_ID
   AI_MODEL_DEFAULT=claude-3-5-sonnet-20241022

   # App
   NEXT_PUBLIC_APP_URL
   NEXT_PUBLIC_MARKETING_URL
   JWT_SECRET
   ENCRYPTION_KEY
   ```

### 1.2 ✅ Modelado de Base de Datos - Schema Core (COMPLETADO)

**Objetivo:** ✅ Implementar el corazón del sistema multi-tenant híbrido B2C + B2B

#### 🏢➕🏠 **Modelo Híbrido B2C + B2B** ← ACTUALIZADO

**Concepto Principal:** 
Mismo sistema para usuarios individuales (B2C) y empresas (B2B) usando "organizaciones personales" automáticas.

##### **Tipos de Organizaciones:**
```sql
-- Modificación requerida al schema
ALTER TABLE core.organizations 
ADD COLUMN org_type TEXT DEFAULT 'business' 
CHECK (org_type IN ('personal', 'business', 'platform'));

ALTER TABLE core.organization_users
ADD COLUMN is_personal_org BOOLEAN DEFAULT false;
```

##### **Organización Platform (Super Admin):**
```sql
-- Organización especial para administradores de la plataforma
INSERT INTO core.organizations (
  name: "TuPatrimonio Platform",
  slug: "tupatrimonio-platform", 
  org_type: "platform",
  settings: {
    "is_platform_org": true,
    "system_organization": true,
    "can_access_all_orgs": true
  }
)
```

##### **Roles de Plataforma:**
```sql
-- Roles específicos para la organización platform
core.roles:
1. "platform_super_admin" → Acceso total al sistema
2. "platform_admin" → Soporte técnico  
3. "platform_billing" → Solo facturación y pagos
```

##### **Flujos de Usuario:**

**B2C (Usuario Individual):**
- Al registrarse: Sistema crea automáticamente "organización personal"
- Usuario = owner de su org personal  
- UI simplificada (sin gestión de equipos)
- Planes: Personal Free ($0), Pro ($9), Business ($29)

**B2B (Empresa):**
- Al registrarse: Crea organización empresarial
- Puede invitar usuarios con roles
- UI completa (teams, admin, etc.)
- Planes: Team Starter ($49), Business ($199), Enterprise (Custom)

**Platform Admin (Nosotros):**
- Organización especial "TuPatrimonio Platform"
- Vista "de Dios" de todo el sistema
- Puede acceder a cualquier organización para soporte

##### **Registro con Intención Clara:**
```typescript
// Pantalla de registro con opciones claras
¿Cómo vas a usar TuPatrimonio?

🏠 Uso Personal
   "Para mis documentos personales, freelance o proyectos individuales"
    
🏢 Uso Empresarial  
   "Para mi empresa o equipo de trabajo"
    
🔗 Tengo una invitación
   "Alguien me invitó a su organización"
```

##### **Ventajas del Modelo Híbrido:**
✅ Misma arquitectura para ambos segmentos
✅ Usuario B2C puede "upgradear" a B2B  
✅ Mercado más amplio (individuales + empresas)
✅ Sistema de créditos/IA unificado
✅ No duplicar código ni infraestructura

#### ✅ Implementación COMPLETADA:
1. **✅ Schema `core` CREADO** - Migración: `20251021120854_schema-core.sql`
   ```sql
   ✅ COMPLETADO - 13 tablas principales:
   - users (integración con Supabase Auth + perfil extendido)
   - organizations (multi-tenant base con settings JSONB)
   - organization_users (relación M:N con roles)
   - teams + team_members (colaboración)
   - roles (jerarquía + permisos JSONB)
   - applications (servicios del ecosistema) 
   - organization_applications (apps habilitadas por org)
   - subscription_plans + organization_subscriptions (monetización)
   - invitations (sistema de invitaciones con tokens)
   - api_keys (claves hasheadas con scopes)
   - system_events (audit trail completo)
   
   BONUS implementado:
   - ✅ 5 ENUMs para status consistentes
   - ✅ 20+ índices optimizados para performance
   - ✅ Triggers automáticos para updated_at
   - ✅ Constraints robustos con validaciones
   - ✅ Documentación completa con comentarios
   ```

#### 🔄 PRÓXIMOS PASOS TÉCNICOS (Consolidado desde Setup):

**2. Configuración Supabase Completa:**
   - 🔄 Conectar con GitHub para migraciones automáticas
   - 🔄 Configurar Storage buckets:
     * `documents` (privado, RLS)
     * `public-assets` (público) 
     * `ai-training-data` (privado)

**3. RLS Policies (Multi-tenant Híbrido):**
   - Usuario solo ve sus organizaciones
   - Usuario solo ve miembros de sus organizaciones  
   - Solo org_admin puede modificar configuraciones
   - Solo org_owner puede eliminar organización
   - Platform admin puede acceder a todas las orgs

**4. Functions y Triggers:**
   - `create_organization()`: Crea org + asigna owner + detecta tipo
   - `invite_user()`: Genera token + envía invitación
   - `accept_invitation()`: Agrega usuario a org
   - `update_user_last_seen()`: Trigger automático
   - Functions para manejo de créditos

**5. Datos Semilla:**
   - Roles estándar (incluir roles platform: platform_super_admin, platform_admin, platform_billing)
   - Aplicaciones del ecosistema (incluir ai_customer_service y ai_document_review)
   - Planes de suscripción diferenciados B2C/B2B
   - **Organización platform "TuPatrimonio Platform"**
   - Super admin inicial
   - Credit prices para servicios IA

**6. Stack y Configuración:**
   ```
   GitHub → Netlify (Frontend + CI/CD automático)
   GitHub → Supabase (Database + migraciones automáticas)
   
   Monorepo Structure:
   /apps/marketing      # Marketing site (tupatrimonio.app)
   /apps/web           # App principal (app.tupatrimonio.app) 
   /packages/ui        # Componentes compartidos Shadcn/UI
   /packages/database  # Types de Supabase
   /packages/utils     # Utilidades compartidas
   /packages/config    # Configuraciones
   /packages/ai        # Utilidades de IA (futuro)
   ```

**7. Variables de Entorno Esenciales:**
   ```bash
   # Supabase
   NEXT_PUBLIC_SUPABASE_URL=
   NEXT_PUBLIC_SUPABASE_ANON_KEY=
   SUPABASE_SERVICE_ROLE_KEY=
   
   # IA Services
   OPENAI_API_KEY=
   ANTHROPIC_API_KEY=
   AI_MODEL_DEFAULT=claude-3-5-sonnet-20241022
   
   # App URLs
   NEXT_PUBLIC_APP_URL=https://app.tupatrimonio.app
   NEXT_PUBLIC_MARKETING_URL=https://tupatrimonio.app
   
   # Platform Configuration
   PLATFORM_ORG_ID=
   DEFAULT_PERSONAL_ORG_SETTINGS={}
   
   # Servicios externos (placeholder)
   STRIPE_SECRET_KEY=
   SENDGRID_API_KEY=
   TWILIO_ACCOUNT_SID=
   VERIFF_API_KEY=
   ```

### 1.3 Sistema de Autenticación - **FASE 0 PENDIENTE** 🔄

**Objetivo:** Auth robusto con múltiples métodos y verificación completa

#### 📋 Estado Actual:
- ✅ Login básico con email/password funcionando
- ❌ **Verificación de email incompleta** (se solicita pero no está configurada)
- ❌ Magic Links no implementados
- ❌ OAuth providers no configurados
- ❌ SMS OTP no implementado

#### 🎯 Tareas Pendientes (PRIORIDAD 1 - FASE 0):

1. **✅ Configurar Verificación de Email en Supabase**
   ```typescript
   Pasos:
   - Configurar email templates en Supabase Dashboard
   - Personalizar template de verificación con branding TuPatrimonio
   - Configurar redirect URL después de verificación
   - Implementar página /verify-email con estado de verificación
   - Testing completo del flujo de verificación
   - Documentar proceso para usuarios
   ```

2. **✅ Implementar Magic Links (Passwordless)**
   ```typescript
   - Configurar Supabase Auth para magic links
   - Crear UI para solicitar magic link
   - Email template para magic link
   - Página de confirmación /auth/confirm
   - Testing del flujo completo
   ```

3. **✅ Agregar OAuth Providers**
   ```typescript
   Providers a implementar:
   - Google OAuth (prioridad alta - más usado)
   - LinkedIn OAuth (para B2B)
   
   Configuración:
   - Crear apps en Google Cloud Console
   - Crear app en LinkedIn Developers
   - Configurar redirect URLs en Supabase
   - Implementar botones de OAuth en /login y /register
   - Manejar callback en /auth/callback
   - Vincular OAuth accounts a organizaciones existentes
   ```

4. **⚠️ SMS OTP via Twilio (Opcional - Baja Prioridad)**
   ```typescript
   - Configurar Twilio account
   - Implementar custom auth provider
   - UI para ingresar número telefónico
   - Flujo de verificación SMS
   - Rate limiting para prevenir spam
   ```

5. **✅ Mejorar Flujo de Onboarding Post-Registro**
   ```typescript
   - Página de bienvenida después del registro
   - Guía rápida de primeros pasos
   - Detectar si viene de OAuth o email/password
   - Redirección inteligente según tipo de usuario (B2C vs B2B)
   ```

6. **Middleware de Next.js (Mejorado)**
   ```typescript
   // middleware.ts - Actualizar
   - Verificar sesión en cada request ✅ (ya implementado)
   - Redireccionar rutas protegidas ✅ (ya implementado)
   - Inyectar org_id en headers para RLS
   - Manejar usuarios no verificados
   - Redirect a /verify-email si no está verificado
   ```

7. **Auth Helpers (Completar)**
   ```typescript
   - getSession() ✅ (ya implementado)
   - getCurrentUser() ✅ (ya implementado)
   - getCurrentOrganization() ⚠️ (implementar)
   - hasPermission() ⚠️ (implementar)
   - switchOrganization() ⚠️ (implementar)
   - isEmailVerified() ⚠️ (implementar)
   ```

8. **Páginas de Auth (Completar y Mejorar)**
   - `/login` ✅ (existente, mejorar con OAuth buttons)
   - `/register` ⚠️ (crear o mejorar)
   - `/verify-email` ❌ (crear)
   - `/reset-password` ❌ (crear)
   - `/accept-invitation/:token` ❌ (crear para Fase 1)
   - `/auth/callback` ✅ (existente, verificar funcionamiento)
   - `/auth/confirm` ❌ (crear para magic links)

#### ⏱️ Estimación de Tiempo:
- Verificación de email: 1-2 días
- Magic Links: 1 día
- OAuth (Google + LinkedIn): 2-3 días
- Mejoras UI y testing: 1-2 días
- **Total: ~1 semana**

#### 🎯 Criterio de Completitud:
- ✅ Usuario puede registrarse y verificar email
- ✅ Usuario puede hacer login con Google
- ✅ Usuario puede hacer login con LinkedIn
- ✅ Usuario puede usar magic link (opcional pero recomendado)
- ✅ Flujo de onboarding claro y sin fricciones
- ✅ Middleware maneja correctamente todos los estados
- ✅ Testing completo de todos los flujos
- ✅ Documentación para usuarios

### 1.4 Dashboard Base y Navegación

**Objetivo:** UI foundation con cambio de contexto organizacional

#### Implementación:
1. **Layout Principal**
   - Sidebar con navegación (incluir secciones de IA)
   - Organization Switcher (dropdown)
   - User menu
   - Notification bell (placeholder)

2. **Dashboard Home**
   - Widgets de métricas básicas
   - Actividad reciente
   - Quick actions (incluir "Hablar con IA" y "Analizar documento")

3. **Componentes Base (Shadcn/UI)**
   ```
   - Button, Input, Select, Checkbox, etc.
   - DataTable (con sorting, filtering, pagination)
   - Modal, Sheet, Dialog
   - Toast notifications
   - Command palette (Cmd+K)
   - Chat widget component (para customer service) ← NUEVO
   - Document viewer component (para review results) ← NUEVO
   ```

4. **Configuración de Temas**
   - Light/Dark mode
   - Persistencia en user.preferences

---

## 🔧 Fase 2: Sistema de Créditos y Facturación (Semanas 11-16) 

**Nota:** ✅ Schema core ya completado, podemos proceder directamente con credits + billing

### 2.1 Schema Credits + Billing - **PRÓXIMO EN COLA** 🔄

**Objetivo:** Sistema de monetización completo

#### Implementación:
1. **✅ Schema `core` YA COMPLETADO** (organizations, subscription_plans, organization_subscriptions)
2. **🔄 Crear schemas `credits` y `billing`** - **SIGUIENTE MIGRACIÓN**
   ```sql
   Credits:
   - credit_accounts
   - credit_transactions
   - credit_packages
   - credit_prices (incluir precios para servicios IA) ← ACTUALIZADO

   Billing:
   - payment_methods
   - invoices
   - invoice_line_items
   - payments
   - tax_rates
   ```

2. **Credit Prices para IA Services** ← NUEVO
   ```sql
   -- Precios específicos para servicios de IA
   INSERT INTO credits.credit_prices (service_code, application_code, operation, credit_cost) VALUES
   ('ai_chat_message', 'ai_customer_service', 'send_message', 0.5),
   ('ai_chat_message_kb', 'ai_customer_service', 'send_message_with_kb', 1.0),
   ('ai_document_review_page', 'ai_document_review', 'review_page', 2.0),
   ('ai_document_review_full', 'ai_document_review', 'review_document', 10.0),
   ('ai_document_compare', 'ai_document_review', 'compare_documents', 15.0);
   ```

3. **Integración Stripe**
   ```typescript
   - setupIntent para guardar payment methods
   - Webhooks: payment_intent.succeeded, customer.subscription.*
   - Manejo de 3D Secure
   - Sincronización de invoices
   ```

4. **Integración dLocal Go**
   ```typescript
   - Flujo para LATAM
   - Métodos locales: Khipu, Mercado Pago, etc.
   - Webhooks para confirmaciones
   - Fallback a Stripe si dLocal falla
   ```

5. **Lógica de Créditos**
   ```typescript
   - reserveCredits(): Bloquea créditos antes de operación
   - confirmCredits(): Confirma uso después de éxito
   - releaseCredits(): Libera si falla operación
   - reloadCredits(): Desde suscripción o compra
   - calculateAICost(): Calcula costo basado en tokens/páginas ← NUEVO
   ```

### 2.2 UI de Facturación

**Objetivo:** Experiencia de usuario para gestión de pagos

#### Páginas:
1. **`/billing/overview`**
   - Balance de créditos
   - Próxima factura
   - Métodos de pago guardados
   - Usage por servicio (incluir desglose de IA)

2. **`/billing/purchase-credits`**
   - Paquetes disponibles
   - Calculadora de créditos (con estimación de uso IA)
   - Checkout flow

3. **`/billing/invoices`**
   - Lista de facturas
   - Descarga PDF
   - Historial de pagos

4. **`/billing/payment-methods`**
   - Agregar/Eliminar métodos
   - Marcar como default

5. **`/billing/subscription`**
   - Plan actual
   - Upgrade/Downgrade
   - Cancelación

6. **`/billing/usage`** ← NUEVO
   - Gráficos de uso por servicio
   - Breakdown de créditos consumidos
   - Proyección de gasto mensual
   - Export de data

**Paralelamente durante Fase 2:**
- Continuar publicando 2 blog posts/semana (incluir 1 sobre IA cada 2 semanas)
- Optimizar landings según analytics
- Responder comentarios y engagement en blog
- Guest posting (1-2 artículos, uno sobre IA)

---

## 📧 Fase 3: Comunicaciones y CRM (Semanas 17-22)

> **📝 NOTA IMPORTANTE (Nov 2025):** Se implementará una **versión básica del CRM** al final de Fase 0 para gestionar los leads de los formularios y conectar el email del workspace. Esta sección describe el CRM completo que se desarrollará en Fase 3 con funcionalidades avanzadas.

**CRM Básico Fase 0 (3-5 días):**
- Vista de contactos de formularios
- Sistema de estados básico
- Integración con email workspace (Google/Microsoft)
- Responder correos desde dashboard
- Notificaciones de nuevos leads

**CRM Completo Fase 3 (descrito abajo):**
- Gestión avanzada de contactos
- Pipelines de ventas
- Campañas de email marketing
- Automatizaciones
- Reportes y analytics

---

### 3.1 Schema Communications

**Objetivo:** Sistema completo de comunicación con usuarios

#### Implementación:
1. **Crear schema `communications`**
   ```sql
   - contacts
   - contact_activities
   - contact_lists
   - contact_list_members
   - message_templates
   - campaigns
   - messages
   - message_events
   - user_notifications
   - sales_pipelines
   - deals
   ```

2. **Integración SendGrid**
   ```typescript
   - Wrapper para API de SendGrid
   - Sistema de templates (almacenar localmente, enviar variables)
   - Procesar webhooks: delivered, opened, clicked, bounced
   - Retry logic con exponential backoff
   - Rate limiting según plan de SendGrid
   ```

3. **Motor de Templates**
   ```typescript
   - Template engine (Handlebars o similar)
   - Variables dinámicas: {{user.name}}, {{organization.credits}}
   - Versionado de templates
   - Preview antes de enviar
   ```

4. **Sistema de Notificaciones**
   ```typescript
   - createNotification(): In-app + opcional email/SMS
   - markAsRead()
   - Supabase Realtime para notificaciones live
   - Agrupación de notificaciones similares
   - Notificaciones específicas de IA (ej: "Tu análisis está listo") ← NUEVO
   ```

### 3.2 UI de CRM

**Objetivo:** Herramientas de gestión de contactos y ventas

#### Páginas:
1. **`/crm/contacts`**
   - Lista con filtros avanzados
   - Importar desde CSV
   - Enriquecimiento de datos
   - Tag: "interesado_en_ai", "usa_chatbot", etc. ← NUEVO

2. **`/crm/contacts/:id`**
   - Perfil de contacto
   - Timeline de actividades
   - Deals asociados
   - Enviar email/SMS
   - Uso de servicios de IA (si aplica) ← NUEVO

3. **`/crm/campaigns`**
   - Crear campaña
   - Segmentación de audiencia (incluir "usuarios de IA")
   - A/B testing (futuro)
   - Analytics de campaña

4. **`/crm/pipelines`**
   - Kanban de deals
   - Drag & drop entre stages
   - Métricas de conversión

5. **`/settings/email-templates`**
   - CRUD de templates
   - Editor visual
   - Variables disponibles

**Paralelamente durante Fase 3:**
- Lanzar primer pillar content piece sobre IA
- Comenzar link building activo
- Crear primer lead magnet interactivo (calculadora ROI chatbot)
- A/B testing de CTAs en landings

---

## ⚙️ Fase 4: Workflows y Manejo de Errores (Semanas 23-28)

### 4.1 Schema Workflows

**Objetivo:** Sistema de automatización tipo Make.com

#### Implementación:
1. **Crear schema `workflows`**
   ```sql
   - workflows
   - workflow_executions
   - workflow_execution_steps
   - error_logs
   - service_health
   - circuit_breakers
   - retry_queue
   - webhooks
   - webhook_deliveries
   ```

2. **Motor de Ejecución**
   ```typescript
   WorkflowEngine:
   - Interpreta JSON definition
   - Ejecuta nodos secuencialmente/paralelo
   - Maneja condiciones y branches
   - Implementa circuit breakers
   - Retry logic con backoff
   - Timeout handling
   ```

3. **Tipos de Nodos**
   ```typescript
   - Trigger: webhook, schedule, event, manual
   - Action: api_call, email, create_record, update_record
   - Condition: if/else basado en datos
   - Transform: mapear/transformar datos
   - Delay: esperar X tiempo
   - Loop: iterar sobre array
   - AI Action: call_chatbot, analyze_document ← NUEVO
   ```

4. **Monitoreo de Servicios**
   ```typescript
   HealthCheck Service:
   - Ping cada servicio externo cada 5min (incluir APIs de IA)
   - Registrar en service_health
   - Abrir circuit breaker si falla threshold
   - Alertar a admins
   - Dashboard de estado
   ```

5. **Sistema de Reintentos**
   ```typescript
   RetryQueue Processor:
   - Job queue (BullMQ o similar)
   - Procesar retry_queue periódicamente
   - Estrategias: immediate, linear, exponential
   - Max attempts configurable
   - Dead letter queue para fallos permanentes
   ```

### 4.2 UI de Workflows

**Objetivo:** Visual workflow builder

#### Páginas:
1. **`/workflows`**
   - Lista de workflows
   - Filtros por status/trigger
   - Quick actions
   - Templates pre-hechos (incluir templates con IA) ← NUEVO

2. **`/workflows/builder`**
   - Drag & drop node-based editor (React Flow)
   - Panel de nodos disponibles (incluir nodos de IA)
   - Configuración por nodo
   - Test workflow
   - Save & Activate

3. **`/workflows/:id/executions`**
   - Historial de ejecuciones
   - Timeline de pasos
   - Logs detallados (incluir tokens usados si hay IA)
   - Retry manual

4. **`/monitoring/services`**
   - Dashboard de salud
   - Circuit breakers status
   - Error rate por servicio (incluir OpenAI/Anthropic)
   - Latency graphs

5. **`/monitoring/errors`**
   - Log explorer
   - Filtros por severity/service
   - Marcar como resuelto
   - Export logs

**Workflow Templates Sugeridos con IA:** ← NUEVO
```
1. "Auto-responder con IA"
   Trigger: Nuevo mensaje en chat
   → Analizar intención con IA
   → Si confianza > 80%: Responder automáticamente
   → Si confianza < 80%: Transferir a humano

2. "Análisis de contrato + notificación"
   Trigger: Nuevo documento subido
   → Analizar con IA Document Review
   → Si riesgo > "medium": Notificar equipo legal
   → Crear tarea en CRM

3. "Seguimiento inteligente de leads"
   Trigger: Lead descarga recurso
   → Analizar comportamiento con IA
   → Enviar email personalizado según perfil
   → Asignar a sales rep apropiado
```

**Paralelamente durante Fase 4:**
- Segundo cluster de contenido (sobre IA)
- Case studies de beta users
- Webinar o demo en vivo (enfoque en automatización con IA)
- Actualizar contenido según feedback

---

## 📁 Fase 5: Gestión de Archivos y Storage (Semanas 29-33)

### 5.1 Schema Files + Integración Storage

**Objetivo:** Sistema centralizado de archivos con versionado

#### Implementación:
1. **Crear schema `files`**
   ```sql
   - file_storage
   - file_versions
   - file_shares
   ```

2. **Abstracción de Storage**
   ```typescript
   StorageProvider Interface:
   - upload(file, path)
   - download(path)
   - delete(path)
   - getSignedUrl(path, expiresIn)
   - listVersions(path)

   Implementaciones:
   - SupabaseStorageProvider
   - S3StorageProvider
   - FirebaseStorageProvider
   ```

3. **Versionado Automático**
   ```typescript
   - Cada update crea nueva versión
   - Mantener X versiones (configurable)
   - Limpieza automática de versiones antiguas
   - Restaurar versión anterior
   ```

4. **Seguridad de Archivos**
   ```typescript
   - Virus scanning (ClamAV via Lambda/Cloud Function)
   - Encriptación en reposo (KMS)
   - Signed URLs con expiración
   - Watermarks para documentos sensibles
   ```

5. **Optimizaciones (Supabase + Netlify Automático)**
   ```typescript
   // Automático con Supabase Storage:
   - Compresión de imágenes
   - Generación de thumbnails
   - CDN global automático
   
   // Configurar manualmente:
   - OCR para documentos (preparación para IA Review)
   ```

### 5.2 UI de Gestión de Archivos

**Objetivo:** Drive-like experience

#### Páginas:
1. **`/files`**
   - Vista de lista/grid
   - Drag & drop upload
   - Carpetas virtuales (tags)
   - Preview modal
   - Quick actions: "Analizar con IA" ← NUEVO

2. **`/files/:id`**
   - Detalles del archivo
   - Historial de versiones
   - Compartir con usuarios/links
   - Actividad reciente
   - Análisis de IA (si aplica) ← NUEVO

---

## 🔐 Fase 6: Auditoría y Compliance (Semanas 34-38)

### 6.1 Schema Audit

**Objetivo:** Trazabilidad completa para compliance

#### Implementación:
1. **Crear schema `audit`**
   ```sql
   - audit_logs
   - compliance_documents
   - user_consents
   - data_retention_policies
   ```

2. **Audit Logging Automático**
   ```typescript
   - Middleware que registra toda acción sensible
   - Trigger en BD para cambios críticos
   - Capturar: user, org, action, resource, changes, IP, timestamp
   - Inmutable: solo INSERT
   - Registrar uso de IA (qué modelo, tokens, prompts si corresponde) ← NUEVO
   ```

3. **Compliance Tools**
   ```typescript
   - Exportar datos de usuario (GDPR)
   - Anonimizar usuario
   - Eliminar datos según retention policy
   - Generar reporte de compliance
   - Auditoría de uso de IA (transparencia) ← NUEVO
   ```

4. **Gestión de Consentimientos**
   ```typescript
   - Banner de cookies
   - Términos y condiciones con versionado
   - Registro de aceptación con IP y timestamp
   - Revocación de consentimientos
   - Consentimiento de uso de IA para análisis ← NUEVO
   ```

### 6.2 UI de Auditoría

**Objetivo:** Herramientas para compliance officers

#### Páginas:
1. **`/audit/logs`**
   - Log explorer avanzado
   - Filtros: user, resource, date range, action
   - Export a CSV/JSON
   - Filtro específico: "AI usage" ← NUEVO

2. **`/audit/data-requests`**
   - GDPR requests
   - Procesar solicitudes de datos
   - Timeline de procesamiento

3. **`/settings/compliance`**
   - Políticas de retención
   - Documentos legales activos
   - Estadísticas de consentimientos
   - Transparency report (uso de IA) ← NUEVO

---

## 🎯 Fase 7: Servicios de Negocio - Firmas Electrónicas (Semanas 39-46)

### 7.1 Schema Signatures + Integración Veriff

**Objetivo:** Primer servicio core del ecosistema

#### Implementación:
1. **Crear schema `signatures`**
   ```sql
   - signature_documents
   - signature_signers
   - signature_workflows
   - signature_templates
   - signature_certificates
   ```

2. **Integración Veriff**
   ```typescript
   - Iniciar sesión de verificación
   - Webhook para resultados
   - Almacenar evidencias en files schema
   - Link con user en core schema
   ```

3. **Flujo de Firma**
   ```typescript
   CreateSignatureRequest:
   1. Upload documento → files schema
   2. Agregar firmantes
   3. (Opcional) Verificar identidad con Veriff
   4. Enviar invitaciones → communications schema
   5. Tracking de firmas
   6. Generar certificado final
   7. Notarizar (si aplica) → notary schema
   8. Consumir créditos → credits schema
   ```

4. **Tipos de Firma**
   ```typescript
   - Firma Simple (email verification)
   - Firma Avanzada (SMS OTP via Twilio)
   - Firma con Certificado (integración CA)
   - Firma Biométrica (Veriff)
   ```

### 7.2 UI de Firmas

**Objetivo:** Experiencia fluida de firma de documentos

#### Páginas:
1. **`/signatures`**
   - Documentos pendientes/completados
   - Crear nuevo documento
   - Templates

2. **`/signatures/new`**
   - Upload documento
   - Agregar firmantes
   - Configurar orden de firma
   - Establecer deadline
   - Preview

3. **`/signatures/:id`**
   - Estado del documento
   - Tracking de firmantes
   - Preview del documento
   - Descargar certificado

4. **`/sign/:token`**
   - Página pública para firmar
   - Verificación de identidad
   - Canvas de firma
   - Confirmar firma

5. **`/settings/signature-templates`**
   - Templates de documentos
   - Campos predefinidos

**Nota:** Al lanzar este servicio, actualizar:
- Landing de firmas con features reales
- Blog post anunciando lanzamiento
- Case studies de early adopters
- Video tutorial completo

---

## 🔍 Fase 8: Servicios Complementarios (Semanas 47-60)

### 8.1 App-Verifications (Semanas 47-49)

**Objetivo:** Sistema de verificación de identidad standalone

#### Implementación:
1. **Schema `verifications`**
   ```sql
   - verification_requests
   - verification_results
   - verification_documents
   - identity_records
   ```

2. **Lógica de Negocio**
   - Crear request → llamar Veriff
   - Procesar webhooks
   - Almacenar resultados + evidencia
   - Marcar user como verificado en core schema

3. **API Endpoints**
   ```typescript
   POST /api/verifications/start
   GET /api/verifications/:id/status
   GET /api/verifications/:id/result
   ```

### 8.2 App-Notary (Semanas 50-52)

**Objetivo:** Servicios notariales digitales

#### Implementación:
1. **Schema `notary`**
   ```sql
   - notary_certificates
   - notary_timestamps
   - notary_chains
   ```

2. **Lógica de Negocio**
   - Timestamp notarial
   - Hash del documento
   - Blockchain anchoring (opcional)
   - Certificado de autenticidad

### 8.3 App-Documents Editor (Semanas 53-55)

**Objetivo:** Editor colaborativo de documentos

#### Implementación:
1. **Schema `documents`**
   ```sql
   - documents
   - document_collaborators
   - document_comments
   - document_versions (linked to files schema)
   ```

2. **Editor**
   - Integrar TipTap o similar
   - Colaboración en tiempo real (Supabase Realtime)
   - Track changes
   - Comentarios

### 8.4 App-Real Estate Consulting (Semanas 56-57)

**Objetivo:** CRM específico para inmobiliarias

#### Implementación:
1. **Schema `real_estate`**
   ```sql
   - properties
   - property_visits
   - property_offers
   - property_documents
   ```

2. **Features específicas**
   - Catálogo de propiedades
   - Gestión de visitas
   - Pipeline de ofertas
   - Documentos asociados

### 8.5 App-Property Administration (Semanas 58-60)

**Objetivo:** Gestión de arriendos y condominios

#### Implementación:
1. **Schema `property_admin`**
   ```sql
   - rental_contracts
   - tenants
   - payment_schedules
   - maintenance_requests
   - common_expenses
   ```

---

## 🤖 **Fase 9: Servicios de IA - Customer Service (Semanas 61-66)**

### **Objetivo:** Chatbot inteligente 24/7 para atención al cliente

Esta es una fase crítica ya que es uno de los diferenciadores principales del producto.

### 9.1 Schema AI Customer Service

**Objetivo:** Base de datos para chatbot conversacional

#### Implementación:

1. **Crear schema `ai_customer_service`**
   ```sql
   -- Habilitar pgvector extension primero
   CREATE EXTENSION IF NOT EXISTS vector;
   
   -- Tablas principales
   - chatbot_configurations
   - knowledge_bases
   - knowledge_base_chunks (con columna VECTOR)
   - conversations
   - conversation_messages
   - conversation_feedback
   - chatbot_analytics
   ```

2. **Configuración de pgvector**
   ```sql
   -- Índice para búsqueda vectorial eficiente
   CREATE INDEX ON ai_customer_service.knowledge_base_chunks 
   USING ivfflat (embedding vector_cosine_ops)
   WITH (lists = 100);
   ```

3. **Integración OpenAI/Anthropic**
   ```typescript
   AIProvider Interface:
   - chat(messages, model, options)
   - embed(text, model)
   - streamChat(messages, model, onChunk)
   
   Implementaciones:
   - OpenAIProvider (GPT-4)
   - AnthropicProvider (Claude 3.5 Sonnet) - RECOMENDADO
   
   Razones para Claude:
   - Mejor comprensión de contexto largo
   - Menos alucinaciones
   - Mejor en español
   - Más económico para uso intensivo
   ```

4. **Sistema RAG (Retrieval Augmented Generation)**
   ```typescript
   RAGEngine:
   - ingestDocument(document) → chunks → embeddings
   - searchSimilar(query, topK) → relevant chunks
   - buildContext(chunks) → formatted context
   - generateResponse(query, context) → answer
   
   Pipeline:
   1. Usuario pregunta
   2. Embed pregunta
   3. Buscar chunks similares (cosine similarity)
   4. Construir contexto con top 5 chunks
   5. Enviar a LLM con contexto
   6. Recibir respuesta fundamentada
   ```

5. **Knowledge Base Management**
   ```typescript
   KnowledgeBaseService:
   - addDocument(file) → parse → chunk → embed → store
   - updateDocument(id, newContent)
   - deleteDocument(id)
   - syncFromURL(url) → scrape → process
   - syncFromNotion(notionPageId)
   
   Chunking strategies:
   - Fixed size: 500 tokens con 50 overlap
   - Semantic: Por párrafos/secciones
   - Recursive: Dividir recursivamente si muy grande
   ```

6. **Conversation Management**
   ```typescript
   ConversationService:
   - startConversation(userId, channel)
   - sendMessage(conversationId, content)
   - getHistory(conversationId, limit)
   - transferToHuman(conversationId, reason)
   - endConversation(conversationId)
   
   Features:
   - Context window management (últimos 10 mensajes)
   - Intent detection
   - Sentiment analysis
   - Escalation triggers
   ```

7. **Channels Integration**
   ```typescript
   Channels a soportar:
   - Web Widget (embeddable)
   - WhatsApp Business (Twilio)
   - Slack
   - Telegram (futuro)
   - Email (futuro)
   
   Abstracción:
   ChannelAdapter Interface:
   - sendMessage(to, message)
   - receiveMessage(webhook)
   - supports(messageType)
   ```

### 9.2 UI de AI Customer Service

**Objetivo:** Configuración y monitoreo del chatbot

#### Páginas:

1. **`/ai/chat/dashboard`**
   ```
   Métricas principales:
   - Conversaciones hoy/semana/mes
   - Tasa de resolución (AI vs humano)
   - Tiempo promedio de respuesta
   - Satisfaction score
   - Top intents detectados
   - Gráficos de uso por hora
   ```

2. **`/ai/chat/conversations`**
   ```
   Features:
   - Lista de conversaciones (filtros: estado, channel, fecha)
   - Live conversations (en tiempo real)
   - Takeover: Admin puede tomar control
   - Transcript export
   - Tags y categorización
   ```

3. **`/ai/chat/conversations/:id`**
   ```
   Vista detallada:
   - Transcript completo
   - Metadata: duración, mensajes, canal
   - Intent tracking
   - Sentiment timeline
   - Sources used (qué chunks de KB)
   - Feedback del usuario
   - Actions: Transfer, Close, Add note
   ```

4. **`/ai/chat/knowledge-base`**
   ```
   Gestión de conocimiento:
   - Lista de documentos/URLs ingresados
   - Upload nuevo documento
   - Sync desde URL (scheduled)
   - Integración Notion
   - Previsualizar chunks
   - Test search (debugging)
   - Analytics: chunks más usados
   ```

5. **`/ai/chat/knowledge-base/:id`**
   ```
   Detalle de documento:
   - Metadata
   - Content preview
   - Chunks breakdown
   - Usage stats
   - Re-index button
   - Delete con confirmación
   ```

6. **`/ai/chat/settings`**
   ```
   Configuración del chatbot:
   
   General:
   - Nombre del bot
   - Avatar
   - Bienvenida
   - Horario de operación
   
   AI Configuration:
   - Model selection (GPT-4, Claude 3.5)
   - Temperature (0-1)
   - Max tokens
   - System prompt customization
   
   Personality:
   - Tone (profesional, casual, friendly)
   - Language (es-CL, es-MX, en)
   - Custom instructions
   
   Escalation Rules:
   - Confidence threshold para transferir
   - Keywords que disparan transferencia
   - Usuarios/equipos para asignar
   
   Channels:
   - Enable/disable por canal
   - Configuración específica (WhatsApp number, etc.)
   ```

7. **`/ai/chat/training`**
   ```
   Mejora continua:
   - Conversaciones para revisar
   - Thumbs up/down feedback
   - Correcciones sugeridas
   - Add to training set
   - Fine-tuning dashboard (futuro)
   ```

8. **`/ai/chat/widget`**
   ```
   Configuración del widget embebible:
   - Customización visual (colores, posición)
   - Configuración de behavior
   - Code snippet para copiar
   - Preview en vivo
   ```

### 9.3 Widget Embebible

**Objetivo:** Chatbot fácil de integrar en cualquier sitio

#### Implementación:

```html
<!-- Código que el cliente pega en su sitio -->
<script src="https://tupatrimonio.app/widgets/ai-chat-widget.js"></script>
<script>
  TuPatrimonioChat.init({
    organizationId: 'org_123',
    chatbotId: 'bot_456',
    position: 'bottom-right', // o 'bottom-left'
    theme: 'light', // o 'dark'
    primaryColor: '#0070f3',
    locale: 'es-CL'
  })
</script>
```

**Features del widget:**
- Bubble indicator (para abrir chat)
- Chat window con historial
- Typing indicators
- Message status (sent, delivered, read)
- File attachments (si está habilitado)
- Emoji support
- Responsive
- Accessibility (ARIA labels, keyboard navigation)

### 9.4 Lógica de Negocio Avanzada

#### Implementación:

1. **Intent Detection**
   ```typescript
   // Detectar intención del usuario
   const intents = {
     'pricing_inquiry': ['precio', 'costo', 'cuánto cuesta', 'plan'],
     'technical_support': ['error', 'no funciona', 'problema', 'bug'],
     'sales_inquiry': ['comprar', 'contratar', 'demo', 'prueba'],
     'cancellation': ['cancelar', 'dar de baja', 'terminar suscripción']
   }
   
   function detectIntent(message: string): Intent {
     // Usar embeddings similarity o keyword matching
     // Priorizar intents que requieren escalación
   }
   ```

2. **Confidence Scoring**
   ```typescript
   function shouldEscalate(response: AIResponse): boolean {
     if (response.confidence < 0.6) return true
     if (detectSensitiveTopic(response.message)) return true
     if (userRequestsHuman(response.userMessage)) return true
     return false
   }
   ```

3. **Context Management**
   ```typescript
   // Mantener contexto relevante sin explotar token limit
   function buildConversationContext(
     conversationId: string,
     maxMessages: number = 10
   ): Message[] {
     const messages = getRecentMessages(conversationId, maxMessages)
     
     // Summarize older messages if needed
     if (messages.length > maxMessages) {
       const summary = summarizeMessages(messages.slice(0, -maxMessages))
       return [
         { role: 'system', content: `Resumen de conversación previa: ${summary}` },
         ...messages.slice(-maxMessages)
       ]
     }
     
     return messages
   }
   ```

4. **Cost Tracking**
   ```typescript
   async function trackAIUsage(
     conversationId: string,
     messageId: string,
     tokensUsed: { prompt: number, completion: number }
   ) {
     const totalTokens = tokensUsed.prompt + tokensUsed.completion
     const creditCost = calculateCreditCost(totalTokens, hasKBSearch)
     
     await reserveAndConfirmCredits(organizationId, creditCost, {
       service: 'ai_customer_service',
       operation: 'send_message',
       metadata: { conversationId, messageId, tokensUsed }
     })
   }
   ```

### 9.5 Testing y Quality Assurance

#### Test Suite:

```typescript
// Test de knowledge base
test('Knowledge base retrieval', async () => {
  const query = "¿Cuál es el precio del plan Pro?"
  const results = await searchKnowledgeBase(query, topK: 3)
  
  expect(results).toHaveLength(3)
  expect(results[0].similarity).toBeGreaterThan(0.7)
  expect(results[0].content).toContain('plan Pro')
})

// Test de respuesta
test('AI generates relevant response', async () => {
  const context = getRelevantChunks("pricing question")
  const response = await generateResponse(userMessage, context)
  
  expect(response.confidence).toBeGreaterThan(0.7)
  expect(response.message).not.toContain('[PLACEHOLDER]')
  expect(response.sources).toHaveLength.greaterThan(0)
})

// Test de escalación
test('Escalates low confidence responses', async () => {
  const response = { confidence: 0.5, message: '...' }
  expect(shouldEscalate(response)).toBe(true)
})
```

### 9.6 Monitoring y Observability

#### Métricas a Trackear:

```typescript
// Performance metrics
- Average response time
- P95, P99 response times
- Token usage per conversation
- Cost per conversation

// Quality metrics
- Confidence score distribution
- Escalation rate
- CSAT score
- Resolution rate

// Usage metrics
- Conversations per hour
- Messages per conversation
- Active conversations
- Channel distribution

// Error tracking
- API failures (OpenAI/Anthropic)
- Embedding failures
- Knowledge base search failures
- Widget loading errors
```

### 9.7 Optimizaciones

#### Implementar:

1. **Caching**
   ```typescript
   // Cache de embeddings frecuentes
   const embeddingCache = new Map<string, number[]>()
   
   // Cache de respuestas a preguntas comunes
   const responseCache = new TTLCache({
     ttl: 3600, // 1 hora
     maxSize: 1000
   })
   ```

2. **Streaming Responses**
   ```typescript
   // Para mejor UX, hacer streaming de respuestas
   async function* streamChatResponse(prompt: string) {
     const stream = await anthropic.messages.stream({
       model: 'claude-3-5-sonnet-20241022',
       messages: [{ role: 'user', content: prompt }],
       max_tokens: 1024,
     })
     
     for await (const chunk of stream) {
       if (chunk.type === 'content_block_delta') {
         yield chunk.delta.text
       }
     }
   }
   ```

3. **Batch Processing**
   ```typescript
   // Procesar embeddings en batch para eficiencia
   async function batchEmbed(texts: string[]): Promise<number[][]> {
     const batchSize = 20
     const batches = chunk(texts, batchSize)
     
     const results = await Promise.all(
       batches.map(batch => openai.embeddings.create({
         model: 'text-embedding-ada-002',
         input: batch
       }))
     )
     
     return results.flatMap(r => r.data.map(d => d.embedding))
   }
   ```

**Paralelamente durante Fase 9:**
- Blog posts sobre el lanzamiento del chatbot IA
- Case study de beta users usando chatbot
- Video tutorial: "Configura tu chatbot en 10 minutos"
- Actualizar landing de AI Customer Service con features reales

---

## 🤖 **Fase 10: Servicios de IA - Document Review (Semanas 67-74)**

### **Objetivo:** Análisis automático de documentos legales/comerciales con IA

### 10.1 Schema AI Document Review

**Objetivo:** Base de datos para análisis de documentos

#### Implementación:

1. **Crear schema `ai_document_review`**
   ```sql
   - review_templates
   - document_reviews
   - review_results
   - review_annotations
   - review_feedback
   - review_comparisons
   - training_feedback
   ```

2. **No necesita pgvector** (diferente approach que chatbot)
   - Análisis más estructurado
   - Usa prompts específicos por tipo de documento
   - Focus en extracción y análisis, no en búsqueda semántica

3. **Integración con Vision Models**
   ```typescript
   // Para documentos escaneados o PDFs complejos
   AIVisionProvider Interface:
   - analyzeDocument(file, instructions)
   - extractText(file)
   - extractTables(file)
   - detectLayout(file)
   
   Implementaciones:
   - GPT-4-Vision (OpenAI)
   - Claude 3 Opus (mejor para documentos largos)
   ```

4. **Document Processing Pipeline**
   ```typescript
   DocumentReviewPipeline:
   
   1. Upload & Validation
      - Verificar formato (PDF, DOCX, images)
      - Validar tamaño (max 50MB)
      - Extraer metadata
   
   2. Text Extraction
      - Si PDF: usar pdf.js o pdfplumber
      - Si DOCX: usar mammoth
      - Si imagen: OCR con Tesseract o Vision API
      - Preservar estructura (headers, lists, tables)
   
   3. Preprocessing
      - Limpiar texto
      - Identificar secciones
      - Extraer tablas
      - Detectar idioma
   
   4. AI Analysis
      - Seleccionar template apropiado
      - Construir prompt con criteria
      - Enviar a LLM (Claude 3.5 Sonnet recomendado)
      - Parse structured response
   
   5. Post-processing
      - Calcular risk score
      - Generar anotaciones
      - Extraer red flags
      - Crear recomendaciones
   
   6. Storage
      - Guardar resultados
      - Link a documento original
      - Generar PDF report
   ```

5. **Template System**
   ```typescript
   ReviewTemplate {
     name: "Revisión de Contrato Comercial",
     documentType: "contract",
     reviewCriteria: {
       sectionsToExtract: [
         "payment_terms",
         "delivery_terms",
         "warranties",
         "liability_limits",
         "termination_clauses",
         "dispute_resolution"
       ],
       redFlags: [
         {
           id: "unlimited_liability",
           pattern: /liability.{0,50}unlimited/i,
           severity: "critical",
           description: "Contrato establece responsabilidad ilimitada"
         },
         {
           id: "auto_renewal",
           pattern: /auto.{0,20}renew/i,
           severity: "high",
           description: "Cláusula de renovación automática"
         }
       ],
       complianceChecks: [
         "gdpr_mention",
         "force_majeure_clause",
         "intellectual_property_rights"
       ]
     },
     promptTemplate: `
       Analiza el siguiente contrato comercial.
       
       Documento:
       {document_text}
       
       Por favor:
       1. Extrae las siguientes secciones: {sections}
       2. Identifica cualquier red flag de esta lista: {red_flags}
       3. Verifica cumplimiento de: {compliance_checks}
       4. Asigna un risk score (0-100)
       5. Proporciona recomendaciones
       
       Responde en formato JSON estructurado.
     `
   }
   ```

6. **AI Analysis Logic**
   ```typescript
   async function analyzeDocument(
     documentId: string,
     templateId: string
   ): Promise<ReviewResult> {
     
     // 1. Get document and template
     const doc = await getDocument(documentId)
     const template = await getTemplate(templateId)
     
     // 2. Extract text
     const text = await extractText(doc.file)
     
     // 3. Build prompt
     const prompt = buildPrompt(template, text)
     
     // 4. Call AI (chunked if document is long)
     const chunks = splitIntoChunks(text, maxTokens: 100000)
     const analyses = await Promise.all(
       chunks.map(chunk => 
         claude.messages.create({
           model: 'claude-3-5-sonnet-20241022',
           max_tokens: 4096,
           messages: [{
             role: 'user',
             content: prompt.replace('{document_text}', chunk)
           }]
         })
       )
     )
     
     // 5. Merge and structure results
     const mergedResult = mergeAnalyses(analyses)
     const structuredResult = parseAIResponse(mergedResult)
     
     // 6. Calculate scores
     structuredResult.overallScore = calculateRiskScore(structuredResult)
     structuredResult.riskLevel = categorizeRisk(structuredResult.overallScore)
     
     // 7. Generate annotations
     const annotations = generateAnnotations(structuredResult, doc)
     
     return {
       ...structuredResult,
       annotations,
       metadata: {
         tokensUsed: calculateTokens(analyses),
         processingTime: Date.now() - startTime,
         aiModel: 'claude-3-5-sonnet'
       }
     }
   }
   ```

7. **Structured Output Parsing**
   ```typescript
   interface AIReviewResponse {
     extracted_sections: {
       [key: string]: {
         content: string
         location: string // "Section 5.2, Page 8"
         analysis: string
       }
     }
     red_flags: Array<{
       type: string
       severity: 'low' | 'medium' | 'high' | 'critical'
       location: string
       description: string
       recommendation: string
     }>
     compliance_status: {
       [key: string]: {
         compliant: boolean
         details: string
       }
     }
     risk_assessment: {
       overall_score: number // 0-100
       category_scores: {
         financial_risk: number
         legal_risk: number
         operational_risk: number
       }
       justification: string
     }
     recommendations: Array<{
       priority: 'low' | 'medium' | 'high'
       action: string
       rationale: string
     }>
   }
   ```

### 10.2 UI de AI Document Review

**Objetivo:** Análisis visual e interactivo de documentos

#### Páginas:

1. **`/ai/review/dashboard`**
   ```
   Métricas principales:
   - Documentos analizados hoy/semana/mes
   - Average risk score
   - Top red flags detectados
   - Tiempo promedio de análisis
   - Distribución por tipo de documento
   - Satisfaction score de usuarios
   ```

2. **`/ai/review/reviews`**
   ```
   Lista de revisiones:
   - Filtros: status, risk level, document type, date
   - Columnas: Documento, Tipo, Risk Score, Status, Fecha
   - Quick actions: Ver, Re-analizar, Exportar
   - Bulk actions: Comparar, Exportar múltiples
   ```

3. **`/ai/review/new`**
   ```
   Iniciar nueva revisión:
   
   Step 1: Upload
   - Drag & drop o seleccionar archivo
   - Múltiples archivos soportados
   - Preview del documento
   
   Step 2: Select Template
   - Grid de templates disponibles
   - "Contrato Comercial", "NDA", "Arrendamiento", etc.
   - Preview de qué se analizará
   
   Step 3: Configure (opcional)
   - Ajustar criteria específicos
   - Agregar custom red flags
   - Set priority
   
   Step 4: Review & Submit
   - Resumen de configuración
   - Estimación de tiempo/costo
   - Submit
   ```

4. **`/ai/review/reviews/:id`**
   ```
   Vista de resultados (dos paneles):
   
   Panel Izquierdo: Documento
   - PDF viewer o document renderer
   - Anotaciones highlighteadas
   - Click en anotación → scroll a ubicación
   - Zoom, navegación por páginas
   
   Panel Derecho: Análisis
   
   Tab "Overview":
   - Risk Score (visual gauge)
   - Executive Summary
   - Key Findings (top 3-5)
   - Quick Stats
   
   Tab "Sections":
   - Accordion de secciones extraídas
   - Cada sección:
     * Contenido extraído
     * Análisis
     * Location en documento
     * Risk indicator
   
   Tab "Red Flags":
   - Lista de issues encontrados
   - Agrupados por severity
   - Cada flag:
     * Descripción
     * Ubicación (clickeable)
     * Recomendación
     * Mark as "Reviewed" o "False Positive"
   
   Tab "Recommendations":
   - Lista priorizada de acciones
   - Checkbox para marcar completadas
   - Assign to team member
   - Add notes
   
   Tab "Compliance":
   - Checklist de compliance items
   - Status por item
   - Details/evidence
   
   Actions:
   - Download PDF Report
   - Share with team
   - Request Human Review (escalar a abogado)
   - Compare with another version
   - Re-analyze with different template
   ```

5. **`/ai/review/reviews/:id/annotate`**
   ```
   Vista de anotación (fullscreen):
   - Document viewer grande
   - Toolbar de anotación:
     * Add comment
     * Highlight text
     * Add sticky note
     * Draw rectangle/circle
   - AI annotations en un color
   - User annotations en otro color
   - Sidebar con lista de annotations
   - Save & Export
   ```

6. **`/ai/review/compare`**
   ```
   Comparar documentos:
   - Seleccionar 2-3 documentos
   - Side-by-side view
   - Diff highlighting
   - AI analysis de diferencias
   - "What changed?" summary
   - Risk comparison table
   ```

7. **`/ai/review/templates`**
   ```
   Gestión de templates:
   - Lista de templates (system + custom)
   - Create new template:
     * Name, description
     * Document type
     * Sections to extract (list)
     * Red flags patterns (list)
     * Compliance checks (list)
     * Custom prompt instructions
   - Edit existing
   - Duplicate
   - Test template (upload sample doc)
   - Usage stats por template
   ```

8. **`/ai/review/templates/:id/edit`**
   ```
   Editor de template:
   - Visual builder
   - Add/remove sections
   - Define red flag patterns (regex or plain text)
   - Configure compliance checks
   - Prompt preview
   - Test section (run on sample)
   - Save & Activate
   ```

9. **`/ai/review/training`**
   ```
   Feedback loop para mejorar:
   - Reviews que necesitan corrección
   - User feedback: "Was this accurate?"
   - Corrections:
     * Mark false positive
     * Add missed red flag
     * Correct extraction
   - Training dataset builder
   - Trigger re-training (futuro: fine-tuning)
   ```

10. **`/ai/review/settings`**
    ```
    Configuración:
    
    General:
    - Default template
    - Auto-analyze on upload
    - Notification preferences
    
    AI Configuration:
    - Model selection (Claude 3.5, GPT-4, etc.)
    - Temperature
    - Max tokens per analysis
    - Confidence threshold
    
    Cost Controls:
    - Budget limits
    - Approval required for documents > X pages
    - Rate limiting
    
    Integrations:
    - Google Drive: Auto-analyze new docs
    - Dropbox
    - Email: Forward contracts for analysis
    ```

### 10.3 PDF Report Generation

**Objetivo:** Reportes profesionales exportables

#### Implementación:

```typescript
async function generatePDFReport(reviewId: string): Promise<Buffer> {
  const review = await getReview(reviewId)
  const result = await getReviewResult(reviewId)
  
  // Usar biblioteca como PDFKit o Puppeteer
  const pdf = new PDFDocument()
  
  // Header
  pdf.image('logo.png', 50, 45, { width: 50 })
  pdf.fontSize(20).text('Análisis de Documento con IA', 120, 50)
  
  // Executive Summary
  pdf.moveDown()
  pdf.fontSize(16).text('Resumen Ejecutivo')
  pdf.fontSize(12).text(result.summary)
  
  // Risk Score
  pdf.moveDown()
  pdf.fontSize(16).text('Nivel de Riesgo')
  // Visual gauge o color-coded box
  pdf.rect(50, pdf.y, 200, 30)
    .fillAndStroke(getRiskColor(result.riskLevel), '#000')
  pdf.fontSize(12).text(`Score: ${result.overallScore}/100`)
  
  // Sections
  pdf.addPage()
  pdf.fontSize(16).text('Secciones Analizadas')
  for (const [key, section] of Object.entries(result.extractedData)) {
    pdf.fontSize(14).text(key)
    pdf.fontSize(10).text(section.content)
    pdf.moveDown()
  }
  
  // Red Flags
  pdf.addPage()
  pdf.fontSize(16).text('Red Flags Detectados')
  for (const flag of result.redFlags) {
    pdf.fontSize(12)
      .fillColor(getSeverityColor(flag.severity))
      .text(`[${flag.severity.toUpperCase()}] ${flag.description}`)
    pdf.fillColor('#000')
      .fontSize(10)
      .text(`Ubicación: ${flag.location}`)
      .text(`Recomendación: ${flag.recommendation}`)
    pdf.moveDown()
  }
  
  // Recommendations
  pdf.addPage()
  pdf.fontSize(16).text('Recomendaciones')
  // ... similar structure
  
  // Footer
  pdf.fontSize(8)
    .text(`Generado por TuPatrimonio.app - ${new Date().toLocaleDateString()}`, 
          50, pdf.page.height - 50)
  
  return pdf.pipe(/* output stream */)
}
```

### 10.4 Advanced Features

#### Implementar:

1. **Batch Processing**
   ```typescript
   // Para procesar múltiples documentos en paralelo
   async function batchReview(
     fileIds: string[],
     templateId: string
   ): Promise<BatchReviewJob> {
     const jobId = generateId()
     
     // Queue jobs
     for (const fileId of fileIds) {
       await queue.add('document-review', {
         jobId,
         fileId,
         templateId
       })
     }
     
     return { jobId, status: 'queued', total: fileIds.length }
   }
   ```

2. **Version Comparison**
   ```typescript
   async function compareVersions(
     docId1: string,
     docId2: string
   ): Promise<ComparisonResult> {
     const [review1, review2] = await Promise.all([
       getReview(docId1),
       getReview(docId2)
     ])
     
     // AI-powered diff
     const diffAnalysis = await claude.messages.create({
       model: 'claude-3-5-sonnet-20241022',
       messages: [{
         role: 'user',
         content: `
           Compara estas dos versiones de contrato y explica qué cambió:
           
           Versión 1:
           ${review1.documentText}
           
           Versión 2:
           ${review2.documentText}
           
           Enfócate en cambios significativos en términos, condiciones, riesgos.
         `
       }]
     })
     
     return {
       changes: parseDiffAnalysis(diffAnalysis),
       riskDelta: review2.overallScore - review1.overallScore,
       newRedFlags: findNewRedFlags(review1, review2)
     }
   }
   ```

3. **Custom Red Flag Training**
   ```typescript
   // Permitir a usuarios entrenar patrones específicos
   interface CustomRedFlag {
     organizationId: string
     name: string
     pattern: string // regex o descripción en lenguaje natural
     severity: 'low' | 'medium' | 'high' | 'critical'
     examples: string[] // ejemplos de texto que deberían matchear
   }
   
   // El sistema aprende de feedback y ajusta detección
   ```

### 10.5 Cost Optimization

#### Estrategias:

```typescript
// 1. Smart chunking - solo analizar secciones relevantes
function smartChunk(document: string, template: Template): string[] {
  // Usar modelo más barato para identificar secciones relevantes
  const sectionMap = identifySections(document) // GPT-3.5-turbo
  
  // Luego usar Claude 3.5 solo en secciones importantes
  const relevantSections = template.sectionsToExtract
    .map(section => sectionMap[section])
    .filter(Boolean)
  
  return relevantSections
}

// 2. Caching de análisis comunes
const analysisCache = new Map<string, ReviewResult>()

function getCacheKey(document: string, template: string): string {
  return `${hashDocument(document)}_${template}`
}

// 3. Progressive analysis
// Análisis rápido (barato) primero, profundo solo si se solicita
async function progressiveReview(docId: string) {
  // Paso 1: Quick scan (GPT-3.5)
  const quickScan = await quickAnalysis(docId)
  
  if (quickScan.riskScore > 70 || userRequestsDeep) {
    // Paso 2: Deep analysis (Claude 3.5 Opus)
    return await deepAnalysis(docId)
  }
  
  return quickScan
}
```

### 10.6 Testing

#### Test Suite:

```typescript
describe('Document Review', () => {
  test('extracts payment terms correctly', async () => {
    const sample = loadSampleContract('commercial.pdf')
    const result = await analyzeDocument(sample, 'commercial_template')
    
    expect(result.extractedData.payment_terms).toBeDefined()
    expect(result.extractedData.payment_terms.content).toContain('Net 30')
  })
  
  test('detects unlimited liability red flag', async () => {
    const sample = loadSampleContract('high_risk.pdf')
    const result = await analyzeDocument(sample, 'commercial_template')
    
    const unlimitedLiabilityFlag = result.redFlags.find(
      f => f.type === 'unlimited_liability'
    )
    expect(unlimitedLiabilityFlag).toBeDefined()
    expect(unlimitedLiabilityFlag.severity).toBe('critical')
  })
  
  test('calculates risk score accurately', async () => {
    const lowRiskDoc = loadSampleContract('low_risk.pdf')
    const highRiskDoc = loadSampleContract('high_risk.pdf')
    
    const [lowResult, highResult] = await Promise.all([
      analyzeDocument(lowRiskDoc, 'commercial_template'),
      analyzeDocument(highRiskDoc, 'commercial_template')
    ])
    
    expect(lowResult.overallScore).toBeLessThan(40)
    expect(highResult.overallScore).toBeGreaterThan(70)
  })
})
```

**Paralelamente durante Fase 10:**
- Blog posts sobre lanzamiento de Document Review
- Case studies con métricas reales (tiempo ahorrado, errores evitados)
- Webinar: "Cómo la IA Revoluciona la Revisión de Contratos"
- Actualizar landing de AI Document Review con demos reales

---

## 📊 Fase 11: Analytics y Reportes (Semanas 75-81)

### 11.1 Schema Analytics

**Objetivo:** Data-driven decision making

#### Implementación:
1. **Crear schema `analytics`**
   ```sql
   - usage_metrics (particionado por fecha)
   - usage_aggregates
   - user_activity_summary
   - revenue_metrics
   - ai_usage_metrics ← NUEVO (métricas específicas de IA)
   - report_templates
   - scheduled_reports
   - generated_reports
   ```

2. **AI Usage Metrics** ← NUEVO
   ```sql
   CREATE TABLE analytics.ai_usage_metrics (
     id UUID PRIMARY KEY,
     organization_id UUID REFERENCES core.organizations,
     service_type TEXT, -- 'customer_service' o 'document_review'
     date DATE,
     
     -- Customer Service metrics
     total_conversations INTEGER,
     messages_sent INTEGER,
     ai_responses INTEGER,
     human_escalations INTEGER,
     avg_confidence_score DECIMAL,
     
     -- Document Review metrics
     documents_analyzed INTEGER,
     pages_analyzed INTEGER,
     red_flags_detected INTEGER,
     avg_risk_score DECIMAL,
     
     -- Cost metrics
     total_tokens_used BIGINT,
     total_credits_consumed DECIMAL,
     
     created_at TIMESTAMP DEFAULT NOW()
   );
   ```

3. **Data Collection**
   ```typescript
   - Event tracking en frontend
   - Server-side tracking
   - Batch insert para performance
   - Agregaciones periódicas (cron jobs)
   - Track AI model usage y costos
   ```

4. **Dashboards**
   ```typescript
   - Organization dashboard (sus métricas + uso de IA)
   - Platform dashboard (métricas globales + ROI de IA)
   - AI-specific dashboards
   - Gráficos con Recharts/Chart.js
   - Export a Excel/PDF
   ```

### 11.2 UI de Analytics

**Objetivo:** Insights accionables

#### Páginas:
1. **`/analytics/overview`**
   ```
   KPIs principales:
   - Total users, organizations
   - MRR/ARR
   - Active services
   - Usage trends
   - AI adoption metrics ← NUEVO
   ```

2. **`/analytics/usage`**
   ```
   - Uso por aplicación
   - Usuarios más activos
   - Features más usadas
   - AI services breakdown ← NUEVO
     * Conversaciones atendidas
     * Documentos analizados
     * Tokens consumidos
     * Cost per service
   ```

3. **`/analytics/revenue`**
   ```
   - MRR/ARR
   - Churn rate
   - Customer LTV
   - Revenue by service (incluir IA)
   - Forecast
   ```

4. **`/analytics/ai`** ← NUEVO
   ```
   Dashboard específico de IA:
   
   Customer Service:
   - Conversations handled by AI vs humans
   - Resolution rate
   - Average confidence score
   - Top intents
   - Escalation reasons
   - Cost per conversation
   
   Document Review:
   - Documents analyzed
   - Average risk score distribution
   - Top red flags detected
   - Processing time trends
   - Cost per document
   - Accuracy feedback
   
   ROI Calculator:
   - Time saved (estimated)
   - Cost savings (vs manual)
   - Efficiency gains
   ```

5. **`/analytics/reports`**
   ```
   - Reportes programados
   - Crear nuevo reporte
   - Historial
   - Templates (incluir templates de IA)
   ```

---

## 🔌 Fase 12: Integraciones y API Pública (Semanas 82-88)

### 12.1 Schema Integrations

**Objetivo:** Conectar con ecosistema externo

#### Implementación:
1. **Crear schema `integrations`**
   ```sql
   - integration_providers
   - organization_integrations
   - integration_sync_logs
   ```

2. **Conectores Pre-built**
   ```typescript
   - Google Drive
   - Dropbox
   - Zapier
   - Make.com
   - Slack
   - Microsoft Teams
   - Notion (para Knowledge Base) ← NUEVO
   ```

3. **OAuth Flow**
   ```typescript
   - Iniciar OAuth
   - Callback handling
   - Refresh tokens
   - Almacenar credentials encriptados
   ```

### 12.2 API Pública

**Objetivo:** API REST completa para B2B

#### Implementación:
1. **Documentación OpenAPI**
   - Swagger/Redoc
   - SDK generation
   - Postman collection

2. **Endpoints por Servicio**
   ```
   /api/v1/signatures/*
   /api/v1/verifications/*
   /api/v1/notary/*
   /api/v1/documents/*
   /api/v1/credits/*
   /api/v1/organizations/*
   /api/v1/ai/chat/* ← NUEVO
   /api/v1/ai/review/* ← NUEVO
   ```

3. **AI API Endpoints** ← NUEVO
   ```typescript
   // Customer Service API
   POST /api/v1/ai/chat/conversations
   POST /api/v1/ai/chat/conversations/:id/messages
   GET  /api/v1/ai/chat/conversations/:id
   GET  /api/v1/ai/chat/conversations/:id/history
   POST /api/v1/ai/chat/knowledge-base/ingest
   
   // Document Review API
   POST /api/v1/ai/review/analyze
   GET  /api/v1/ai/review/:id/status
   GET  /api/v1/ai/review/:id/results
   POST /api/v1/ai/review/compare
   GET  /api/v1/ai/review/templates
   ```

4. **Rate Limiting**
   ```typescript
   - Por API key
   - Por plan de suscripción
   - Redis para contadores
   - Headers: X-RateLimit-*
   - Rate limits más altos para AI endpoints (son más costosos)
   ```

5. **Webhooks Salientes**
   ```typescript
   - Configurar endpoints
   - Retry logic
   - HMAC signatures
   - Event types configurables
   - Eventos de IA:
     * ai.chat.conversation.completed
     * ai.review.analysis.completed
     * ai.review.high_risk_detected
   ```

### 12.3 Developer Portal

**Objetivo:** Self-service para developers

#### Páginas:
1. **`/developers/api-keys`**
   - Crear/revocar API keys
   - Usage por key
   - Scopes y permisos

2. **`/developers/webhooks`**
   - Configurar webhooks
   - Test endpoints
   - Delivery logs

3. **`/developers/docs`**
   - Documentación interactiva
   - Code examples (incluir ejemplos de IA)
   - Changelog
   - Sandbox para testing

4. **`/developers/playground`** ← NUEVO
   ```
   Interactive API playground:
   - Test AI Chat API
   - Test Document Review API
   - Ver responses en tiempo real
   - Code generation
   ```

---

## 🚀 Fase 13: Optimización y Escalabilidad (Semanas 89-95)

### 13.1 Performance

**Objetivo:** Sub-second response times

#### Tareas:
1. **Database Optimization**
   ```sql
   - Analizar slow queries
   - Agregar índices faltantes (especialmente en tablas de IA)
   - Optimizar RLS policies
   - Implementar materialized views
   - Particionamiento de tablas grandes (usage_metrics, conversations)
   ```

2. **Caching Strategy (Simplificado)**
   ```typescript
   - Redis (solo si necesario):
     * AI embeddings cache
     * Common AI responses cache
   - Next.js optimización automática (Netlify)
   - CDN global automático (Netlify)
   ```

3. **Frontend Performance (Netlify Automático)**
   ```typescript
   // Netlify maneja automáticamente:
   - Code splitting óptimo
   - Image optimization
   - Bundle optimization
   
   // Solo configurar manualmente:
   - Lazy loading de componentes pesados
   - Virtualización de listas largas (si necesario)
   ```

4. **AI Performance Optimization** ← NUEVO
   ```typescript
   - Batch embedding generation
   - Streaming responses (mejor UX)
   - Progressive analysis (quick → deep)
   - Smart chunking (solo procesar lo necesario)
   - Model selection basado en complejidad
   - Fallback a modelos más baratos cuando sea posible
   ```

### 13.2 Monitoring y Observabilidad

**Objetivo:** Detectar problemas antes que usuarios

#### Implementación:
1. **APM**
   ```typescript
   - Integrar Sentry (errors)
   - New Relic o Datadog (performance)
   - LogRocket (session replay)
   ```

2. **Logging**
   ```typescript
   - Structured logging (JSON)
   - Log levels apropiados
   - Correlation IDs
   - Integrar con Papertrail/LogDNA
   - AI-specific logs (model used, tokens, latency)
   ```

3. **Alerting**
   ```typescript
   - Error rate > threshold
   - Response time > threshold
   - Service health down
   - Credits balance low
   - AI API failures ← NUEVO
   - AI cost spikes ← NUEVO
   - Enviar a Slack/PagerDuty
   ```

4. **AI Monitoring** ← NUEVO
   ```typescript
   Dashboards específicos:
   - Token usage trends
   - Cost per request
   - Model latency
   - Error rates por provider
   - Quality metrics (confidence, satisfaction)
   ```

### 13.3 Testing

**Objetivo:** Confianza en deployments

#### Estrategia:
1. **Unit Tests**
   ```typescript
   - Utils y funciones puras
   - Business logic
   - AI helper functions
   - Coverage > 70%
   ```

2. **Integration Tests**
   ```typescript
   - API endpoints
   - Database operations
   - Service integrations (mocked)
   - AI pipelines (mocked)
   ```

3. **E2E Tests**
   ```typescript
   - Playwright/Cypress
   - Critical user flows
   - Include AI features (mock AI responses)
   - Smoke tests en staging
   ```

4. **Load Testing**
   ```typescript
   - k6 scripts
   - Test escenarios reales
   - Include AI endpoints
   - Identificar bottlenecks
   ```

5. **AI Testing** ← NUEVO
   ```typescript
   - Regression tests con sample documents
   - Accuracy benchmarking
   - Cost monitoring en tests
   - A/B testing de prompts
   ```

---

## 🎨 Fase 14: UX/UI Polish y Features Finales (Semanas 96-102)

### 14.1 Refinamiento de UI

**Objetivo:** Experiencia delightful

#### Tareas:
1. **Micro-interactions**
   - Animaciones suaves (Framer Motion)
   - Loading skeletons (especialmente para AI responses)
   - Empty states informativos
   - Error states amigables
   - Typing indicators en chat

2. **Responsive Design**
   - Mobile-first approach
   - Tablet optimization
   - Desktop enhancements

3. **Accessibility**
   - ARIA labels
   - Keyboard navigation
   - Screen reader testing
   - WCAG 2.1 AA compliance

4. **Onboarding**
   - Welcome tour (incluir features de IA)
   - Tooltips contextuales
   - Sample data
   - Interactive tutorials
   - "Try AI" prompts en empty states

### 14.2 Features Finales

**Objetivo:** Nice-to-haves que marcan diferencia

#### Lista:
1. **Command Palette (Cmd+K)**
   - Búsqueda global
   - Quick actions (incluir "Ask AI", "Analyze Document")
   - Navigation rápida

2. **Advanced Search**
   - Full-text search (PostgreSQL)
   - Filtros combinables
   - Saved searches
   - AI-powered search (semantic)

3. **Bulk Operations**
   - Select multiple
   - Batch actions (incluir batch document review)
   - Progress tracking

4. **Export/Import**
   - CSV/Excel export
   - PDF generation
   - Bulk import con validation

5. **Activity Feed**
   - Timeline de cambios
   - Filtros por tipo
   - Notificaciones agrupadas
   - AI activity (análisis completados, chats atendidos)

6. **Collaboration Features** ← NUEVO
   - Comments on documents
   - @mentions
   - Share AI analysis with team
   - Collaborative annotation

---

## 📱 Fase 15: Mobile App (Opcional - Semanas 103-114)

### 15.1 React Native App

**Objetivo:** Experiencia móvil nativa

#### Consideraciones:
- Expo framework
- Shared business logic con web
- Push notifications (Firebase)
- Offline-first approach
- Biometric authentication

#### Features prioritarias mobile:
- Chat con AI (notificaciones push)
- Ver análisis de documentos
- Firmar documentos
- Notifications dashboard
- Camera para capturar documentos → enviar a AI Review

---

## 🎯 Fase 16: Go-to-Market (Semanas 115-121)

### 16.1 Preparación para Lanzamiento

**Objetivo:** Launch ready

#### Checklist:
1. **Legal**
   - Términos de servicio (actualizados con uso de IA)
   - Privacy policy (incluir procesamiento de datos por IA)
   - Cookie policy
   - GDPR compliance
   - AI Ethics policy

2. **Marketing Site Evolution**
   - Actualizar con features reales (no "coming soon")
   - Agregar demos interactivos de IA
   - Customer success stories reales (con métricas de IA)
   - Optimizar según 12+ meses de data SEO

3. **Content Milestone**
   ```
   A esta altura deberías tener:
   - 80+ blog posts
   - 7+ pillar articles (2 sobre IA)
   - 5+ downloadable resources
   - 15+ video tutorials (incluir varios de IA)
   - Rankings top 3 para varias keywords (incluir IA)
   - 10,000+ organic visits/mes
   ```

4. **Launch PR**
   ```
   - Press release a medios tech (enfatizar IA como diferenciador)
   - Product Hunt launch (destacar AI features)
   - LinkedIn announcement
   - Email a waitlist (1000+ personas)
   - Webinar de lanzamiento (demo en vivo de IA)
   - Launch en comunidades de IA (Hacker News, etc.)
   ```

5. **Support**
   - Help center (Intercom/Zendesk)
   - Live chat (con AI bot como first line)
   - Email templates
   - Onboarding videos (incluir tutoriales de IA)

6. **Analytics**
   - Google Analytics 4 (ya configurado)
   - Mixpanel/Amplitude
   - Conversion tracking completo
   - Cohort analysis setup
   - AI usage funnels

### 16.2 Public Launch

**Objetivo:** Convertir tráfico orgánico en customers

**Ventaja competitiva:** Llegas al launch con:
- ✅ SEO maduro (12+ meses de antigüedad)
- ✅ 10,000+ visitas orgánicas/mes
- ✅ 1,000+ waitlist
- ✅ Content library de 80+ posts
- ✅ Authority establecida (incluir en IA)
- ✅ Backlink profile sólido
- ✅ **Diferenciadores de IA probados y funcionando**

#### Launch Day Strategy:
```
T-7 días: Email a waitlist (teaser)
T-3 días: Soft launch para early adopters
T-0: Public launch
  - Product Hunt
  - Hacker News
  - LinkedIn
  - Twitter/X
  - Paid ads (boost inicial)
T+1: Follow-up content
T+7: First case study
T+30: Launch retrospective
```

---

## 📊 **Métricas de Éxito Actualizadas**

### Fase 0 (Semanas 1-4):
- Website live con Lighthouse > 95
- 10-14 blog posts publicados (incluir 2 sobre IA)
- 100% páginas indexadas
- 50+ organic visits (baseline)
- Landings de IA con demos funcionales

### Durante Fases 1-6 (Semanas 5-38):
**Marketing parallels:**
- Mes 3: 500+ organic visits/mes
- Mes 6: 2,000+ organic visits/mes
- Rankings top 10 para 5+ keywords (incluir 2 de IA)
- 150+ signups waitlist
- 25+ quality backlinks

**Desarrollo:**
- Foundation completa (auth, credits, billing)
- CRM operacional
- Workflows funcionales
- Compliance ready

### Durante Fases 7-12 (Semanas 39-88):
**Marketing parallels:**
- Mes 9: 5,000+ organic visits/mes
- Mes 12: 10,000+ organic visits/mes
- Rankings top 5 para keyword principal
- Rankings top 10 para keywords de IA
- 1,000+ waitlist
- Featured snippets
- 60+ backlinks DA > 30

**Desarrollo:**
- Servicios core operacionales (firmas, verificación, notaría)
- **AI Customer Service live y probado**
- **AI Document Review live y probado**
- API pública documentada
- Analytics completo

### Fases 13-14 - Optimization (Semanas 89-102):
- Performance optimizada
- AI costs optimizados
- UX refinado
- Tests comprehensivos

### Fase 16 - Launch (Semanas 115-121):
- 15,000+ organic visits/mes
- 15-20% signup rate (2,000-3,000 signups/mes orgánico)
- Rankings dominantes (incluir IA)
- Thought leadership establecido
- **AI services con adoption > 40% de usuarios**

---

## 🎯 **Priorización Final Actualizada**

### Absolutely Critical (No lanzar sin esto):
1. **Fase 0:** Marketing + SEO foundation
2. Fase 1-2: Foundation + Credits
3. Fase 3: Comunicaciones básicas
4. Fase 7: Signatures (servicio core)
5. **Fase 9: AI Customer Service** (diferenciador clave)
6. **Fase 10: AI Document Review** (diferenciador clave)
7. Seguridad completa

### High Priority:
- Fase 4: Workflows
- Fase 5: Files
- Fase 6: Audit
- Fase 12: API pública
- **Contenido continuo (paralelo a todo)**

### Medium Priority:
- Otros servicios (8.x)
- Fase 11: Analytics
- Fase 13: Optimization

### Nice to Have:
- Fase 15: Mobile app
- Integraciones avanzadas
- AI features avanzados (fine-tuning, custom models)

---

## 🔄 **Proceso Paralelo: Content y SEO (Continuo)**

Mientras desarrollas las Fases 1-16, mantén este ritmo:

### Mensual:
- 8 blog posts (2/semana)
  * 6 posts tradicionales
  * 2 posts sobre IA
- 1 pillar content piece o guía larga
- 2 actualizaciones de contenido existente
- 1 guest post o PR initiative
- Análisis de rankings y ajustes

### Trimestral:
- 1 lead magnet nuevo (incluir 1 de IA cada 2 trimestres)
- Content audit y actualización
- Backlink campaign
- Video content (tutoriales, incluir demos de IA)

### Semestral:
- Comprehensive SEO audit
- Content cluster expansion
- Competitor analysis
- UX improvements en marketing site

---

## 🛠️ **Stack Tecnológico Final Simplificado**

### Frontend:
- Next.js 14+ (App Router)
- React 18
- TypeScript
- TailwindCSS + Shadcn/UI
- React Flow (workflow builder)
- TipTap (document editor)
- PDF.js (document viewer)

### Backend (Todo en Supabase):
- Supabase (PostgreSQL + Auth + Storage + Realtime)
- pgvector extension (AI embeddings)
- Supabase Edge Functions (si necesario)

### AI & ML:
- Anthropic Claude API (primary)
- OpenAI API (secondary/fallback)
- Vector search: pgvector integrado

### Servicios Externos:
- Stripe + dLocal Go (pagos)
- SendGrid (email)
- Twilio (SMS/auth)
- Veriff (identity verification)

### Deploy y Hosting (Ultra Simple):
- **Vercel**: Ambas apps (tupatrimonio.app + app.tupatrimonio.app) + CI/CD automático
- **Supabase**: Backend + Migraciones automáticas
- **DNS**: Solo configurar dominios
- **Analytics**: Google Analytics 4 con propiedades separadas por app

### Monitoring (Básico):
- Sentry (errors)
- Supabase Analytics (built-in)

### CMS:
- Contentful/Sanity (marketing content)

---

## ✅ **Checklist de Launch Simplificado**

### Pre-Launch:
- [ ] **Base de datos completa** (todas las migraciones aplicadas)
- [ ] **Marketing site optimizado** (SEO + contenido)
- [ ] **App funcional** con servicios core
- [ ] **AI Customer Service** funcionando (chatbot)
- [ ] **AI Document Review** funcionando (análisis)
- [ ] **Testing completo** (funcional + performance)
- [ ] **Legal docs** finalizados
- [ ] **Costos controlados** (especialmente IA)

### Launch:
- [ ] **Deploy a producción** (automático con Vercel)
- [ ] **Email a waitlist**
- [ ] **Product Hunt launch**
- [ ] **Contenido de lanzamiento** (blog, social media)
- [ ] **Monitoring básico** activo
- [ ] **Google Analytics** recabando datos en ambas apps

### Post-Launch:
- [ ] **Feedback loop** activo
- [ ] **Hotfixes** según necesidad  
- [ ] **Case studies** reales
- [ ] **Optimización** basada en datos
- [ ] **Scaling** según demanda

---

## 🎓 **Principios de Desarrollo Simplificados**

### Filosofía Core:
1. **Simple pero robusto:** Evitar over-engineering
2. **Type-safe:** TypeScript + Supabase types automáticos
3. **Mobile-first:** Responsive desde el inicio
4. **Fast by default:** Aprovechar optimizaciones automáticas
5. **Secure by design:** RLS + validaciones desde día 1
6. **AI-responsible:** Transparencia + control de costos
7. **Data-driven:** Medir lo importante, no todo

### Stack Ultra-Simple:
- **Backend:** Solo Supabase (base de datos + auth + storage)
- **Frontend:** Next.js + Tailwind + Shadcn/UI
- **Deploy:** Vercel (ambas apps) - todo automático
- **Analytics:** Google Analytics 4 con propiedades separadas
- **No necesitas:** Docker, CI/CD complex, CDN manual, SSL config

### Flujo de Desarrollo:
1. **Codigo** → Push a GitHub
2. **Deploy automático** → Vercel (ambas apps)
3. **Migraciones** → Supabase automático
4. **Monitoreo** → Supabase dashboard + Google Analytics
5. **Variables de entorno** → Vercel Dashboard

### AI Development Best Practices:
```typescript
// 1. Siempre manejar errores de API
try {
  const response = await claude.messages.create({...})
} catch (error) {
  if (error.status === 529) {
    // Overloaded, retry
  } else if (error.status === 429) {
    // Rate limited, backoff
  }
  // Log y fallback
}

// 2. Siempre trackear costs
await trackAIUsage({
  tokens: response.usage,
  model: 'claude-3-5-sonnet',
  organizationId
})

// 3. Implementar timeouts
const response = await Promise.race([
  claude.messages.create({...}),
  timeout(30000) // 30s max
])

// 4. Cache cuando sea posible
const cached = await getCachedEmbedding(text)
if (cached) return cached

// 5. Usar streaming para mejor UX
for await (const chunk of stream) {
  yield chunk.delta.text
}
```

---

## 🎉 **Resultado Final Simplificado**

Llegas al lanzamiento con una **arquitectura ultra-simple pero poderosa**:

### Producto (Simple pero Completo):
1. ✅ **Base robusta multi-tenant** (Supabase)
2. ✅ **Servicios core** (firmas, verificación, notaría)
3. ✅ **IA diferenciadora** (chatbot + document review)
4. ✅ **API nativa** (Supabase automático)
5. ✅ **Mobile responsive** (Next.js + Tailwind)

### Marketing (SEO-First):
1. ✅ **Tráfico orgánico** creciendo desde día 1
2. ✅ **Authority establecida** (contenido + backlinks)
3. ✅ **Waitlist cualificada**
4. ✅ **Content library** rica
5. ✅ **Keywords dominantes** (incluir IA)

### Tecnología (Ultra-Simple):
1. ✅ **Solo 3 servicios principales**:
   - GitHub (código)
   - Vercel (ambas apps + deploy automático)
   - Supabase (backend completo)
2. ✅ **Deploy automático** (sin configuración)
3. ✅ **Escalabilidad nativa** (Supabase + Vercel)
4. ✅ **Analytics separadas** (GA4 con propiedades por app)
5. ✅ **Costos predecibles**
6. ✅ **Mantenimiento mínimo**

### Ventajas Competitivas:
1. ✅ **Time-to-market ultra rápido**
2. ✅ **IA como diferenciador principal**
3. ✅ **SEO head-start** (12+ meses de ventaja)
4. ✅ **Arquitectura que escala automáticamente**
5. ✅ **Stack que cualquier developer puede mantener**

---

**🚀 Con esta arquitectura simplificada tienes lo mejor de ambos mundos: la robustez de un sistema enterprise pero la simplicidad de un startup. Puedes enfocarte en construir features y conseguir clientes, no en mantener infraestructura.**

**Tu ventaja competitiva está en los servicios de IA y el SEO foundation, no en complejidad técnica innecesaria.**

**¡A ejecutar! 🎯**