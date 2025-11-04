# @tupatrimonio/assets

Package compartido de assets para las aplicaciones de TuPatrimonio.

## 📦 Contenido

- **Componentes de Logo**: 
  - `ImagotipoImage` - ⭐ Next.js Image con import directo (recomendado)
  - `Imagotipo` - SVG inline
  - `Isotipo` - Solo símbolo SVG
  - `Logo` - Wrapper con variantes
- **Constantes**: Rutas de assets, colores de marca
- **Assets públicos**: Imágenes en `packages/assets/public/` (única fuente de verdad)
- **Types**: Definiciones TypeScript para imports de imágenes

## 🚀 Instalación

Este package es interno del monorepo y se instala automáticamente mediante workspaces.

### 1. Agregar al package.json

```json
{
  "dependencies": {
    "@tupatrimonio/assets": "workspace:*"
  }
}
```

### 2. Configurar Next.js (IMPORTANTE)

Para que Next.js pueda importar imágenes desde el package, agrega esto a `next.config.ts`:

```typescript
import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Transpilar packages del monorepo
  transpilePackages: ['@tupatrimonio/assets'],
  
  // Configurar webpack para resolver archivos desde packages
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@tupatrimonio/assets/public': path.resolve(__dirname, '../../packages/assets/public'),
    };
    return config;
  },
  // ... resto de tu configuración
};
```

## 📖 Uso

### Componentes React

```tsx
import { Logo, Imagotipo, ImagotipoImage, Isotipo } from '@tupatrimonio/assets';

// ⭐ Imagen real con Next.js Image (RECOMENDADO)
<ImagotipoImage width={120} height={150} />

// Con priority para hero images
<ImagotipoImage width={120} height={150} priority />

// Logo completo (imagotipo por defecto)
<Logo width={150} height={180} />

// Solo el símbolo (isotipo)
<Logo variant="isotipo" width={100} height={100} />

// Imagotipo SVG inline (si necesitas cambiar color)
<Imagotipo width={120} height={150} color="#800039" />

// Isotipo directamente
<Isotipo width={80} height={80} />
```

### Rutas de Assets

```tsx
import { ASSET_PATHS } from '@tupatrimonio/assets';

<img src={ASSET_PATHS.logo.imagotipo} alt="TuPatrimonio" />
```

### Colores de Marca

```tsx
import { BRAND_COLORS } from '@tupatrimonio/assets';

const styles = {
  backgroundColor: BRAND_COLORS.primary,
  color: BRAND_COLORS.background.light
};
```

## 🎨 Props Disponibles

### ImagotipoImage (Next.js Image - Recomendado)

| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| `width` | `number` | 120 | Ancho de la imagen |
| `height` | `number` | 150 | Alto de la imagen |
| `className` | `string` | `''` | Clases CSS adicionales |
| `alt` | `string` | `'TuPatrimonio'` | Texto alternativo |
| `priority` | `boolean` | `false` | Carga prioritaria (hero images) |

### Logo / Imagotipo / Isotipo (SVG)

| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| `width` | `number` | 120/100 | Ancho del SVG |
| `height` | `number` | 150/100 | Alto del SVG |
| `className` | `string` | `''` | Clases CSS adicionales |
| `color` | `string` | `'#800039'` | Color del logo |

### Logo (adicional)

| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| `variant` | `'imagotipo' \| 'isotipo'` | `'imagotipo'` | Variante del logo |

## 🏗️ Desarrollo

```bash
# Compilar
npm run build

# Modo watch
npm run dev
```

## 📁 Estructura

```
packages/assets/
├── src/
│   ├── components/
│   │   ├── ImagotipoImage.tsx  # ⭐ Next.js Image con import directo
│   │   ├── Imagotipo.tsx       # SVG inline
│   │   ├── Isotipo.tsx         # Solo símbolo SVG
│   │   └── Logo.tsx            # Wrapper
│   ├── types/
│   │   └── images.d.ts         # 🎯 Type definitions para imágenes
│   └── index.ts
├── public/
│   └── images/
│       └── logo/
│           └── Imagotipo.webp  # ✨ Única fuente de verdad
├── dist/                        # Compilado
├── package.json
├── tsconfig.json
├── CHANGELOG.md
└── README.md
```

## 📝 Notas

- ⭐ **ImagotipoImage** usa Next.js Image con import directo (una sola fuente de verdad)
- 🎯 **Sin duplicación**: Las imágenes viven solo en `packages/assets/public/`
- 📦 **Next.js optimiza**: Automáticamente redimensiona y optimiza las imágenes
- 🚀 **Performance**: Lazy loading automático, priority para hero images
- 🎨 **SVG flexibles**: Imagotipo e Isotipo permiten cambiar colores mediante props
- 💎 **Type-safe**: TypeScript con tipos completos para todo
- 🔧 **Compatible**: Funciona en todas las apps del monorepo

