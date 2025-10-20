# Sistema de Diseño TuPatrimonio

Este documento explica cómo usar el sistema de estilos centralizado de TuPatrimonio para mantener consistencia visual en toda la aplicación.

## Ubicación de Archivos

- **Variables CSS**: `src/app/globals.css` - Contiene todas las variables del sistema
- **Configuración Tailwind**: `tailwind.config.ts` - Mapea variables a clases de Tailwind

## Colores Base

### Colores Principales
```css
--tp-buttons: #800039          /* Color primario de botones */
--tp-buttons-hover: #a50049    /* Estado hover de botones */
--tp-background-light: #f7f7f7 /* Fondo claro principal */
--tp-background-dark: #4a4a4a  /* Fondo oscuro/contrastes */
--tp-lines: #7a7a7a            /* Líneas, bordes, texto secundario */
```

### Uso en Tailwind
```html
<!-- Botones -->
<button class="bg-tp-primary hover:bg-tp-primary-hover text-tp-white">
  Botón Principal
</button>

<!-- Fondos -->
<div class="bg-tp-bg-light">Contenido</div>
<div class="bg-tp-gradient-background">Fondo con gradiente</div>

<!-- Textos y bordes -->
<p class="text-tp-lines">Texto secundario</p>
<div class="border border-tp-lines-30">Borde sutil</div>
```

### Uso en CSS Puro
```css
.custom-button {
  background: var(--tp-buttons);
  color: var(--tp-white);
}

.custom-button:hover {
  background: var(--tp-buttons-hover);
}
```

## Variaciones de Opacidad

Las variables incluyen versiones con diferentes opacidades:

- `tp-primary-5` (5% opacidad) - Para efectos muy sutiles
- `tp-primary-10` (10% opacidad) - Fondos de hover ligeros  
- `tp-primary-20` (20% opacidad) - Estados de focus
- `tp-primary-30` (30% opacidad) - Bordes más visibles

```html
<!-- Ejemplos de uso -->
<div class="bg-tp-primary-10">Fondo sutil</div>
<div class="border border-tp-lines-30">Borde con opacidad</div>
<div class="bg-tp-white-80">Fondo semi-transparente</div>
```

## Gradientes Predefinidos

```html
<!-- Gradiente principal para botones e iconos -->
<div class="bg-tp-gradient-primary">Botón con gradiente</div>

<!-- Gradiente de fondo para páginas -->
<div class="bg-tp-gradient-background">Fondo de página</div>

<!-- Gradiente sutil para efectos -->
<div class="bg-tp-gradient-subtle">Efecto decorativo</div>
```

## Sombras

```html
<!-- Para cards normales -->
<div class="shadow-tp-md">Card estándar</div>

<!-- Para elementos elevados -->
<div class="shadow-tp-lg">Card elevado</div>

<!-- Para modales y overlays -->
<div class="shadow-tp-2xl">Modal</div>
```

## Efectos de Blur

```html
<!-- Para glass morphism -->
<div class="backdrop-blur-tp-md bg-tp-white-80">
  Elemento glass
</div>

<!-- Blur más intenso -->
<div class="backdrop-blur-tp-lg bg-tp-white-60">
  Overlay fuerte
</div>
```

## Border Radius

```html
<!-- Para inputs y elementos pequeños -->
<input class="rounded-tp-md" />

<!-- Para cards -->
<div class="rounded-tp-lg">Card</div>

<!-- Para modales y elementos grandes -->
<div class="rounded-tp-2xl">Modal</div>
```

## Estados de Feedback

### Éxito
```html
<div class="bg-tp-success-light border border-tp-success-border">
  <p class="text-tp-success">Operación exitosa</p>
</div>
```

### Error
```html
<div class="bg-tp-error-light border border-tp-error-border">
  <p class="text-tp-error">Error en la operación</p>
</div>
```

### Información
```html
<div class="bg-tp-info/10 border border-tp-info/20">
  <p class="text-tp-info">Información importante</p>
</div>
```

## Tipografía

La fuente principal es **Quicksand**, configurada en `layout.tsx`:

```html
<body class="font-quicksand">
  <!-- Todo el contenido usará Quicksand -->
</body>
```

## Escalas de Grises

```html
<!-- Textos -->
<h1 class="text-tp-gray-900">Título principal</h1>
<p class="text-tp-gray-700">Texto normal</p>
<span class="text-tp-gray-600">Texto secundario</span>

<!-- Fondos -->
<div class="bg-tp-gray-50">Fondo muy claro</div>
<div class="bg-tp-gray-100">Fondo claro</div>
<div class="bg-tp-gray-200">Fondo medio</div>
```

## Ejemplos de Componentes Completos

### Card Estándar
```html
<div class="bg-tp-white-80 backdrop-blur-tp-md rounded-tp-xl shadow-tp-md border border-tp-white-50 p-6">
  <h3 class="text-tp-gray-900 font-medium mb-2">Título del Card</h3>
  <p class="text-tp-lines text-sm">Descripción del contenido</p>
</div>
```

### Botón Principal
```html
<button class="bg-tp-primary hover:bg-tp-primary-hover text-tp-white font-medium py-3 px-6 rounded-tp-lg shadow-tp-sm transition-all duration-200">
  Acción Principal
</button>
```

### Input con Estados
```html
<input class="border border-tp-lines-30 focus:border-tp-primary focus:ring-tp-primary-20 rounded-tp-md px-4 py-2" />
```

## Cómo Agregar Nuevas Variables

1. **Agregar en globals.css**:
```css
:root {
  --tp-nueva-variable: #valor;
}
```

2. **Mapear en tailwind.config.ts**:
```typescript
colors: {
  tp: {
    'nueva-variable': 'var(--tp-nueva-variable)',
  }
}
```

3. **Usar en componentes**:
```html
<div class="bg-tp-nueva-variable">Contenido</div>
```

## Ventajas del Sistema

- **Centralizado**: Un solo lugar para cambiar colores globalmente
- **Consistente**: Mismos valores en toda la aplicación  
- **Mantenible**: Fácil de actualizar y modificar
- **Escalable**: Simple agregar nuevas variables
- **Accesible**: Colores pensados para buen contraste

## Migración de Código Existente

Si encuentras código con colores hardcodeados:

```html
<!-- ❌ Antes -->
<div class="bg-[#800039] text-white border-[#7a7a7a]">

<!-- ✅ Después -->
<div class="bg-tp-primary text-tp-white border-tp-lines">
```

Este sistema asegura que todos los estilos estén centralizados y sean fáciles de mantener.
