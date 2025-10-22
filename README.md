# 🏢 TuPatrimonio - Plataforma de Servicios Legales Digitales

Ecosistema multi-tenant B2C + B2B que digitaliza procesos legales con IA avanzada, detección automática de ubicación por país y sistema de estilos centralizado.

## 🎯 Características Principales

- **🌍 Detección de País Automática**: Sistema por IP usando Netlify + selección manual
- **🏠 B2C**: Usuarios individuales con gestión personal de documentos  
- **🏢 B2B**: Empresas con equipos, colaboración y gestión avanzada
- **🤖 IA Integrada**: Análisis automático de documentos + asistente legal
- **✍️ Servicios Core**: Firmas electrónicas, verificación de identidad, notaría digital
- **🎨 Design System**: Sistema dual de colores y estilos centralizados

## 🛠️ Stack Tecnológico

- **Frontend**: Next.js 15+ (App Router) + TailwindCSS + Shadcn/UI
- **Backend**: Supabase (PostgreSQL + Auth + Storage + pgvector)
- **Deploy**: Netlify con Edge Functions para geolocalización
- **IA**: Anthropic Claude + OpenAI
- **Arquitectura**: Monorepo con packages compartidos

## 📁 Estructura del Proyecto

```
tupatrimonio-app/
├── apps/
│   ├── marketing/          # Marketing site (puerto 3001)
│   │   ├── src/app/
│   │   │   ├── cl/         # Páginas específicas Chile
│   │   │   ├── mx/         # Páginas específicas México  
│   │   │   ├── co/         # Páginas específicas Colombia
│   │   │   └── [service]/  # Landing pages genéricas
│   │   └── components/
│   └── web/               # Aplicación principal (puerto 3000)
│       ├── src/app/
│       │   ├── dashboard/
│       │   ├── login/
│       │   └── auth/
│       └── components/
├── packages/              # Código compartido
│   ├── location/         # Sistema de detección ubicación
│   └── ui/              # Estilos y componentes centralizados
├── netlify/             # Funciones para geolocalización
│   ├── functions/       # Functions normales
│   └── edge-functions/  # Edge Functions rápidas
└── supabase/           # Configuración backend
    └── migrations/
```

## 🌍 Sistema de Detección de Ubicación

### Países Soportados
| País | Código | Moneda | Estado | URL |
|------|--------|--------|---------|-----|
| Chile | `cl` | CLP | ✅ Activo | `/cl/firmas-electronicas` |
| México | `mx` | MXN | 🚧 Próximamente | `/mx/firmas-electronicas` |
| Colombia | `co` | COP | 🚧 Próximamente | `/co/firmas-electronicas` |

### Flujo de Detección
1. **Usuario visita** `/firmas-electronicas`
2. **Netlify Edge Function** detecta país por IP → redirect a `/cl/firmas-electronicas`
3. **Fallback** a detección por navegador si falla Netlify
4. **Selector manual** disponible para cambiar país
5. **Confirmación** antes de navegar entre páginas de países

### Configuración
```typescript
// Usar en componentes
import { useLocation, CountrySelector } from 'packages/location/src';

const { country, countryInfo, formatCurrency } = useLocation();
```

## 🎨 Sistema de Colores

### Paleta Dual Implementada
```css
/* Botones funcionales (neutros) */
--tp-buttons: #404040;           /* Gris oscuro */
--tp-buttons-hover: #555555;     /* Gris claro hover */

/* Elementos de marca (identidad) */
--tp-brand: #800039;             /* Vino corporativo */
--tp-brand-light: #a50049;       /* Vino claro */
--tp-brand-dark: #600028;        /* Vino oscuro */

/* Variaciones con opacidad disponibles */
--tp-buttons-5: #4040400d;       /* 5% opacity */
--tp-brand-10: #8000391a;        /* 10% opacity */
```

### Uso Recomendado
- **Color de Marca (Vino)**: Nombres "TuPatrimonio", títulos de servicios, iconos destacados
- **Color Funcional (Gris)**: Botones de acción, navegación, controles de UI

