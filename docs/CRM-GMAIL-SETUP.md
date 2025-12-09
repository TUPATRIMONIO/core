# Gmail Integration Setup - CRM TuPatrimonio

## 📧 Overview

El CRM incluye integración completa con Gmail para enviar y recibir emails directamente desde el dashboard.

---

## 🔧 Configuración de Google Cloud

### Paso 1: Crear Proyecto en Google Cloud Console

1. Ir a https://console.cloud.google.com
2. Crear nuevo proyecto: **"TuPatrimonio CRM"**
3. Seleccionar el proyecto recién creado

### Paso 2: Habilitar Gmail API

1. En el menú lateral, ir a **"APIs & Services" > "Library"**
2. Buscar **"Gmail API"**
3. Click en **"Enable"**

### Paso 3: Crear Credenciales OAuth 2.0

1. Ir a **"APIs & Services" > "Credentials"**
2. Click en **"Create Credentials" > "OAuth client ID"**
3. Si es primera vez, configurar **"OAuth consent screen"**:
   - User Type: **External** (o Internal si usas Google Workspace)
   - App name: **TuPatrimonio CRM**
   - User support email: tu email
   - Developer contact: tu email
   - Scopes: Agregar scopes de Gmail:
     - `https://www.googleapis.com/auth/gmail.send`
     - `https://www.googleapis.com/auth/gmail.compose`
     - `https://www.googleapis.com/auth/gmail.readonly` (requerido para sincronización)
   - Test users: Agregar tus emails de prueba

4. Crear OAuth client:
   - Application type: **Web application**
   - Name: **TuPatrimonio CRM Web**
   - Authorized JavaScript origins:
     - `http://localhost:3000`
     - `https://app.tupatrimonio.app`
   - Authorized redirect URIs:
     - `http://localhost:3000/api/crm/settings/gmail/callback`
     - `https://app.tupatrimonio.app/api/crm/settings/gmail/callback`

5. **Descargar credenciales** (JSON)

### Paso 4: Configurar Variables de Entorno

En `.env.local`:

```bash
# Gmail OAuth
GOOGLE_CLIENT_ID=tu_client_id_aqui.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=tu_client_secret_aqui

# Clave de encriptación (OBLIGATORIA para producción)
# Generar una clave segura:
# node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
ENCRYPTION_KEY=tu-clave-de-64-caracteres-hex-aqui

# URLs (ya configuradas)
NEXT_PUBLIC_APP_URL=http://localhost:3000
GOOGLE_REDIRECT_URI=http://localhost:3000/api/admin/gmail/callback

# Secret para cron job de sincronización automática (producción)
# Generar una clave segura:
# node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
CRON_SECRET=tu-clave-secreta-para-cron-aqui
```

En **Vercel** (producción):
- Agregar `GOOGLE_CLIENT_ID`
- Agregar `GOOGLE_CLIENT_SECRET`
- Agregar `ENCRYPTION_KEY` (MUY IMPORTANTE - debe ser la misma en todos los entornos)
- Agregar `GOOGLE_REDIRECT_URI=https://app.tupatrimonio.app/api/admin/gmail/callback`
- Agregar `CRON_SECRET` (requerido para sincronización automática)

⚠️ **IMPORTANTE**: Si conectas Gmail sin `ENCRYPTION_KEY` configurada, los tokens se encriptarán con una clave temporal que cambia en cada reinicio del servidor. Esto hará que los tokens sean inutilizables. **Siempre configura `ENCRYPTION_KEY` antes de conectar Gmail.**

---

## 📦 Instalar Dependencias

```bash
npm install googleapis
```

---

## 🚀 Conectar Gmail desde el CRM

### Paso 1: Navegar a Settings

```
http://localhost:3000/dashboard/crm/settings/gmail
```

### Paso 2: Click en "Conectar con Gmail"

Esto:
1. Genera URL de OAuth con tu `organization_id`
2. Redirige a Google para autorizar
3. Usuario acepta permisos
4. Google redirige a `/api/crm/settings/gmail/callback`
5. Callback guarda tokens en `crm.settings`
6. Redirige de vuelta a settings con confirmación

