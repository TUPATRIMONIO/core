# 🛠️ Guía de Desarrollo - TuPatrimonio

## 🚀 Quick Start

### Prerrequisitos
- Node.js 18+
- npm workspace support
- Git

### Instalación Inicial
```bash
# Clonar repositorio
git clone [repo-url]
cd tupatrimonio-app

# Instalar dependencias (puede fallar por workspace:* - es normal)
npm install

# Build packages compartidos primero
npm run build:location

# Iniciar development server
npm run dev:marketing    # Puerto 3001 (marketing)
npm run dev             # Puerto 3000 (web app)
```

## 📦 Packages y Dependencies

### Estructura del Monorepo
```
packages/
├── location/           # Sistema de ubicación compartido
│   ├── src/
│   │   ├── LocationManager.ts     # Detección híbrida
│   │   ├── CountryConfig.ts       # Configuración países
│   │   ├── hooks/useLocation.ts   # React hooks
│   │   └── components/CountrySelector.tsx
│   ├── package.json
│   └── tsconfig.json
└── ui/                # Estilos compartidos
    ├── globals.css    # Variables CSS centralizadas
    └── package.json
```

### Scripts Importantes
```bash
# Development
npm run dev:marketing        # Marketing app (puerto 3001)
npm run dev                 # Web app (puerto 3000)

# Build
npm run build:location      # Compilar package location primero
npm run build:marketing     # Build marketing app
npm run build:web          # Build web app  
npm run build              # Build todo (incluye packages)

# Utilidades
npm run lint               # Linting todas las apps
```

## 🌍 Sistema de Ubicación

### Configuración Local
En desarrollo, la detección funciona por:
1. **Zona horaria** del navegador (más precisa)
2. **Idioma** del navegador (backup)
3. **Default** a Chile si nada funciona

### APIs del Sistema
```typescript
// Hook principal
const { 
  country,        // 'cl', 'mx', 'co'
  countryInfo,    // { name, flag, currency, ... }
  source,         // 'netlify' | 'browser' | 'manual' | 'fallback'
  setCountry,     // Cambiar país manualmente
  formatCurrency  // Formatear precios automáticamente
} = useLocation();

// Para personalización en web app
const {
  formatCurrency,
  formatDate,
  getLocalizedContent
} = useCountryPersonalization();
```

### Debugging
```typescript
// En consola del navegador
import { LocationManager } from 'packages/location/src/LocationManager';

// Ver información de debugging
console.log(LocationManager.getDebugInfo());

// Resultado:
{
  timezone: "America/Santiago",
  language: "es-CL",
  currency: "CLP",
  localStorage: { ... }
}
```

## 🎨 Sistema de Estilos

### Variables CSS Centralizadas
Ubicación: `packages/ui/globals.css`

```css
/* Botones funcionales */
--tp-buttons: #404040;
--tp-buttons-hover: #555555;

/* Elementos de marca */
--tp-brand: #800039;
--tp-brand-light: #a50049;

/* Variaciones con opacidad */
--tp-buttons-10: #4040401a;
--tp-brand-20: #80003933;
```

### Uso en Componentes
```typescript
// Para botones funcionales
<Button className="bg-[var(--tp-buttons)] hover:bg-[var(--tp-buttons-hover)]">

// Para elementos de marca
<h1 className="text-[var(--tp-brand)]">TuPatrimonio</h1>

// Para fondos sutiles
<div className="bg-[var(--tp-brand-5)] border border-[var(--tp-brand-20)]">
```

## 🔧 Desarrollo por Aplicación

### Marketing App (`apps/marketing`)
```bash
cd apps/marketing
npm run dev                 # Puerto 3001

# Estructura importante:
src/app/
├── [country]/             # Páginas por país  
│   ├── firmas-electronicas/
│   ├── notaria-digital/
│   └── verificacion-identidad/
├── firmas-electronicas/   # Landing genérica (redirect)
├── blog/                  # Blog con categorías
└── layout.tsx            # Layout principal
```

