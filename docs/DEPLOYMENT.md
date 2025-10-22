# 🚀 Guía de Deployment - TuPatrimonio

## Netlify Deployment

### Configuración Automática
El proyecto incluye `netlify.toml` con configuración completa para:
- Build automático de marketing app
- Edge Functions para detección de ubicación
- Redirects por país como backup
- Headers de geolocalización automáticos

### Setup en Netlify Dashboard

#### 1. Configuración Básica
- **Base directory**: `/` (raíz del repo)
- **Build command**: `npm run build:marketing`
- **Publish directory**: `apps/marketing/.next`
- **Node.js version**: `18` (automático desde netlify.toml)

#### 2. Variables de Entorno
```
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key_aqui
NODE_VERSION=18
NEXT_TELEMETRY_DISABLED=1
```

#### 3. Build & Deploy Settings
```toml
# Ya configurado en netlify.toml
[build]
  command = "npm run build:marketing"
  publish = "apps/marketing/.next"
```

## 🌍 Sistema de Geolocalización

### Funciones Netlify Incluidas

#### Edge Functions (Súper Rápidas)
- `netlify/edge-functions/country-redirect.ts`
- Se ejecutan en el edge de Netlify
- Redirects automáticos por país
- Latencia < 50ms

#### Functions Normales (Backup)
- `netlify/functions/detect-country.ts` 
- API para detección por IP
- Fallback si Edge Functions fallan

### Headers Automáticos
Netlify proporciona automáticamente:
```
x-nf-country-code: CL        # Código ISO del país
x-nf-geo-city: Santiago      # Ciudad detectada  
x-nf-geo-subdivision-1-iso-code: RM  # Región/Estado
```

## 📊 Configuraciones por Ambiente

### Development (Local)
- **Puerto 3001**: Marketing app
- **Puerto 3000**: Web app  
- **Detección**: Por navegador (timezone, idioma)
- **Netlify Functions**: No disponibles localmente

### Production (Netlify)
- **Detección**: Por IP real via headers Netlify
- **Edge Functions**: Activas y súper rápidas
- **Redirects**: Automáticos e instantáneos
- **Caché**: Headers cacheados 5 minutos

## 🔧 Verificación Post-Deploy

### 1. URLs a Probar
```bash
# Landing genérica (debe detectar país y redirect)
https://tu-sitio.netlify.app/firmas-electronicas

# Páginas específicas por país  
https://tu-sitio.netlify.app/cl/firmas-electronicas
https://tu-sitio.netlify.app/mx/firmas-electronicas
https://tu-sitio.netlify.app/co/firmas-electronicas
```

### 2. API de Detección
```bash
# Debe responder JSON con país detectado
https://tu-sitio.netlify.app/.netlify/functions/detect-country

# Respuesta esperada:
{
  "country": "cl",
  "city": "Santiago", 
  "source": "netlify",
  "supported": true
}
```

### 3. Funcionalidades
- [ ] **Auto-redirect** funciona desde landing genérica
- [ ] **Selector de país** aparece y funciona
- [ ] **Confirmación** antes de cambiar de página país
- [ ] **Persistencia** de preferencia manual
- [ ] **Colores correctos** (gris botones, vino marca)

## ⚠️ Posibles Issues y Soluciones

### Build Errors
```bash
# Error: Can't resolve packages
Causa: Package location no compilado
Solución: npm run build:location se ejecuta automáticamente
```

### Edge Functions Not Working
```bash
# Síntoma: No redirect automático
Causa: Edge Functions solo en producción
Solución: Normal en development, usar redirects de backup
```

### Variables de Entorno
```bash
# Error: Supabase connection failed
Causa: Variables no configuradas en Netlify
Solución: Configurar en Site Settings > Environment variables
```

### Geolocation Headers Missing
```bash
# Síntoma: Siempre detecta Chile
Causa: Headers geo no disponibles
Solución: Normal en algunas regiones, fallback funciona
```

## 🔄 Deploy de Cambios

### Deploy Automático
```bash
# Push a main/desarrollo
git push origin desarrollo

# Netlify hace build automático
# 1. npm run build:location (compila packages)
# 2. npm run build:marketing (build app)
# 3. Deploy a CDN global
```

### Deploy Manual (Si es necesario)
```bash
# En Netlify Dashboard > Deploys
# Click "Trigger deploy" > "Deploy site"
```

## 📈 Monitoreo

### Analytics a Revisar
- **Detección de países**: ¿Qué países detecta más?
- **Uso del selector**: ¿Los usuarios cambian país manualmente?
- **Bounce rate** de redirects automáticos
- **Performance** de Edge Functions

### Logs Útiles
- **Netlify Functions Log**: Para debugging de detección
- **Deploy Logs**: Para errors de build
- **Analytics**: Tráfico por país detectado

## 🌐 Consideraciones Internacionales

### Agregar Nuevo País
1. **Actualizar** `packages/location/src/CountryConfig.ts`
2. **Crear** páginas específicas en `/[nuevo-pais]/`
3. **Agregar** a Edge Function y redirects
4. **Crear** contenido localizado (precios, regulaciones)

### SEO por País
- Cada país tiene metadata específica
- URLs únicas: `/cl/servicio` vs `/mx/servicio`
- hreflang automático entre versiones

---

**Sistema completamente configurado para deploy automático en Netlify** ✅
