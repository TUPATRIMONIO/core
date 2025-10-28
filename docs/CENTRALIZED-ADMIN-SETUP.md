# Sistema de Administración Centralizado - TuPatrimonio

## Arquitectura Implementada

Se ha consolidado todo el sistema administrativo en la **App Web** (`app.tupatrimonio.app`), dejando la **App Marketing** (`tupatrimonio.app`) como aplicación puramente pública.

## 🏗️ Estructura de Apps

### App Marketing (`tupatrimonio.app`)
**Propósito**: Contenido público, landing pages, SEO

**Funcionalidades**:
- ✅ Landing pages por país
- ✅ Blog público
- ✅ Páginas de servicios (firmas, precios, contacto)
- ✅ SEO optimizado
- ❌ Sin autenticación
- ❌ Sin panel de administración

**Middleware Simplificado**:
- Redirecciones por país (geo-routing)
- Validación de países permitidos
- Sin verificación de admin

### App Web (`app.tupatrimonio.app`)
**Propósito**: Aplicación autenticada + Hub administrativo

**Funcionalidades**:
- ✅ Dashboard de usuario
- ✅ Login/Autenticación
- ✅ Panel de administración completo
- ✅ Gestión de blog
- ✅ Gestión de páginas marketing
- ✅ Gestión de usuarios/roles

**Rutas Administrativas**:
```
/login                      → Login único para todo
/dashboard                  → Dashboard principal
/dashboard/pages           → Gestión de páginas marketing
/dashboard/blog            → Gestión de blog (próximamente)
/dashboard/users           → Gestión de usuarios y roles
```

## 🔐 Sistema de Autenticación

### Login Único
**URL**: `app.tupatrimonio.app/login`

**Proceso**:
1. Usuario ingresa credenciales
2. Supabase valida autenticación
3. Sistema verifica rol con función `can_access_admin()`
4. Si es admin/editor → Acceso completo al dashboard
5. Si no es admin → Solo dashboard básico de usuario

### Roles del Sistema

**`public`** (default):
- Acceso solo al dashboard básico
- Sin permisos administrativos

**`editor`**:
- Acceso al panel de blog
- Acceso al panel de páginas
- Puede editar contenido

**`admin`**:
- Acceso completo a todas las secciones
- Puede gestionar usuarios
- Puede cambiar configuraciones

**`super_admin`**:
- Todos los permisos de admin
- Acceso a configuraciones avanzadas

## 📊 Panel de Gestión de Páginas

### Ubicación
`app.tupatrimonio.app/dashboard/pages`

### Funcionalidades

**Estados de Página**:
- 🌍 **Público**: Visible para todos, indexable SEO
- 📝 **Borrador**: Solo visible para admins, no indexable
- 🔒 **Privado**: Solo para roles específicos, no indexable

**Control SEO Independiente**:
- Toggle para habilitar/deshabilitar indexación
- Útil para páginas públicas sin SEO (términos, cookies, etc.)

**Filtros Avanzados**:
- Por estado (público/borrador/privado)
- Por país (Chile, México, Colombia, etc.)
- Por sección (home, firmas, precios, blog, etc.)
- Búsqueda por ruta o título

**Acciones Rápidas**:
- Cambiar estado con dropdown
- Toggle SEO con switch
- Editar configuración avanzada

**Estadísticas en Tiempo Real**:
- Total de páginas
- Páginas públicas vs borradores
- Páginas indexadas
- Distribución por país
- Distribución por sección

## 🛠️ Configuración Inicial

### 1. Aplicar Migraciones

Ejecuta en Supabase SQL Editor:

```sql
-- Migración 1: Tablas y funciones principales
-- Ejecutar: supabase/migrations/20251028150000_page_management_sistema.sql

-- Migración 2: Función de acceso admin
-- Ejecutar: supabase/migrations/20251028193015_funcion-para-acceso-admin.sql
```

