"use client";

import { useOrganization } from "./useOrganization";

/**
 * Hook para verificar apps habilitadas en la organización activa
 *
 * Uso:
 * ```tsx
 * const { hasApp, enabledApps, hasCRM, hasSignatures } = useOrgApps();
 *
 * if (hasApp('crm_sales')) { ... }
 * if (hasCRM) { ... }
 * ```
 */
export function useOrgApps() {
    const { hasApp, getEnabledApps } = useOrganization();

    const enabledApps = getEnabledApps();

    return {
        // Verificador genérico
        hasApp,

        // Lista de apps habilitadas
        enabledApps,

        // Apps específicas pre-calculadas (basadas en el seed de applications)
        hasMarketingSite: hasApp("marketing_site"),
        hasCRM: hasApp("crm_sales"),
        hasSignatures: hasApp("signatures"),
        hasVerifications: hasApp("verifications"),
        hasAICustomerService: hasApp("ai_customer_service"),
        hasAIDocumentReview: hasApp("ai_document_review"),
        hasAnalytics: hasApp("analytics"),
    };
}
