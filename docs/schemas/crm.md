# Guía de Implementación: CRM Multi-Tenant B2B

## 📋 Resumen

Sistema CRM completo multi-tenant que puede ser usado internamente por TuPatrimonio y vendido como servicio B2B a organizaciones cliente. Cada organización gestiona sus propios contactos, deals, y comunicaciones de forma aislada.

## 🏗️ Arquitectura de Schemas

**Filosofía**: Cada aplicación/servicio tiene su propio schema para mejor organización y separación de concerns.

```
┌─────────────────────────────────────────────────┐
│ SUPABASE DATABASE                               │
├─────────────────────────────────────────────────┤
│                                                 │
│  📦 core                                        │
│  └─ Organizaciones, usuarios, roles            │
│     suscripciones, autenticación               │
│                                                 │
│  📦 marketing                                   │
│  └─ Blog, KB, waitlist, contact forms          │
│     reviews, testimonials                      │
│                                                 │
│  📦 crm                      ← NUEVO            │
│  └─ Contactos, deals, activities, emails       │
│     settings (multi-tenant B2B)                │
│                                                 │
│  📦 signatures                (futuro)          │
│  └─ Firma electrónica                          │
│                                                 │
│  📦 verifications             (futuro)          │
│  └─ Verificación de identidad                  │
│                                                 │
│  📦 ai_customer_service       (futuro)          │
│  └─ Chatbot IA con RAG                         │
│                                                 │
│  📦 ai_document_review        (futuro)          │
│  └─ Análisis de documentos con IA              │
│                                                 │
└─────────────────────────────────────────────────┘
```

**Ventajas de esta arquitectura**:
- ✅ Clara separación de responsabilidades
- ✅ Escalabilidad independiente por servicio
- ✅ Permisos granulares por schema
- ✅ Backups selectivos por servicio
- ✅ Migraciones organizadas por funcionalidad

---

## 🎯 Arquitectura Multi-Tenant

### Concepto Clave

```
TuPatrimonio Platform (org_type: 'platform')
└── Usa CRM para gestionar leads de marketing

Cliente A (org_type: 'business')
└── Usa CRM para gestionar sus propios clientes

Cliente B (org_type: 'business')
└── Usa CRM para gestionar sus propios clientes
```

**Aislamiento**: Cada organización solo ve sus propios datos mediante RLS basado en `organization_id`.

---

## ✅ Fase 1: Migraciones de Base de Datos

### Migración 1: Limpiar Sistema de Roles

**Archivo**: `supabase/migrations/20251112185905_limpiar-user-roles.sql`

**Cambios**:
- Elimina tabla redundante `marketing.user_roles`
- Unifica todo en `core.roles` + `core.organization_users`
- Actualiza funciones `can_access_admin()` y `can_access_crm()`
- Crea función helper `marketing.user_is_platform_admin()`

**Aplicar en Supabase SQL Editor** ⚠️

### Migración 2: Schema CRM Multi-Tenant

**Archivo**: `supabase/migrations/20251112190000_schema-crm-multitenant.sql`

**Schema Creado**: `crm` (separado de `core` y `marketing`)

**Tablas Creadas**:

```
crm.contacts             # Contactos por organización
crm.activities           # Timeline de interacciones
crm.deals                # Oportunidades de venta
crm.emails               # Integración Gmail
crm.settings             # Configuración por org
crm.notes                # Notas internas
```

**Roles Creados**:
- `crm_manager` (nivel 6): Gestión completa del CRM
- `sales_rep` (nivel 4): Solo contactos asignados

**Aplicación Registrada**:
- `crm_sales`: Servicio vendible en planes de suscripción

**Aplicar en Supabase SQL Editor** ⚠️

### Post-Migración: Importar Leads Existentes

```sql
-- Importar leads de marketing al CRM de platform org
SELECT import_marketing_leads_to_crm();
```

Esto crea contactos en el CRM de TuPatrimonio Platform a partir de:
- `marketing.waitlist_subscribers`
- `marketing.contact_messages`

---

## 🏗️ Fase 2: Estructura de la Aplicación

### Rutas del CRM

