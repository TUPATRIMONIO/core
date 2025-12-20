"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";

interface LockState {
    isLocked: boolean;
    lockedBy: { id: string; name: string } | null;
    canEdit: boolean;
    isConnected: boolean;
}

interface UseDocumentLockProps {
    documentId: string;
    userId: string;
    userName: string;
}

/**
 * Hook para manejar el bloqueo de documentos en tiempo real usando Supabase Presence.
 * Solo un usuario puede editar un documento a la vez.
 */
export function useDocumentLock(
    { documentId, userId, userName }: UseDocumentLockProps,
) {
    const [lockState, setLockState] = useState<LockState>({
        isLocked: false,
        lockedBy: null,
        canEdit: false,
        isConnected: false,
    });

    const channelRef = useRef<RealtimeChannel | null>(null);
    const supabase = createClient();

    // Determinar quién tiene el lock basado en presencia
    const processPresenceState = useCallback((state: Record<string, any[]>) => {
        const allPresences = Object.values(state).flat();

        if (allPresences.length === 0) {
            // Nadie está editando
            setLockState((prev) => ({
                ...prev,
                isLocked: false,
                lockedBy: null,
                canEdit: true,
            }));
            return;
        }

        // Ordenar por timestamp para dar lock al primero
        const sortedPresences = allPresences.sort((a, b) =>
            new Date(a.joined_at).getTime() - new Date(b.joined_at).getTime()
        );

        const firstEditor = sortedPresences[0];
        const isMe = firstEditor.user_id === userId;

        setLockState((prev) => ({
            ...prev,
            isLocked: !isMe,
            lockedBy: isMe ? null : {
                id: firstEditor.user_id,
                name: firstEditor.user_name,
            },
            canEdit: isMe,
        }));
    }, [userId]);

    useEffect(() => {
        // Crear canal de presencia para este documento
        const channel = supabase.channel(`doc-presence:${documentId}`, {
            config: {
                presence: {
                    key: userId,
                },
            },
        });

        // Sincronizar con estado de presencia
        channel.on("presence", { event: "sync" }, () => {
            const state = channel.presenceState();
            processPresenceState(state);
        });

        // Usuario se une
        channel.on("presence", { event: "join" }, ({ newPresences }) => {
            console.log("[DocumentLock] User joined:", newPresences);
        });

        // Usuario se va
        channel.on("presence", { event: "leave" }, ({ leftPresences }) => {
            console.log("[DocumentLock] User left:", leftPresences);
        });

        // Suscribirse al canal
        channel.subscribe(async (status) => {
            if (status === "SUBSCRIBED") {
                setLockState((prev) => ({ ...prev, isConnected: true }));

                // Registrar presencia (intenta tomar el lock)
                await channel.track({
                    user_id: userId,
                    user_name: userName,
                    joined_at: new Date().toISOString(),
                });
            } else if (status === "CLOSED" || status === "CHANNEL_ERROR") {
                setLockState((prev) => ({ ...prev, isConnected: false }));
            }
        });

        channelRef.current = channel;

        // Cleanup: liberar lock al desmontar
        return () => {
            if (channelRef.current) {
                channelRef.current.untrack();
                supabase.removeChannel(channelRef.current);
            }
        };
    }, [documentId, userId, userName, supabase, processPresenceState]);

    // Función para liberar manualmente el lock
    const releaseLock = useCallback(async () => {
        if (channelRef.current) {
            await channelRef.current.untrack();
        }
    }, []);

    return {
        ...lockState,
        releaseLock,
    };
}
