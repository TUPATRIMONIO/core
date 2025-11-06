# Guía de Tipografía Centralizada - TuPatrimonio

## 📍 Ubicación del Sistema

Todo el sistema de tipografía está centralizado en: **`packages/ui/globals.css`**

## 🎨 Sistema de Variables CSS

### Font Families (Fuentes por Nivel)

Cada nivel de heading puede tener su propia fuente:

```css
--font-h1: var(--font-outfit)    /* Outfit */
--font-h2: var(--font-nunito)    /* Nunito Thin (200) */
--font-h3: var(--font-outfit)    /* Outfit */
--font-h4: var(--font-outfit)    /* Outfit */
--font-h5: var(--font-outfit)    /* Outfit */
--font-h6: var(--font-outfit)    /* Outfit */
--font-body: var(--font-outfit)  /* Outfit */
```

**💡 Nota:** H2 usa Nunito con peso Thin (200) para un estilo elegante y ligero en los subtítulos.

### Font Weights (Pesos)
```css
--font-weight-light: 300
--font-weight-normal: 400
--font-weight-medium: 500
--font-weight-semibold: 600
--font-weight-bold: 700
--font-weight-extrabold: 800
```

### Tamaños Responsive

#### Mobile (Base)
- H1: 36px (2.25rem)
- H2: 30px (1.875rem)
- H3: 24px (1.5rem)
- H4: 20px (1.25rem)
- H5: 18px (1.125rem)
- H6: 16px (1rem)

#### Tablet (768px+)
- H1: 48px (3rem)
- H2: 40px (2.5rem)
- H3: 32px (2rem)
- H4: 24px (1.5rem)
- H5: 20px (1.25rem)
- H6: 18px (1.125rem)

#### Desktop (1024px+)
- H1: 60px (3.75rem)
- H2: 48px (3rem)
- H3: 40px (2.5rem)
- H4: 30px (1.875rem)
- H5: 24px (1.5rem)
- H6: 20px (1.25rem)

## 📝 Cómo Usar

### Uso Básico (Sin clases adicionales)

Simplemente usa las etiquetas HTML normales y automáticamente tendrán los estilos aplicados:

```tsx
export function MiComponente() {
  return (
    <div>
      <h1>Título Principal</h1>
      <h2>Subtítulo Importante</h2>
      <h3>Sección</h3>
      <p>Este es un párrafo normal con espaciado consistente.</p>
    </div>
  );
}
```

### Con Sobrescrituras de Color

Puedes agregar clases Tailwind para personalizar colores u otros estilos:

```tsx
<h1 className="text-[var(--tp-brand)]">
  Título en Color de Marca
</h1>

<h2 className="text-[var(--tp-brand)] mb-6">
  Subtítulo con margen inferior
</h2>
```

### Usando Variables Directamente

Si necesitas usar los valores en componentes personalizados:

```tsx
<div style={{ fontSize: 'var(--text-h3)' }}>
  Texto con tamaño H3
</div>

<span style={{ fontWeight: 'var(--font-weight-semibold)' }}>
  Texto semi-bold
</span>
```

## ✅ Ventajas de Este Sistema

1. **Consistencia Total**: Todos los H1 se ven igual en toda la aplicación
2. **Responsive Automático**: Cambia de tamaño según el dispositivo
3. **Mobile-First**: Diseñado pensando primero en móviles
4. **Fácil Mantenimiento**: Cambias un valor y actualiza todo
5. **Performance**: CSS nativo, sin JS adicional

## 🔧 Cómo Modificar

### Cambiar Tamaños

Edita `packages/ui/globals.css` en la sección `:root`:

```css
:root {
  /* Cambia estos valores */
  --text-h1: 2.25rem;      /* Mobile */
  --text-h1-md: 3rem;      /* Tablet */
  --text-h1-lg: 3.75rem;   /* Desktop */
}
```

### Cambiar Fuente de un Heading

Edita las variables en `:root`:

```css
:root {
  /* Ejemplo: Cambiar H3 a usar otra fuente */
  --font-h3: "Times New Roman", serif;
  
  /* O usar otra fuente de Google Fonts */
  --font-h3: var(--font-otra-fuente);
}
```

### Cambiar Pesos de Fuente

```css
h1 {
  font-weight: var(--font-weight-bold);  /* Cambia aquí */
}
```

### Cambiar Line Heights

```css
h1 {
  line-height: var(--leading-tight);  /* Cambia aquí */
}
```

## 🎯 Ejemplo Completo

```tsx
export function LandingHero() {
  return (
    <section className="py-20">
      {/* H1 con estilos automáticos + color personalizado */}
      <h1 className="text-[var(--tp-brand)] mb-4">
        Transforma Tu Negocio
      </h1>
      
      {/* H2 con estilos automáticos */}
      <h2 className="text-gray-600 mb-8">
        Soluciones legales digitales para empresas modernas
      </h2>
      
      {/* Párrafo con estilos automáticos */}
      <p>
        Digitaliza tus procesos legales con firmas electrónicas válidas,
        verificación de identidad biométrica y servicios notariales.
      </p>
    </section>
  );
}
```

## 🚀 Despliegue

Después de modificar `globals.css`:

```bash
# Reconstruir packages
npm run build:packages

# Probar en desarrollo
npm run dev
```

## 📚 Referencias

- Variables CSS: `packages/ui/globals.css` (líneas 80-120)
- Estilos Base: `packages/ui/globals.css` (líneas 415-485)
- Configuración Tailwind: `apps/marketing/tailwind.config.ts`

