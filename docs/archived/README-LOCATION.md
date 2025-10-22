# Sistema de Detección de Ubicación - TuPatrimonio

## Resumen

Sistema completo de detección automática de ubicación por IP usando Netlify, con interfaz de selección manual para usuarios. Funciona tanto en la app de marketing (con URLs por país) como en la web app (personalización interna).

## 🚀 Características Implementadas

- ✅ **Detección automática por IP** usando Netlify Edge Functions
- ✅ **Fallback por navegador** (zona horaria, idioma)
- ✅ **Selección manual** con persistencia en localStorage
- ✅ **URLs por país** en marketing app (`/cl/firmas-electronicas`)
- ✅ **Personalización interna** en web app (precios, moneda, contenido)
- ✅ **Componente CountrySelector** reutilizable
- ✅ **Auto-redirects inteligentes** con countdown cancelable

## 📁 Estructura del Proyecto

```
packages/location/                   # Package compartido
├── src/
│   ├── LocationManager.ts          # Lógica principal de detección
│   ├── CountryConfig.ts            # Configuración de países
│   ├── hooks/useLocation.ts        # React hooks
│   ├── components/CountrySelector.tsx # Componente UI
│   └── index.ts                    # Exports principales

netlify/
├── functions/detect-country.ts     # Función para detección por IP
├── edge-functions/country-redirect.ts # Auto-redirects
└── netlify.toml                    # Configuración Netlify

apps/marketing/                     # Marketing app
├── src/app/
│   ├── firmas-electronicas/page.tsx    # Landing con selector
│   ├── cl/firmas-electronicas/page.tsx # Página Chile
│   ├── mx/firmas-electronicas/page.tsx # Página México
│   └── co/firmas-electronicas/page.tsx # Página Colombia
└── components/LocationProvider.tsx

apps/web/                           # Web app
├── src/components/
│   ├── LocationProvider.tsx       # Provider para web app
│   ├── DashboardHeader.tsx        # Header con selector
│   └── PricingExample.tsx         # Ejemplo precios localizados
└── app/dashboard/page.tsx         # Dashboard personalizado
```

## 🌍 Países Soportados

| País | Código | Moneda | Estado |
|------|--------|--------|---------|
| Chile | `cl` | CLP | ✅ Activo |
| México | `mx` | MXN | 🚧 Próximamente |
| Colombia | `co` | COP | 🚧 Próximamente |

## 🔧 Configuración

### 1. Netlify Configuration

El archivo `netlify.toml` está configurado para:
- Habilitar headers automáticos de geolocalización
- Redirects por país como backup
- Edge Functions para redirects rápidos

### 2. Package Installation

```bash
# En apps/marketing
npm install @tupatrimonio/location

# En apps/web  
npm install @tupatrimonio/location
```

### 3. Environment Setup

No requiere variables de entorno adicionales. Netlify proporciona automáticamente:
- `x-nf-country-code`
- `x-nf-geo-city` 
- `x-nf-geo-subdivision-1-iso-code`

## 💻 Uso en Marketing App

### Auto-redirects Inteligentes

```typescript
// apps/marketing/src/app/firmas-electronicas/page.tsx
import { useLocation, CountrySelector } from '@tupatrimonio/location';

export default function FirmasElectronicasLanding() {
  const { country, countryInfo, source } = useLocation();
  
  // Auto-redirect con countdown cancelable
  useEffect(() => {
    if (['netlify', 'browser'].includes(source)) {
      // Redirect después de 5 segundos
    }
  }, [source, country]);
  
  return (
    <div>
      <CountrySelector variant="minimal" />
      {/* Resto del componente */}
    </div>
  );
}
```

### Páginas por País

Cada país tiene su página específica con:
- Precios en moneda local
- Marco legal específico
- Contenido localizado
- SEO optimizado por país

## 💻 Uso en Web App

### Personalización Automática

```typescript
// apps/web/src/components/PricingExample.tsx
import { useLocationContext } from './LocationProvider';

export function PricingExample() {
  const { formatCurrency, getLocalizedContent } = useLocationContext();
  
  const prices = getLocalizedContent({
    cl: { advanced: 2500 },
    mx: { advanced: 75 },
    co: { advanced: 10000 }
  });
  
  return (
    <div>
      <span>{formatCurrency(prices.advanced)}</span>
    </div>
  );
}
```

