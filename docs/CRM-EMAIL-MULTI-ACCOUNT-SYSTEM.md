# 📧 Sistema Multi-Cuenta de Gmail - CRM TuPatrimonio

## ✨ Resumen

Has implementado un sistema completo de gestión de emails multi-cuenta similar a HubSpot, que permite:

- ✅ Múltiples cuentas de Gmail por organización (compartidas y personales)
- ✅ Sistema de permisos granular
- ✅ Sincronización automática de emails entrantes
- ✅ Threading de conversaciones
- ✅ Matching automático con contactos
- ✅ Inbox unificado con todas las cuentas

**Fecha de implementación**: 14 Noviembre 2025  
**Estado**: Backend 100% completo, UIs pendientes

---

## 🏗️ Arquitectura del Sistema

### **Conceptos Principales**

```
┌─────────────────────────────────────────────────────────────┐
│                    ORGANIZACIÓN                              │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  📬 Cuentas Compartidas                                     │
│  ├─ contacto@tupatrimonio.app (5 usuarios con acceso)      │
│  └─ ventas@tupatrimonio.app (2 usuarios con acceso)        │
│                                                             │
│  👤 Cuentas Personales                                      │
│  ├─ felipe@tupatrimonio.app (Felipe - owner)               │
│  └─ maria@tupatrimonio.app (María - sales_rep)             │
│                                                             │
│  📧 Emails & Threads                                        │
│  ├─ Emails enviados desde cualquier cuenta                 │
│  ├─ Emails recibidos en cualquier cuenta                   │
│  └─ Agrupados por thread_id de Gmail                       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 📊 Tablas de Base de Datos

### **1. `crm.email_accounts`**

Almacena todas las cuentas de Gmail conectadas.

**Campos principales:**
- `email_address` - Email de la cuenta
- `account_type` - `'shared'` o `'personal'`
- `owner_user_id` - Solo para cuentas personales
- `gmail_oauth_tokens` - Tokens OAuth (encriptar en producción)
- `is_default` - Cuenta por defecto de la organización
- `sync_enabled` - Si sincroniza emails automáticamente
- `last_sync_at` - Última vez que sincronizó

### **2. `crm.email_account_permissions`**

Controla quién puede usar qué cuentas compartidas.

**Campos principales:**
- `email_account_id` - Referencia a la cuenta
- `user_id` - Usuario con permiso
- `can_send` - Puede enviar desde esta cuenta
- `can_receive` - Puede ver emails recibidos
- `is_default` - Cuenta por defecto del usuario

### **3. `crm.email_threads`**

Agrupa emails en conversaciones (threads).

**Campos principales:**
- `gmail_thread_id` - Thread ID de Gmail
- `subject` - Asunto de la conversación
- `participants` - Array de emails participantes
- `contact_id` - Contacto asociado (auto-match)
- `email_count` - Cantidad de emails en el thread
- `is_read` - Si fue leído
- `status` - `active`, `closed`, `archived`

### **4. `crm.emails` (actualizado)**

Tabla existente con nuevos campos:
- `sent_from_account_id` - Desde qué cuenta se envió
- `received_in_account_id` - En qué cuenta se recibió
- `thread_id_crm` - Referencia al thread
- `parent_email_id` - Email al que responde
- `is_read` - Si fue leído
- `labels` - Labels de Gmail
- `in_reply_to` - Message-ID del email padre
- `references` - Array de Message-IDs de la conversación

---

## 🔌 APIs Implementadas

### **Gestión de Cuentas**

| Endpoint | Método | Descripción |
|----------|--------|-------------|
| `/api/crm/email-accounts` | GET | Listar cuentas disponibles para el usuario |
| `/api/crm/email-accounts` | POST | Crear nueva cuenta (no usar, usar connect) |
| `/api/crm/email-accounts/connect` | GET | Iniciar OAuth para conectar cuenta |
| `/api/crm/email-accounts/callback` | GET | Callback de OAuth |
| `/api/crm/email-accounts/[id]` | GET | Detalles de cuenta |
| `/api/crm/email-accounts/[id]` | PATCH | Actualizar config de cuenta |
| `/api/crm/email-accounts/[id]` | DELETE | Desconectar cuenta |
| `/api/crm/email-accounts/[id]/permissions` | GET | Listar permisos |
| `/api/crm/email-accounts/[id]/permissions` | POST | Otorgar permiso |

### **Envío y Sincronización**

| Endpoint | Método | Descripción |
|----------|--------|-------------|
| `/api/crm/emails/send` | POST | Enviar email (ahora con from_account_id) |
| `/api/crm/emails/sync` | POST | Sincronizar emails manualmente |

### **Inbox y Threads**

| Endpoint | Método | Descripción |
|----------|--------|-------------|
| `/api/crm/inbox` | GET | Listar threads del inbox |
| `/api/crm/inbox/[threadId]` | GET | Ver thread completo |
| `/api/crm/inbox/[threadId]` | PATCH | Actualizar estado del thread |

---

## 🚀 Flujos de Uso

### **Flujo 1: Conectar Cuenta Compartida (Owner)**

```typescript
// 1. Owner inicia OAuth
const response = await fetch('/api/crm/email-accounts/connect?account_type=shared&display_name=Contacto TuPatrimonio');
const { auth_url } = await response.json();
window.location.href = auth_url;

