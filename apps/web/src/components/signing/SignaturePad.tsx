"use client";

import { useEffect, useRef, useState } from "react";
import SignaturePadLib from "signature_pad";
import { Eraser, PenLine } from "lucide-react";
import { cn } from "@/lib/utils";

interface SignaturePadProps {
  onSignatureChange: (signature: string | null) => void;
  className?: string;
}

export default function SignaturePad({
  onSignatureChange,
  className,
}: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const signaturePadRef = useRef<SignaturePadLib | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isEmpty, setIsEmpty] = useState(true);

  // Initialize signature pad
  useEffect(() => {
    if (canvasRef.current) {
      const pad = new SignaturePadLib(canvasRef.current, {
        backgroundColor: "rgb(255, 255, 255)",
        penColor: "rgb(0, 0, 0)",
        velocityFilterWeight: 0.7,
      });

      pad.addEventListener("endStroke", () => {
        setIsEmpty(pad.isEmpty());
        if (!pad.isEmpty()) {
          // Get signature as PNG base64
          // Trim whitespace for better storage/display
          onSignatureChange(pad.toDataURL("image/png"));
        }
      });

      signaturePadRef.current = pad;
    }

    return () => {
      if (signaturePadRef.current) {
        signaturePadRef.current.off();
        signaturePadRef.current = null;
      }
    };
  }, [onSignatureChange]);

  // Handle resize
  useEffect(() => {
    const handleResize = () => {
      if (canvasRef.current && containerRef.current && signaturePadRef.current) {
        const canvas = canvasRef.current;
        const container = containerRef.current;
        
        // Store current signature
        const data = signaturePadRef.current.toData();
        
        // Resize canvas
        const ratio = Math.max(window.devicePixelRatio || 1, 1);
        canvas.width = container.offsetWidth * ratio;
        canvas.height = container.offsetHeight * ratio;
        canvas.getContext("2d")?.scale(ratio, ratio);
        
        // Restore signature (clears canvas first internally)
        signaturePadRef.current.fromData(data);
      }
    };

    window.addEventListener("resize", handleResize);
    handleResize(); // Initial resize

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  const handleClear = () => {
    if (signaturePadRef.current) {
      signaturePadRef.current.clear();
      setIsEmpty(true);
      onSignatureChange(null);
    }
  };

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div 
        ref={containerRef} 
        className="relative border-2 border-dashed border-gray-300 rounded-xl bg-white h-[200px] w-full overflow-hidden touch-none"
      >
        <canvas
          ref={canvasRef}
          className="w-full h-full cursor-crosshair block"
          style={{ touchAction: "none" }}
        />
        
        {isEmpty && (
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-gray-400">
            <PenLine className="w-8 h-8 mb-2 opacity-50" />
            <p className="text-sm font-medium">Dibuja tu firma aquí</p>
          </div>
        )}
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleClear}
          disabled={isEmpty}
          className="text-sm text-gray-500 hover:text-red-600 flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Eraser className="w-4 h-4" />
          Limpiar firma
        </button>
      </div>
    </div>
  );
}