```
apps/web/src/app/dashboard/crm/
├── page.tsx                           # Dashboard principal del CRM
├── contacts/
│   ├── page.tsx                       # Lista de contactos
│   ├── [id]/
│   │   ├── page.tsx                   # Detalle de contacto
│   │   └── edit/page.tsx              # Editar contacto
│   └── new/page.tsx                   # Crear contacto
├── deals/
│   ├── page.tsx                       # Kanban de deals
│   ├── [id]/page.tsx                  # Detalle de deal
│   └── new/page.tsx                   # Crear deal
├── emails/
│   ├── page.tsx                       # Inbox de emails
│   └── compose/page.tsx               # Compositor
├── settings/
│   ├── page.tsx                       # Configuración general
│   └── gmail/
│       ├── connect/page.tsx           # Conectar Gmail
│       └── callback/page.tsx          # OAuth callback
└── components/
    ├── ContactsList.tsx               # Tabla de contactos
    ├── ContactDetail.tsx              # Vista detallada
    ├── ActivityTimeline.tsx           # Timeline de actividades
    ├── DealsKanban.tsx                # Kanban de deals
    ├── EmailComposer.tsx              # Compositor de email
    ├── EmailThread.tsx                # Thread de conversación
    ├── ContactFilters.tsx             # Filtros avanzados
    ├── StatusBadge.tsx                # Badge de estados
    └── QuickActions.tsx               # Acciones rápidas
```

---

## 🔌 Fase 3: API Routes Multi-Tenant

### Estructura de APIs

```
apps/web/src/app/api/crm/
├── contacts/
│   ├── route.ts                       # GET, POST (lista y crear)
│   ├── [id]/
│   │   ├── route.ts                   # GET, PATCH, DELETE
│   │   └── activities/route.ts       # GET actividades del contacto
│   ├── import/route.ts                # POST (importar CSV)
│   └── search/route.ts                # POST (búsqueda avanzada)
├── activities/
│   ├── route.ts                       # GET, POST
│   └── [id]/route.ts                  # GET, PATCH, DELETE
├── deals/
│   ├── route.ts                       # GET, POST
│   ├── [id]/route.ts                  # GET, PATCH, DELETE
│   └── stats/route.ts                 # GET (estadísticas)
├── emails/
│   ├── route.ts                       # GET (inbox)
│   ├── send/route.ts                  # POST (enviar email)
│   └── sync/route.ts                  # POST (sincronizar con Gmail)
├── settings/
│   └── route.ts                       # GET, PATCH
└── stats/route.ts                     # GET (dashboard stats)
```

### Ejemplo: API de Contactos

```typescript
// apps/web/src/app/api/crm/contacts/route.ts
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Verificar acceso al CRM
  const { data: canAccess } = await supabase.rpc('can_access_crm', {
    user_id: user.id
  });

  if (!canAccess) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Obtener organization_id del usuario
  const { data: orgUser } = await supabase
    .from('organization_users')
    .select('organization_id')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .single();

  if (!orgUser) {
    return NextResponse.json({ error: 'No organization found' }, { status: 404 });
  }

  // Query params para filtros
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');
  const search = searchParams.get('search');
  const assignedTo = searchParams.get('assigned_to');

  // Construir query (nota: Supabase cliente usa schema crm automáticamente)
  let query = supabase
    .schema('crm')
    .from('contacts')
    .select(`
      *,
      assigned_user:assigned_to(id, first_name, last_name, email)
    `)
    .eq('organization_id', orgUser.organization_id)
    .order('created_at', { ascending: false });

  // Aplicar filtros
  if (status) {
    query = query.eq('status', status);
  }
  if (assignedTo) {
    query = query.eq('assigned_to', assignedTo);
  }
  if (search) {
    query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%,company_name.ilike.%${search}%`);
  }

  const { data: contacts, error } = await query;

  if (error) {
    console.error('Error fetching contacts:', error);
    return NextResponse.json({ error: 'Failed to fetch contacts' }, { status: 500 });
  }

  return NextResponse.json(contacts);
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Verificar acceso
  const { data: canAccess } = await supabase.rpc('can_access_crm', {
    user_id: user.id
  });

  if (!canAccess) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Obtener organization_id
  const { data: orgUser } = await supabase
    .from('organization_users')
    .select('organization_id')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .single();

  if (!orgUser) {
    return NextResponse.json({ error: 'No organization found' }, { status: 404 });
  }

  const body = await request.json();

  // Crear contacto
  const { data: contact, error } = await supabase
    .schema('crm')
    .from('contacts')
    .insert({
      ...body,
      organization_id: orgUser.organization_id,
      created_by: user.id
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating contact:', error);
    return NextResponse.json({ error: 'Failed to create contact' }, { status: 500 });
  }

  return NextResponse.json(contact);
}
```

---

## 🔐 Fase 4: Sistema de Permisos

### Helper para Obtener Organization ID del Usuario

```typescript
// apps/web/src/lib/crm/permissions.ts
import { createClient } from '@/lib/supabase/server';

