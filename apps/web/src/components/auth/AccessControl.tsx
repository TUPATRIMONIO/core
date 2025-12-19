'use client';

import { ReactNode } from 'react';
import { useOrganization } from '@/hooks/useOrganization';

interface AccessControlProps {
  /** App slug requerida (ej: 'crm_sales', 'signatures') */
  app?: string;
  
  /** Permiso requerido (ej: 'edit', 'crm.edit') */
  permission?: string;
  
  /** Rol requerido (ej: 'admin', 'owner') */
  role?: string;
  
  /** Nivel mínimo de rol requerido */
  minLevel?: number;
  
  /** Qué mostrar si no tiene acceso */
  fallback?: ReactNode;
  
  /** Contenido a mostrar si tiene acceso */
  children: ReactNode;
}

/**
 * Componente para controlar acceso declarativamente
 * 
 * Verifica acceso a nivel de organización (apps) y miembro (permisos/rol)
 * 
 * @example
 * ```tsx
 * // Requiere app habilitada
 * <AccessControl app="crm_sales">
 *   <CRMDashboard />
 * </AccessControl>
 * 
 * // Requiere permiso específico
 * <AccessControl permission="edit">
 *   <EditButton />
 * </AccessControl>
 * 
 * // Requiere rol específico
 * <AccessControl role="admin">
 *   <AdminPanel />
 * </AccessControl>
 * 
 * // Combinación de requisitos (todos deben cumplirse)
 * <AccessControl app="signatures" permission="create">
 *   <CreateSignatureButton />
 * </AccessControl>
 * 
 * // Con fallback personalizado
 * <AccessControl app="analytics" fallback={<UpgradePrompt />}>
 *   <AnalyticsDashboard />
 * </AccessControl>
 * ```
 */
export function AccessControl({ 
  app, 
  permission, 
  role,
  minLevel,
  fallback = null, 
  children 
}: AccessControlProps) {
  const { 
    hasApp, 
    hasPermission, 
    hasRole,
    getRoleLevel,
    isAdmin,
  } = useOrganization();

  // Si es admin, tiene acceso a todo (excepto apps que la org no tiene)
  const userIsAdmin = isAdmin();

  // Verificar app habilitada (esto no se puede saltar ni siendo admin)
  if (app && !hasApp(app)) {
    return <>{fallback}</>;
  }

  // Verificar permiso (admins tienen todos los permisos)
  if (permission && !hasPermission(permission) && !userIsAdmin) {
    return <>{fallback}</>;
  }

  // Verificar rol específico
  if (role && !hasRole(role)) {
    return <>{fallback}</>;
  }

  // Verificar nivel mínimo
  if (minLevel !== undefined && getRoleLevel() < minLevel && !userIsAdmin) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

/**
 * Componente para mostrar contenido solo a admins/owners
 */
export function AdminOnly({ 
  children, 
  fallback = null 
}: { 
  children: ReactNode; 
  fallback?: ReactNode;
}) {
  return (
    <AccessControl role="admin" fallback={fallback}>
      {children}
    </AccessControl>
  );
}

/**
 * Componente para mostrar contenido solo al owner
 */
export function OwnerOnly({ 
  children, 
  fallback = null 
}: { 
  children: ReactNode; 
  fallback?: ReactNode;
}) {
  return (
    <AccessControl role="owner" fallback={fallback}>
      {children}
    </AccessControl>
  );
}
