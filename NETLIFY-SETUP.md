# 🚀 Setup de Netlify - Configuración Dual Sites

## Configuración Actual del Proyecto

TuPatrimonio usa **un solo archivo `netlify.toml`** con **contexts** diferentes para cada aplicación.

## 📊 Sites en Netlify

### Site 1: Marketing App
- **Domain**: `tupatrimonio.app`
- **Context**: `marketing` (o default)
- **Purpose**: Landing pages, SEO, conversión

### Site 2: Web App
- **Domain**: `app.tupatrimonio.app` 
- **Context**: `web`
- **Purpose**: Dashboard, autenticación, funcionalidad

## 🔧 Configuración en Netlify Dashboard

### Site 1 (Marketing - tupatrimonio.app)
1. **Site Settings > Build & Deploy**
2. **Build settings**:
   ```
   Base directory: /
   Build command: [dejar vacío - usa netlify.toml]
   Publish directory: [dejar vacío - usa netlify.toml]
   ```
3. **Deploy contexts**: 
   - **Production branch**: `main` (usa config por defecto)
   - **Deploy context**: `marketing` (opcional)

### Site 2 (Web App - app.tupatrimonio.app)
1. **Site Settings > Build & Deploy** 
2. **Build settings**:
   ```
   Base directory: /
   Build command: [dejar vacío - usa netlify.toml]
   Publish directory: [dejar vacío - usa netlify.toml]
   ```
3. **Deploy contexts**:
   - **Production branch**: `main`
   - **Deploy context**: `web` ← **IMPORTANTE**

### ⚠️ CONFIGURACIÓN CRÍTICA para Site 2:

En **Site Settings > Environment Variables**:
```
NETLIFY_CONTEXT=web
```

O en **Build & Deploy > Deploy contexts**, asignar:
- **Branch**: `main` → **Context**: `web`

## 📋 Configuración Completa del netlify.toml

### Default (Marketing App):
```toml
[build]
  command = "npm run build:marketing" 
  publish = "apps/marketing/.next"
```

### Context Web (Web App):
```toml
[context.web]
  command = "npm run build:web"
  publish = "apps/web/.next"
  [context.web.environment]
    NODE_VERSION = "20"
    NEXT_TELEMETRY_DISABLED = "1"
```

### Context Marketing:
```toml
[context.marketing]
  command = "npm run build:marketing"
  publish = "apps/marketing/.next"
  [context.marketing.environment] 
    NODE_VERSION = "20"
    NEXT_TELEMETRY_DISABLED = "1"
```

## 🎯 Resultado Esperado

### Cuando configures correctamente:
- **tupatrimonio.app** → Build marketing app (edge functions activas)
- **app.tupatrimonio.app** → Build web app (dashboard funcional)

### Verificación:
- Site 1: `/firmas-electronicas` → Redirect por país
- Site 2: `/` → Redirect a `/login` o `/dashboard`

## 🛠️ Pasos para Corregir el Site 2

### En Netlify Dashboard del Site 2:
1. **Site Settings > Build & Deploy**
2. **Edit settings**
3. **Deploy contexts**:
   - Click **Edit deploy contexts**
   - **Branch deploys**: `main` → **Context**: `web`
   - **Save**
4. **Redeploy** el site

### Alternative Manual Override:
En **Build settings** del Site 2:
```
Build command: npm run build:web
Publish directory: apps/web/.next
```

---

**La clave es que el Site 2 use el context `web` del netlify.toml** 🎯
