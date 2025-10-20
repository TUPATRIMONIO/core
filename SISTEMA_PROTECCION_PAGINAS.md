# 🛡️ Sistema de Protección de Páginas y Roles - Plan de Implementación

## 📋 Resumen del Sistema

Este plan detalla la implementación de un **sistema centralizado de protección de páginas** basado en roles y permisos para TuPatrimonio. El sistema permite:

- ✅ Proteger páginas según roles específicos
- ✅ Verificar permisos granulares 
- ✅ Manejo centralizado y fácil mantención
- ✅ Protección tanto en cliente como servidor
- ✅ Sistema flexible de roles múltiples por usuario

---

## 🗄️ 1. Base de Datos - Tablas Necesarias

### Ejecutar en Supabase SQL Editor:

```sql
-- 1. Tabla de roles disponibles
CREATE TABLE user_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL, -- 'admin', 'user', 'premium', etc.
  description TEXT,
  permissions JSONB DEFAULT '[]', -- Array de permisos específicos
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Relación usuario-rol (un usuario puede tener múltiples roles)
CREATE TABLE user_role_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role_id UUID REFERENCES user_roles(id) ON DELETE CASCADE,
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE, -- Para roles temporales
  UNIQUE(user_id, role_id)
);

-- 3. Insertar roles básicos
INSERT INTO user_roles (name, description, permissions) VALUES
  ('admin', 'Administrador del Sistema', '["manage_users", "manage_system", "view_all", "delete_all"]'),
  ('premium', 'Usuario Premium', '["advanced_features", "priority_support", "export_data"]'),
  ('user', 'Usuario Básico', '["basic_features", "view_own_data"]');

-- 4. Índices para mejorar performance
CREATE INDEX idx_user_role_assignments_user_id ON user_role_assignments(user_id);
CREATE INDEX idx_user_role_assignments_expires ON user_role_assignments(expires_at);
```

---

## 🔧 2. Hook de Autenticación - `src/hooks/useAuth.ts`

```typescript
'use client'

import { createClient } from '@/lib/supabase/client'
import { User } from '@supabase/supabase-js'
import { useEffect, useState } from 'react'

interface UserRole {
  id: string
  name: string
  permissions: string[]
}

interface AuthUser {
  user: User | null
  roles: UserRole[]
  permissions: string[]
  isLoading: boolean
  hasRole: (roleName: string) => boolean
  hasPermission: (permission: string) => boolean
  isAdmin: boolean
}

export function useAuth(): AuthUser {
  const [user, setUser] = useState<User | null>(null)
  const [roles, setRoles] = useState<UserRole[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    // Obtener usuario y sus roles
    const getUserAndRoles = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        setUser(user)

        if (user) {
          // Obtener roles del usuario
          const { data: userRoles, error } = await supabase
            .from('user_role_assignments')
            .select(`
              user_roles (
                id,
                name,
                permissions
              )
            `)
            .eq('user_id', user.id)
            .is('expires_at', null) // Solo roles activos

          if (error) {
            console.error('Error fetching user roles:', error)
            setRoles([])
          } else {
            const formattedRoles = userRoles?.map(assignment => ({
              id: assignment.user_roles.id,
              name: assignment.user_roles.name,
              permissions: assignment.user_roles.permissions
            })) || []
            setRoles(formattedRoles)
          }
        } else {
          setRoles([])
        }
      } catch (error) {
        console.error('Error in getUserAndRoles:', error)
        setUser(null)
        setRoles([])
      } finally {
        setIsLoading(false)
      }
    }

    getUserAndRoles()

    // Escuchar cambios de autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED') {
          await getUserAndRoles()
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  // Funciones de utilidad
  const hasRole = (roleName: string): boolean => {
    return roles.some(role => role.name === roleName)
  }

  const hasPermission = (permission: string): boolean => {
    return roles.some(role => role.permissions.includes(permission))
  }

  const isAdmin = hasRole('admin')

  // Combinar todos los permisos de todos los roles
  const allPermissions = roles.reduce<string[]>((acc, role) => {
    return [...acc, ...role.permissions]
  }, [])

  return {
    user,
    roles,
    permissions: allPermissions,
    isLoading,
    hasRole,
    hasPermission,
    isAdmin
  }
}
```

---

## 🛡️ 3. Componente de Protección - `src/components/auth/PageGuard.tsx`

