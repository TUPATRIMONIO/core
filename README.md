# 🏢 TuPatrimonio - Plataforma de Servicios Legales Digitales

Ecosistema multi-tenant B2C + B2B que digitaliza procesos legales con IA avanzada, detección automática de ubicación por país y sistema de estilos centralizado.

> **📊 Estado del Proyecto:** Fase 0 en progreso (~85% completado)  
> **📅 Última actualización:** 10 Noviembre 2025  
> **📋 Ver pendientes:** [`docs/FASE-0-PENDIENTES.md`](docs/FASE-0-PENDIENTES.md)

## 🎯 Características Principales

- **🌍 Detección de País Automática**: Sistema por IP usando Vercel Edge Middleware + selección manual
- **🏠 B2C**: Usuarios individuales con gestión personal de documentos  
- **🏢 B2B**: Empresas con equipos, colaboración y gestión avanzada
- **🤖 IA Integrada**: Análisis automático de documentos + asistente legal
- **✍️ Servicios Core**: Firmas electrónicas, verificación de identidad, notaría digital
- **🎨 Design System**: Sistema dual de colores y estilos centralizados

## 🛠️ Stack Tecnológico

### Core Framework
- **Next.js**: 15.5.6 (App Router)
- **React**: 19.1.0
- **TypeScript**: 5.x
- **Node.js**: 20.x recomendado

### UI & Styling
- **Tailwind CSS**: v4 (con @tailwindcss/postcss)
- **Shadcn/UI**: Componentes basados en Radix UI v1.x
- **Iconos**: Lucide React 0.546.0
- **Fuentes**: Outfit (headings), Nunito (body), Josefin Sans (H1)
- **Dark Mode**: next-themes 0.4.6

### Backend & Database
- **Supabase**: 2.75+ (PostgreSQL + Auth + Storage + pgvector)
- **Supabase SSR**: 0.7.0

### Deployment & Infrastructure
- **Vercel**: Hosting con Edge Middleware para geolocalización
- **PWA**: Progressive Web App con service workers

### IA & Advanced Features
- **Anthropic Claude**: Análisis de documentos
- **OpenAI**: Asistente legal

### Development Tools
- **ESLint**: 9.x
- **Supabase CLI**: 2.53.6+
- **Sharp**: 0.33.5 (generación de iconos PWA)

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
2. **Vercel Edge Middleware** detecta país por IP → redirect a `/cl/firmas-electronicas`
3. **Fallback** a detección por navegador si falla Edge Middleware
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

## 🎨 Directrices de Diseño

### Sistema Dual de Colores

**Importante**: Usamos DOS paletas distintas para diferentes propósitos:

#### 🔘 Color Funcional (Grises) - Para UI Interactiva
```css
--tp-buttons: #404040         /* Botones, controles */
--tp-buttons-hover: #555555   /* Hover states */
```

**Cuándo usar**: 
- Botones de acción (CTAs, formularios)
- Navegación y menús
- Controles de UI y elementos interactivos
- Todo lo que requiere interacción del usuario

**Ejemplo**:
```tsx
<button className="bg-tp-primary hover:bg-tp-primary-hover text-white px-6 py-3 rounded-xl">
  Enviar Formulario
</button>
```

#### 🍷 Color de Marca (Vino) - Para Identidad
```css
--tp-brand: #800039          /* Marca principal */
--tp-brand-light: #a50049    /* Variante clara */
--tp-brand-dark: #600028     /* Variante oscura */
```

**Cuándo usar**:
- Logo y nombre "TuPatrimonio"
- Títulos de secciones principales
- Iconos destacados y elementos de marca
- Acentos visuales importantes

**Ejemplo**:
```tsx
<h1 className="text-[var(--tp-brand)]">
  TuPatrimonio
</h1>
```

### Dark Mode

El proyecto soporta dark mode automático usando `next-themes`:

```tsx
// Ya configurado en ambas apps
// Configurado en tailwind.config.ts
darkMode: ["class"]

// Uso en componentes - se adapta automáticamente
<div className="bg-background text-foreground">
  <Card className="bg-card text-card-foreground">
    {/* Colores se ajustan según el tema */}
  </Card>
</div>
```

**Comportamiento**:
- Las variables CSS se ajustan automáticamente en modo oscuro
- Ver `packages/ui/globals.css` líneas 276-405 para valores dark mode
- Los componentes Shadcn/UI respetan el tema automáticamente
- Usa las variables de Shadcn (`bg-background`, `text-foreground`) para elementos que deben adaptarse

### Componentes Shadcn/UI

Todos los componentes UI están basados en **Shadcn/UI** con personalización TuPatrimonio:

**Ubicación de componentes**:
```
apps/marketing/src/components/ui/
apps/web/src/components/ui/
```

