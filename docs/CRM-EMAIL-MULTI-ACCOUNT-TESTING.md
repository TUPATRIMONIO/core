# 🧪 Guía de Testing - Sistema Multi-Cuenta de Gmail

## ✅ Checklist de Implementación Completada

- ✅ **Migración aplicada** (`20251114160000_crm_email_multi_account.sql`)
- ✅ **3 tablas nuevas** creadas (email_accounts, email_account_permissions, email_threads)
- ✅ **11 campos nuevos** en `crm.emails`
- ✅ **9 APIs REST** implementadas
- ✅ **4 UIs** creadas
- ✅ **Servicio de sincronización** completo
- ✅ **Cron job** configurado (cada 5 minutos)
- ✅ **Matching automático** con contactos
- ✅ **Threading** de conversaciones

---

## 🚀 Pasos de Testing

### **PASO 1: Configurar Google Cloud Console**

1. Ve a https://console.cloud.google.com
2. APIs & Services > Credentials
3. Edita tu OAuth Client
4. **Agregar a Authorized redirect URIs**:
   ```
   http://localhost:3000/api/crm/email-accounts/callback
   https://app.tupatrimonio.app/api/crm/email-accounts/callback
   ```
5. Guardar

### **PASO 2: Conectar Cuenta Compartida (contacto@tupatrimonio.app)**

1. **Navega a**: `http://localhost:3000/dashboard/crm/settings/email-accounts`

2. **Click en**: "Conectar Cuenta Compartida"

3. **Cuando pida nombre**, ingresa: `Contacto TuPatrimonio`

4. **Selecciona en Google**: `contacto@tupatrimonio.app`

5. **Autoriza** los permisos

6. **Verifica** que aparezca en "Cuentas Compartidas"

**Resultado esperado:**
```
✅ Cuentas Compartidas (1)
   📧 Contacto TuPatrimonio
      contacto@tupatrimonio.app
      [Por defecto] [🔄] [🗑️]
```

### **PASO 3: Conectar Cuenta Personal (felipe@tupatrimonio.app)**

1. **En la misma página**, click: "Conectar Mi Cuenta Personal"

2. **Selecciona en Google**: `felipe@tupatrimonio.app`

3. **Autoriza** los permisos

4. **Verifica** que aparezca en "Mis Cuentas Personales"

**Resultado esperado:**
```
✅ Mis Cuentas Personales (1)
   👤 felipe@tupatrimonio.app
      felipe@tupatrimonio.app
      [🔄] [🗑️]
```

### **PASO 4: Probar Selector de Cuenta al Enviar**

1. **Ve a un contacto**: `http://localhost:3000/dashboard/crm/contacts/[id]`

2. **Baja hasta** "Enviar Email"

3. **Verifica** que aparezca un selector desplegable "Enviar desde"

4. **Debería mostrar**:
   ```
   Enviar desde: [contacto@tupatrimonio.app ▼]
   
   Opciones:
   - 👥 Cuentas Compartidas
     └─ Contacto TuPatrimonio (contacto@tupatrimonio.app)
   
   - 👤 Mi Cuenta Personal
     └─ felipe@tupatrimonio.app
   ```

5. **Selecciona**: `felipe@tupatrimonio.app`

6. **Envía un email de prueba**

7. **Verifica** en tu bandeja que llegó desde `felipe@tupatrimonio.app`

8. **Cambia el selector** a `contacto@tupatrimonio.app`

9. **Envía otro email**

10. **Verifica** que ahora llegó desde `contacto@tupatrimonio.app`

### **PASO 5: Probar Sincronización Manual**

1. **Desde tu Gmail personal**, envía un email a `contacto@tupatrimonio.app`
   - Asunto: "Prueba de sincronización CRM"
   - Cuerpo: "Hola, este es un email de prueba para verificar la sincronización"

2. **En el CRM**, ve a: `http://localhost:3000/dashboard/crm/settings/email-accounts`

3. **Click en el botón de sincronización** (🔄) de la cuenta `contacto@tupatrimonio.app`

4. **Espera unos segundos**

5. **Deberías ver** mensaje de éxito: "X emails nuevos sincronizados"

### **PASO 6: Verificar el Inbox**

1. **Ve a**: `http://localhost:3000/dashboard/crm/inbox`

2. **Deberías ver**:
   - Lista de conversaciones (threads)
   - El email que enviaste en el Paso 5
   - Indicador de "no leído" (círculo azul)
   - Preview del mensaje

3. **Click en la conversación**

4. **Deberías ver**:
   - El thread completo
   - Email recibido marcado con 📨
   - Información del remitente
   - Botón "Responder"

### **PASO 7: Responder desde el Inbox**

1. **En la vista del thread**, click: "Responder"

2. **Completa el formulario**:
   - Selecciona cuenta: `contacto@tupatrimonio.app`
   - Mensaje: "Gracias por tu email. Respondo desde el CRM."

3. **Envía**

4. **Verifica**:
   - El nuevo email aparece en el thread
   - Marcado como 📤 Enviado
   - El thread se actualizó (contador de mensajes)

5. **Ve a tu Gmail** y verifica que llegó la respuesta

