# Landing Sections - Componentes Reutilizables

## 📋 Resumen

Esta carpeta contiene componentes modulares reutilizables para crear landing pages de servicios notariales y legales. Cada componente ha sido extraído de la página de Notaría Online y refactorizado para aceptar props configurables.

## 🎯 Objetivo

Facilitar la creación de múltiples landing pages (contrato de arriendo, promesa de compraventa, poder notarial, etc.) manteniendo un diseño consistente pero con contenido personalizable.

## 📦 Componentes Disponibles

### 1. HeroSection

Sección principal de la landing page con imagotipo, título, subtítulo, badges de confianza y CTAs.

**Props principales:**
- `title`: React.ReactNode (puede incluir HTML/JSX para estilos)
- `subtitle`: string
- `trustBadges`: Array de badges superiores (puede ser iconos o componentes React)
- `valueBullets`: Array de 3 puntos de valor con iconos
- `ctaButtons`: Array de botones CTA
- `bottomBadges`: Array de badges inferiores
- `showImageotype`: boolean

**Ejemplo de uso:**
```tsx
<HeroSection
  title={<>Notaría Online:<br /><span className="text-[var(--tp-brand)]">Tu Título</span></>}
  subtitle="Descripción del servicio..."
  trustBadges={[
    { icon: BadgeCheck, text: "Ley 19.799" },
    { component: <GoogleStatsBadge /> }
  ]}
  valueBullets={[...]}
  ctaButtons={[...]}
  bottomBadges={[...]}
/>
```

---

### 2. TestimonialsSection

Sección de testimonios con integración de Google Reviews y métricas destacadas.

**Props principales:**
- `title`: string
- `description`: string
- `showGoogleReviews`: boolean
- `metrics`: Array de métricas (valor, label, descripción)

**Nota:** El segundo elemento del array `metrics` se reemplaza automáticamente por el componente `GoogleStatsMetrics`.

---

### 3. ComparisonTableSection

Tabla comparativa entre servicio online y físico.

**Props principales:**
- `title`: string
- `description`: string
- `rows`: Array de filas de comparación (aspecto, emoji, online, physical)
- `ctaText`: string
- `ctaDescription`: string
- `ctaHref`: string

**Ejemplo de fila:**
```tsx
{
  aspect: "Tiempo de gestión",
  emoji: "⏱️",
  online: { value: "< 24 hrs", description: "...", highlight: true },
  physical: { value: "3-7 días", description: "..." }
}
```

---

### 4. ProcessStepsSection

Sección de proceso paso a paso (típicamente 4 pasos).

**Props principales:**
- `title`: string
- `description`: string
- `totalTime`: string (ej: "5 minutos a 24 horas")
- `steps`: Array de pasos con icono, título, descripción, color
- `ctaText`: string
- `ctaHref`: string

---

### 5. CompetitorComparisonSection

Comparativa con competidores + USPs (Unique Selling Points).

**Props principales:**
- `title`: string
- `description`: string
- `highlightedColumn`: string (nombre de la empresa destacada)
- `features`: Array de características comparadas
- `usps`: Array de 3 USPs con iconos, títulos, descripciones

---

### 6. LegalValiditySection

Sección de validez legal con FAQs principales.

**Props principales:**
- `title`: string
- `description`: string
- `icon`: LucideIcon
- `faqs`: Array de preguntas/respuestas con soporte para JSX

**Nota:** Las respuestas (`answer`) pueden incluir JSX para listas, divs con estilos, etc.

---

### 7. FAQSection

Sección de preguntas frecuentes organizadas por categorías.

**Props principales:**
- `title`: string
- `description`: string
- `categories`: Array de categorías con nombre, icono, color, preguntas
- `contactCta`: Objeto con texto y href del CTA de contacto

**Ejemplo de categoría:**
```tsx
{
  name: "Preguntas sobre el Proceso",
  icon: Clock,
  color: "blue",
  questions: [
    { question: "...", answer: "..." }
  ]
}
```

---

### 8. FinalCTASection

Sección final de call-to-action con tarjetas para personas y empresas.

**Props principales:**
- `title`: string
- `description`: string
- `cards`: Array de tarjetas (type, icon, title, description, benefits, cta)
- `trustBar`: Array de elementos de confianza final

---

## 🎨 Diseño y Estilos

Todos los componentes:
- Usan variables CSS de TuPatrimonio (`--tp-brand`, `--tp-background-light`, etc.)
- Son responsive (mobile-first)
- Utilizan Tailwind CSS
- Mantienen consistencia visual con el design system

## 📁 Estructura de Archivos

```
landing-sections/
├── HeroSection.tsx
├── TestimonialsSection.tsx
├── ComparisonTableSection.tsx
├── ProcessStepsSection.tsx
├── CompetitorComparisonSection.tsx
├── LegalValiditySection.tsx
├── FAQSection.tsx
├── FinalCTASection.tsx
├── index.ts (exports centralizados)
└── README.md (este archivo)
```

## 🔄 Cómo Crear una Nueva Landing Page

1. Importa los componentes necesarios:
```tsx
import {
  HeroSection,
  TestimonialsSection,
  ProcessStepsSection,
  // ... otros
} from "@/components/landing-sections";
```

2. Define tus datos específicos (títulos, descripciones, etc.)

3. Renderiza los componentes con tus props:
```tsx
<HeroSection
  title="Tu título personalizado"
  subtitle="Tu subtítulo"
  // ... otras props
/>
```

## ✅ Ventajas de esta Arquitectura

- **Reutilización:** Usa los mismos componentes en múltiples landing pages
- **Consistencia:** Diseño uniforme en todas las páginas
- **Mantenibilidad:** Cambios en un componente se reflejan en todas las páginas
- **Flexibilidad:** Props configurables permiten personalización total
- **Type-Safety:** TypeScript garantiza uso correcto de props
- **Escalabilidad:** Fácil agregar nuevas landing pages

## 🚀 Próximos Pasos

Usar estos componentes para crear landing pages de:
- Contrato de arriendo online
- Promesa de compraventa online
- Poder notarial online
- Otros servicios legales

## 📝 Notas Importantes

- Los títulos NO están hardcodeados en los componentes
- Cada prop puede incluir HTML/JSX cuando sea necesario
- Los componentes mantienen toda la funcionalidad original
- Compatible con SEO (schemas JSON-LD se mantienen en la página principal)
- Los componentes son client-side por defecto, pero pueden optimizarse para SSR si es necesario

## 🤝 Contribuir

Al modificar o crear nuevos componentes:
1. Mantén la estructura de props similar
2. Usa TypeScript para todas las interfaces
3. Respeta las variables CSS de TuPatrimonio
4. Asegura responsive design
5. Documenta nuevos componentes en este README