**Componentes principales disponibles**:
- `Card`: Contenedores con `rounded-xl`, `shadow-sm`, `border`
- `Button`: Variantes con colores del sistema
- `Dialog`: Modales y diálogos
- `Popover`: Tooltips y popovers
- `Select`: Selectores personalizados
- `Checkbox`, `Switch`, `Label`: Controles de formulario
- `Separator`: Divisores de sección
- `Tabs`: Navegación por pestañas

**Documentación**: https://ui.shadcn.com/docs/components

### Iconos Minimalistas

Usamos **Lucide React** con estilo consistente y minimalista:

```tsx
import { Check, ArrowRight, User, FileText, Shield } from "lucide-react";

// Iconos en componentes
<Check className="w-5 h-5 text-tp-brand" />
<ArrowRight className="w-4 h-4" />
<Shield className="w-6 h-6 text-[var(--tp-brand)]" />
```

**Convenciones de tamaño**:
- `w-4 h-4` (16px): Iconos pequeños, inline con texto
- `w-5 h-5` (20px): Tamaño estándar, mayoría de casos
- `w-6 h-6` (24px): Iconos destacados, títulos
- `w-8 h-8` (32px): Iconos grandes, hero sections

**Estilo**:
- Stroke weight: 2 (default de Lucide)
- Estilo: Simple, limpio, sin relleno
- Consistencia: Todos los iconos de la misma familia

### Tipografía

El sistema usa tres fuentes con jerarquía clara:

```typescript
// Definido en packages/ui/globals.css
--font-h1: Josefin Sans     // Solo para H1
--font-h2-h6: Outfit        // Headings H2-H6
--font-body: Nunito         // Todo el texto body
```

**Uso automático**: Los estilos se aplican automáticamente a las etiquetas HTML:

```tsx
// No necesitas agregar clases de fuente
<h1>Se aplica Josefin Sans automáticamente</h1>
<h2>Se aplica Outfit automáticamente</h2>
<h3>Se aplica Outfit automáticamente</h3>
<p>Se aplica Nunito automáticamente</p>
```

**Responsive**: Los tamaños son mobile-first y se ajustan automáticamente:
- Mobile: Tamaños base
- Tablet (768px+): Tamaños medianos
- Desktop (1024px+): Tamaños grandes

Ver `packages/ui/TYPOGRAPHY-GUIDE.md` para más detalles.

### Tarjetas (Cards)

Estilo estándar consistente en todo el proyecto:

```tsx
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardContent,
  CardFooter 
} from "@/components/ui/card";

<Card>
  <CardHeader>
    <CardTitle>Título de la tarjeta</CardTitle>
    <CardDescription>Descripción breve del contenido</CardDescription>
  </CardHeader>
  <CardContent>
    {/* Contenido principal */}
  </CardContent>
  <CardFooter>
    {/* Acciones o información adicional */}
  </CardFooter>
</Card>
```

**Características predeterminadas**:
- Border radius: `rounded-xl` (12px)
- Shadow: `shadow-sm` (sutil)
- Border: `border` (se adapta a light/dark)
- Padding: `py-6 px-6` (24px vertical y horizontal)
- Gap interno: `gap-6` (24px entre elementos)
- Background: `bg-card` (se adapta a tema)

## 📐 Guía Rápida de Estilos

### Uso de Variables CSS

Hay dos formas de usar las variables de TuPatrimonio:

#### Opción 1: Variables CSS directas
Recomendado para valores únicos o personalizados:
```tsx
<button className="bg-[var(--tp-buttons)] hover:bg-[var(--tp-buttons-hover)] text-white">
  Click me
</button>
```

#### Opción 2: Clases Tailwind extendidas
Recomendado para reutilización y código más limpio:
```tsx
<div className="bg-tp-primary hover:bg-tp-primary-hover">
  {/* Usa las clases definidas en tailwind.config.ts */}
</div>
```

Ver todas las clases disponibles en `apps/marketing/tailwind.config.ts` líneas 21-85.

### Ejemplos Prácticos

```tsx
// ✅ Botón primario (gris funcional)
<button className="bg-tp-primary hover:bg-tp-primary-hover text-white px-6 py-3 rounded-xl transition-colors">
  Acción Principal
</button>

// ✅ Título con color de marca
<h2 className="text-[var(--tp-brand)] font-bold">
  TuPatrimonio
</h2>

// ✅ Card con fondo sutil de marca
<div className="bg-tp-brand-5 border border-tp-brand-20 rounded-xl p-6">
  <p className="text-[var(--tp-brand)]">Contenido destacado</p>
</div>

// ✅ Sección con gradiente de fondo
<section className="bg-tp-gradient-background py-16">
  <h2>Hero Section</h2>
</section>

// ✅ Card elevada con shadow personalizada
<div className="shadow-tp-lg rounded-tp-xl bg-card p-6">
  <h3>Card con sombra personalizada</h3>
</div>

// ✅ Elemento con backdrop blur (glass morphism)
<div className="backdrop-blur-tp-md bg-white/80 dark:bg-black/80 rounded-xl p-4">
  Efecto cristal
</div>
```