export async function getUserOrganizationId(userId: string): Promise<string | null> {
  const supabase = await createClient();
  
  const { data } = await supabase
    .from('organization_users')
    .select('organization_id')
    .eq('user_id', userId)
    .eq('status', 'active')
    .single();
  
  return data?.organization_id || null;
}

export async function canAccessCRM(userId: string): Promise<boolean> {
  const supabase = await createClient();
  
  const { data } = await supabase.rpc('can_access_crm', {
    user_id: userId
  });
  
  return data || false;
}

export async function hasPermission(
  userId: string, 
  resource: 'contacts' | 'deals' | 'emails',
  action: 'view' | 'create' | 'edit' | 'delete'
): Promise<boolean> {
  const supabase = await createClient();
  
  // Obtener rol del usuario en su org
  const { data: orgUser } = await supabase
    .from('organization_users')
    .select(`
      role:roles(slug, level, permissions)
    `)
    .eq('user_id', userId)
    .eq('status', 'active')
    .single();
  
  if (!orgUser || !orgUser.role) return false;
  
  const permissions = orgUser.role.permissions as any;
  
  // Verificar permisos específicos
  return permissions?.crm?.[resource]?.[action] === true ||
         permissions?.crm?.[resource]?.['*'] === true ||
         orgUser.role.level >= 7; // Admin o superior tiene todo
}
```

---

## 📧 Fase 5: Integración Gmail Multi-Tenant

### OAuth por Organización

Cada organización conecta su propia cuenta de Gmail:

```typescript
// apps/web/src/lib/gmail/oauth.ts
import { google } from 'googleapis';

export function getGmailOAuthUrl(organizationId: string) {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    `${process.env.NEXT_PUBLIC_APP_URL}/api/crm/settings/gmail/callback`
  );

  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: [
      'https://www.googleapis.com/auth/gmail.send',
      'https://www.googleapis.com/auth/gmail.readonly',
      'https://www.googleapis.com/auth/gmail.modify'
    ],
    state: organizationId // Pasar org_id en state
  });
}

export async function getOAuthClient(tokens: any) {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    `${process.env.NEXT_PUBLIC_APP_URL}/api/crm/settings/gmail/callback`
  );
  
  oauth2Client.setCredentials(tokens);
  return oauth2Client;
}
```

### Guardar Tokens por Organización

```typescript
// apps/web/src/app/api/crm/settings/gmail/callback/route.ts
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const organizationId = searchParams.get('state'); // org_id
  
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return NextResponse.redirect('/login');
  }

  // Verificar que usuario pertenece a la org
  const { data: orgUser } = await supabase
    .from('organization_users')
    .select('organization_id')
    .eq('user_id', user.id)
    .eq('organization_id', organizationId)
    .single();

  if (!orgUser) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Obtener tokens
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    `${process.env.NEXT_PUBLIC_APP_URL}/api/crm/settings/gmail/callback`
  );
  
  const { tokens } = await oauth2Client.getToken(code);

  // Guardar en crm_settings (encriptado en producción)
  await supabase
    .from('crm_settings')
    .upsert({
      organization_id: organizationId,
      gmail_oauth_tokens: tokens // En producción: encrypt(tokens)
    });

  return NextResponse.redirect('/dashboard/crm/settings?gmail=connected');
}
```

### Enviar Email Usando Tokens de la Org

```typescript
// apps/web/src/lib/gmail/service.ts
import { google } from 'googleapis';
import { getOAuthClient } from './oauth';

