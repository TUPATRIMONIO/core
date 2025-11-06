# Sistema de Tipografía Centralizado - TuPatrimonio

## 🎯 Filosofía del Sistema

**Enfoque Híbrido CSS + Tailwind:**
- **CSS Base (`globals.css`)**: Maneja toda la tipografía (fuentes, tamaños, pesos, colores)
- **Tailwind**: Solo para layout y espaciado (márgenes, padding, ancho, alineación)

## 📍 Ubicación de Configuración

**Archivo principal**: `packages/ui/globals.css`

### Variables de Fuentes (líneas 80-89)
```css
--font-h1: var(--font-outfit);      /* H1 → Outfit */
--font-h2: var(--font-nunito);      /* H2 → Nunito Thin (200) */
--font-h3: var(--font-nunito);      /* H3 → Nunito */
--font-h4: var(--font-nunito);      /* H4 → Nunito */
--font-h5: var(--font-outfit);      /* H5 → Outfit */
--font-h6: var(--font-outfit);      /* H6 → Outfit */
--font-body: var(--font-outfit);    /* P → Outfit */
```

### Estilos Base (líneas 415-504)
```css
@layer base {
  h1 {
    font-family: var(--font-h1);
    font-size: var(--text-h1);
    font-weight: var(--font-weight-bold);
    /* ... */
  }
  /* ... H2-H6, p */
}
```

## 🎨 Configuración Actual de Fuentes

| Elemento | Fuente | Peso | Mobile | Tablet | Desktop |
|----------|--------|------|--------|--------|---------|
| **H1** | Outfit | 700 (Bold) | 36px | 48px | 60px |
| **H2** | Nunito | 200 (Thin) | 30px | 40px | 48px |
| **H3** | Nunito | 600 (Semibold) | 24px | 32px | 40px |
| **H4** | Nunito | 600 (Semibold) | 20px | 24px | 30px |
| **H5** | Outfit | 500 (Medium) | 18px | 20px | 24px |
| **H6** | Outfit | 500 (Medium) | 16px | 18px | 20px |
| **P** | Outfit | 400 (Normal) | 16px | - | - |

## 📝 Cómo Usar

### ✅ Uso Correcto (Enfoque Híbrido)

```tsx
// Headings: Solo layout con Tailwind
<h1 className="mb-6 max-w-5xl mx-auto">
  Mi Título Principal
</h1>

<h2 className="mb-4">
  Subtítulo de Sección
</h2>

<h3 className="mb-3 text-center">
  Título Centrado
</h3>

// Párrafos: Solo layout
<p className="mb-8 max-w-4xl mx-auto">
  Texto descriptivo normal
</p>
```

### ⚠️ Excepciones: Fondos Oscuros

Cuando un heading está sobre fondo oscuro, mantén la clase de color:

```tsx
<div className="bg-[var(--tp-brand)]">
  <h2 className="text-white mb-6">
    Título Sobre Fondo Oscuro
  </h2>
</div>
```

### ❌ Evitar (No Usar Tailwind para Tipografía)

```tsx
// ❌ MAL - Tipografía con Tailwind
<h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
  Título
</h2>

// ❌ MAL - Sobrescribiendo estilos base
<p className="text-xl font-medium">
  Párrafo
</p>
```

## 🔧 Cómo Modificar el Sistema

### Cambiar Tamaño de un Heading

Edita `packages/ui/globals.css`:

```css
:root {
  /* Cambiar tamaño de TODOS los H2 */
  --text-h2: 2rem;        /* Mobile: 32px */
  --text-h2-md: 2.5rem;   /* Tablet: 40px */
  --text-h2-lg: 3.5rem;   /* Desktop: 56px */
}
```

### Cambiar Fuente de un Nivel

```css
:root {
  /* Cambiar H3 a usar otra fuente */
  --font-h3: var(--font-otra-fuente);
}
```

### Cambiar Peso de un Heading

