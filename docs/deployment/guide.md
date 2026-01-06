# 🚀 Guía de Deployment - TuPatrimonio

## Configuración Dual de Sites

TuPatrimonio usa **2 projects separados** en Vercel para optimal performance:

### 📱 Project 1: Marketing App
- **Domain**: `tupatrimonio.app`
- **Config file**: `next.config.ts` (apps/marketing)
- **Purpose**: Landing pages, SEO, blog, conversión

### 💼 Project 2: Web App  
- **Domain**: `app.tupatrimonio.app`
- **Config file**: `next.config.ts` (apps/web)
- **Purpose**: Dashboard, autenticación, funcionalidad

## Marketing App Deployment

### Configuración en Vercel
- **Root directory**: `apps/marketing`
- **Build command**: `npm run build`
- **Output directory**: `.next`
- **Install command**: `npm install --prefix ../.. && npm run build:packages --prefix ../..`

### Características Específicas
- ✅ **Edge Functions** para detección de ubicación
- ✅ **Redirects automáticos** por país
- ✅ **Headers de geolocalización**
- ✅ **SEO optimizado** por país

### Variables de Entorno
```bash
NODE_VERSION=20
NEXT_TELEMETRY_DISABLED=1
NEXT_PUBLIC_SUPABASE_URL=https://proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key
```

## Web App Deployment  

### Configuración en Vercel
- **Root directory**: `apps/web`
- **Build command**: `npm run build`
- **Output directory**: `.next`
- **Install command**: `npm install --prefix ../.. && npm run build:packages --prefix ../..`

### Características Específicas
- ✅ **Dashboard funcional** con autenticación
- ✅ **Personalización automática** por país
- ✅ **Performance optimizado** para interacción
- ✅ **Redirects de auth** incluidos
- ✅ **Progressive Web App (PWA)** instalable y offline
- ✅ **Actualizaciones automáticas** con notificación

### Variables de Entorno
```bash
NODE_VERSION=20
NEXT_TELEMETRY_DISABLED=1
NEXT_PUBLIC_SUPABASE_URL=https://proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key
```

## 🔧 Setup en Vercel Dashboard

### Project 1: Marketing (tupatrimonio.app)
1. **New Project** → Importar tu repositorio desde GitHub
2. **Framework Preset**: Next.js
3. **Root Directory**: `apps/marketing`
4. **Build Settings**:
   ```
   Base directory: /
   Build command: npm run build:marketing  
   Publish directory: apps/marketing/.next
   ```
4. **Advanced build settings** → **Add build file: netlify.toml**

### Site 2: Web App (app.tupatrimonio.app) - apps/web/netlify.toml  
1. **Team Settings > Sites** → **Add new site**
2. **Connect to Git** → Mismo repositorio (diferente configuración)
3. **Site configuration**:
   ```
   Base directory: /
   Build command: npm run build:web
   Publish directory: apps/web/.next  
   ```
4. **Advanced build settings** → **Add build file: netlify-web.toml**

## 🌐 Domain Configuration

### Custom Domains
- **Marketing**: `tupatrimonio.app` (site 1)
- **Web App**: `app.tupatrimonio.app` (site 2)

### DNS Configuration
```
# En Vercel Dashboard  
# Vercel proporciona automáticamente los registros DNS necesarios
# Solo necesitas agregar los dominios en Settings → Domains
```

## 🔄 Workflow de Deploy

### Marketing App
```bash
# Push a main branch
git push origin main

# Vercel Project 1:
1. Detecta cambios
2. npm run build:marketing
3. Deploys a tupatrimonio.app
4. Edge Functions activas
```

### Web App
```bash
# Push a main branch  
git push origin main

# Vercel Project 2:
1. Detecta cambios (mismo repo)
2. npm run build:web  
3. Deploys a app.tupatrimonio.app
4. Solo funcionalidad de dashboard
```

## ⚠️ Diferencias Importantes

### Marketing App (tupatrimonio.app)
- ✅ **Edge Functions** para geo-redirección
- ✅ **Múltiples redirects** por país  
- ✅ **Headers de geolocalización**
- ✅ **Optimizado para SEO**

### Web App (app.tupatrimonio.app)
- ✅ **Auth redirects** (/signin → /login)
- ✅ **Dashboard routing** (/ → /dashboard si autenticado)
- ✅ **Performance optimizado** para interacción
- ✅ **No geo-functions** (detección interna solo)

## 🔧 Build Commands Utilizados

### En package.json raíz:
```json
{
  "scripts": {
    "build:marketing": "npm run build:location && npm run build --workspace=apps/marketing",
    "build:web": "npm run build:location && npm run build --workspace=apps/web"
  }
}
```

### Secuencia de Build:
1. **Compilar packages** (`build:location`)
2. **Build app específica** (marketing o web)
3. **Next.js optimizations** automáticas
4. **Deploy a CDN** respectivo

## 📊 Verificación Post-Deploy

### Marketing App (tupatrimonio.app)
- [ ] **Auto-redirect** desde `/firmas-electronicas`
- [ ] **Selector de país** funcional
- [ ] **Edge Functions**: `/.netlify/functions/detect-country`
- [ ] **Colores correctos** (gris + vino)