export async function sendEmail(
  organizationId: string,
  to: string,
  subject: string,
  body: string,
  contactId?: string
) {
  const supabase = await createClient();
  
  // Obtener tokens de la organización
  const { data: settings } = await supabase
    .from('crm_settings')
    .select('gmail_oauth_tokens')
    .eq('organization_id', organizationId)
    .single();

  if (!settings?.gmail_oauth_tokens) {
    throw new Error('Gmail not connected for this organization');
  }

  // Crear cliente OAuth
  const oauth2Client = await getOAuthClient(settings.gmail_oauth_tokens);
  const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

  // Construir email
  const email = [
    `To: ${to}`,
    'Content-Type: text/html; charset=utf-8',
    `Subject: ${subject}`,
    '',
    body
  ].join('\n');

  const encodedEmail = Buffer.from(email)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  // Enviar
  const { data } = await gmail.users.messages.send({
    userId: 'me',
    requestBody: {
      raw: encodedEmail
    }
  });

  // Guardar en crm.emails
  await supabase.schema('crm').from('emails').insert({
    organization_id: organizationId,
    contact_id: contactId,
    gmail_message_id: data.id,
    thread_id: data.threadId,
    from_email: 'me', // Obtener del perfil de Gmail
    to_emails: [to],
    subject,
    body_html: body,
    direction: 'outbound',
    status: 'sent',
    sent_at: new Date().toISOString(),
    sent_by: (await supabase.auth.getUser()).data.user?.id
  });

  return data;
}
```

---

## 💰 Fase 6: Monetización y Límites

### Planes con CRM

```typescript
// Actualizar core.subscription_plans
const crmPlans = {
  starter: {
    features: {
      crm_enabled: true,
      crm_contacts_limit: 100,
      crm_users: 2,
      email_integration: false,
      custom_fields: false
    }
  },
  professional: {
    features: {
      crm_enabled: true,
      crm_contacts_limit: 1000,
      crm_users: 5,
      email_integration: true,
      custom_fields: true,
      api_access: false
    }
  },
  enterprise: {
    features: {
      crm_enabled: true,
      crm_contacts_limit: -1, // Ilimitado
      crm_users: -1,
      email_integration: true,
      custom_fields: true,
      api_access: true,
      automations: true
    }
  }
};
```

### Verificar Límites

```typescript
// apps/web/src/lib/crm/limits.ts
export async function canCreateContact(organizationId: string): Promise<boolean> {
  const supabase = await createClient();
  
  // Obtener plan de la organización
  const { data: subscription } = await supabase
    .from('organization_subscriptions')
    .select('plan:subscription_plans(features)')
    .eq('organization_id', organizationId)
    .eq('status', 'active')
    .single();

  if (!subscription) return false;

  const limit = subscription.plan.features.crm_contacts_limit;
  
  // -1 = ilimitado
  if (limit === -1) return true;

  // Contar contactos actuales
  const { count } = await supabase
    .schema('crm')
    .from('contacts')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', organizationId);

  return (count || 0) < limit;
}
```

---

## 🎨 Fase 7: UI Multi-Tenant

### Context de Organización

```typescript
// apps/web/src/contexts/OrganizationContext.tsx
'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

interface Organization {
  id: string;
  name: string;
  slug: string;
  org_type: string;
}

interface OrganizationContextType {
  currentOrganization: Organization | null;
  organizations: Organization[];
  switchOrganization: (orgId: string) => void;
}

const OrganizationContext = createContext<OrganizationContextType | undefined>(undefined);

export function OrganizationProvider({ children }: { children: React.ReactNode }) {
  const [currentOrganization, setCurrentOrganization] = useState<Organization | null>(null);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const supabase = createClient();

  useEffect(() => {
    async function loadOrganizations() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: orgs } = await supabase
        .from('organization_users')
        .select('organization:organizations(*)')
        .eq('user_id', user.id)
        .eq('status', 'active');

      if (orgs && orgs.length > 0) {
        const orgList = orgs.map(o => o.organization);
        setOrganizations(orgList);
        
        // Cargar última org activa del usuario
        const { data: userData } = await supabase
          .from('users')
          .select('last_active_organization_id')
          .eq('id', user.id)
          .single();

        const lastOrgId = userData?.last_active_organization_id;
        const lastOrg = orgList.find(o => o.id === lastOrgId);
        
        setCurrentOrganization(lastOrg || orgList[0]);
      }
    }

    loadOrganizations();
  }, []);

  const switchOrganization = async (orgId: string) => {
    const org = organizations.find(o => o.id === orgId);
    if (org) {
      setCurrentOrganization(org);
      
      // Guardar preferencia
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from('users')
          .update({ last_active_organization_id: orgId })
          .eq('id', user.id);
      }
    }
  };

  return (
    <OrganizationContext.Provider value={{
      currentOrganization,
      organizations,
      switchOrganization
    }}>
      {children}
    </OrganizationContext.Provider>
  );
}

