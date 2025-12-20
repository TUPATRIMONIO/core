'use client';

import { useState, useRef } from 'react';
import mammoth from 'mammoth';
import { Upload, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface WordImporterProps {
  onImport: (html: string) => void;
}

export function WordImporter({ onImport }: WordImporterProps) {
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar que sea un archivo .docx
    if (!file.name.endsWith('.docx')) {
      toast.error('Solo se permiten archivos .docx');
      return;
    }

    setIsLoading(true);
    try {
      const arrayBuffer = await file.arrayBuffer();
      
      // Convertir DOCX a HTML usando mammoth.js
      const result = await mammoth.convertToHtml(
        { arrayBuffer },
        {
          // Opciones de conversión
          styleMap: [
            "p[style-name='Title'] => h1:fresh",
            "p[style-name='Heading 1'] => h1:fresh",
            "p[style-name='Heading 2'] => h2:fresh",
            "p[style-name='Heading 3'] => h3:fresh",
          ],
        }
      );

      // Mostrar warnings si hay
      if (result.messages.length > 0) {
        console.warn('Mammoth warnings:', result.messages);
        const warnings = result.messages.filter(m => m.type === 'warning');
        if (warnings.length > 0) {
          toast.warning(`${warnings.length} elementos no se pudieron convertir completamente`);
        }
      }

      // Pasar HTML al editor
      onImport(result.value);
      
      toast.success(`"${file.name}" importado correctamente`);
    } catch (error) {
      console.error('Error importing Word file:', error);
      toast.error('Error al importar el archivo');
    } finally {
      setIsLoading(false);
      // Resetear input para permitir reimportar el mismo archivo
      if (inputRef.current) {
        inputRef.current.value = '';
      }
    }
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept=".docx"
        onChange={handleFileChange}
        className="hidden"
        id="word-upload"
      />
      <Button
        variant="outline"
        size="sm"
        onClick={() => inputRef.current?.click()}
        disabled={isLoading}
        className="gap-2"
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Upload className="h-4 w-4" />
        )}
        Importar Word
      </Button>
    </>
  );
}
