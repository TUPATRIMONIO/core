/**
 * FileUpload Component
 * Permite adjuntar archivos a emails con preview y validación
 */

'use client';

import { useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Paperclip, X, FileText, Image as ImageIcon, File } from 'lucide-react';
import { formatFileSize, isAllowedFileType } from '@/lib/storage/attachments';

interface FileUploadProps {
  files: File[];
  onFilesChange: (files: File[]) => void;
  maxFiles?: number;
  disabled?: boolean;
}

export function FileUpload({ files, onFilesChange, maxFiles, disabled }: FileUploadProps) {
  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || []);
    
    // Validar archivos
    const validFiles = selectedFiles.filter(file => {
      if (!isAllowedFileType(file)) {
        alert(`Archivo "${file.name}" no permitido. Los archivos ejecutables están bloqueados.`);
        return false;
      }
      
      if (file.size > 25 * 1024 * 1024) {
        alert(`Archivo "${file.name}" es muy grande. Máximo 25 MB.`);
        return false;
      }
      
      return true;
    });

    if (maxFiles && files.length + validFiles.length > maxFiles) {
      alert(`Máximo ${maxFiles} archivos por email`);
      return;
    }

    onFilesChange([...files, ...validFiles]);
    
    // Resetear input
    event.target.value = '';
  }, [files, onFilesChange, maxFiles]);

  const removeFile = (index: number) => {
    const newFiles = files.filter((_, i) => i !== index);
    onFilesChange(newFiles);
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <ImageIcon className="w-4 h-4" />;
    if (type.includes('pdf')) return <FileText className="w-4 h-4" />;
    return <File className="w-4 h-4" />;
  };

  return (
    <div className="space-y-3">
      {/* Input de archivos */}
      <div>
        <input
          type="file"
          id="file-upload"
          multiple
          onChange={handleFileSelect}
          disabled={disabled}
          className="hidden"
        />
        <label htmlFor="file-upload">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={disabled}
            asChild
          >
            <span className="cursor-pointer">
              <Paperclip className="w-4 h-4 mr-2" />
              Adjuntar Archivos
            </span>
          </Button>
        </label>
      </div>

      {/* Lista de archivos */}
      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((file, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="shrink-0 text-gray-600 dark:text-gray-400">
                  {getFileIcon(file.type)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                    {file.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatFileSize(file.size)}
                  </p>
                </div>
              </div>

              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeFile(index)}
                disabled={disabled}
                className="shrink-0"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          ))}
          
          <p className="text-xs text-gray-500">
            {files.length} archivo{files.length !== 1 ? 's' : ''} adjunto{files.length !== 1 ? 's' : ''} 
            ({formatFileSize(files.reduce((sum, f) => sum + f.size, 0))} total)
          </p>
        </div>
      )}
    </div>
  );
}

