/**
 * AttachmentPreview Component
 * Preview de archivos adjuntos (imágenes inline, PDFs en viewer, otros con download)
 */

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, FileText, Image as ImageIcon, File, X } from 'lucide-react';
import { formatFileSize } from '@/lib/storage/attachments';

interface Attachment {
  name: string;
  size: number;
  type: string;
  url: string;
}

interface AttachmentPreviewProps {
  attachments: Attachment[];
  showPreview?: boolean;
}

export function AttachmentPreview({ attachments, showPreview = true }: AttachmentPreviewProps) {
  const [expandedImage, setExpandedImage] = useState<string | null>(null);

  if (!attachments || attachments.length === 0) return null;

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <ImageIcon className="w-5 h-5" />;
    if (type.includes('pdf')) return <FileText className="w-5 h-5" />;
    return <File className="w-5 h-5" />;
  };

  const isImage = (type: string) => type.startsWith('image/');
  const isPDF = (type: string) => type.includes('pdf');

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
        📎 Adjuntos ({attachments.length})
      </p>

      <div className="grid grid-cols-1 gap-2">
        {attachments.map((attachment, index) => (
          <div key={index}>
            {/* Lista de archivos */}
            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="text-gray-600 dark:text-gray-400">
                  {getFileIcon(attachment.type)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                    {attachment.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatFileSize(attachment.size)}
                  </p>
                </div>
              </div>

              <div className="flex gap-2">
                {/* Botón de preview para imágenes */}
                {showPreview && isImage(attachment.type) && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setExpandedImage(attachment.url)}
                  >
                    Ver
                  </Button>
                )}

                {/* Botón de descarga */}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  asChild
                >
                  <a
                    href={attachment.url}
                    download={attachment.name}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Download className="w-4 h-4" />
                  </a>
                </Button>
              </div>
            </div>

            {/* Preview inline de imágenes */}
            {showPreview && isImage(attachment.type) && (
              <div className="mt-2">
                <img
                  src={attachment.url}
                  alt={attachment.name}
                  className="max-w-full max-h-64 rounded-lg border border-gray-200 dark:border-gray-700 object-contain"
                  loading="lazy"
                />
              </div>
            )}

            {/* Preview de PDF en iframe */}
            {showPreview && isPDF(attachment.type) && (
              <div className="mt-2">
                <iframe
                  src={attachment.url}
                  className="w-full h-96 rounded-lg border border-gray-200 dark:border-gray-700"
                  title={attachment.name}
                  sandbox="allow-same-origin"
                />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Modal de imagen expandida */}
      {expandedImage && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setExpandedImage(null)}
        >
          <div className="relative max-w-6xl max-h-full">
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 bg-white/90 hover:bg-white"
              onClick={() => setExpandedImage(null)}
            >
              <X className="w-4 h-4" />
            </Button>
            <img
              src={expandedImage}
              alt="Preview"
              className="max-w-full max-h-[90vh] object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </div>
  );
}