```typescript
'use client'

import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { useEffect, ReactNode } from 'react'

interface PageGuardProps {
  children: ReactNode
  requiredRoles?: string[]
  requiredPermissions?: string[]
  requireAuth?: boolean
  fallbackPath?: string
  loadingComponent?: ReactNode
  unauthorizedComponent?: ReactNode
}

export default function PageGuard({
  children,
  requiredRoles = [],
  requiredPermissions = [],
  requireAuth = true,
  fallbackPath = '/login',
  loadingComponent,
  unauthorizedComponent
}: PageGuardProps) {
  const { user, isLoading, hasRole, hasPermission } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading) {
      // Si requiere autenticación y no hay usuario
      if (requireAuth && !user) {
        router.push(fallbackPath)
        return
      }

      // Si hay roles requeridos y el usuario no los tiene
      if (requiredRoles.length > 0 && !requiredRoles.some(role => hasRole(role))) {
        router.push('/unauthorized')
        return
      }

      // Si hay permisos requeridos y el usuario no los tiene
      if (requiredPermissions.length > 0 && !requiredPermissions.some(permission => hasPermission(permission))) {
        router.push('/unauthorized')
        return
      }
    }
  }, [isLoading, user, requiredRoles, requiredPermissions, hasRole, hasPermission, router, requireAuth, fallbackPath])

  // Mostrar loading mientras verifica
  if (isLoading) {
    return loadingComponent || (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#800039]"></div>
      </div>
    )
  }

  // Si no cumple los requisitos
  if (requireAuth && !user) {
    return null // Se redirigirá
  }

  if (requiredRoles.length > 0 && !requiredRoles.some(role => hasRole(role))) {
    return unauthorizedComponent || (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Acceso Denegado</h1>
          <p className="text-gray-600">No tienes permisos para ver esta página.</p>
        </div>
      </div>
    )
  }

  if (requiredPermissions.length > 0 && !requiredPermissions.some(permission => hasPermission(permission))) {
    return unauthorizedComponent || (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Permisos Insuficientes</h1>
          <p className="text-gray-600">No tienes los permisos necesarios para esta acción.</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
```

---

## ⚙️ 4. Utilidades del Servidor - `src/lib/auth/permissions.ts`

```typescript
import { createClient } from '@/lib/supabase/server'
import { User } from '@supabase/supabase-js'

interface UserWithRoles {
  user: User | null
  roles: string[]
  permissions: string[]
  hasRole: (roleName: string) => boolean
  hasPermission: (permission: string) => boolean
  isAdmin: boolean
}

export async function getUserWithRoles(): Promise<UserWithRoles> {
  const supabase = await createClient()
  
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user) {
    return {
      user: null,
      roles: [],
      permissions: [],
      hasRole: () => false,
      hasPermission: () => false,
      isAdmin: false
    }
  }

  // Obtener roles del usuario
  const { data: userRoles } = await supabase
    .from('user_role_assignments')
    .select(`
      user_roles (
        name,
        permissions
      )
    `)
    .eq('user_id', user.id)
    .is('expires_at', null)

  const roles = userRoles?.map(assignment => assignment.user_roles.name) || []
  const allPermissions = userRoles?.reduce<string[]>((acc, assignment) => {
    return [...acc, ...assignment.user_roles.permissions]
  }, []) || []

  return {
    user,
    roles,
    permissions: allPermissions,
    hasRole: (roleName: string) => roles.includes(roleName),
    hasPermission: (permission: string) => allPermissions.includes(permission),
    isAdmin: roles.includes('admin')
  }
}

// Función para verificar acceso rápidamente
export async function requireRole(roleName: string): Promise<boolean> {
  const { hasRole } = await getUserWithRoles()
  return hasRole(roleName)
}

export async function requirePermission(permission: string): Promise<boolean> {
  const { hasPermission } = await getUserWithRoles()
  return hasPermission(permission)
}
```

---

## 📄 5. Página de Acceso No Autorizado - `src/app/unauthorized/page.tsx`

```typescript
import { Button } from '@/components/ui/button'
import { ShieldX, ArrowLeft, Home } from 'lucide-react'
import Link from 'next/link'

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200 flex items-center justify-center">
      <div className="max-w-md w-full mx-4">
        <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-lg border border-white/60 p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <ShieldX className="w-8 h-8 text-red-600" />
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Acceso Denegado
          </h1>
          
          <p className="text-gray-600 mb-6">
            No tienes los permisos necesarios para acceder a esta página.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild variant="outline">
              <Link href="/" className="flex items-center">
                <Home className="w-4 h-4 mr-2" />
                Ir al Inicio
              </Link>
            </Button>
            
            <Button 
              onClick={() => window.history.back()} 
              variant="default"
              className="bg-[#800039] hover:bg-[#a50049]"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Regresar
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
```

---

## 🎯 6. Ejemplos de Uso

### 6.1. Página con Protección de Cliente

```typescript
// src/app/admin/page.tsx
import PageGuard from '@/components/auth/PageGuard'

export default function AdminPage() {
  return (
    <PageGuard requiredRoles={['admin']}>
      <div className="p-8">
        <h1 className="text-3xl font-bold mb-4">Panel de Administración</h1>
        <p>Solo los administradores pueden ver esto</p>
      </div>
    </PageGuard>
  )
}
```

### 6.2. Página con Protección de Servidor

