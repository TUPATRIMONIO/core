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
     - `.../auth/gmail.send`
     - `.../auth/gmail.readonly`
     - `.../auth/gmail.modify`
     - `.../auth/gmail.compose`
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

# URLs (ya configuradas)
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

En **Vercel** (producción):
- Agregar `GOOGLE_CLIENT_ID`
- Agregar `GOOGLE_CLIENT_SECRET`

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

## 🔮 Features Futuras

- [ ] Leer emails del inbox
- [ ] Threading de conversaciones
- [ ] Templates de email
- [ ] Firma automática
- [ ] Tracking de opens/clicks (requiere webhook)
- [ ] Adjuntos
- [ ] Email scheduling

---

**Gmail integration está lista para usar!** 🎉



