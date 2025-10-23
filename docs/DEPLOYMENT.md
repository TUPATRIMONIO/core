# 🚀 Guía de Deployment - TuPatrimonio

## Configuración Dual de Sites

TuPatrimonio usa **2 sites separados** en Netlify para optimal performance:

### 📱 Site 1: Marketing App
- **Domain**: `tupatrimonio.app`
- **Config file**: `netlify.toml` 
- **Purpose**: Landing pages, SEO, blog, conversión

### 💼 Site 2: Web App  
- **Domain**: `app.tupatrimonio.app`
- **Config file**: `netlify-web.toml`
- **Purpose**: Dashboard, autenticación, funcionalidad

## Marketing App Deployment

### Configuración en Netlify
- **Base directory**: `/`
- **Build command**: `npm run build:marketing`
- **Publish directory**: `apps/marketing/.next`
- **Config file**: `netlify.toml`

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

### Configuración en Netlify
- **Base directory**: `/`
- **Build command**: `npm run build:web`
- **Publish directory**: `apps/web/.next`
- **Config file**: `netlify-web.toml`

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

## 🔧 Setup en Netlify Dashboard

### Site 1: Marketing (tupatrimonio.app) - apps/marketing/netlify.toml
1. **Team Settings > Sites** → **Add new site**
2. **Connect to Git** → Seleccionar tu repositorio
3. **Site configuration**:
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
# En tu proveedor DNS
A     tupatrimonio.app        → 75.2.60.5 (Netlify)
CNAME app.tupatrimonio.app   → [site-2].netlify.app
```

## 🔄 Workflow de Deploy

### Marketing App
```bash
# Push a main branch
git push origin main

# Netlify Site 1:
1. Detecta cambios
2. npm run build:marketing
3. Deploys a tupatrimonio.app
4. Edge Functions activas
```

### Web App
```bash
# Push a main branch  
git push origin main

# Netlify Site 2:
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

### Netlify Headers para PWA
Ya configurados en `netlify.toml`:
```toml
[[headers]]
  for = "/sw.js"
  [headers.values]
    Cache-Control = "public, max-age=0, must-revalidate"
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

---

**Ambos sites están listos para deploy independiente** 🚀

### Next Steps:
1. ✅ **Marketing site ya funcionando** en `tupatrimonio.app`
2. 🚧 **Web site**: Usar `netlify-web.toml` en configuración
3. ✅ **Dominios**: Configurar app.tupatrimonio.app → Site 2