### Web App (`apps/web`)
```bash
cd apps/web  
npm run dev                 # Puerto 3000
npm run generate-icons     # Generar íconos PWA
npm run pwa:test           # Test PWA (build + start)

# Estructura importante:
src/app/
├── dashboard/              # Dashboard principal
├── login/                  # Sistema de auth
├── auth/callback/          # OAuth callback
├── offline/               # Página offline PWA
└── layout.tsx             # Layout con LocationProvider + PWA
```

#### PWA Setup
```bash
# 1. Colocar ícono base (512x512px PNG)
cp tu-icono.png apps/web/public/icons/icon-base.png

# 2. Instalar dependencias
cd apps/web
npm install

# 3. Generar todos los íconos
npm run generate-icons

# 4. Test en producción local
npm run pwa:test
```

Ver documentación completa en `apps/web/README-PWA.md`

## 🚦 Testing

### Verificar Sistema de Ubicación
```bash
# 1. Ir a http://localhost:3001/firmas-electronicas
# 2. Verificar detección automática
# 3. Probar selector manual
# 4. Confirmar persistencia en localStorage
```

### Verificar Estilos
```bash
# 1. Confirmar colores vino en elementos de marca
# 2. Confirmar colores grises en botones
# 3. Verificar popup del selector
```

## 🐛 Troubleshooting

### Problemas Comunes

#### "Can't resolve @tupatrimonio/location"
```bash
# Solución: Compilar package location
npm run build:location
```

#### Estilos no se aplican
```bash
# Verificar que globals.css se importe correctamente
# apps/marketing/src/app/layout.tsx
import "../../../../packages/ui/globals.css";
```

#### Edge Functions no funcionan localmente
```bash
# Normal - Solo funcionan en producción Netlify
# Localmente usa fallback a detección por navegador
```

#### PWA: Service Worker no se registra
```bash
# El Service Worker solo funciona en:
# - Producción (NODE_ENV=production)
# - HTTPS o localhost
# - Para testing: npm run pwa:test
```

#### PWA: Íconos no aparecen
```bash
# Solución: Generar íconos desde ícono base
npm run generate-icons

# Verificar que existan en:
ls apps/web/public/icons/
```

## 📝 Agregando Nuevas Páginas por País

### 1. Crear página específica
```typescript
// apps/marketing/src/app/cl/nuevo-servicio/page.tsx
export const metadata = {
  title: "Nuevo Servicio Chile | TuPatrimonio",
  // ... metadata específico
};

export default function NuevoServicioChile() {
  return (
    <div>
      <header>
        <h1>TuPatrimonio Chile</h1>
        <CountrySelector variant="minimal" />
      </header>
      {/* Contenido específico Chile */}
    </div>
  );
}
```

### 2. Crear landing genérica  
```typescript
// apps/marketing/src/app/nuevo-servicio/page.tsx
'use client'

import { useLocation } from 'packages/location/src/hooks/useLocation';

export default function NuevoServicioLanding() {
  const { country, countryInfo } = useLocation();
  
  // Auto-redirect logic similar a firmas-electronicas
  return <div>{/* Landing con selector */}</div>;
}
```

### 3. Actualizar Edge Function
```typescript
// netlify/edge-functions/country-redirect.ts
const needsCountryRedirect = [
  '/firmas-electronicas',
  '/notaria-digital', 
  '/verificacion-identidad',
  '/nuevo-servicio'        // ← Agregar aquí
].includes(pathname);
```

## 🔄 Git Workflow

### Branches
- `main`: Producción estable
- `desarrollo`: Development activo
- `feature/*`: Features específicas

### Commits
```bash
# Compilar location package antes de commit
npm run build:location

# Commit normal
git add .
git commit -m "feat: nueva funcionalidad"
```

---

**Para más detalles**: Ver `docs/DEPLOYMENT.md` para deploy o `docs/ARCHITECTURE.md` para decisiones técnicas.
