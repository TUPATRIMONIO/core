"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface SelectionState {
    text: string;
    from: number;
    to: number;
    rect: DOMRect | null;
}

interface UseTextSelectionOptions {
    containerRef: React.RefObject<HTMLElement | null>;
    enabled?: boolean;
}

/**
 * Hook para detectar selección de texto dentro de un contenedor
 * Retorna el texto seleccionado, su posición y un rect para posicionar popups
 */
export function useTextSelection(
    { containerRef, enabled = true }: UseTextSelectionOptions,
) {
    const [selection, setSelection] = useState<SelectionState | null>(null);
    const isSelecting = useRef(false);

    const handleMouseUp = useCallback(() => {
        if (!enabled || !containerRef.current) return;

        // Pequeño delay para asegurar que la selección esté completa
        setTimeout(() => {
            const windowSelection = window.getSelection();

            if (
                !windowSelection || windowSelection.isCollapsed ||
                windowSelection.rangeCount === 0
            ) {
                setSelection(null);
                return;
            }

            const range = windowSelection.getRangeAt(0);
            const selectedText = windowSelection.toString().trim();

            // Verificar que la selección está dentro del contenedor
            if (
                !containerRef.current?.contains(range.commonAncestorContainer)
            ) {
                setSelection(null);
                return;
            }

            if (selectedText.length < 3) {
                setSelection(null);
                return;
            }

            // Obtener las coordenadas para posicionar el popup
            const rect = range.getBoundingClientRect();

            // Calcular posición aproximada en el texto (para guardar en la BD)
            // Usamos el contenido de texto del contenedor
            const containerText = containerRef.current.innerText || "";
            const from = containerText.indexOf(selectedText);
            const to = from + selectedText.length;

            setSelection({
                text: selectedText,
                from: from >= 0 ? from : 0,
                to: to >= 0 ? to : selectedText.length,
                rect,
            });
        }, 10);
    }, [enabled, containerRef]);

    const handleMouseDown = useCallback(() => {
        isSelecting.current = true;
        // No limpiar inmediatamente para permitir clicks en el popup
    }, []);

    const clearSelection = useCallback(() => {
        setSelection(null);
        window.getSelection()?.removeAllRanges();
    }, []);

    // Limpiar selección al hacer click fuera
    const handleClickOutside = useCallback((e: MouseEvent) => {
        if (!selection) return;

        const target = e.target as HTMLElement;

        // No limpiar si se hace click en el popup de comentario
        if (target.closest("[data-comment-popup]")) return;

        // Limpiar si se hace click fuera de la selección
        if (!containerRef.current?.contains(target)) {
            clearSelection();
        }
    }, [selection, containerRef, clearSelection]);

    useEffect(() => {
        if (!enabled) return;

        document.addEventListener("mouseup", handleMouseUp);
        document.addEventListener("mousedown", handleMouseDown);
        document.addEventListener("click", handleClickOutside);

        return () => {
            document.removeEventListener("mouseup", handleMouseUp);
            document.removeEventListener("mousedown", handleMouseDown);
            document.removeEventListener("click", handleClickOutside);
        };
    }, [enabled, handleMouseUp, handleMouseDown, handleClickOutside]);

    return {
        selection,
        hasSelection: !!selection && selection.text.length > 0,
        clearSelection,
    };
}