export const useOrganization = () => {
  const context = useContext(OrganizationContext);
  if (!context) {
    throw new Error('useOrganization must be used within OrganizationProvider');
  }
  return context;
};
```

### Selector de Organización en Layout

```typescript
// En apps/web/src/app/dashboard/layout.tsx
import { OrganizationSwitcher } from '@/components/OrganizationSwitcher';

// Dentro del header:
<OrganizationSwitcher />
```

---

## 🔄 Fase 8: Sincronización Bidireccional con Gmail

### Webhook de Gmail (Push Notifications)

```typescript
// apps/web/src/app/api/crm/emails/webhook/route.ts
// Gmail puede enviar notificaciones cuando llegan nuevos emails

export async function POST(request: Request) {
  const body = await request.json();
  
  // Validar webhook de Gmail
  // Procesar nuevo email
  // Guardar en crm_emails
  // Crear actividad automática
  // Vincular a contacto si existe
  
  return NextResponse.json({ success: true });
}
```

---

## 📊 Orden de Implementación Completo

### Semana 1: Foundation
1. ✅ Aplicar migración de roles
2. ✅ Aplicar migración de schema CRM
3. ✅ Importar leads existentes
4. Crear estructura de carpetas
5. Implementar context de organización
6. Implementar helpers de permisos

### Semana 2: Contactos y Actividades
7. API routes de contactos
8. UI de lista de contactos
9. UI de detalle de contacto
10. Sistema de actividades y timeline
11. Sistema de notas

### Semana 3: Gmail e Integración
12. Configurar OAuth en Google Cloud
13. Implementar flujo de conexión Gmail
14. Implementar envío de emails
15. Componente EmailComposer
16. Sincronización de emails (lectura)

### Semana 4: Deals y Optimización
17. API y UI de deals
18. Kanban de deals
19. Sistema de límites por plan
20. Testing multi-tenant completo

---

## 🎯 Ventajas del CRM Multi-Tenant

1. ✅ **TuPatrimonio usa su propio CRM** (como cliente #1)
2. ✅ **Vendible desde día 1** a clientes B2B
3. ✅ **Escalable** sin cambios de arquitectura
4. ✅ **Monetizable** con planes diferenciados
5. ✅ **Aislamiento total** entre organizaciones (RLS)
6. ✅ **Roles granulares** por organización

---

## 📝 Variables de Entorno

```bash
# .env.local

# Gmail OAuth
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret

# URLs
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Supabase (ya configurado)
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

---

## 🧪 Testing Multi-Tenant

### Script de Testing

```sql
-- Crear organización de prueba
INSERT INTO core.organizations (name, slug, org_type, status)
VALUES ('Test Company', 'test-company', 'business', 'active');

-- Asignar CRM a la org de prueba
INSERT INTO core.organization_applications (organization_id, application_id, is_enabled)
SELECT 
  (SELECT id FROM core.organizations WHERE slug = 'test-company'),
  (SELECT id FROM core.applications WHERE slug = 'crm_sales'),
  true;

-- Crear usuario de prueba en la org
INSERT INTO core.organization_users (organization_id, user_id, role_id)
SELECT
  (SELECT id FROM core.organizations WHERE slug = 'test-company'),
  'test-user-id',
  (SELECT id FROM core.roles WHERE slug = 'crm_manager');

-- Verificar aislamiento
-- Este query NO debe mostrar contactos de otras orgs
SELECT * FROM crm.contacts WHERE organization_id = 'org-id-de-prueba';
```

---

## 📦 Dependencias NPM

```bash
npm install googleapis @types/node
```

---

**Última actualización**: 12 de Noviembre 2024
**Estado**: Schema completo, listo para implementar UI