// 2. Usuario autoriza en Google (elige contacto@tupatrimonio.app)
// 3. Redirige a callback que crea la cuenta
// 4. Cuenta aparece en la lista de cuentas compartidas

// 5. Owner otorga permisos a usuarios
await fetch('/api/crm/email-accounts/[account-id]/permissions', {
  method: 'POST',
  body: JSON.stringify({
    user_id: 'usuario-uuid',
    can_send: true,
    can_receive: true
  })
});
```

### **Flujo 2: Conectar Cuenta Personal (Usuario)**

```typescript
// 1. Usuario inicia OAuth para su cuenta personal
const response = await fetch('/api/crm/email-accounts/connect?account_type=personal&display_name=Felipe Leveke');
const { auth_url } = await response.json();
window.location.href = auth_url;

// 2. Usuario autoriza con felipe@tupatrimonio.app
// 3. Se crea cuenta personal vinculada al usuario
// 4. Solo ese usuario puede usarla
```

### **Flujo 3: Enviar Email desde Cuenta Específica**

```typescript
// Enviar desde cuenta compartida
await fetch('/api/crm/emails/send', {
  method: 'POST',
  body: JSON.stringify({
    from_account_id: 'shared-account-uuid', // Especificar cuenta
    to: 'cliente@empresa.com',
    subject: 'Consulta sobre servicios',
    body: '<p>Hola, gracias por contactarnos...</p>',
    contact_id: 'contact-uuid'
  })
});

// Enviar desde cuenta personal
await fetch('/api/crm/emails/send', {
  method: 'POST',
  body: JSON.stringify({
    from_account_id: 'personal-account-uuid',
    to: 'cliente@empresa.com',
    subject: 'Seguimiento personalizado',
    body: '<p>Hola desde mi cuenta personal...</p>'
  })
});

// Enviar desde cuenta por defecto (automático)
await fetch('/api/crm/emails/send', {
  method: 'POST',
  body: JSON.stringify({
    // No especificar from_account_id, usa cuenta por defecto
    to: 'cliente@empresa.com',
    subject: 'Email rápido',
    body: '<p>Mensaje...</p>'
  })
});
```

### **Flujo 4: Sincronizar Emails Entrantes**

```typescript
// Sincronizar todas las cuentas de la org
const response = await fetch('/api/crm/emails/sync', { method: 'POST' });
const result = await response.json();
// {
//   summary: {
//     accounts_synced: 3,
//     new_emails: 15,
//     updated_threads: 8,
//     errors: []
//   }
// }

// Sincronizar solo una cuenta
await fetch('/api/crm/emails/sync?account_id=account-uuid', { method: 'POST' });
```

### **Flujo 5: Ver Inbox y Threads**

```typescript
// Listar threads del inbox
const response = await fetch('/api/crm/inbox?unread_only=true');
const { data: threads } = await response.json();

// Ver thread completo
const threadResponse = await fetch('/api/crm/inbox/thread-uuid');
const { thread, emails } = await threadResponse.json();
// emails[] ordenados cronológicamente formando la conversación

