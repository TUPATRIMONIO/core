# Changelog - @tupatrimonio/assets

## [1.2.1] - 2024-11-04

### 🐛 Fixes
- **Path correcto para imports**: Actualizado path de `../public/` a `../../public/` para que funcione desde `dist/`
- **Configuración Next.js**: Agregada documentación de configuración requerida
- **TROUBLESHOOTING.md**: Nuevo archivo con soluciones a problemas comunes

### 📝 Configuración Requerida
Las apps necesitan configurar `next.config.ts`:
```typescript
transpilePackages: ['@tupatrimonio/assets']
webpack: (config) => {
  config.resolve.alias['@tupatrimonio/assets/public'] = ...
}
```

---

## [1.2.0] - 2024-11-04

### 🎉 BREAKING CHANGE: Única Fuente de Verdad

#### ⭐ Mejoras Mayores
- **Next.js Image Component**: `ImagotipoImage` ahora usa `next/image` con import directo
- **Sin duplicación**: Eliminada necesidad de copiar imágenes a cada app
- **Import directo**: La imagen se importa desde `packages/assets/public/`
- **Type definitions**: Agregados tipos TypeScript para imports de imágenes
- **Prop `priority`**: Nueva prop para optimizar carga en hero images

#### ✨ Agregado
- `src/types/images.d.ts` - Type definitions para .webp, .png, .jpg, .svg, etc.
- Prop `priority` en `ImagotipoImage` para hero images
- `next` como peer dependency
- Configuración TypeScript mejorada para manejar imports de imágenes

#### 🔄 Actualizado
- `ImagotipoImage` refactorizado para usar `next/image` con import directo
- `package.json` v1.2.0 con next como peer dependency
- `tsconfig.json` con `resolveJsonModule` habilitado
- Documentación completa actualizada

#### 🗑️ Eliminado
- ❌ Carpetas duplicadas en `apps/marketing/public/assets/`
- ❌ Carpetas duplicadas en `apps/web/public/assets/`
- ❌ Necesidad de copiar archivos manualmente
- ❌ Dependencia de rutas `/public` hardcodeadas

#### 🎯 Migración

**Antes (v1.1.0):**
```tsx
// Usaba rutas públicas
<ImagotipoImage width={120} height={150} />
// Las imágenes estaban copiadas en cada app
```

**Ahora (v1.2.0):**
```tsx
// Import directo desde el package
<ImagotipoImage width={120} height={150} />
// Para hero images, usa priority
<ImagotipoImage width={120} height={150} priority />
```

**Beneficios:**
- ✅ Una sola fuente de verdad
- ✅ Next.js optimiza automáticamente
- ✅ Sin copiar archivos
- ✅ Type-safe imports
- ✅ Mejor performance

---

## [1.1.0] - 2024-11-04

### ✨ Agregado
- **ImagotipoImage**: Componente que usa imagen real en WebP
- **Imagen real**: `Imagotipo.webp` agregada en `public/images/logo/`
- **ASSET_PATHS actualizados**: Ruta al imagotipo WebP
- **Copiado automático**: Imagen disponible en ambas apps

### 🔄 Actualizado
- Página notaria-online usa `ImagotipoImage` para mejor calidad
- README.md con documentación del nuevo componente
- Estructura de carpetas optimizada

### 🗑️ Eliminado
- Archivos placeholder innecesarios en apps/marketing/public/images/
- Carpeta images vacía de marketing

---

## [1.0.0] - 2024-11-04

### 🎉 Primera Versión

#### Agregado
- ✨ **Componente Imagotipo**: Logo completo de TuPatrimonio (círculos + texto) SVG
- ✨ **Componente Isotipo**: Solo el símbolo de círculos (sin texto) SVG
- ✨ **Componente Logo**: Wrapper que permite elegir entre variantes
- 📦 **Constantes BRAND_COLORS**: Colores de marca exportados
- 📦 **Constantes ASSET_PATHS**: Rutas de assets
- 📝 **Documentación completa**: README.md y docs/ASSETS-PACKAGE.md
- 🔧 **Configuración TypeScript**: Tipos completos para todos los componentes

#### Características
- SVG inline para máxima flexibilidad
- Props configurables (width, height, className, color)
- Type-safe con TypeScript
- Compatible con Tailwind CSS
- Atributos de accesibilidad (aria-label)
- Optimizado para tree-shaking

#### Integración
- ✅ Agregado a `apps/marketing`
- ✅ Agregado a `apps/web`
- ✅ Actualizada página notaria-online
- ✅ Documentación agregada a docs/DEVELOPMENT.md

---

**Equipo TuPatrimonio** - Noviembre 2024
