# Constantes de TuPatrimonio

Este directorio contiene constantes centralizadas utilizadas en toda la aplicación de marketing.

## USERS_COUNT

Constante que almacena la cantidad de usuarios de la plataforma en diferentes formatos.

### Ubicación
`apps/marketing/src/lib/constants.ts`

### Uso

```typescript
import { USERS_COUNT } from "@/lib/constants";

// Diferentes formatos disponibles:
USERS_COUNT.raw         // 160000 (número)
USERS_COUNT.short       // "+160k"
USERS_COUNT.shortUpper  // "+160K"
USERS_COUNT.full        // "+160.000"
USERS_COUNT.text        // "más de 160.000 usuarios"
USERS_COUNT.textShort   // "+160k usuarios"
```

### Ejemplos

#### En metadatos (string templates)
```typescript
export const metadata: Metadata = {
  description: `${USERS_COUNT.textShort} confían en nosotros`
};
```

#### En JSX
```tsx
<p>Únete a {USERS_COUNT.text}</p>
```

#### En objetos de configuración
```typescript
trustBadges: [
  { icon: Users, text: USERS_COUNT.textShort }
]
```

### Componente UsersCount

También existe un componente React que facilita el uso de estas constantes:

```typescript
import { UsersCount } from "@/components/UsersCount";

// Uso básico
<UsersCount />  // Muestra "+160k usuarios"

// Con formato específico
<UsersCount format="short" />      // "+160k"
<UsersCount format="shortUpper" /> // "+160K"
<UsersCount format="full" />       // "+160.000"
<UsersCount format="text" />       // "más de 160.000 usuarios"

// Con ícono
<UsersCount showIcon />            // 👥 +160k usuarios

// Con clases personalizadas
<UsersCount className="font-bold text-lg" />
```

### Actualización

Cuando el número de usuarios crezca, **solo actualiza el valor en un lugar**:

```typescript
// apps/marketing/src/lib/constants.ts
export const USERS_COUNT = {
  raw: 200000,  // ← Actualiza aquí
  short: "+200k",
  shortUpper: "+200K",
  full: "+200.000",
  text: "más de 200.000 usuarios",
  textShort: "+200k usuarios"
} as const;
```

Todos los lugares donde se usa esta constante se actualizarán automáticamente.

### Beneficios

- ✅ Único lugar para actualizar el número
- ✅ Consistencia en todos los formatos
- ✅ Fácil de mantener y escalar
- ✅ TypeScript valida los formatos disponibles
- ✅ Reutilizable en nuevas páginas