### **PASO 8: Verificar Threading**

1. **Desde tu Gmail**, responde al email anterior

2. **En el CRM**, sincroniza: `http://localhost:3000/dashboard/crm/settings/email-accounts`

3. **Ve al Inbox**: `http://localhost:3000/dashboard/crm/inbox`

4. **Click en el thread**

5. **Deberías ver**:
   - Email 1: Inicial (📨 Recibido)
   - Email 2: Tu respuesta (📤 Enviado)
   - Email 3: Nueva respuesta (📨 Recibido)
   - Todos en orden cronológico
   - Mismo thread/conversación

---

## 🧪 Tests de Base de Datos

### **Verificar Migración**

```sql
-- Ver cuentas conectadas
SELECT 
  id,
  email_address,
  account_type,
  is_active,
  is_default,
  last_sync_at
FROM crm.email_accounts;

-- Ver permisos
SELECT 
  eap.user_id,
  ea.email_address,
  eap.can_send,
  eap.can_receive,
  eap.is_default
FROM crm.email_account_permissions eap
JOIN crm.email_accounts ea ON ea.id = eap.email_account_id;

-- Ver threads
SELECT 
  gmail_thread_id,
  subject,
  email_count,
  is_read,
  last_email_at
FROM crm.email_threads
ORDER BY last_email_at DESC
LIMIT 10;

-- Ver emails con cuenta asociada
SELECT 
  e.subject,
  e.direction,
  e.from_email,
  ea.email_address as sent_from,
  e.sent_at
FROM crm.emails e
LEFT JOIN crm.email_accounts ea ON ea.id = e.sent_from_account_id
ORDER BY e.sent_at DESC
LIMIT 10;
```

### **Función: get_user_email_accounts**

```sql
-- Ver cuentas disponibles para un usuario
SELECT * FROM crm.get_user_email_accounts(
  'tu-user-uuid'::uuid,
  'tu-org-uuid'::uuid
);
```

### **Función: get_user_default_email_account**

```sql
-- Obtener cuenta por defecto
SELECT crm.get_user_default_email_account(
  'tu-user-uuid'::uuid,
  'tu-org-uuid'::uuid
);
```

---

## 🔍 Testing de Casos de Uso Específicos

### **Caso 1: Usuario con Múltiples Cuentas**

**Setup:**
- Owner conecta `contacto@tupatrimonio.app` (compartida)
- Owner conecta `felipe@tupatrimonio.app` (personal)

**Tests:**
1. ✅ Enviar desde cuenta compartida
2. ✅ Enviar desde cuenta personal
3. ✅ Cambiar cuenta por defecto
4. ✅ Ver selector con ambas cuentas
5. ✅ Sincronizar ambas cuentas
6. ✅ Ver emails de ambas en el Inbox

### **Caso 2: Permisos de Cuentas Compartidas**

**Setup:**
- Owner conecta `ventas@tupatrimonio.app` (compartida)
- Owner otorga permiso a usuario "María"

**Tests:**
1. ✅ María puede ver la cuenta en su selector
2. ✅ María puede enviar desde `ventas@`
3. ✅ María ve emails recibidos en `ventas@`
4. ✅ Usuario "Juan" (sin permiso) NO ve la cuenta
5. ✅ Owner puede revocar permiso a María

### **Caso 3: Cliente con Su Propia Organización**

**Setup:**
- Cliente "ABC S.A." conecta `info@clienteabc.com`
- Cliente conecta `pedro@clienteabc.com` (personal del owner)

**Tests:**
1. ✅ Cliente solo ve sus cuentas (no las de TuPatrimonio)
2. ✅ Cliente puede enviar desde ambas
3. ✅ Cliente ve solo sus threads (multi-tenant aislado)
4. ✅ Sincronización solo trae sus emails

---

## 🐛 Problemas Comunes y Soluciones

### **Error: "No email account available"**

**Causa**: No tienes cuentas conectadas o no tienes permiso

**Solución**:
1. Ve a `/dashboard/crm/settings/email-accounts`
2. Conecta al menos una cuenta
3. Recarga el EmailComposer

### **Error al sincronizar: "Token expired"**

**Causa**: Access token de Gmail expiró

**Solución**:
- El sistema debería refrescar automáticamente
- Si falla, desconecta y reconecta la cuenta

### **No aparecen emails en el Inbox**

**Causa**: No se ha sincronizado o no hay emails nuevos

**Solución**:
1. Click en "Sincronizar" en la página de cuentas
2. O espera 5 minutos para el cron automático
3. Verifica que `sync_enabled = true` en la cuenta

### **Thread no agrupa emails correctamente**

**Causa**: Gmail cambió el thread_id o emails no están relacionados

**Solución**:
- El threading usa el `thread_id` de Gmail
- Solo se agrupan emails que Gmail ya agrupa
- Verificar que sean respuestas (no emails nuevos)

---

## ✅ Checklist Final de Verificación

### **Base de Datos**
- [ ] Tablas creadas: `email_accounts`, `email_account_permissions`, `email_threads`
- [ ] Columnas agregadas a `crm.emails`
- [ ] Funciones SQL funcionando
- [ ] RLS activo y funcionando
- [ ] Migración de tokens existentes completada