## 🚀 Development Setup

### Instalación
```bash
# Instalar dependencias
npm install

# Desarrollo - Marketing app
npm run dev:marketing        # http://localhost:3001

# Desarrollo - Web app  
npm run dev                 # http://localhost:3000

# Build completo
npm run build
```

### Build Scripts
```bash
npm run build:location      # Compilar package location
npm run build:marketing     # Build marketing app
npm run build:web          # Build web app
npm run build              # Build everything
```

## 📦 Packages Compartidos

### @tupatrimonio/location
Sistema de detección de ubicación con:
- `LocationManager`: Lógica de detección híbrida
- `useLocation`: Hook React para ambas apps
- `CountrySelector`: Componente UI reutilizable

### @tupatrimonio/ui
Sistema de estilos compartido:
- `globals.css`: Variables CSS centralizadas
- Design system unificado entre apps

## 🚀 Deployment

### Netlify Configuration
El proyecto incluye `netlify.toml` configurado para:
- **Build command**: `npm run build:marketing`
- **Publish directory**: `apps/marketing/.next`
- **Edge Functions**: Auto-redirects por país
- **Headers automáticos**: Geolocalización sin configuración adicional

### Variables de Entorno
```bash
# En Netlify Dashboard
NEXT_PUBLIC_SUPABASE_URL=tu_url_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_key_anonima
```

### Verificación Post-Deploy
- [ ] `/.netlify/functions/detect-country` responde JSON
- [ ] Redirects automáticos funcionan (`/firmas-electronicas` → `/cl/firmas-electronicas`)
- [ ] Selector de país funciona correctamente
- [ ] Colores de marca aplicados en toda la app

## 🛡️ Features Principales

### Marketing App (Público)
- ✅ **Landing pages por país** con detección automática
- ✅ **Auto-redirects inteligentes** con countdown cancelable
- ✅ **SEO optimizado** por país (metadata específica)
- ✅ **Blog integrado** con categorías por país y tema
- ✅ **Sistema de colores** coherente en toda la app

### Web App (Dashboard)
- ✅ **Personalización automática** por país (precios, moneda)
- ✅ **Dashboard responsivo** con información localizada
- ✅ **Selector de país** en header para cambiar configuración
- ✅ **Autenticación** integrada con Supabase

### Funcionalidades Compartidas
- ✅ **Detección de ubicación** híbrida (IP + navegador)
- ✅ **Persistencia** de preferencias en localStorage
- ✅ **Fallbacks múltiples** para máxima compatibilidad
- ✅ **Components reutilizables** entre apps

## 📊 Backend (Supabase)

### Schema Principal
```sql
marketing.blog_posts        # Sistema de blog dinámico
marketing.blog_categories   # Categorías por país/tema
marketing.waitlist_subscribers  # Lista de espera por país
```

### Edge Functions
```
supabase/functions/         # APIs custom si se necesitan
```

## 🔧 Comandos Útiles

```bash
# Development
npm run dev:marketing       # Iniciar marketing site
npm run dev                # Iniciar web app

# Build & Deploy
npm run build              # Build completo 
npm run build:marketing    # Solo marketing
npm run build:web         # Solo web app

# Linting
npm run lint              # Lint todas las apps
```

## 🎯 Próximos Pasos

1. **Deploy inicial** en Netlify con configuración actual
2. **Verificar** detección de ubicación en producción  
3. **Configurar** variables de entorno de Supabase
4. **Monitorear** analytics de detección por país
5. **Expandir** contenido para México y Colombia

## 📚 Documentación Adicional

- **Setup detallado**: Ver `docs/DEVELOPMENT.md`
- **Configuración Netlify**: Ver `docs/DEPLOYMENT.md` 
- **Decisiones arquitectónicas**: Ver `docs/ARCHITECTURE.md`
- **Archivos históricos**: Ver `docs/archived/`

---

**Proyecto listo para deploy en Netlify** 🚀

Para soporte: [Crear issue](https://github.com/tupatrimonio/issues) • Documentación completa en `/docs`