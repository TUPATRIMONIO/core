
# Reglas de Proyecto - Antigravity / Cursor

## Stack Tecnológico
- **Frontend**: Next.js 14+ (App Router), React, TypeScript, Tailwind CSS.
- **Backend**: Supabase (PostgreSQL, Edge Functions, Auth, Storage).
- **Monorepo**: Turborepo (apps/web, packages/*).

## Reglas Generales
- **Idioma**: Responder siempre en Español salvo que se indique lo contrario.
- **Concisión**: Ser directo y técnico. Evitar explicaciones excesivas si no se piden.
- **Paths**: Usar siempre rutas absolutas o relativas desde la raíz del workspace.

## Frontend (Next.js & React)
- Preferir **Server Components** por defecto. Usar `'use client'` solo cuando sea necesario (interacción, hooks).
- Usar **Tailwind CSS** para estilizado. Evitar CSS modules o inline styles salvo necesidad estricta.
- Componentes deben ser pequeños, reutilizables y tipados estrictamente con TypeScript.
- Manejo de datos: Usar Server Actions o Supabase Client para fetch de datos.
- Rutas: Mantener la estructura `apps/web/src/app`.

## Backend (Supabase)
- **RLS**: Siempre habilitar Row Level Security en nuevas tablas.
- **Tipos**: Generar y usar tipos de base de datos de Supabase (`Database` types).
- **Migraciones**: Todo cambio de esquema debe ir en una migración SQL en `supabase/migrations`.
- **Edge Functions**: Usar Deno para Edge Functions en `supabase/functions`.

## Código y Estilo
- **TypeScript**: No usar `any`. Definir interfaces claras (prefijar con `I` o simplemente nombre descriptivo).
- **Nombres**: camelCase para variables/funciones, PascalCase para componentes, snake_case para base de datos.
- **Error Handling**: Manejar errores explícitamente (try/catch en async, boundaries en UI).

## Comportamiento del Agente
- Al crear archivos, verificar que no existan para no duplicar lógica.
- Al modificar código, mostrar solo los cambios relevantes (diffs) o el archivo completo si es pequeño.
- Antes de ejecutar comandos destructivos, pedir confirmación explicita (aunque el entorno ya lo fuerce).