### Selector en Dashboard

```typescript
// apps/web/src/components/DashboardHeader.tsx
import { CountrySelector } from '@tupatrimonio/location';

export function DashboardHeader() {
  return (
    <header>
      <CountrySelector variant="minimal" showLabel={false} />
    </header>
  );
}
```

## 🎛️ API del Package

### LocationManager

```typescript
// Obtener país actual
const location = await LocationManager.getCurrentCountry();
// { country: 'cl', source: 'netlify', confidence: 'high' }

// Establecer preferencia manual
LocationManager.setUserPreference('mx');

// Resetear a detección automática  
LocationManager.resetToAutoDetection();
```

### useLocation Hook

```typescript
const {
  country,        // Código del país actual
  countryInfo,    // Información completa del país
  source,         // 'netlify' | 'browser' | 'manual' | 'fallback'
  isLoading,      // Estado de carga
  setCountry,     // Función para cambiar país
  resetToAutoDetection // Función para resetear
} = useLocation();
```

### CountrySelector Component

```typescript
<CountrySelector 
  variant="button"        // 'button' | 'minimal' | 'header'
  showLabel={true}        // Mostrar nombre del país
  onCountryChange={(country) => {}} // Callback opcional
/>
```

## 🔄 Flujo de Detección

1. **Usuario visita `/firmas-electronicas`**
2. **Netlify Edge Function** detecta país por IP → redirect a `/cl/firmas-electronicas`
3. **Si falla**, función normal detecta país
4. **Si falla**, detección por navegador (timezone, idioma)
5. **Si todo falla**, default a Chile

## 📱 Experiencia de Usuario

### Marketing App
1. Usuario entra a página genérica
2. País detectado automáticamente
3. Countdown de 5 segundos con opción a cancelar
4. Redirect automático o selección manual
5. Preferencia guardada para futuras visitas

### Web App
1. Detección automática en background
2. Precios y contenido personalizados
3. Selector disponible en header
4. Cambios aplican instantáneamente

## 🐛 Debugging

### Información de Debug

```typescript
import { LocationManager } from '@tupatrimonio/location';

const debugInfo = LocationManager.getDebugInfo();
console.log(debugInfo);
// {
//   timezone: "America/Santiago",
//   language: "es-CL", 
//   currency: "CLP",
//   localStorage: { ... }
// }
```

### Verificar Detección

```bash
# Probar función Netlify localmente
curl https://tupatrimonio.app/.netlify/functions/detect-country

# Headers de debug (desarrollo)
{
  "country": "cl",
  "source": "netlify", 
  "debug": { ... }
}
```

## 🚀 Deployment

### Netlify

1. **Configura el repositorio** en Netlify
2. **Build command**: `npm run build:marketing`
3. **Publish directory**: `apps/marketing/.next`
4. **Edge Functions se despliegan automáticamente**

### Verificación Post-Deploy

- [ ] Función de detección responde: `/.netlify/functions/detect-country`
- [ ] Edge redirects funcionan para rutas principales  
- [ ] Headers de geolocalización presentes
- [ ] Selector de país funciona en ambas apps
- [ ] Persistencia en localStorage funciona

## 📈 Métricas y Analytics

Puedes trackear la detección de ubicación:

```typescript
// En el LocationManager
const trackCountryDetection = (country: string, source: string) => {
  // Google Analytics, Mixpanel, etc.
  gtag('event', 'country_detected', {
    country: country,
    detection_method: source
  });
};
```

## 🔒 Consideraciones de Privacidad

- ✅ Solo usa IP para detección, no almacenamiento
- ✅ Respeta preferencias del usuario
- ✅ Permite opt-out a detección manual
- ✅ Información transparente sobre detección
- ✅ Cumple con GDPR (solo datos necesarios)

## 🤝 Contribuir

Para agregar un nuevo país:

1. **Agregar en CountryConfig.ts**
2. **Crear páginas específicas en marketing**
3. **Actualizar precios localizados**
4. **Agregar marco legal específico**
5. **Probar detección y flujos**

---

**¿Problemas?** Revisa los logs de Netlify Functions y verifica que los headers de geolocalización estén presentes.
