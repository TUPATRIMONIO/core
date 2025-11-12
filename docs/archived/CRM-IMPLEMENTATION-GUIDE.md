# Guía de Implementación: CRM Básico

## 📋 Resumen

Sistema CRM básico para gestionar leads de waitlist y formularios de contacto, con integración de Gmail para responder correos directamente desde el dashboard.

## ✅ Fase 1: Migración del Sistema de Roles (COMPLETADA)

### Archivo de Migración
- **Ubicación**: `supabase/migrations/20251112185905_limpiar-user-roles.sql`
- **Estado**: Pendiente de aplicar manualmente

### Cambios Realizados

1. **Base de Datos**:
   - ✅ Eliminada tabla `marketing.user_roles`
   - ✅ Función `can_access_admin()` actualizada para usar `core.organization_users`
   - ✅ Nueva función `can_access_crm()` para verificar acceso al CRM
   - ✅ Rol `sales_manager` creado (opcional para futuro)
   - ✅ Políticas RLS actualizadas

2. **Código TypeScript**:
   - ✅ `apps/web/src/lib/page-management.ts` - Actualizado para usar sistema core
   - ✅ `apps/web/src/app/dashboard/users/page.tsx` - Instrucciones SQL actualizadas

### Sistema de Roles Unificado

```
core.roles (Sistema único):
├── platform_super_admin (nivel 10) - Acceso total
├── marketing_admin (nivel 7) - Gestión de contenido
└── sales_manager (nivel 5) - Gestión de CRM (futuro)
```

### Cómo Aplicar la Migración

```bash
# En el SQL Editor de Supabase, ejecuta el contenido de:
# supabase/migrations/20251112185905_limpiar-user-roles.sql
```

**⚠️ IMPORTANTE**: Antes de aplicar, asegúrate de:
1. Tener backup de la base de datos
2. Verificar que tienes al menos un usuario en `core.organization_users` con rol admin
3. No hay usuarios activos dependiendo de `marketing.user_roles`

---

## 🚀 Fase 2: Implementación del CRM

### Estructura de Base de Datos (Ya Existente)

Las siguientes tablas ya están listas para usar:

```sql
marketing.waitlist_subscribers
├── id, email, first_name, last_name, company
├── use_case, referral_source
├── status (active, unsubscribed, bounced)
└── subscribed_at, unsubscribed_at

marketing.contact_messages
├── id, name, email, company, phone
├── subject, message
├── form_type, priority
├── status (new, read, replied, closed, spam)
├── assigned_to, responded_at, response_notes
└── created_at, updated_at
```

### Estructura de Rutas a Crear

```
apps/web/src/app/dashboard/crm/
├── page.tsx                    # Lista principal de leads
├── leads/[id]/page.tsx        # Detalle de lead individual
├── layout.tsx                 # Layout del CRM (opcional)
└── components/
    ├── LeadsList.tsx          # Tabla de leads con filtros
    ├── LeadDetail.tsx         # Vista detallada
    ├── StatusBadge.tsx        # Badge visual de estados
    ├── EmailComposer.tsx      # Compositor de email
    ├── LeadNotes.tsx          # Sistema de notas
    └── LeadFilters.tsx        # Filtros y búsqueda
```

### API Routes a Crear

```
apps/web/src/app/api/crm/
├── leads/
│   ├── route.ts               # GET: Lista de leads con filtros
│   └── [id]/
│       ├── route.ts           # GET, PATCH: Detalle y actualización
│       └── email/route.ts     # POST: Enviar email vía Gmail
└── stats/route.ts             # GET: Estadísticas para badge
```

### Integración Gmail

#### 1. Configurar Google Cloud Console

```
1. Ir a https://console.cloud.google.com
2. Crear nuevo proyecto: "TuPatrimonio CRM"
3. Habilitar Gmail API
4. Crear credenciales OAuth 2.0:
   - Tipo: Aplicación web
   - URIs autorizados: http://localhost:3000
   - URIs de redirección: http://localhost:3000/api/auth/gmail/callback
5. Descargar credenciales
```

#### 2. Variables de Entorno

```bash
# .env.local
GOOGLE_CLIENT_ID=your_client_id_here
GOOGLE_CLIENT_SECRET=your_client_secret_here
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/gmail/callback
```

#### 3. Librerías Necesarias

```bash
npm install googleapis @types/node
```

#### 4. Servicios Gmail a Implementar

```
apps/web/src/lib/gmail/
├── oauth.ts          # Configuración OAuth 2.0
├── service.ts        # Funciones de envío de email
└── types.ts          # Types para Gmail API
```

### Sistema de Notificaciones

#### Badge en Sidebar