```css
@layer base {
  h2 {
    font-weight: 300;  /* Cambiar a Light */
  }
}
```

### Agregar Nueva Fuente de Google Fonts

1. **Importar en `layout.tsx`:**
```tsx
import { NombreFuente } from 'next/font/google';

const nombreFuente = NombreFuente({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-nombre",
  display: "swap",
});
```

2. **Agregar al HTML:**
```tsx
<html className={`${outfit.variable} ${nunito.variable} ${nombreFuente.variable}`}>
```

3. **Usar en `globals.css`:**
```css
--font-h3: var(--font-nombre);
```

## 📚 Variables CSS Disponibles

### Font Families
```css
var(--font-outfit)    /* Outfit (H1, H5, H6, P) */
var(--font-nunito)    /* Nunito (H2, H3, H4) */
```

### Font Weights
```css
var(--font-weight-light): 200
var(--font-weight-normal): 400
var(--font-weight-medium): 500
var(--font-weight-semibold): 600
var(--font-weight-bold): 700
var(--font-weight-extrabold): 800
```

### Tamaños (Mobile)
```css
var(--text-h1): 2.25rem   /* 36px */
var(--text-h2): 1.875rem  /* 30px */
var(--text-h3): 1.5rem    /* 24px */
var(--text-h4): 1.25rem   /* 20px */
var(--text-h5): 1.125rem  /* 18px */
var(--text-h6): 1rem      /* 16px */
var(--text-base): 1rem    /* 16px */
```

### Line Heights
```css
var(--leading-tight): 1.1
var(--leading-snug): 1.2
var(--leading-normal): 1.5
var(--leading-relaxed): 1.625
var(--leading-loose): 1.75
```

## ✅ Beneficios del Sistema

1. **Mantenimiento Centralizado**: Un cambio en `globals.css` afecta toda la app
2. **Código 75% Más Corto**: `className="mb-6"` vs `className="text-4xl md:text-5xl font-bold text-foreground mb-6"`
3. **Consistencia Automática**: Todos los H2 se ven igual
4. **Responsive Automático**: Sin escribir `text-xl md:text-2xl lg:text-3xl`
5. **Mejor SEO**: Estructura semántica HTML correcta

## 🎓 Guía Rápida para Desarrolladores

### Al Crear un Nuevo Componente

```tsx
export function MiComponente() {
  return (
    <section className="py-20">
      {/* ✅ Solo layout en className */}
      <h2 className="mb-6 text-center">
        Mi Título de Sección
      </h2>
      
      <p className="mb-4 max-w-3xl mx-auto">
        Mi descripción explicativa
      </p>
      
      <h3 className="mb-3">
        Subsección
      </h3>
    </section>
  );
}
```

### Casos Especiales

#### Heading con Color Diferente
```tsx
<h2 className="text-[var(--tp-brand)] mb-6">
  Título en Color de Marca
</h2>
```

#### Heading Sobre Fondo Oscuro
```tsx
<div className="bg-[var(--tp-brand)]">
  <h2 className="text-white mb-6">
    Título Blanco
  </h2>
</div>
```

## 🚀 Después de Modificar globals.css

```bash
# 1. Reconstruir packages
npm run build:packages

# 2. Probar en desarrollo
npm run dev

# 3. Compilar para producción
npm run build:marketing
```

## 📖 Referencias

- **Guía de Tipografía**: `packages/ui/TYPOGRAPHY-GUIDE.md`
- **Configuración CSS**: `packages/ui/globals.css` (líneas 80-504)
- **Layout Principal**: `apps/marketing/src/app/layout.tsx`
- **Tailwind Config**: `apps/marketing/tailwind.config.ts`

## ⚡ Resumen de Cambios Aplicados

- ✅ **13 archivos** actualizados
- ✅ **100+ headings** limpiados
- ✅ **Código 75% más corto** en clases
- ✅ **Build exitoso** sin errores
- ✅ **Documentación completa** creada