```typescript
// src/app/premium/page.tsx
import { getUserWithRoles } from '@/lib/auth/permissions'
import { redirect } from 'next/navigation'

export default async function PremiumPage() {
  const { hasRole, user } = await getUserWithRoles()
  
  if (!user) {
    redirect('/login')
  }
  
  if (!hasRole('premium') && !hasRole('admin')) {
    redirect('/unauthorized')
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-4">Área Premium</h1>
      <p>Contenido exclusivo para usuarios premium</p>
    </div>
  )
}
```

### 6.3. Protección por Permisos Específicos

```typescript
// src/app/reports/page.tsx
import PageGuard from '@/components/auth/PageGuard'

export default function ReportsPage() {
  return (
    <PageGuard requiredPermissions={['view_all', 'export_data']}>
      <div className="p-8">
        <h1 className="text-3xl font-bold mb-4">Reportes Avanzados</h1>
        <p>Solo usuarios con permisos específicos pueden ver esto</p>
      </div>
    </PageGuard>
  )
}
```

### 6.4. Protección Condicional en Componentes

```typescript
// Dentro de cualquier componente
import { useAuth } from '@/hooks/useAuth'

function SomeComponent() {
  const { hasRole, hasPermission, isAdmin } = useAuth()

  return (
    <div>
      {hasRole('admin') && (
        <Button>Solo Admins</Button>
      )}
      
      {hasPermission('delete_all') && (
        <Button variant="destructive">Eliminar Todo</Button>
      )}
      
      {isAdmin ? (
        <AdminPanel />
      ) : (
        <UserPanel />
      )}
    </div>
  )
}
```

---

## 🔧 7. Sistema de Asignación de Roles

### 7.1. Función para Asignar Roles

```typescript
// src/lib/auth/role-management.ts
import { createClient } from '@/lib/supabase/server'

export async function assignRoleToUser(
  userId: string, 
  roleName: string, 
  expiresAt?: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  
  try {
    // Obtener el ID del rol
    const { data: role, error: roleError } = await supabase
      .from('user_roles')
      .select('id')
      .eq('name', roleName)
      .single()

    if (roleError || !role) {
      return { success: false, error: 'Rol no encontrado' }
    }

    // Asignar rol al usuario
    const { error: assignError } = await supabase
      .from('user_role_assignments')
      .insert({
        user_id: userId,
        role_id: role.id,
        expires_at: expiresAt || null
      })

    if (assignError) {
      return { success: false, error: assignError.message }
    }

    return { success: true }
  } catch (error) {
    return { success: false, error: 'Error interno' }
  }
}

export async function removeRoleFromUser(
  userId: string, 
  roleName: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  
  try {
    // Obtener el ID del rol
    const { data: role, error: roleError } = await supabase
      .from('user_roles')
      .select('id')
      .eq('name', roleName)
      .single()

    if (roleError || !role) {
      return { success: false, error: 'Rol no encontrado' }
    }

    // Remover rol del usuario
    const { error: removeError } = await supabase
      .from('user_role_assignments')
      .delete()
      .eq('user_id', userId)
      .eq('role_id', role.id)

    if (removeError) {
      return { success: false, error: removeError.message }
    }

    return { success: true }
  } catch (error) {
    return { success: false, error: 'Error interno' }
  }
}
```

---

## 📝 8. Pasos de Implementación

### Paso 1: Base de Datos
1. Ejecutar las queries SQL en Supabase SQL Editor
2. Verificar que las tablas se crearon correctamente
3. Insertar roles adicionales si es necesario

### Paso 2: Archivos del Sistema
1. Crear `src/hooks/useAuth.ts`
2. Crear `src/components/auth/PageGuard.tsx`
3. Crear `src/lib/auth/permissions.ts`
4. Crear `src/app/unauthorized/page.tsx`

### Paso 3: Integración
1. Asignar roles a usuarios de prueba
2. Implementar protección en páginas específicas
3. Probar diferentes escenarios de acceso

### Paso 4: Funcionalidades Avanzadas (Opcional)
1. Crear `src/lib/auth/role-management.ts`
2. Implementar panel de administración de roles
3. Agregar logs de acceso y auditoría

---

## 🎯 Ventajas del Sistema

- ✅ **Centralizado**: Todo el manejo de roles en un solo lugar
- ✅ **Flexible**: Roles múltiples y permisos granulares
- ✅ **Seguro**: Verificación tanto en cliente como servidor
- ✅ **Performante**: Queries optimizadas con índices
- ✅ **Mantenible**: Fácil de extender y modificar
- ✅ **Escalable**: Soporta roles temporales y complejos

---

## 🚀 Próximos Pasos Recomendados

1. **Panel de Administración**: Crear interfaz para gestionar roles
2. **Logs de Auditoría**: Registrar accesos y cambios de permisos
3. **Roles Dinámicos**: Permitir creación de roles desde la UI
4. **Middleware Avanzado**: Protección automática por rutas
5. **Cache de Roles**: Optimizar performance con Redis/memoria

---

*📅 Creado: $(date)*
*🔄 Última actualización: Pendiente de implementación*
