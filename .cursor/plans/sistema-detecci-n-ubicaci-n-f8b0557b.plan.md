<!-- f8b0557b-64fe-4ad1-a344-f882c55ba4e2 0516128d-5a9a-4454-812f-443ad51a6d28 -->
# Sistema de Detección de Ubicación con Netlify

## Arquitectura General

- **Package compartido** en `packages/location` con toda la lógica de detección
- **Marketing app**: URLs por país + auto-redirect + selector visible
- **Web app**: Detección interna + personalización + selector en dashboard
- **Netlify Functions**: Detección por IP sin servicios terceros

## Estructura de Implementación

### 1. Package Compartido `packages/location`

Crear biblioteca reutilizable con:

- `LocationManager`: Clase principal para detección y persistencia
- `CountryConfig`: Configuración de países soportados (CL, MX, CO)
- `useLocation`: Hook React para ambas aplicaciones
- `CountrySelector`: Componente UI compartido
- Detección híbrida: Netlify headers → Browser fallback → Default

### 2. Configuración Netlify

- **Edge Function** en `netlify/edge-functions/country-redirect.ts` para marketing
- **Netlify Function** en `netlify/functions/detect-country.ts` para detección por IP
- **netlify.toml** con headers automáticos y redirects por país
- Headers de geolocalización: `x-nf-country-code`, `x-nf-geo-city`

### 3. Marketing App (apps/marketing)

- **URLs por país**: `/cl/firmas-electronicas`, `/mx/firmas-electronicas`, etc.
- **Auto-redirect inteligente** con countdown de 5 segundos
- **Páginas genéricas** (`/firmas-electronicas`) que detectan y redirectan
- **Selector visible** en header y landing pages
- **Persistencia** de preferencia manual del usuario

### 4. Web App (apps/web)  

- **URLs normales** sin código de país: `/dashboard`, `/login`, etc.
- **Detección interna** para personalización de:
  - Precios y moneda en UI
  - Contenido específico por país
  - Configuración regional
- **Selector en dashboard** header para cambiar configuración
- **No redirects** - solo personalización interna

### 5. Componentes y Hooks

- `CountrySelector`: Componente con variantes (minimal, button, header)
- `useLocation`: Hook con estado global y persistencia
- `LocationProvider`: Context provider para ambas apps
- Auto-detección con caché de 24 horas
- Eventos personalizados para cambios de país

## Archivos Principales a Crear

```
packages/location/
├── src/
│   ├── LocationManager.ts          # Lógica principal
│   ├── CountryConfig.ts           # Configuración países
│   ├── hooks/useLocation.ts       # Hook React
│   ├── components/CountrySelector.tsx
│   └── index.ts
├── package.json
└── tsconfig.json

netlify/
├── edge-functions/
│   └── country-redirect.ts        # Auto-redirect marketing
├── functions/
│   └── detect-country.ts         # Detección por IP
└── netlify.toml                  # Configuración headers

apps/marketing/src/
├── app/
│   ├── [country]/               # Páginas por país
│   │   ├── firmas-electronicas/
│   │   ├── notaria-digital/
│   │   └── verificacion-identidad/
│   └── firmas-electronicas/page.tsx # Landing con selector
└── components/LocationProvider.tsx

apps/web/src/
├── components/
│   ├── DashboardHeader.tsx       # Header con selector
│   └── LocationProvider.tsx
└── hooks/useCountryPersonalization.ts
```

## Integración Step-by-Step

1. **Crear package compartido** con lógica de detección
2. **Configurar Netlify** functions y edge functions  
3. **Integrar en marketing** con redirects automáticos
4. **Integrar en web app** con personalización interna
5. **Testing** en ambas aplicaciones
6. **Documentar** uso para futuros desarrolladores

### To-dos

- [ ] Crear package compartido packages/location con LocationManager, CountryConfig, hooks y componentes
- [ ] Implementar funciones Netlify para detección por IP y redirects automáticos
- [ ] Integrar sistema en marketing app con URLs por país y auto-redirects
- [ ] Integrar detección en web app para personalización interna sin cambiar URLs
- [ ] Implementar componente CountrySelector en ambas apps con diferentes variantes
- [ ] Probar detección automática, selección manual y persistencia en ambas apps