Modificar `apps/web/src/app/dashboard/layout.tsx`:

```tsx
// Agregar icono CRM con badge
import { Mail } from 'lucide-react';

// Fetch stats
const { data: stats } = await supabase.rpc('get_crm_stats');

<Link href="/dashboard/crm">
  <Mail className="h-4 w-4 mr-3" />
  CRM
  {stats?.newLeads > 0 && (
    <span className="ml-2 px-2 py-0.5 text-xs bg-red-500 text-white rounded-full">
      {stats.newLeads}
    </span>
  )}
</Link>
```

#### Función RPC para Stats

Nueva migración necesaria:

```sql
CREATE OR REPLACE FUNCTION public.get_crm_stats()
RETURNS JSON AS $$
DECLARE
  new_messages INTEGER;
  new_waitlist INTEGER;
BEGIN
  SELECT COUNT(*) INTO new_messages 
  FROM marketing.contact_messages 
  WHERE status = 'new';
  
  SELECT COUNT(*) INTO new_waitlist 
  FROM marketing.waitlist_subscribers 
  WHERE status = 'active' 
  AND subscribed_at > NOW() - INTERVAL '7 days';
  
  RETURN json_build_object(
    'newLeads', new_messages + new_waitlist,
    'newMessages', new_messages,
    'newWaitlist', new_waitlist
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## 📝 Orden de Implementación Recomendado

### Paso 1: Verificación Post-Migración
- [ ] Aplicar migración de roles
- [ ] Verificar que `can_access_admin()` funciona
- [ ] Probar acceso al dashboard

### Paso 2: Estructura Base del CRM
- [ ] Crear carpetas y archivos base
- [ ] Implementar layout del CRM
- [ ] Agregar link en sidebar con badge

### Paso 3: Lista de Leads
- [ ] API route para obtener leads
- [ ] Componente LeadsList con tabla
- [ ] Implementar filtros y búsqueda
- [ ] Componente StatusBadge

### Paso 4: Detalle de Lead
- [ ] Página de detalle
- [ ] API route para actualización
- [ ] Sistema de notas
- [ ] Cambio de estados

### Paso 5: Integración Gmail
- [ ] Configurar OAuth en Google Cloud
- [ ] Implementar servicios Gmail
- [ ] Componente EmailComposer
- [ ] API route para envío

### Paso 6: Sistema de Notificaciones
- [ ] Función RPC get_crm_stats
- [ ] Badge en sidebar
- [ ] Actualización en tiempo real (opcional)

### Paso 7: Testing
- [ ] Testing de permisos
- [ ] Testing de funcionalidad completa
- [ ] Testing de envío de emails

---

## 🔐 Control de Acceso

### Verificación en Server Components

```typescript
// En página de CRM
const supabase = await createClient();
const { data: { user } } = await supabase.auth.getUser();

if (!user) {
  redirect('/login');
}

const { data: canAccess } = await supabase.rpc('can_access_crm', {
  user_id: user.id
});

if (!canAccess) {
  redirect('/dashboard');
}
```

### Verificación en API Routes

```typescript
// En API route
export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: canAccess } = await supabase.rpc('can_access_crm', {
    user_id: user.id
  });

  if (!canAccess) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // ... lógica del endpoint
}
```

---

## 📊 Métricas de Éxito

- [ ] Usuario puede ver lista de leads desde ambas fuentes (waitlist + contact)
- [ ] Usuario puede filtrar leads por status, tipo, fecha
- [ ] Usuario puede ver detalle completo de cada lead
- [ ] Usuario puede cambiar status de lead
- [ ] Usuario puede agregar notas a lead
- [ ] Usuario puede enviar email desde el dashboard
- [ ] Sistema actualiza automatically status a "replied" al enviar email
- [ ] Badge muestra correctamente número de leads nuevos
- [ ] Solo usuarios con permisos pueden acceder al CRM

---

## 🔮 Mejoras Futuras (Post-MVP)

- [ ] Respuestas automáticas con templates
- [ ] Threading de conversaciones (leer emails entrantes)
- [ ] Integración con Slack para notificaciones
- [ ] Sistema de tags personalizables
- [ ] Reportes y analytics avanzados
- [ ] Exportar leads a CSV
- [ ] Integración con otros CRMs (Hubspot, Salesforce)
- [ ] Asignar leads a diferentes usuarios del equipo

---

## 📞 Soporte

Si encuentras problemas durante la implementación:

1. Verificar logs de Supabase
2. Verificar que la migración se aplicó correctamente
3. Verificar variables de entorno
4. Verificar permisos de usuario en `core.organization_users`

---

**Última actualización**: 12 de Noviembre 2024

