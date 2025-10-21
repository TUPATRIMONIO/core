# Setup Inicial Simplificado - Fases 0 y 1

## 🎯 Stack Simplificado
```
GitHub → Netlify (Frontend + CI/CD automático)
GitHub → Supabase (Database + migraciones automáticas)
```

## 1. Configuración de Supabase

### 1.1 Extensiones y Storage
- Habilitar extensión `pgvector` para IA
- Configurar Storage buckets:
  - `documents` (privado, RLS)
  - `public-assets` (público) 
  - `ai-training-data` (privado)

### 1.2 Conectar con GitHub
- Instalar Supabase CLI
- Conectar proyecto con repositorio para migraciones automáticas
- Configurar branch protection para migrations

### 1.3 Schemas y Migraciones SQL
Crear todos los schemas del proyecto:

**Schema Core:**
- `users` (integración con Supabase Auth)
- `organizations`
- `organization_users` (M:N)
- `teams` y `team_members`
- `roles` y `permissions` (JSONB)
- `applications`
- `organization_applications`
- `subscription_plans`
- `organization_subscriptions`
- `invitations`
- `api_keys` (hasheadas)
- `system_events`

**Schema Credits:**
- `credit_accounts`
- `credit_transactions`
- `credit_packages`
- `credit_prices` (incluir precios IA)

**Schema Billing:**
- `payment_methods`
- `invoices`
- `invoice_line_items`
- `payments`
- `tax_rates`

**Schema Communications:**
- `contacts`
- `contact_activities`
- `message_templates`
- `campaigns`
- `messages`
- `user_notifications`

**Schema Workflows:**
- `workflows`
- `workflow_executions`
- `error_logs`
- `service_health`
- `retry_queue`

**Schema Files:**
- `file_storage`
- `file_versions`
- `file_shares`

**Schema Audit:**
- `audit_logs`
- `compliance_documents`
- `user_consents`

**Schemas de Servicios:**
- `signatures.*`
- `verifications.*`
- `notary.*`
- `documents.*`

**Schemas de IA:**
- `ai_customer_service.*` (con columnas VECTOR)
- `ai_document_review.*`

**Schema Analytics:**
- `usage_metrics` (particionado)
- `ai_usage_metrics`
- `generated_reports`

### 1.4 Row Level Security (RLS)
- Habilitar RLS en todas las tablas
- Policies para multi-tenancy (filtrado por organization_id)
- Policies específicas por rol (admin, user, viewer)

### 1.5 Functions y Triggers
- `create_organization()` con asignación de owner
- `invite_user()` con token generation
- `update_user_last_seen()` trigger
- Functions para manejo de créditos
- Audit logging automático

### 1.6 Datos Semilla
- Roles estándar del sistema
- Aplicaciones del ecosistema
- Planes de suscripción base
- Organización platform (TuPatrimonio.app)
- Credit prices para servicios IA

## 2. Estructura del Proyecto

### 2.1 Monorepo Simple
```
/apps/marketing      # Marketing site (tupatrimonio.app)
/apps/web           # App principal (app.tupatrimonio.app) 
/packages/ui        # Componentes compartidos Shadcn/UI
/packages/database  # Types de Supabase
/packages/utils     # Utilidades compartidas
/packages/config    # Configuraciones
/packages/ai        # Utilidades de IA (futuro)
```

### 2.2 Configuraciones Básicas
- `package.json` con workspaces
- `tailwind.config.ts` compartido
- `tsconfig.json` base y específicos
- ESLint + Prettier (básico)

## 3. Marketing Site (apps/marketing)

### 3.1 Páginas Esenciales
- `/` (homepage con value prop y features IA)
- `/firmas-electronicas` (landing específica)
- `/verificacion-identidad` (landing específica)
- `/notaria-digital` (landing específica)
- `/asistente-ia` (landing chatbot)
- `/revision-documentos-ia` (landing document review)
- `/precios` (pricing con servicios IA)
- `/blog` (estructura preparada)
- `/legal/*` (términos, privacidad)

### 3.2 SEO Foundation
- Metadata API de Next.js configurada
- Structured data (Schema.org JSON-LD)
- Sitemap.xml dinámico
- Robots.txt optimizado
- OpenGraph y Twitter Cards

### 3.3 Performance (Netlify automático)
- Next.js Image optimization
- Font optimization (Quicksand)
- Bundle automático con Netlify

## 4. App Principal (apps/web)

### 4.1 Setup Base
- Configuración de Supabase client
- Middleware de autenticación
- Layout principal con sidebar
- Sistema de temas (light/dark)
- Componentes base de Shadcn/UI

### 4.2 Páginas Iniciales
- `/login` y `/register`
- `/dashboard` (placeholder con widgets básicos)
- `/settings/*` (estructura preparada)

## 5. DNS y Deploy

### 5.1 Dominio
- `tupatrimonio.app` → Netlify (marketing)
- `app.tupatrimonio.app` → Netlify (aplicación)

### 5.2 Netlify Configuration
- Conectar repositorio GitHub
- Build settings para monorepo
- Variables de entorno desde Dashboard
- Deploy automático en push a main

## 6. Variables de Entorno

### 6.1 Variables Esenciales
```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# IA Services (para futuro)
OPENAI_API_KEY=
ANTHROPIC_API_KEY=
AI_MODEL_DEFAULT=claude-3-5-sonnet-20241022

# App URLs
NEXT_PUBLIC_APP_URL=https://app.tupatrimonio.app
NEXT_PUBLIC_MARKETING_URL=https://tupatrimonio.app

# Servicios externos (placeholder)
STRIPE_SECRET_KEY=
SENDGRID_API_KEY=
TWILIO_ACCOUNT_SID=
VERIFF_API_KEY=
```

## ✅ To-Do Simplificado

1. **Supabase Setup Completo**
   - [ ] Crear proyecto y habilitar pgvector
   - [ ] Configurar Storage buckets
   - [ ] Conectar con GitHub para migraciones
   - [ ] Crear todas las migraciones SQL
   - [ ] Implementar RLS policies
   - [ ] Crear functions y triggers
   - [ ] Insertar datos semilla

2. **Proyecto Next.js**
   - [ ] Crear estructura de monorepo
   - [ ] Setup apps/marketing con páginas SEO
   - [ ] Setup apps/web con auth básico
   - [ ] Configurar Shadcn/UI compartido

3. **Deploy y DNS**
   - [ ] Conectar GitHub con Netlify
   - [ ] Configurar build para monorepo
   - [ ] Configurar DNS para subdominios
   - [ ] Variables de entorno en Netlify

4. **Contenido Inicial**
   - [ ] Copy básico para landing pages
   - [ ] 2-3 blog posts iniciales
   - [ ] Forms de contacto funcionales

---

## 🚀 Resultado Final

Al terminar tendrás:
- ✅ Base de datos completa con todos los schemas
- ✅ Marketing site SEO-optimizado
- ✅ App con autenticación funcionando
- ✅ Deploy automático configurado
- ✅ Foundation lista para servicios de IA
- ✅ **Sin complejidad innecesaria**