### Paso 3: Verificar Conexión

Deberías ver:
- ✅ Gmail Conectado
- Email de la cuenta conectada
- Opción para desconectar

---

## 📧 Enviar Emails desde el CRM

### Desde Detalle de Contacto

1. Ir a `/dashboard/crm/contacts/[id]`
2. Scroll down hasta "Enviar Email"
3. El campo "Para" viene pre-llenado con el email del contacto
4. Escribir asunto y mensaje
5. Click "Enviar Email"

**Lo que sucede**:
- Email se envía vía Gmail API
- Se guarda en `crm.emails`
- Se crea actividad automática en `crm.activities`
- Aparece en el timeline del contacto

### Desde Cualquier Parte

Puedes usar el componente `EmailComposer`:

```tsx
import { EmailComposer } from '@/components/crm/EmailComposer';

<EmailComposer 
  defaultTo="cliente@empresa.com"
  defaultSubject="Propuesta Comercial"
  contactId="contact-uuid"
  onSent={() => console.log('Email sent!')}
/>
```

---

## 🔐 Seguridad

### Tokens Almacenados

Los tokens OAuth se guardan en `crm.settings.gmail_oauth_tokens`:

```sql
SELECT gmail_oauth_tokens FROM crm.settings 
WHERE organization_id = 'your-org-id';
```

⚠️ **IMPORTANTE en Producción**:

```typescript
// Encriptar tokens antes de guardar
import { encrypt, decrypt } from '@/lib/crypto';

// Al guardar:
const encryptedTokens = encrypt(JSON.stringify(tokens));

// Al usar:
const tokens = JSON.parse(decrypt(encryptedTokens));
```

### Refresh Tokens

- Los refresh tokens se obtienen con `access_type: 'offline'` y `prompt: 'consent'`
- Se usan para obtener nuevos access tokens cuando expiran
- Nunca expiran a menos que el usuario revoque el acceso

### Revocar Acceso

Usuario puede revocar en cualquier momento:
1. Google Account > Security > Third-party apps
2. Buscar "TuPatrimonio CRM"
3. Revocar acceso

---

## 📊 Estructura de Emails

### Email Record en BD

```typescript
{
  organization_id: "uuid",
  contact_id: "uuid",
  gmail_message_id: "msg_123",
  thread_id: "thread_123",
  from_email: "tu@empresa.com",
  to_emails: ["cliente@empresa.com"],
  subject: "Propuesta Comercial",
  body_html: "<p>Hola...</p>",
  direction: "outbound",
  status: "sent",
  sent_at: "2025-11-12T10:30:00Z"
}
```

### Activity Record

```typescript
{
  organization_id: "uuid",
  contact_id: "uuid",
  type: "email",
  subject: "Email enviado: Propuesta Comercial",
  description: "Hola...", // Primeros 500 chars
  performed_by: "user-uuid",
  email_id: "msg_123"
}
```

---

## 🔄 Flujo Completo

```
1. Usuario conecta Gmail
   ↓
2. Tokens guardados en crm.settings
   ↓
3. Usuario envía email desde CRM
   ↓
4. API verifica tokens
   ↓
5. Si expirado → refresh automático
   ↓
6. Envía email via Gmail API
   ↓
7. Guarda en crm.emails
   ↓
8. Crea actividad en crm.activities
   ↓
9. Aparece en timeline del contacto
```

---

## 🐛 Troubleshooting

### Error: "Gmail not connected"

**Causa**: No hay tokens en `crm.settings`

**Solución**: Conectar Gmail en `/dashboard/crm/settings/gmail`

### Error: "Invalid client"

**Causa**: Credenciales OAuth incorrectas

**Solución**: Verificar `GOOGLE_CLIENT_ID` y `GOOGLE_CLIENT_SECRET`

### Error: "Redirect URI mismatch"

**Causa**: URL de callback no autorizada

**Solución**: Agregar URL exacta en Google Cloud Console:
- `http://localhost:3000/api/crm/settings/gmail/callback`

