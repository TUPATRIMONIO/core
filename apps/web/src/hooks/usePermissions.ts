"use client";

import { useOrganization } from "./useOrganization";

/**
 * Hook para verificar permisos del usuario en la organización activa
 *
 * Uso:
 * ```tsx
 * const { hasPermission, hasRole, isAdmin } = usePermissions();
 *
 * if (hasPermission('crm.edit')) { ... }
 * if (hasRole('admin')) { ... }
 * if (isAdmin) { ... }
 * ```
 */
export function usePermissions() {
    const {
        hasPermission,
        hasRole,
        getRoleSlug,
        getRoleLevel,
        isAdmin,
        isOwner,
        canManageOrg,
    } = useOrganization();

    return {
        // Verificadores de permisos
        hasPermission,
        hasRole,

        // Getters
        roleSlug: getRoleSlug(),
        roleLevel: getRoleLevel(),

        // Helpers de conveniencia
        isAdmin: isAdmin(),
        isOwner: isOwner(),
        canManageOrg: canManageOrg(),

        // Permisos comunes pre-calculados
        canView: hasPermission("view") || isAdmin(),
        canEdit: hasPermission("edit") || isAdmin(),
        canDelete: hasPermission("delete") || isAdmin(),
        canCreate: hasPermission("create") || isAdmin(),
    };
}
