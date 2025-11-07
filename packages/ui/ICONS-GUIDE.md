# Sistema de Íconos Minimalista - TuPatrimonio

## 🎯 Filosofía

Este sistema proporciona un enfoque consistente y minimalista para usar íconos en todo el proyecto, garantizando:
- **Consistencia visual**: Todos los íconos con el mismo estilo
- **Mantenibilidad**: Un solo lugar para cambios globales
- **Simplicidad**: Props claras y predecibles
- **Accesibilidad**: Tamaños y contrastes adecuados

---

## 📦 Componentes

### `Icon`

Ícono simple sin contenedor. Ideal para:
- Íconos inline junto a texto
- Botones con íconos
- Navegación
- Badges y chips

#### Props

| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| `icon` | `LucideIcon` | - | **Requerido**. Componente de Lucide React |
| `size` | `'xs' \| 'sm' \| 'md' \| 'lg' \| 'xl'` | `'md'` | Tamaño del ícono |
| `variant` | `'default' \| 'muted' \| 'brand' \| 'white' \| 'inherit'` | `'default'` | Color del ícono |
| `style` | `'outline' \| 'minimal'` | `'outline'` | Grosor de línea |
| `className` | `string` | `''` | Clases adicionales |

#### Tamaños

- `xs`: 12px (w-3 h-3) - Para badges pequeños
- `sm`: 16px (w-4 h-4) - Para texto inline
- `md`: 20px (w-5 h-5) - Tamaño estándar
- `lg`: 24px (w-6 h-6) - Para headers
- `xl`: 32px (w-8 h-8) - Para heros

#### Variantes de Color

- `default`: Color de texto principal (`text-foreground`)
- `muted`: Color de texto secundario (`text-muted-foreground`)
- `brand`: Color de marca (`text-[var(--tp-brand)]`)
- `white`: Blanco (`text-white`)
- `inherit`: Hereda el color del contenedor padre

#### Ejemplos

```tsx
import { Icon } from '@tupatrimonio/ui';
import { Shield, Zap, Users } from 'lucide-react';

// Ícono estándar
<Icon icon={Shield} size="md" variant="brand" />

// Ícono junto a texto
<span className="flex items-center gap-2">
  <Icon icon={Users} size="sm" variant="muted" />
  <span>500+ usuarios</span>
</span>

// Ícono ultra minimalista
<Icon icon={Zap} size="lg" variant="muted" style="minimal" />

// Ícono que hereda color
<div className="text-blue-500">
  <Icon icon={Shield} variant="inherit" />
</div>
```

---

### `IconContainer`

Ícono dentro de un contenedor con fondo y borde. Ideal para:
- Cards con íconos destacados
- Secciones de características
- Avatares de servicios
- Elementos visuales prominentes

#### Props

| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| `icon` | `LucideIcon` | - | **Requerido**. Componente de Lucide React |
| `variant` | `'brand' \| 'muted' \| 'neutral' \| 'solid-brand'` | `'brand'` | Estilo del contenedor |
| `shape` | `'circle' \| 'square' \| 'rounded'` | `'rounded'` | Forma del contenedor |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Tamaño del contenedor |
| `className` | `string` | `''` | Clases adicionales |

#### Tamaños

- `sm`: 40px (w-10 h-10) - Ícono 20px
- `md`: 48px (w-12 h-12) - Ícono 24px
- `lg`: 56px (w-14 h-14) - Ícono 28px

#### Variantes

- `brand`: Fondo claro de marca con ícono en color marca
- `solid-brand`: Fondo sólido de marca con ícono blanco
- `muted`: Fondo gris claro con ícono gris
- `neutral`: Fondo blanco con borde

#### Formas

- `rounded`: Esquinas redondeadas (rounded-xl)
- `circle`: Círculo perfecto (rounded-full)
- `square`: Sin redondeo (rounded-none)

#### Ejemplos

```tsx
import { IconContainer } from '@tupatrimonio/ui';
import { Target, Globe, Heart } from 'lucide-react';

// Contenedor estándar con color de marca
<IconContainer 
  icon={Target} 
  variant="brand" 
  shape="rounded" 
  size="lg" 
/>

// Contenedor sólido circular
<IconContainer 
  icon={Globe} 
  variant="solid-brand" 
  shape="circle" 
  size="md" 
/>

// Contenedor con estilo muted
<IconContainer 
  icon={Heart} 
  variant="muted" 
  shape="rounded" 
  size="sm" 
/>
```

---

## 🎨 Guía de Uso

### ✅ Buenas Prácticas

