"use client";

import { useEffect, useRef, useState } from "react";
import SignaturePadLib from "signature_pad";
import { Eraser, PenLine, Upload, Image as ImageIcon, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface SignaturePadProps {
  onSignatureChange: (signature: string | null) => void;
  initialSignature?: string | null;
  className?: string;
}

type SignatureMode = "draw" | "upload";

export default function SignaturePad({
  onSignatureChange,
  initialSignature,
  className,
}: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const signaturePadRef = useRef<SignaturePadLib | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [mode, setMode] = useState<SignatureMode>("draw");
  const [isEmpty, setIsEmpty] = useState(!initialSignature);
  const [uploadedImage, setUploadedImage] = useState<string | null>(initialSignature || null);

  // Initialize signature pad
  useEffect(() => {
    if (canvasRef.current && mode === "draw") {
      const pad = new SignaturePadLib(canvasRef.current, {
        backgroundColor: "rgb(255, 255, 255)",
        penColor: "rgb(0, 0, 0)",
        velocityFilterWeight: 0.7,
      });

      pad.addEventListener("endStroke", () => {
        setIsEmpty(pad.isEmpty());
        if (!pad.isEmpty()) {
          onSignatureChange(pad.toDataURL("image/png"));
        }
      });

      signaturePadRef.current = pad;

      // Load initial signature if available and in draw mode
      if (initialSignature && !uploadedImage) {
        const img = new Image();
        img.onload = () => {
          const canvas = canvasRef.current;
          const ctx = canvas?.getContext("2d");
          if (ctx && canvas) {
            // Calculate aspect ratio to fit
            const scale = Math.min(
              canvas.width / img.width,
              canvas.height / img.height
            );
            const x = (canvas.width / 2) - (img.width / 2) * scale;
            const y = (canvas.height / 2) - (img.height / 2) * scale;
            
            ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
            
            // We need to manually set data URL because drawImage doesn't update internal data structure
            // But for simplicity, we just keep the initial signature valid
          }
        };
        img.src = initialSignature;
      }
    }

    return () => {
      if (signaturePadRef.current) {
        signaturePadRef.current.off();
        signaturePadRef.current = null;
      }
    };
  }, [mode, initialSignature, uploadedImage, onSignatureChange]);

  // Handle resize
  useEffect(() => {
    const handleResize = () => {
      if (canvasRef.current && containerRef.current && signaturePadRef.current && mode === "draw") {
        const canvas = canvasRef.current;
        const container = containerRef.current;
        
        // Store current signature
        const data = signaturePadRef.current.toData();
        
        // Resize canvas
        const ratio = Math.max(window.devicePixelRatio || 1, 1);
        canvas.width = container.offsetWidth * ratio;
        canvas.height = container.offsetHeight * ratio;
        canvas.getContext("2d")?.scale(ratio, ratio);
        
        // Restore signature
        signaturePadRef.current.fromData(data);
      }
    };

    window.addEventListener("resize", handleResize);
    handleResize(); // Initial resize

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [mode]);

  const handleClear = () => {
    if (mode === "draw" && signaturePadRef.current) {
      signaturePadRef.current.clear();
    }
    setUploadedImage(null);
    setIsEmpty(true);
    onSignatureChange(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        setUploadedImage(result);
        setIsEmpty(false);
        onSignatureChange(result);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      {/* Tabs */}
      <div className="flex p-1 bg-gray-100 rounded-lg w-fit">
        <button
          type="button"
          onClick={() => {
            setMode("draw");
            // If switching to draw and we have an image, we might want to clear or keep it
            // For now, let's keep the logic simple
          }}
          className={cn(
            "px-3 py-1.5 text-sm font-medium rounded-md transition-all flex items-center gap-2",
            mode === "draw" 
              ? "bg-white text-gray-900 shadow-sm" 
              : "text-gray-500 hover:text-gray-900"
          )}
        >
          <PenLine className="w-4 h-4" />
          Dibujar
        </button>
        <button
          type="button"
          onClick={() => setMode("upload")}
          className={cn(
            "px-3 py-1.5 text-sm font-medium rounded-md transition-all flex items-center gap-2",
            mode === "upload" 
              ? "bg-white text-gray-900 shadow-sm" 
              : "text-gray-500 hover:text-gray-900"
          )}
        >
          <Upload className="w-4 h-4" />
          Subir imagen
        </button>
      </div>

      <div 
        ref={containerRef} 
        className="relative border-2 border-dashed border-gray-300 rounded-xl bg-white h-[200px] w-full overflow-hidden touch-none"
      >
        {mode === "draw" ? (
          <>
            <canvas
              ref={canvasRef}
              className="w-full h-full cursor-crosshair block"
              style={{ touchAction: "none" }}
            />
            {isEmpty && !initialSignature && (
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-gray-400">
                <PenLine className="w-8 h-8 mb-2 opacity-50" />
                <p className="text-sm font-medium">Dibuja tu firma aquí</p>
              </div>
            )}
          </>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center p-4">
            {uploadedImage ? (
              <div className="relative w-full h-full flex items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img 
                  src={uploadedImage} 
                  alt="Firma subida" 
                  className="max-w-full max-h-full object-contain"
                />
                <button
                  type="button"
                  onClick={handleClear}
                  className="absolute top-2 right-2 p-1 bg-white rounded-full shadow-md hover:bg-gray-100 border border-gray-200"
                >
                  <X className="w-4 h-4 text-gray-500" />
                </button>
              </div>
            ) : (
              <div 
                className="flex flex-col items-center justify-center w-full h-full cursor-pointer hover:bg-gray-50 transition-colors rounded-lg"
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                  <ImageIcon className="w-6 h-6 text-gray-400" />
                </div>
                <p className="text-sm font-medium text-gray-900">Haz clic para subir una imagen</p>
                <p className="text-xs text-gray-500 mt-1">PNG, JPG o WEBP (max. 2MB)</p>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={handleFileUpload}
            />
          </div>
        )}
      </div>

      <div className="flex justify-between items-center">
        <p className="text-xs text-gray-400">
          {mode === "draw" 
            ? "Usa tu dedo o mouse para firmar" 
            : "Sube una foto clara de tu firma"
          }
        </p>
        <button
          type="button"
          onClick={handleClear}
          disabled={isEmpty && !uploadedImage}
          className="text-sm text-gray-500 hover:text-red-600 flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Eraser className="w-4 h-4" />
          Limpiar
        </button>
      </div>
    </div>
  );
}
