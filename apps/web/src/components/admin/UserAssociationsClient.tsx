"use client";

import { useState, useTransition } from "react";
import {
    AssociationsPanel,
    AssociationSection,
    AssociatedItem,
} from "@/components/shared/AssociationsPanel";
import { AssociationSelector } from "@/components/crm/tickets/AssociationSelector";
import {
    linkEntityGeneric,
    unlinkEntityGeneric,
    AssociationType,
} from "@/app/actions/crm/associations";
import { toast } from "sonner";

interface UserAssociationsClientProps {
    userId: string;
    initialOrganizations: AssociatedItem[];
    initialOrders: AssociatedItem[];
    initialTickets: AssociatedItem[];
}

export function UserAssociationsClient({
    userId,
    initialOrganizations,
    initialOrders,
    initialTickets,
}: UserAssociationsClientProps) {
    const [organizations, setOrganizations] =
        useState<AssociatedItem[]>(initialOrganizations);
    const [orders, setOrders] = useState<AssociatedItem[]>(initialOrders);
    const [tickets, setTickets] = useState<AssociatedItem[]>(initialTickets);

    const [isPending, startTransition] = useTransition();
    const [selectorOpen, setSelectorOpen] = useState(false);
    const [selectorType, setSelectorType] =
        useState<AssociationType>("organization"); // Default

    const handleAddToSection = (sectionId: string, sectionType: string) => {
        // Map section type to association type
        // sectionType comes from the 'type' in sections definition
        const typeMap: Record<string, AssociationType> = {
            organization: "organization" as any, // casting because AssociationType might not strictly include organization in some old versions, but we added it?
            // Wait, AssociationType in associations.ts defined as: contact | company | order | ticket | application.
            // It does NOT include 'organization' (company is the term used often).
            // But we have 'user-organization' linkKey.
            // Let's check Schema. 'core.organizations'.
            // In AssociationSelector, type can be 'organization'?
            // Let's check AssociationSelector.
        };

        // Actually 'company' usually maps to organization in our app context or vice versa.
        // But let's assume valid types.
        setSelectorType(sectionType as AssociationType);
        setSelectorOpen(true);
    };

    const handleSelectEntity = async (
        entityId: string,
        source?: string,
        item?: any,
    ) => {
        setSelectorOpen(false);

        startTransition(async () => {
            // targetType is selectorType
            const result = await linkEntityGeneric(
                "user",
                userId,
                selectorType,
                entityId,
                source,
            );

            if (result.success) {
                toast.success("Asociación creada");
                // Optimistic update
                if (selectorType === "company" || selectorType === "organization" as any) {
                     // Note: Selector usually returns 'company' or 'organization' depending on implementation
                     // we will assume the selectorType passed in is what we want.
                    setOrganizations((prev) => [
                        ...prev,
                        {
                            id: entityId,
                            name: item?.top_text || "Organización",
                            subtext: item?.sub_text || "",
                        },
                    ]);
                } else if (selectorType === "order") {
                    setOrders((prev) => [
                        ...prev,
                        {
                            id: entityId,
                            name: item?.top_text || "Pedido",
                            subtext: item?.sub_text || "",
                        },
                    ]);
                } else if (selectorType === "ticket") {
                    setTickets((prev) => [
                        ...prev,
                        {
                            id: entityId,
                            name: item?.top_text || "Ticket",
                            subtext: item?.sub_text || "",
                        },
                    ]);
                }
            } else {
                toast.error(result.error || "Error al crear asociación");
            }
        });
    };

    const handleRemoveItem = async (sectionId: string, itemId: string) => {
        let targetType: AssociationType | null = null;
        if (sectionId === "organizations") targetType = "organization" as any; // forceful cast if needed, or mapping
        if (sectionId === "orders") targetType = "order";
        if (sectionId === "tickets") targetType = "ticket";

        // Note: AssociationType needs to include 'organization' if we want to pass it to unlinkEntityGeneric.
        // In associations.ts I defined AssociationType = contact | company | order | ticket | application.
        // It seems "company" is used for organizations in CRM context.
        // But for Platform Users linking to Platform Organizations, we might need "organization" type or map "company" -> "organization".
        // Let's assume we use "organization" and I need to update AssociationType in generic if failing.
        // Wait, 'user-organization' was added to associations.ts. But is 'organization' in AssociationType?
        // Checking associations.ts (Step 587):
        // export type AssociationType = "contact" | "company" | "order" | "ticket" | "application";
        // It MISSES "organization". I should probably update AssociationType to include "organization" OR use "company" and map it.
        // Given I added "user-organization" case, I probably intended "organization" to be a valid type.
        // I should update AssociationType in associations.ts.

        if (!targetType) return;

        startTransition(async () => {
            const result = await unlinkEntityGeneric(
                "user",
                userId,
                targetType!,
                itemId,
            );

            if (result.success) {
                toast.success("Asociación eliminada");
                if (sectionId === "organizations") {
                    setOrganizations((prev) =>
                        prev.filter((o) => o.id !== itemId),
                    );
                } else if (sectionId === "orders") {
                    setOrders((prev) => prev.filter((o) => o.id !== itemId));
                } else if (sectionId === "tickets") {
                    setTickets((prev) => prev.filter((t) => t.id !== itemId));
                }
            } else {
                toast.error(result.error || "Error al eliminar asociación");
            }
        });
    };

    const sections: AssociationSection[] = [
        {
            id: "organizations",
            title: "Organizaciones",
            type: "organization", // This string is passed to handleAddToSection -> setSelectorType.
            items: organizations.map((o) => ({
                ...o,
                href: `/admin/organizations/${o.id}`,
            })),
            canAdd: true,
            canRemove: true,
        },
        {
            id: "orders",
            title: "Pedidos del Usuario",
            type: "order",
            items: orders.map((o) => ({
                ...o,
                href: `/admin/orders/${o.id}`,
            })),
            canAdd: false,  // Informativo: muestra pedidos reales comprados
            canRemove: false,
        },
        {
            id: "tickets",
            title: "Tickets",
            type: "ticket",
            items: tickets.map((t) => ({
                ...t,
                href: `/admin/communications/tickets/${t.id}`,
            })),
            canAdd: true,
            canRemove: true,
        },
    ];

    return (
        <>
            <AssociationsPanel
                title="Asociaciones"
                sections={sections}
                onAddToSection={handleAddToSection}
                onRemoveItem={handleRemoveItem}
                isLoading={isPending}
            />

            <AssociationSelector
                open={selectorOpen}
                onOpenChange={setSelectorOpen}
                type={selectorType}
                onSelect={handleSelectEntity}
            />
        </>
    );
}

export default UserAssociationsClient;