### 2. Crear Primer Administrador

```sql
-- Ver usuarios existentes
SELECT id, email FROM auth.users;

-- Asignar rol de admin (reemplaza el user_id)
INSERT INTO marketing.user_roles (user_id, role) 
VALUES ('tu-user-id-aqui', 'admin');
```

### 3. Acceder al Sistema

1. Ve a `app.tupatrimonio.app/login`
2. Ingresa con tu email y contraseña
3. Accede al dashboard
4. Navega a `/dashboard/pages` para gestionar páginas

## 📁 Archivos Principales

### App Web (Nuevos)
```
apps/web/src/
├── lib/
│   └── page-management.ts           # Biblioteca de gestión
├── hooks/
│   └── usePageManagement.ts         # Hooks para admin
├── components/admin/
│   └── PageManagement.tsx           # Dashboard de páginas
├── app/dashboard/
│   ├── layout.tsx                   # Layout con sidebar
│   ├── page.tsx                     # Dashboard principal (actualizado)
│   ├── pages/page.tsx               # Gestión de páginas
│   └── users/page.tsx               # Gestión de usuarios
```

### App Marketing (Limpiada)
```
apps/marketing/
├── middleware.ts                    # Simplificado, sin admin
├── src/app/
│   └── (sin directorio /admin)      # Eliminado completamente
```

## 🚀 Uso del Sistema

### Para Administradores

**Gestionar Páginas**:
1. Login en `app.tupatrimonio.app`
2. Ir a "Páginas" en el sidebar
3. Filtrar por país/sección/estado
4. Cambiar estados con dropdown
5. Toggle SEO según necesites

**Lanzar Nuevo País**:
1. Filtrar páginas por país (ej: México)
2. Cambiar todas de "borrador" a "público"
3. Automáticamente aparecen en sitemap
4. SEO indexa el contenido

**Páginas en Desarrollo**:
1. Crear/editar con estado "borrador"
2. Solo admins pueden verlas
3. Cuando estén listas, cambiar a "público"

### Para Desarrolladores

**Proteger Páginas en Marketing** (opcional):
```tsx
import { PageAccessWrapper } from '@/components/PageAccessWrapper';

export default function MiPagina() {
  return (
    <PageAccessWrapper routePath="/mi-ruta">
      {/* Contenido */}
    </PageAccessWrapper>
  );
}
```

## ✅ Ventajas de la Nueva Arquitectura

### Separación Clara
- **Marketing** = Solo público y SEO
- **Web** = Autenticación + Administración

### Un Solo Login
- No más confusión entre apps
- Usa el sistema de auth que ya funciona
- Redirecciones correctas

### Código Limpio
- Sin duplicación de lógica admin
- Marketing más liviano = mejor performance
- Web centraliza toda la administración

### Mejor UX
- Dashboard unificado para admins
- Navegación clara entre secciones
- Estadísticas centralizadas

## 📝 Próximos Pasos

### Funcionalidad Actual
- ✅ Login funcional en app web
- ✅ Verificación de roles con RPC
- ✅ Dashboard de páginas completo
- ✅ Middleware actualizado en ambas apps

### Funcionalidad Pendiente (Futuro)
- ⏳ Mover admin de blog a `/dashboard/blog`
- ⏳ Crear UI de gestión de usuarios
- ⏳ Agregar analytics de uso

## 🔧 Troubleshooting

### "Error verificando permisos"
- Verifica que las migraciones estén aplicadas
- Ejecuta las funciones RPC en Supabase
- Confirma que tu usuario tiene rol asignado

### No veo opciones de admin
- Verifica tu rol en `marketing.user_roles`
- Debe ser `admin`, `super_admin` o `editor`

### Función `can_access_admin` no existe
- Aplica la migración `20251028193015_funcion-para-acceso-admin.sql`
- Ejecuta los GRANT en Supabase

---

**Sistema completamente implementado y funcional** 🚀