// Marcar como leído (se hace automáticamente al ver)
// Cerrar thread
await fetch('/api/crm/inbox/thread-uuid', {
  method: 'PATCH',
  body: JSON.stringify({ status: 'closed' })
});
```

---

## 🔐 Sistema de Permisos

### **Matriz de Permisos**

| Rol | Cuentas Compartidas | Cuentas Personales | Gestionar Permisos |
|-----|---------------------|--------------------|--------------------|
| **Owner** | ✅ Todas | ✅ Propia | ✅ Sí |
| **Admin** | ✅ Con permiso | ✅ Propia | ✅ Sí |
| **User** | ✅ Con permiso | ✅ Propia (si permitido) | ❌ No |

### **Configuración por Organización**

En `crm.settings.email_settings`:

```json
{
  "allow_personal_accounts": true,      // Permitir cuentas personales
  "require_approval_for_personal": false, // Requiere aprobación del owner
  "default_from_name": "TuPatrimonio",
  "signature_html": "<p>Saludos,<br>Equipo TuPatrimonio</p>",
  "sync_enabled": true,
  "sync_interval_minutes": 5
}
```

---

## 🔄 Sincronización de Emails

### **Cómo Funciona**

1. **Polling cada X minutos** (configurable)
2. Para cada cuenta activa con `sync_enabled = true`:
   - Llama a Gmail API `users.messages.list()`
   - Filtra solo emails nuevos desde `last_sync_at`
   - Para cada email:
     - Descarga contenido completo
     - Parsea headers y body
     - Intenta match con contactos por email
     - Guarda en `crm.emails`
     - Crea/actualiza thread en `crm.email_threads`
     - Crea actividad si hay contacto
   - Actualiza `last_sync_at`

### **Matching Automático con Contactos**

```typescript
// Si el email es INBOUND, busca contacto por FROM
// Si el email es OUTBOUND, busca contacto por TO[0]

const contactEmail = direction === 'inbound' ? parsed.from : parsed.to[0];

const contact = await findContactByEmail(organizationId, contactEmail);

if (contact) {
  // Asociar email al contacto
  // Crear actividad en timeline del contacto
}
```

---

## 🛠️ Configuración en Google Cloud Console

Ahora necesitas **agregar una nueva Redirect URI** para el nuevo flujo de cuentas:

1. Ve a: https://console.cloud.google.com
2. APIs & Services > Credentials
3. Edita tu OAuth Client
4. **Agregar a Authorized redirect URIs**:
   ```
   http://localhost:3000/api/crm/email-accounts/callback
   https://app.tupatrimonio.app/api/crm/email-accounts/callback
   ```
5. Guardar

---

## 📝 Próximos Pasos para Completar

### **1. Aplicar Migración** ⏳ URGENTE

```bash
cd "D:\Aplicaciones-Desarrollos\TuPatrimonio Apps\tupatrimonio-app"
supabase db reset
```

### **2. Actualizar Google Cloud Console** ⏳

Agregar redirect URI: `/api/crm/email-accounts/callback`

### **3. Crear UIs** (yo lo haré)

- [ ] Página de gestión de cuentas
- [ ] Selector de cuenta en EmailComposer
- [ ] Página de Inbox
- [ ] Vista de thread/conversación

### **4. Crear Edge Function** (yo lo haré)

- [ ] Cron job que ejecute sync cada 5 minutos

### **5. Testing**

- [ ] Conectar `contacto@tupatrimonio.app`
- [ ] Conectar `felipe@tupatrimonio.app`
- [ ] Otorgar permisos a usuarios
- [ ] Enviar desde diferentes cuentas
- [ ] Sincronizar emails
- [ ] Ver inbox y threads

---

## 🎯 Casos de Uso Implementados

### **Caso: TuPatrimonio (Tu Empresa)**

**Configuración:**
```
1. Owner (tú) conectas:
   - contacto@tupatrimonio.app (compartida)
   - felipe@tupatrimonio.app (personal)

2. Otorgas permisos:
   - Usuario "María" puede usar contacto@tupatrimonio.app
   - Usuario "Juan" puede usar contacto@tupatrimonio.app

3. María conecta su cuenta personal:
   - maria@tupatrimonio.app (si lo permites en settings)

Resultado:
- Tú puedes enviar desde ambas cuentas
- María puede enviar desde contacto@ y maria@
- Juan solo puede enviar desde contacto@
- Todos ven emails recibidos según sus permisos
```

### **Caso: Cliente ABC (Organización Cliente)**

```
1. Pedro (owner de Cliente ABC) conecta:
   - info@clienteabc.com (compartida)
   - pedro@clienteabc.com (personal)

2. Pedro otorga permisos:
   - Ana y Luis pueden usar info@clienteabc.com