### Error: "Token expired"

**Causa**: Access token expiró

**Solución**: El sistema debería refrescar automáticamente. Si falla, reconectar Gmail.

### Error: "Request had insufficient authentication scopes"

**Causa**: Los tokens OAuth no tienen todos los scopes necesarios (faltan permisos de lectura).

**Solución**: 
1. Ve a `/admin/communications/gmail`
2. Desconecta la cuenta Gmail actual
3. Reconecta Gmail (esto solicitará los nuevos permisos incluyendo `gmail.readonly`)
4. Los nuevos tokens tendrán todos los scopes necesarios para sincronización

### Error: "Los tokens no se pueden desencriptar"

**Causa**: Los tokens fueron encriptados con una clave temporal (sin `ENCRYPTION_KEY` configurada) o la `ENCRYPTION_KEY` cambió.

**Solución**: 
1. Configurar `ENCRYPTION_KEY` en `.env.local` (generar con: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`)
2. Reiniciar el servidor
3. Reconectar Gmail desde Configuración > Gmail (desconectar y volver a conectar)
4. Los nuevos tokens se encriptarán con la clave correcta

### No se guarda la actividad

**Causa**: FK constraint o permisos

**Solución**: Verificar que `contact_id` existe y usuario tiene permisos

---

## 📝 Testing

### Test Manual

1. Conectar Gmail
2. Ir a un contacto
3. Enviar email de prueba
4. Verificar que:
   - Email llegó al destinatario
   - Se guardó en `crm.emails`
   - Se creó actividad en `crm.activities`
   - Aparece en timeline del contacto

### Queries de Verificación

```sql
-- Ver emails enviados
SELECT * FROM crm.emails 
WHERE organization_id = 'your-org-id'
ORDER BY sent_at DESC;

-- Ver actividades de email
SELECT * FROM crm.activities 
WHERE type = 'email'
AND organization_id = 'your-org-id'
ORDER BY performed_at DESC;

-- Ver settings de Gmail
SELECT 
  organization_id,
  gmail_oauth_tokens IS NOT NULL as has_tokens
FROM crm.settings
WHERE organization_id = 'your-org-id';
```

---

## 🎯 Features Implementadas

✅ OAuth 2.0 completo  
✅ Envío de emails  
✅ Refresh automático de tokens  
✅ Guardar en BD  
✅ Crear actividades automáticas  
✅ EmailComposer component  
✅ Settings UI  
✅ Multi-tenant (cada org su Gmail)  

---

## 🔄 Sincronización Automática de Emails

El sistema incluye dos métodos de sincronización automática:

### 1. Polling Automático en Frontend

Cuando el inbox está abierto, se sincroniza automáticamente cada 2 minutos:
- ✅ Activo por defecto
- ✅ Se puede desactivar con el switch "Auto-sincronizar"
- ✅ Muestra la hora de la última sincronización
- ✅ Solo funciona mientras la página está abierta

### 2. Cron Job con Vercel (Producción)

Sincronización automática cada 5 minutos en background:
- ✅ Funciona aunque nadie esté viendo el inbox
- ✅ Configurado en `vercel.json`
- ✅ Requiere `CRON_SECRET` en variables de entorno
- ✅ Ruta: `/api/cron/sync-emails`

**Configuración del Cron:**

El cron está configurado en `vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/cron/sync-emails",
      "schedule": "*/5 * * * *"
    }
  ]
}
```

**Verificar que funciona:**

1. En Vercel Dashboard, ve a tu proyecto
2. Click en **Settings** → **Cron Jobs**
3. Deberías ver el cron `sync-emails` ejecutándose cada 5 minutos
4. Revisa los logs para verificar que está funcionando

---

## 🔮 Features Futuras

- [x] Leer emails del inbox ✅
- [x] Threading de conversaciones ✅
- [x] Sincronización automática ✅
- [ ] Templates de email
- [x] Firma automática ✅
- [ ] Tracking de opens/clicks (requiere webhook)
- [ ] Adjuntos
- [ ] Email scheduling

---

**Gmail integration está lista para usar!** 🎉









