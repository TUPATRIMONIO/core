# Configuración de Autenticación con Supabase

Esta guía te ayudará a configurar la autenticación completa en tu proyecto TuPatrimonio.

## 📋 Índice

- [Configuración Inicial](#configuración-inicial)
- [Authentication Settings](#authentication-settings)
- [Email Templates](#email-templates)
- [OAuth Providers](#oauth-providers)
- [Testing Local](#testing-local)
- [Troubleshooting](#troubleshooting)

---

## Configuración Inicial

### 1. Variables de Entorno

Crea un archivo `.env.local` en `apps/web/` con las siguientes variables:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
```

**¿Dónde encontrar estas credenciales?**

1. Ve a tu proyecto en [Supabase Dashboard](https://app.supabase.com)
2. Click en ⚙️ **Settings** → **API**
3. Copia:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon/public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

---

## Authentication Settings

### 1. Habilitar Confirmación de Email

**Ruta**: `Authentication > Settings > Email Auth`

1. Ve a tu proyecto en Supabase Dashboard
2. Navega a **Authentication** → **Settings**
3. En la sección **Email Auth**:
   - ✅ **Enable email confirmations** → Activado
   - ✅ **Enable email change confirmations** → Activado (recomendado)
   - ✅ **Secure email change** → Activado (recomendado)

### 2. Configurar Site URL

**Ruta**: `Authentication > Settings > General`

- **Site URL** (desarrollo): `http://localhost:3000`
- **Site URL** (producción): `https://tupatrimonio.com`

### 3. Configurar Redirect URLs

**Ruta**: `Authentication > URL Configuration`

Agrega las siguientes URLs permitidas:

**Desarrollo:**
```
http://localhost:3000/auth/callback
http://localhost:3000/reset-password
```

**Producción:**
```
https://tupatrimonio.com/auth/callback
https://tupatrimonio.com/reset-password
https://app.tupatrimonio.com/auth/callback
https://app.tupatrimonio.com/reset-password
```

---

## Email Templates

### Plantillas Disponibles

Supabase incluye plantillas predeterminadas para:
- ✉️ Confirmación de registro
- 🔑 Reset de contraseña
- ✨ Magic Link
- 🔄 Cambio de email

### ⚠️ CRÍTICO: Deshabilitar Link Tracking en SendGrid

**Problema**: SendGrid está aplicando link tracking a los enlaces de Magic Link, lo que los modifica y corrompe los tokens PKCE. Esto causa errores `otp_expired` incluso con enlaces recién generados.

**Evidencia**: Los enlaces llegan como `url9306.hub.tupatrimon.io/ls/click?upn=...` en lugar del enlace directo de Supabase.

**Solución OBLIGATORIA**: 

#### Opción 1: Deshabilitar Click Tracking Globalmente (Recomendado)

1. Ve a [SendGrid Dashboard](https://app.sendgrid.com/)
2. Settings → **Tracking** → **Click Tracking**
3. **Desactiva completamente** "Click Tracking"
4. Guarda los cambios

**Ventaja**: Los enlaces de Magic Link funcionarán correctamente sin modificaciones.

**Desventaja**: Perderás métricas de clicks en otros emails (pero puedes usar otras herramientas de analytics).

#### Opción 2: Configurar Exclusiones por Dominio (Si necesitas tracking en otros emails)

1. Ve a SendGrid Dashboard
2. Settings → **Mail Settings** → **Click Tracking**
3. Configura exclusiones para URLs que contengan:
   - `api.tupatrimonio.app/auth/v1/verify`
   - `app.tupatrimonio.app/auth/callback`
   - Cualquier URL con `token=pkce_`

**Nota**: Esta opción es más compleja y puede no funcionar perfectamente si SendGrid procesa los enlaces antes de aplicar exclusiones.

#### Opción 3: Usar un Subdominio Separado para Autenticación

1. Configura un subdominio específico en SendGrid solo para emails de autenticación
2. Deshabilita link tracking solo para ese subdominio
3. Configura Supabase para usar ese subdominio en las plantillas de email

**Por qué es crítico**: Los tokens PKCE en los Magic Links son sensibles y cualquier modificación del enlace los invalida. SendGrid modifica los enlaces agregando su propio sistema de tracking, lo que corrompe los tokens.

### Personalizar Plantillas

**Ruta**: `Authentication > Email Templates`

#### 1. Plantilla de Confirmación de Registro

```html
<h2>Confirma tu email</h2>
<p>Hola,</p>
<p>Gracias por registrarte en TuPatrimonio. Haz clic en el siguiente enlace para confirmar tu cuenta:</p>
<p><a href="{{ .ConfirmationURL }}">Confirmar mi cuenta</a></p>
<p>Si no creaste esta cuenta, puedes ignorar este email.</p>
<p>Tu Tranquilidad, Nuestra Prioridad</p>
```

#### 2. Plantilla de Reset de Contraseña

```html
<h2>Restablece tu contraseña</h2>
<p>Hola,</p>
<p>Recibimos una solicitud para restablecer tu contraseña. Haz clic en el siguiente enlace:</p>
<p><a href="{{ .ConfirmationURL }}">Restablecer contraseña</a></p>
<p>Este enlace expira en 1 hora.</p>
<p>Si no solicitaste este cambio, ignora este email.</p>
```

#### 3. Plantilla de Magic Link

```html
<h2>Tu link de acceso</h2>
<p>Hola,</p>
<p>Haz clic en el siguiente enlace para iniciar sesión:</p>
<p><a href="{{ .ConfirmationURL }}">Iniciar sesión</a></p>
<p>Este enlace expira en 1 hora y solo puede usarse una vez.</p>
```

#### 4. Plantilla de Email OTP

Para usar códigos de 6 dígitos en lugar de links, modifica la plantilla:

```html
<h2>Tu código de verificación</h2>
<p>Hola,</p>
<p>Tu código de verificación es:</p>
<h1 style="font-size: 32px; letter-spacing: 5px;">{{ .Token }}</h1>
<p>Este código expira en 1 hora.</p>
<p>Si no solicitaste este código, ignora este email.</p>
```

---

## OAuth Providers

### Google OAuth

**Referencia**: [Supabase Google Auth Docs](https://supabase.com/docs/guides/auth/social-login/auth-google)

#### Paso 1: Crear Proyecto en Google Cloud Console

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Crea un nuevo proyecto o selecciona uno existente
3. Habilita **Google+ API**

#### Paso 2: Crear Credenciales OAuth

1. Ve a **APIs & Services** → **Credentials**
2. Click en **+ CREATE CREDENTIALS** → **OAuth client ID**
3. Tipo: **Web application**
4. Nombre: `TuPatrimonio Auth`

**Authorized JavaScript origins:**
```
http://localhost:3000
https://tupatrimonio.com
```

**Authorized redirect URIs:**
```
https://[TU-PROYECTO].supabase.co/auth/v1/callback
```

> **Nota**: Reemplaza `[TU-PROYECTO]` con tu proyecto real de Supabase

5. Copia **Client ID** y **Client Secret**

#### Paso 3: Configurar en Supabase

1. Ve a **Authentication** → **Providers** → **Google**
2. Activa el toggle **Enable Sign in with Google**
3. Pega:
   - **Client ID**
   - **Client Secret**
4. Click **Save**

---

### Facebook OAuth

**Referencia**: [Supabase Facebook Auth Docs](https://supabase.com/docs/guides/auth/social-login/auth-facebook)

#### Paso 1: Crear App en Facebook Developers

1. Ve a [Facebook Developers](https://developers.facebook.com/)
2. Click en **My Apps** → **Create App**
3. Selecciona **Consumer** como tipo de app
4. Nombre: `TuPatrimonio`

#### Paso 2: Configurar Facebook Login

1. En el dashboard de tu app, agrega producto **Facebook Login**
2. Ve a **Facebook Login** → **Settings**

**Valid OAuth Redirect URIs:**
```
https://[TU-PROYECTO].supabase.co/auth/v1/callback
```

3. Guarda cambios

#### Paso 3: Obtener Credenciales

1. Ve a **Settings** → **Basic**
2. Copia:
   - **App ID**
   - **App Secret** (click en "Show")

#### Paso 4: Configurar en Supabase

1. Ve a **Authentication** → **Providers** → **Facebook**
2. Activa el toggle **Enable Sign in with Facebook**
3. Pega:
   - **Facebook App ID**
   - **Facebook App Secret**
4. Click **Save**

---

### GitHub OAuth

**Referencia**: [Supabase GitHub Auth Docs](https://supabase.com/docs/guides/auth/social-login/auth-github)

#### Paso 1: Crear OAuth App en GitHub

1. Ve a [GitHub Settings](https://github.com/settings/developers)
2. Click en **OAuth Apps** → **New OAuth App**
3. Completa:
   - **Application name**: `TuPatrimonio`
   - **Homepage URL**: `https://tupatrimonio.com`
   - **Authorization callback URL**: `https://[TU-PROYECTO].supabase.co/auth/v1/callback`

#### Paso 2: Obtener Credenciales

1. Después de crear la app, copia:
   - **Client ID**
2. Genera un **Client Secret** y cópialo

#### Paso 3: Configurar en Supabase

1. Ve a **Authentication** → **Providers** → **GitHub**
2. Activa el toggle **Enable Sign in with GitHub**
3. Pega:
   - **Client ID**
   - **Client Secret**
4. Click **Save**

---

### Apple OAuth

**Referencia**: [Supabase Apple Auth Docs](https://supabase.com/docs/guides/auth/social-login/auth-apple)

> **Nota**: Apple OAuth es más complejo y requiere una cuenta de Apple Developer ($99/año)

#### Paso 1: Registrar App ID

1. Ve a [Apple Developer](https://developer.apple.com/account/)
2. **Certificates, Identifiers & Profiles** → **Identifiers**
3. Click **+** para crear nuevo Identifier
4. Selecciona **App IDs** → **Continue**
5. Tipo: **App**
6. Descripción: `TuPatrimonio`
7. Bundle ID: `com.tupatrimonio.app`
8. Habilita **Sign in with Apple**
9. Click **Continue** → **Register**

#### Paso 2: Crear Services ID

1. En **Identifiers**, click **+** de nuevo
2. Selecciona **Services IDs** → **Continue**
3. Descripción: `TuPatrimonio Web`
4. Identifier: `com.tupatrimonio.web`
5. Habilita **Sign in with Apple**
6. Click **Configure** junto a Sign in with Apple:
   - **Primary App ID**: Selecciona el App ID creado antes
   - **Web Domain**: `tupatrimonio.com`
   - **Return URLs**: `https://[TU-PROYECTO].supabase.co/auth/v1/callback`
7. Click **Save** → **Continue** → **Register**

#### Paso 3: Crear Key

1. Ve a **Keys** → Click **+**
2. Key Name: `TuPatrimonio Auth Key`
3. Habilita **Sign in with Apple**
4. Click **Configure** → Selecciona tu App ID
5. Click **Save** → **Continue** → **Register**
6. **Descarga el archivo .p8** (solo puedes descargarlo una vez)
7. Copia el **Key ID**

#### Paso 4: Obtener Team ID

1. En la esquina superior derecha del portal de Apple Developer
2. Copia tu **Team ID**

#### Paso 5: Configurar en Supabase

1. Ve a **Authentication** → **Providers** → **Apple**
2. Activa el toggle **Enable Sign in with Apple**
3. Pega:
   - **Services ID**: `com.tupatrimonio.web`
   - **Key ID**: El Key ID de tu .p8
   - **Team ID**: Tu Team ID
   - **Private Key**: Abre el archivo .p8 y pega todo el contenido
4. Click **Save**

---

## Rate Limits

### Límites por Defecto

- **Magic Link / OTP**: 60 segundos entre solicitudes
- **OTP expiration**: 1 hora (configurable hasta 24 horas)
- **Password reset**: Sin límite de solicitudes

### Modificar Rate Limits

**Ruta**: `Authentication > Settings > Rate Limits`

Puedes ajustar:
- Requests por hora
- Requests por IP
- Tiempo de cooldown

---

## Testing Local

### 1. Usando Mailpit (Recomendado para desarrollo local)

Si usas Supabase CLI local:

```bash
# Ver emails capturados
supabase status
# Busca la URL de Inbucket/Mailpit
```

Abre la URL en tu navegador para ver todos los emails de prueba.

### 2. Testing de OAuth en localhost

**⚠️ Importante**: Algunos providers (Apple) no funcionan con `localhost`. Usa ngrok o similar:

```bash
# Instalar ngrok
npm install -g ngrok

# Exponer localhost:3000
ngrok http 3000

# Usa la URL https://xxx.ngrok.io en las configuraciones de OAuth
```

---

## Troubleshooting

### Error: "Email not confirmed"

**Problema**: El usuario intenta hacer login pero su email no está verificado.

**Solución**: 
1. Verificar que el email de confirmación llegó
2. Revisar spam
3. Usar botón "Reenviar email de verificación"

---

### Error: "Invalid login credentials"

**Problema**: Email o contraseña incorrectos.

**Solución**:
1. Verificar que el usuario existe en **Authentication > Users**
2. Verificar que el email está confirmado
3. Si olvidó contraseña, usar flujo de reset

---

### OAuth redirect no funciona

**Problema**: Después de autenticar con OAuth, no redirige correctamente.

**Solución**:
1. Verificar que la Redirect URL está en la lista de URLs permitidas
2. Verificar que el callback page existe: `apps/web/src/app/(auth)/auth/callback/page.tsx`
   - Esta página cliente maneja tanto OAuth (`?code=` + `provider_token`) como Magic Links (`#access_token=`)
3. Verificar logs en Supabase Dashboard

**Nota**: La página cliente maneja ambos casos:
- **OAuth Social** (Google, Facebook, etc.): Usa query params (`?code=` + `provider_token`) - se procesa con `exchangeCodeForSession()`
- **Magic Links**: Usan hash fragments (`#access_token=`) - se procesa con `setSession()` usando implicit flow (configuración por defecto de Supabase)

---

### Magic Link no llega

**Problema**: El email del magic link no llega.

**Solución**:
1. En desarrollo: Revisar Mailpit/Inbucket
2. En producción: Verificar que tienes SMTP configurado o usar el servicio de Supabase
3. Revisar spam
4. Verificar rate limits (60 segundos entre solicitudes)

---

### Magic Link expira o muestra error "otp_expired"

**Problema**: Al hacer clic en el Magic Link, aparece error `otp_expired` o `access_denied`.

**Solución**:
1. **Verificar configuración del callback**: 
   - El callback debe tener una página cliente (`page.tsx`) que maneje hash fragments (`#access_token=`)
   - Los hash fragments no están disponibles en el servidor, por eso se necesita una página cliente
   - Verificar que existe: `apps/web/src/app/(auth)/auth/callback/page.tsx`

2. **Verificar Redirect URLs en Supabase**:
   - Asegúrate de que `https://app.tupatrimonio.app/auth/callback` esté en la lista de URLs permitidas
   - En desarrollo: `http://localhost:3000/auth/callback`

3. **Verificar tiempo de expiración**:
   - En Supabase Dashboard → Authentication → Settings → Email Auth
   - Verifica que `OTP expiry` sea suficiente (por defecto 3600 segundos = 1 hora)
   - Si el usuario tarda mucho en hacer clic, el link puede expirar

4. **Verificar que el link no se haya usado antes**:
   - Los Magic Links son de un solo uso
   - Si ya se usó, solicita uno nuevo

5. **Revisar logs del navegador**:
   - Abre la consola del navegador (F12)
   - Busca errores relacionados con autenticación
   - Verifica que el hash fragment se esté procesando correctamente
   - Debes ver: `"Procesando hash fragments: { hasAccessToken: true, hasRefreshToken: true }"`
   - **NO debe aparecer** error de `exchangeCodeForSession` (ese método solo se usa para OAuth social)

---

### Error: "invalid request: both auth code and code verifier should be non-empty"

**Problema**: Al hacer clic en Magic Link, aparece error `Error en exchangeCodeForSession: invalid request: both auth code and code verifier should be non-empty`.

**Causa**: El callback estaba intentando procesar Magic Links como si fueran OAuth, cuando en realidad Supabase usa **implicit flow por defecto** para Magic Links (redirige con `access_token` y `refresh_token` en hash fragments, no con `code`).

**Solución Definitiva**:
1. **Magic Links usan implicit flow**: Supabase redirige con hash fragments (`#access_token=...&refresh_token=...`), NO con query params `?code=`
2. **OAuth Social usa authorization code flow**: Solo los providers sociales (Google, Facebook, etc.) usan `?code=` + `provider_token`
3. **El callback ahora distingue correctamente**:
   - Si hay `code` Y `provider_token` → Procesa como OAuth social con `exchangeCodeForSession()`
   - Si hay hash fragments (`#access_token=`) → Procesa como Magic Link con `setSession()`
   - Si solo hay `code` sin `provider_token` → Se ignora (no es un flujo válido)

**Flujo correcto de Magic Link**:
1. Usuario hace clic en Magic Link → Supabase procesa internamente
2. Supabase redirige a `/auth/callback#access_token=...&refresh_token=...`
3. El callback detecta hash fragments y llama a `supabase.auth.setSession()`
4. Redirige al dashboard

**Validación**:
- En consola del navegador debe aparecer: `"Procesando hash fragments: { hasAccessToken: true, hasRefreshToken: true }"`
- NO debe aparecer error de `exchangeCodeForSession`
- Debe redirigir directamente al dashboard en menos de 1 segundo

---

### Magic Link redirige a HubSpot o enlace incorrecto

**Problema**: El Magic Link redirige a un dominio de HubSpot (`url9306.hub.tupatrimon.io`) en lugar del dominio de tu aplicación.

**Causa**: SendGrid tiene link tracking habilitado (probablemente integrado con HubSpot), lo que modifica todos los enlaces en los emails.

**Solución**:
1. **Deshabilitar Click Tracking en SendGrid**:
   - Ve a [SendGrid Dashboard](https://app.sendgrid.com/)
   - Settings → **Tracking** → **Click Tracking**
   - Desactiva "Click Tracking" completamente, O
   - Configura exclusiones para emails de autenticación

2. **Alternativa: Deshabilitar solo para dominio de autenticación**:
   - En SendGrid Dashboard → Settings → **Mail Settings**
   - Busca "Click Tracking" y configura exclusiones por dominio o tipo de email

3. **Verificar configuración de Supabase SMTP**:
   - Asegúrate de que el SMTP de SendGrid esté configurado correctamente
   - Los enlaces deben llegar directamente sin modificaciones

**Nota**: Los enlaces de autenticación NO deben ser modificados por servicios de tracking, ya que contienen tokens críticos en el hash fragment (`#access_token=...`).

---

### Rate Limit: "Debes esperar X segundos"

**Problema**: Al solicitar un Magic Link antes de 60 segundos, aparece un error genérico.

**Solución**: El sistema ahora muestra automáticamente cuántos segundos debes esperar. El mensaje de error incluirá el tiempo restante.

**Configuración**:
- El rate limit por defecto es de 60 segundos entre solicitudes
- Puedes ajustarlo en Supabase Dashboard → Authentication → Settings → Email Auth → `max_frequency`

---

### OTP muestra link en lugar de código

**Problema**: El email muestra un link en lugar del código de 6 dígitos.

**Solución**:
1. Ve a **Authentication > Email Templates**
2. Edita la plantilla de Magic Link
3. Incluye `{{ .Token }}` en lugar de o además del `{{ .ConfirmationURL }}`

---

## Recursos Adicionales

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Next.js SSR with Supabase](https://supabase.com/docs/guides/auth/server-side-rendering)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)

---

## Soporte

Si tienes problemas con la configuración:

1. Revisa los logs en Supabase Dashboard → **Logs**
2. Consulta la documentación oficial de cada provider
3. Contacta al equipo de desarrollo

**Tu Tranquilidad, Nuestra Prioridad** 🛡️