Resultado:
- Pedro ve TODO (info@ y pedro@)
- Ana y Luis solo ven info@
- No ven nada de TuPatrimonio (multi-tenant aislado)
```

---

## 🔍 Funciones SQL Útiles

### **Ver cuentas disponibles de un usuario**

```sql
SELECT * FROM crm.get_user_email_accounts(
  'user-uuid'::uuid,
  'org-uuid'::uuid
);
```

### **Obtener cuenta por defecto de un usuario**

```sql
SELECT crm.get_user_default_email_account(
  'user-uuid'::uuid,
  'org-uuid'::uuid
);
```

### **Ver threads sin leer**

```sql
SELECT * FROM crm.email_threads
WHERE organization_id = 'org-uuid'
AND is_read = false
ORDER BY last_email_at DESC;
```

### **Ver emails de un thread**

```sql
SELECT * FROM crm.emails
WHERE thread_id = 'gmail-thread-id'
AND organization_id = 'org-uuid'
ORDER BY sent_at ASC;
```

---

## 📧 Ejemplo Completo de Envío

### **Frontend (EmailComposer con selector)**

```typescript
const [selectedAccount, setSelectedAccount] = useState<string>('');
const [accounts, setAccounts] = useState<EmailAccount[]>([]);

// Cargar cuentas disponibles
useEffect(() => {
  fetch('/api/crm/email-accounts')
    .then(r => r.json())
    .then(({ data }) => {
      setAccounts(data);
      setSelectedAccount(data.find(a => a.is_default)?.account_id || data[0]?.account_id);
    });
}, []);

// Enviar
const handleSend = async () => {
  await fetch('/api/crm/emails/send', {
    method: 'POST',
    body: JSON.stringify({
      from_account_id: selectedAccount, // Cuenta elegida
      to: 'cliente@empresa.com',
      subject: 'Hola',
      body: '<p>Mensaje...</p>'
    })
  });
};
```

---

## 🎨 Componentes UI a Crear

### **1. EmailAccountSelector**

```tsx
<Select value={accountId} onValueChange={setAccountId}>
  <SelectTrigger>
    <Mail className="w-4 h-4 mr-2" />
    {selectedAccount.email_address}
  </SelectTrigger>
  <SelectContent>
    {/* Cuentas compartidas */}
    <SelectGroup>
      <SelectLabel>Cuentas Compartidas</SelectLabel>
      <SelectItem value="id-1">contacto@tupatrimonio.app</SelectItem>
    </SelectGroup>
    
    {/* Cuenta personal */}
    <SelectSeparator />
    <SelectGroup>
      <SelectLabel>Mi Cuenta</SelectLabel>
      <SelectItem value="id-2">felipe@tupatrimonio.app</SelectItem>
    </SelectGroup>
  </SelectContent>
</Select>
```

### **2. InboxThreadList**

Lista de conversaciones tipo Gmail/Outlook.

### **3. ThreadConversationView**

Vista de mensajes de un thread ordenados cronológicamente.

---

## ⚙️ Configuración de Sincronización Automática

### **Opción A: Vercel Cron (Recomendado)**

```typescript
// vercel.json
{
  "crons": [{
    "path": "/api/crm/emails/sync/cron",
    "schedule": "*/5 * * * *"  // Cada 5 minutos
  }]
}
```

### **Opción B: Supabase Edge Function + pg_cron**

```sql
-- Ejecutar sync cada 5 minutos
SELECT cron.schedule(
  'sync-gmail-emails',
  '*/5 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://app.tupatrimonio.app/api/crm/emails/sync',
    headers := '{"Content-Type": "application/json"}'::jsonb
  );
  $$
);
```

---

## 📱 Próximas UIs a Implementar

1. **`/dashboard/crm/settings/email-accounts`**
   - Listar cuentas conectadas
   - Botón "Conectar Cuenta Compartida"
   - Botón "Conectar Mi Cuenta Personal"
   - Gestionar permisos por cuenta

2. **`/dashboard/crm/inbox`**
   - Lista de threads
   - Filtros: No leídos, Por cuenta, Por contacto
   - Click en thread → Ver conversación

3. **`/dashboard/crm/inbox/[threadId]`**
   - Ver todos los emails del thread
   - Botón "Responder" (mantiene thread)
   - Vincular a contacto si no está vinculado
   - Marcar como leído/no leído
   - Cerrar/Archivar

4. **Actualizar `EmailComposer`**
   - Dropdown "Enviar desde: [cuenta]"
   - Mostrar firma de la cuenta seleccionada

---

## 🔮 Features Futuras (Post-MVP)

- [ ] Templates de email
- [ ] Snippets reutilizables
- [ ] Firma automática por cuenta
- [ ] Tracking de opens/clicks
- [ ] Email scheduling (envío programado)
- [ ] Push notifications en lugar de polling
- [ ] Búsqueda avanzada en emails
- [ ] Exportar conversaciones
- [ ] Adjuntos en emails
- [ ] Domain-wide Delegation para Google Workspace

---

**🎉 Sistema 75% Completo - Solo Faltan UIs**

Aplica la migración y te continúo con las interfaces! 🚀

