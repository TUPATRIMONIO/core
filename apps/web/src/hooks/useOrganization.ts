import { useContext } from "react";
import { OrganizationContext } from "@/providers/OrganizationProvider";

/**
 * Hook para acceder al contexto de organización
 *
 * @returns Contexto de organización con organización activa y métodos para cambiarla
 * @throws Error si se usa fuera del OrganizationProvider
 */
export function useOrganization() {
    const context = useContext(OrganizationContext);

    if (!context) {
        throw new Error(
            "useOrganization must be used within OrganizationProvider",
        );
    }

    return context;
}