```tsx
// ✅ Usar componentes centralizados
<Icon icon={Shield} size="md" variant="brand" />

// ✅ Mantener consistencia en variantes dentro de una sección
<div className="flex gap-4">
  <Icon icon={Shield} size="md" variant="brand" />
  <Icon icon={Lock} size="md" variant="brand" />
  <Icon icon={Key} size="md" variant="brand" />
</div>

// ✅ Usar IconContainer para destacar íconos importantes
<Card>
  <CardHeader>
    <IconContainer icon={Target} variant="brand" size="lg" />
    <CardTitle>Nuestra Misión</CardTitle>
  </CardHeader>
</Card>
```

### ❌ Malas Prácticas

```tsx
// ❌ No usar clases directamente en Lucide
<Shield className="w-7 h-7 text-blue-500" />

// ❌ No mezclar múltiples estilos de contenedor en la misma sección
<div>
  <div className="w-12 h-12 bg-red-500">
    <Shield className="w-6 h-6" />
  </div>
  <IconContainer icon={Lock} variant="brand" />
</div>

// ❌ No usar tamaños custom
<Shield className="w-[23px] h-[23px]" />

// ❌ No aplicar strokeWidth directamente
<Shield strokeWidth={2} className="w-6 h-6" />
```

---

## 📋 Patrones Comunes

### Hero Section con Badge

```tsx
<div className="inline-flex items-center gap-2 bg-[var(--tp-brand-5)] rounded-full px-4 py-2">
  <Icon icon={Building2} size="sm" variant="brand" />
  <span className="text-sm font-medium text-[var(--tp-brand)]">
    Sobre TuPatrimonio
  </span>
</div>
```

### Card con Ícono Destacado

```tsx
<Card className="border hover:border-[var(--tp-brand)] transition-all">
  <CardHeader>
    <IconContainer 
      icon={Target} 
      variant="brand" 
      shape="rounded" 
      size="lg" 
      className="mb-4"
    />
    <CardTitle>Título de la Card</CardTitle>
  </CardHeader>
  <CardContent>
    <CardDescription>
      Descripción del contenido...
    </CardDescription>
  </CardContent>
</Card>
```

### Lista con Íconos

```tsx
<ul className="space-y-3">
  {items.map((item) => (
    <li key={item.id} className="flex items-center gap-3">
      <Icon icon={CheckCircle} size="sm" variant="brand" />
      <span>{item.text}</span>
    </li>
  ))}
</ul>
```

### Grid de Estadísticas

```tsx
<div className="grid md:grid-cols-4 gap-8">
  <div className="text-center">
    <IconContainer 
      icon={Users} 
      variant="solid-brand" 
      shape="circle" 
      size="md"
      className="mx-auto mb-4"
    />
    <div className="text-4xl font-bold mb-2">+500</div>
    <div className="text-muted-foreground">Usuarios</div>
  </div>
</div>
```

---

## 🔄 Migración desde Íconos Antiguos

### Antes (hardcoded)

```tsx
<div className="w-14 h-14 bg-[var(--tp-brand)] rounded-xl flex items-center justify-center mb-4">
  <Target className="w-7 h-7 text-white" />
</div>
```

### Después (componente)

```tsx
<IconContainer 
  icon={Target} 
  variant="solid-brand" 
  shape="rounded" 
  size="lg" 
  className="mb-4"
/>
```

### Beneficios

- **-60% código**: De 10+ clases a 4 props
- **Consistente**: Mismo estilo en toda la app
- **Mantenible**: Cambios globales desde un solo lugar
- **Type-safe**: Props con TypeScript

---

## 🎯 Recomendaciones por Contexto

| Contexto | Componente | Configuración Recomendada |
|----------|------------|---------------------------|
| Badge/Chip inline | `Icon` | `size="sm"`, `variant="brand"` |
| Botón con ícono | `Icon` | `size="sm"`, `variant="inherit"` |
| Card destacada | `IconContainer` | `size="lg"`, `variant="brand"` |
| Estadísticas | `IconContainer` | `size="md"`, `variant="solid-brand"`, `shape="circle"` |
| Lista de features | `Icon` | `size="md"`, `variant="muted"` |
| Navegación | `Icon` | `size="sm"`, `variant="muted"` |
| Hero section | `Icon` | `size="lg"`, `variant="brand"` |

---

## 🚀 Siguiente Paso

Para migrar una página existente:

1. Importar componentes:
```tsx
import { Icon, IconContainer } from '@tupatrimonio/ui';
```

2. Identificar íconos hardcodeados

3. Reemplazar con componentes apropiados

4. Verificar consistencia visual

5. Eliminar código duplicado

---

**Última actualización**: Noviembre 2024  
**Autor**: TuPatrimonio Development Team