### Espaciado Consistente

Usa las clases de container para mantener padding lateral uniforme:

```tsx
// Container estándar (recomendado para la mayoría de secciones)
<section className="tp-container">
  {/* 
    Padding lateral responsive:
    Mobile: 24px
    Tablet: 32px
    Desktop MD: 48px
    Desktop LG: 64px
    XL: 80px
    2XL: 96px
  */}
</section>

// Container ancho (para secciones especiales que necesitan más espacio)
<section className="tp-container-wide">
  {/* Padding más reducido */}
</section>
```

Definidas en `packages/ui/globals.css` líneas 427-433.

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

### Setup PWA (Web App)
```bash
cd apps/web

# 1. Colocar ícono base (512x512px)
cp tu-icono.png public/icons/icon-base.png

# 2. Generar íconos en todos los tamaños
npm run generate-icons

# 3. Test PWA en producción local
npm run pwa:test             # http://localhost:3000
```

Ver guía completa: `apps/web/QUICK-START-PWA.md`

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

### Vercel Configuration

El proyecto usa **2 proyectos separados** en Vercel:

#### Marketing App (`tupatrimonio.app`)
- **Root directory**: `apps/marketing`
- **Build command**: `npm run build:marketing`
- **Output directory**: `.next`
- **Edge Middleware**: Auto-redirects por país

#### Web App (`app.tupatrimonio.app`)
- **Root directory**: `apps/web`
- **Build command**: `npm run build:web`
- **Output directory**: `.next`
- **PWA**: Instalable y funciona offline

### Variables de Entorno
```bash
# En Vercel Dashboard (ambos proyectos)
NODE_VERSION=20
NEXT_TELEMETRY_DISABLED=1
NEXT_PUBLIC_SUPABASE_URL=tu_url_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_key_anonima
```

### Verificación Post-Deploy
- [ ] Redirects automáticos funcionan (`/firmas-electronicas` → `/cl/firmas-electronicas`)
- [ ] Selector de país funciona correctamente
- [ ] Colores de marca aplicados en toda la app
- [ ] Dark mode funciona correctamente
- [ ] PWA instalable (solo Web App)

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
- ✅ **Progressive Web App (PWA)** instalable y funciona offline
- ✅ **Actualizaciones automáticas** con notificación al usuario

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

## 🎯 Próximos Pasos - Completar Fase 0

### Prioridad 1: Sistema de Autenticación (1 semana)
1. **Configurar verificación de correo electrónico** en Supabase
2. **Implementar OAuth** (Google + LinkedIn)
3. **Agregar Magic Links** para login sin contraseña
4. **Mejorar flujo de onboarding** post-registro
5. **Testing exhaustivo** de todos los flujos

### Prioridad 2: Contenido Real (1-2 semanas)
1. **Migrar contenido** del sitio actual en producción
2. **Actualizar landing pages** con información definitiva
3. **Migrar posts del blog** existente (10-15 posts)
4. **Crear posts nuevos** (3-4 sobre servicios core)
5. **Optimizar SEO** en todo el sitio

### Una vez completado → Iniciar Fase 1 (Backend Foundation)
- Schema credits + billing
- Dashboard híbrido B2C/B2B
- RLS policies completas
- Storage buckets adicionales

📖 **Ver detalles completos:** [`docs/FASE-0-PENDIENTES.md`](docs/FASE-0-PENDIENTES.md)

## 📚 Documentación Adicional

### Guías de Configuración y Desarrollo
- **Setup detallado**: Ver `docs/DEVELOPMENT.md`
- **Configuración Vercel**: Ver `docs/DEPLOYMENT.md` 
- **Decisiones arquitectónicas**: Ver `docs/ARCHITECTURE.md`

### Guías de Diseño y Estilos
- **Sistema de estilos completo**: Ver `packages/ui/globals.css`
- **Variables Tailwind extendidas**: Ver `apps/marketing/tailwind.config.ts`
- **Guía de tipografía**: Ver `packages/ui/TYPOGRAPHY-GUIDE.md`
- **Guía de iconos**: Ver `packages/ui/ICONS-GUIDE.md`
- **Componentes Shadcn/UI**: https://ui.shadcn.com/docs/components

### Referencias de Packages
- **Sistema de ubicación**: Ver `packages/location/`
- **Notificaciones de actualización**: Ver `packages/update-notifier/`
- **Utilidades compartidas**: Ver `packages/utils/`

### Archivos Históricos
- **Documentación archivada**: Ver `docs/archived/`

---

**Proyecto listo para deploy en Vercel** 🚀

Para soporte: [Crear issue](https://github.com/tupatrimonio/issues) • Documentación completa en `/docs`