### **APIs**
- [ ] GET `/api/crm/email-accounts` - retorna lista
- [ ] POST `/api/crm/email-accounts/connect` - redirige a Google
- [ ] GET `/api/crm/email-accounts/callback` - guarda cuenta
- [ ] POST `/api/crm/emails/send` - envía con account_id
- [ ] POST `/api/crm/emails/sync` - sincroniza emails
- [ ] GET `/api/crm/inbox` - lista threads
- [ ] GET `/api/crm/inbox/[id]` - thread completo

### **UIs**
- [ ] `/dashboard/crm/settings/email-accounts` - gestión de cuentas
- [ ] EmailComposer - selector de cuenta visible
- [ ] `/dashboard/crm/inbox` - lista de threads
- [ ] `/dashboard/crm/inbox/[id]` - vista de conversación
- [ ] Sidebar - link a "Inbox" visible

### **Funcionalidades**
- [ ] Conectar cuenta compartida
- [ ] Conectar cuenta personal
- [ ] Enviar desde cuenta específica
- [ ] Sincronización manual funciona
- [ ] Sincronización automática (cron) funciona
- [ ] Emails se agrupan en threads
- [ ] Matching automático con contactos
- [ ] Responder mantiene el thread
- [ ] Marcar como leído funciona
- [ ] Archivar thread funciona

---

## 📊 Métricas de Éxito

Después de completar el testing, deberías tener:

- ✅ **2+ cuentas conectadas** (1 compartida, 1 personal)
- ✅ **10+ emails sincronizados** del inbox de Gmail
- ✅ **5+ threads** agrupados correctamente
- ✅ **3+ contactos** auto-matched con emails
- ✅ **0 errores** en sincronización
- ✅ **Cron job** ejecutándose cada 5 minutos

---

## 🎯 Próximos Pasos Después del Testing

### **Optimizaciones**
1. Encriptar tokens en producción
2. Agregar rate limiting a endpoints de sync
3. Implementar retry logic para fallos de sync
4. Agregar logs de auditoría

### **Features Adicionales**
1. Templates de email
2. Snippets reutilizables
3. Firma automática por cuenta
4. Tracking de opens/clicks
5. Email scheduling
6. Push notifications (reemplazar polling)
7. Adjuntos en emails
8. Búsqueda avanzada

### **UI Improvements**
1. Vista de lista vs vista compacta en Inbox
2. Filtros avanzados (por fecha, adjuntos, etc.)
3. Búsqueda full-text en cuerpo de emails
4. Etiquetas/tags personalizables
5. Shortcuts de teclado
6. Notificaciones de emails nuevos

---

## 🔐 Seguridad en Producción

### **Importante:**

1. **Encriptar tokens**: 
   ```typescript
   import { encrypt, decrypt } from '@/lib/crypto';
   
   // Al guardar
   gmail_oauth_tokens: encrypt(JSON.stringify(tokens))
   
   // Al usar
   const tokens = JSON.parse(decrypt(encryptedTokens));
   ```

2. **Proteger cron endpoint**:
   ```bash
   # .env
   CRON_SECRET=tu-secreto-super-seguro-aqui
   ```

3. **Rate limiting**:
   - Limitar llamadas a Gmail API
   - Implementar exponential backoff

4. **Auditoría**:
   - Loguear todos los envíos de email
   - Loguear cambios de permisos
   - Loguear conexión/desconexión de cuentas

---

## ✨ Features Implementadas

### **Multi-Cuenta**
- ✅ Cuentas compartidas (varios usuarios)
- ✅ Cuentas personales (solo el dueño)
- ✅ Permisos granulares por usuario
- ✅ Cuenta por defecto configurable
- ✅ Selector de cuenta al enviar

### **Sincronización**
- ✅ Sync manual por cuenta
- ✅ Sync automático cada 5 min (cron)
- ✅ Parser completo de emails
- ✅ Refresh automático de tokens
- ✅ Error handling robusto

### **Threading**
- ✅ Agrupación por thread_id de Gmail
- ✅ Contador de mensajes
- ✅ Preview del último mensaje
- ✅ Participantes de la conversación
- ✅ Estados (active, archived, closed)

### **Matching**
- ✅ Auto-match con contactos por email
- ✅ Creación de actividades automáticas
- ✅ Vinculación a contactos existentes

### **Inbox**
- ✅ Lista de threads
- ✅ Filtros (all, unread)
- ✅ Búsqueda
- ✅ Vista de conversación completa
- ✅ Responder desde inbox
- ✅ Marcar como leído automático
- ✅ Archivar threads

---

## 🎉 Sistema 100% Funcional

Una vez completes todos los tests, tendrás un sistema de emails multi-cuenta completamente funcional, al nivel de HubSpot o Salesforce.

**Características destacadas:**
- Multi-tenant (cada organización aislada)
- Multi-cuenta (compartidas + personales)
- Permisos configurables
- Sincronización automática
- Threading inteligente
- Matching automático
- Inbox unificado

---

**¡Empieza el testing y avísame cualquier problema que encuentres!** 🚀

