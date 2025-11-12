# Package @tupatrimonio/assets

Documentación del package compartido de assets para el monorepo de TuPatrimonio.

## 📦 Qué es

`@tupatrimonio/assets` es un package compartido que centraliza todos los recursos visuales y componentes de marca (logos, iconos, imágenes) para ser reutilizados en todas las aplicaciones del monorepo (marketing, web, etc.).

## 🎯 Objetivo

- **Centralizar** todos los assets de marca en un único lugar
- **Reutilizar** componentes de logos entre aplicaciones
- **Mantener consistencia** visual en todas las apps
- **Facilitar actualizaciones** de marca (un solo lugar para cambiar)
- **Type-safe** con TypeScript completo

## 📁 Estructura

```
packages/assets/
├── src/
│   ├── components/
│   │   ├── ImagotipoImage.tsx  # ⭐ Next.js Image (recomendado)
│   │   ├── Imagotipo.tsx       # Logo SVG completo
│   │   ├── Isotipo.tsx         # Solo símbolo SVG
│   │   └── Logo.tsx            # Wrapper con variantes
│   ├── types/
│   │   └── images.d.ts         # Type definitions para imágenes
│   ├── public/
│   │   └── images/
│   │       └── logo/
│   │           └── Imagotipo.webp  # ✨ Única fuente de verdad
│   └── index.ts                    # Exports y constantes
├── dist/                     # Archivos compilados
├── package.json
├── tsconfig.json
├── CHANGELOG.md
└── README.md
```

## 🚀 Uso

### Instalación

El package está configurado como workspace interno. Ya está agregado en:
- ✅ `apps/marketing/package.json`
- ✅ `apps/web/package.json`

### Importar Componentes

```tsx
import { ImagotipoImage, Imagotipo, Isotipo, Logo } from '@tupatrimonio/assets';

// ⭐ Next.js Image con import directo (RECOMENDADO)
<ImagotipoImage width={120} height={150} />

// Con priority para hero images
<ImagotipoImage width={120} height={150} priority />

// Logo completo SVG (si necesitas cambiar color)
<Imagotipo width={120} height={150} color="#800039" />

// Solo símbolo
<Isotipo width={100} height={100} />

// Usando el wrapper Logo
<Logo variant="imagotipo" width={150} height={180} />
<Logo variant="isotipo" width={80} height={80} />
```

### Props Disponibles

Todos los componentes aceptan:

| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| `width` | `number` | 120/100 | Ancho en píxeles |
| `height` | `number` | 150/100 | Alto en píxeles |
| `className` | `string` | `''` | Clases CSS de Tailwind |
| `color` | `string` | `'#800039'` | Color de marca |

### Constantes Exportadas

```tsx
import { BRAND_COLORS, ASSET_PATHS } from '@tupatrimonio/assets';

// Colores de marca
BRAND_COLORS.primary          // '#800039'
BRAND_COLORS.primaryLight     // '#a50049'
BRAND_COLORS.background.light // '#f7f7f7'

// Rutas de assets (para uso futuro)
ASSET_PATHS.logo.imagotipo    // '/assets/images/logo/imagotipo.svg'
```

## 🔧 Desarrollo

### Compilar el Package

```bash
cd packages/assets
npm run build
```

### Modo Watch

```bash
npm run dev
```

### Agregar Nuevos Componentes

1. Crear el componente en `src/components/`
2. Exportarlo en `src/index.ts`
3. Compilar con `npm run build`
4. Usar en cualquier app del monorepo

## 📝 Ejemplos de Uso Real

### En la Landing de Notaría Online

```tsx
// apps/marketing/src/app/(paises)/cl/notaria-online/page.tsx
import { Imagotipo } from '@tupatrimonio/assets';

export default function NotariaOnlinePage() {
  return (
    <section>
      <div className="flex justify-center mb-8">
        <Imagotipo width={120} height={150} />
      </div>
      {/* ... resto del contenido */}
    </section>
  );
}
```

### En el Header de la App Web

```tsx
// apps/web/src/components/Header.tsx
import { Logo } from '@tupatrimonio/assets';

export function Header() {
  return (
    <header>
      <Logo variant="isotipo" width={50} height={50} />
      {/* ... menú de navegación */}
    </header>
  );
}
```

### Con Estilos Personalizados

```tsx
import { Imagotipo } from '@tupatrimonio/assets';

<Imagotipo 
  width={200} 
  height={240}
  className="hover:scale-110 transition-transform"
  color="var(--tp-brand)"
/>
```

## ✅ Ventajas

1. **Una sola fuente de verdad**: Las imágenes viven solo en `packages/assets/public/`
2. **Sin duplicación**: No es necesario copiar archivos a cada app
3. **Next.js optimiza**: Redimensionamiento y optimización automática
4. **Performance**: Lazy loading automático, priority para hero
5. **Type-safe**: Imports de imágenes validados por TypeScript
6. **Fácil mantenimiento**: Cambios en un solo lugar
7. **Flexible**: Props configurables para diferentes contextos
8. **Accesible**: Atributos de accesibilidad incluidos

## 🔄 Próximos Pasos

- [ ] Agregar más variantes del logo (horizontal, vertical)
- [ ] Incluir iconos de marca compartidos
- [ ] Agregar imágenes estáticas en `/public`
- [ ] Crear componente para favicons
- [ ] Documentar guía de uso de marca

## 🐛 Troubleshooting

### Error: "Cannot find module '@tupatrimonio/assets'"

```bash
# Desde la raíz del proyecto
npm install
```

### Los cambios no se reflejan

```bash
# Recompilar el package
cd packages/assets
npm run build
```

### TypeScript no reconoce los tipos

```bash
# Verificar que dist/ existe
ls packages/assets/dist

# Recompilar si es necesario
cd packages/assets && npm run build
```

## 📚 Referencias

- [Monorepo con npm workspaces](https://docs.npmjs.com/cli/v7/using-npm/workspaces)
- [TypeScript para packages](https://www.typescriptlang.org/docs/handbook/declaration-files/publishing.html)
- Guía de marca TuPatrimonio: Ver `docs/archived/COLOR-SYSTEM-GUIDE.md`

---

**Última actualización**: Noviembre 2024  
**Mantenedor**: Equipo TuPatrimonio