### Web App (app.tupatrimonio.app) 
- [ ] **Login** funcional → `/login`
- [ ] **Dashboard** accesible después de auth
- [ ] **Selector de país** en header del dashboard
- [ ] **Precios localizados** según país detectado
- [ ] **No errores** de imports o CSS
- [ ] **PWA instalable** desde navegador (ícono en barra)
- [ ] **Manifest accesible** → `/manifest.json`
- [ ] **Service Worker** registrado → DevTools Application
- [ ] **Funciona offline** → Test con DevTools Network Offline

## 📱 PWA Deployment (Web App)

### Pre-Deploy: Generar Íconos
```bash
cd apps/web

# 1. Colocar ícono base
cp tu-icono.png public/icons/icon-base.png

# 2. Generar todos los tamaños
npm run generate-icons

# 3. Verificar
ls public/icons/
```

### Build Automático
El build de Next.js incluye automáticamente:
- ✅ `manifest.json` → Servido en `/manifest.json`
- ✅ `sw.js` → Service Worker registrado
- ✅ `version.json` → Generado en cada build para detección de updates
- ✅ Todos los íconos en `/icons/*`

### Verificación PWA Post-Deploy

#### Lighthouse Audit
```bash
# Chrome DevTools → Lighthouse
# Ejecutar audit con categoría "Progressive Web App"
# Score esperado: 90+
```

#### Manual Testing
1. **Instalabilidad**:
   - Abrir sitio en móvil/desktop
   - Verificar ícono de instalación en barra
   - Instalar y verificar funcionamiento

2. **Offline**:
   - Instalar PWA
   - Desconectar internet
   - Verificar que páginas visitadas cargan
   - Verificar página offline personalizada

3. **Actualizaciones**:
   - Hacer nuevo deploy
   - App debe detectar actualización automáticamente
   - Notificación con countdown debe aparecer

### Headers para PWA (configurados en next.config.ts)
Ya configurados en `apps/web/next.config.ts`:
```typescript
async headers() {
  return [
    {
      source: '/sw.js',
      headers: [
        {
          key: 'Cache-Control',
          value: 'public, max-age=0, must-revalidate',
        },
      ],
    },
  ];
}
    Service-Worker-Allowed = "/"

[[headers]]
  for = "/manifest.json"
  [headers.values]
    Content-Type = "application/manifest+json"
```

## 🐛 Troubleshooting

### Error: "Module not found"
```bash
# Causa: Package location no compilado antes de app
# Solución: build:location se ejecuta automáticamente
```

### PWA: Íconos no aparecen
```bash
# Causa: Íconos no generados antes del deploy
# Solución:
cd apps/web
npm run generate-icons
git add public/icons/
git commit -m "add: PWA icons"
git push
```

### PWA: Service Worker no funciona
```bash
# Verificar en producción (no funciona en npm run dev)
# Debe ser HTTPS o localhost
# Revisar DevTools → Application → Service Workers
```

### PWA: No se puede instalar
```bash
# Verificar:
1. HTTPS activo en producción ✓
2. manifest.json accesible ✓
3. Service Worker registrado ✓
4. Al menos un ícono 192x192px ✓
5. start_url accesible ✓
```

### Error: "Edge Functions not working"
```bash
# Solo aplica a marketing app
# Web app no necesita edge functions
```

### Error: "CSS not loading"  
```bash
# Verificar ruta relativa a packages/ui/globals.css
# Marketing: ../../../../packages/ui/globals.css
# Web: ../../../../packages/ui/globals.css
```

## 🔐 Variables de Entorno - Supabase Edge Functions

Las Edge Functions de Supabase requieren variables de entorno específicas que se configuran en el Dashboard de Supabase.

### Configuración en Supabase Dashboard

1. Ir a **Settings** → **Edge Functions** → **Environment Variables**
2. Agregar las siguientes variables:

#### Variables Requeridas para CDS (Certificadora del Sur)

```bash
# Credenciales de API CDS
CDS_USUARIO=tu_usuario_cds
CDS_CLAVE=tu_clave_cds

# Secret para validar webhooks de CDS
CDS_WEBHOOK_SECRET=tu_secret_webhook

# Modo de prueba (true = usar URLs de test, false = producción)
CDS_TEST_MODE=false
```

**Nota:** Las credenciales de CDS ahora se almacenan como variables de entorno en lugar de la base de datos por seguridad. La Edge Function `cds-signature` lee estas variables automáticamente.

#### Variables Automáticas de Supabase

Estas variables ya están configuradas automáticamente por Supabase:
- `SUPABASE_URL` - URL del proyecto
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key para acceso completo
- `SUPABASE_ANON_KEY` - Anon key para acceso público

### Verificación

Después de configurar las variables, verifica que la Edge Function funcione:

```bash
# Desde la app web, prueba consultar vigencia de un RUT
# La función debería usar las credenciales desde variables de entorno
```

### Migración desde Base de Datos

Si anteriormente tenías las credenciales en la tabla `signing_provider_configs`, ejecuta la migración:

```bash
supabase migration up
```

Esto limpiará las credenciales de la base de datos (ya no son necesarias ahí).

---

**Ambos sites están listos para deploy independiente** 🚀

### Next Steps:
1. ✅ **Marketing site ya funcionando** en `tupatrimonio.app`
2. 🚧 **Web site**: Usar `netlify-web.toml` en configuración
3. ✅ **Dominios**: Configurar app.tupatrimonio.app → Site 2
4. ✅ **Supabase Edge Functions**: Configurar variables de entorno para CDS