'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { FileText, Loader2 } from 'lucide-react';

type DocumentType = 'stripe_invoice' | 'boleta_electronica' | 'factura_electronica' | string;

interface InvoiceButtonProps {
  orderId: string;
  initialPdfUrl?: string | null;
  initialDocumentType?: DocumentType | null;
}

function getButtonLabel(documentType: DocumentType | null | undefined): string {
  switch (documentType) {
    case 'boleta_electronica':
      return 'Ver Boleta';
    case 'factura_electronica':
      return 'Ver Factura';
    case 'stripe_invoice':
    default:
      return 'Ver Invoice';
  }
}

function getLoadingLabel(documentType: DocumentType | null | undefined): string {
  switch (documentType) {
    case 'boleta_electronica':
      return 'Generando Boleta...';
    case 'factura_electronica':
      return 'Generando Factura...';
    case 'stripe_invoice':
    default:
      return 'Generando Invoice...';
  }
}

export default function InvoiceButton({ 
  orderId, 
  initialPdfUrl,
  initialDocumentType,
}: InvoiceButtonProps) {
  const [pdfUrl, setPdfUrl] = useState(initialPdfUrl);
  const [documentType, setDocumentType] = useState<DocumentType | null>(initialDocumentType || null);
  const [loading, setLoading] = useState(!initialPdfUrl);

  useEffect(() => {
    if (pdfUrl) {
      setLoading(false);
      return;
    }

    // Polling cada 3 segundos para verificar si el documento está listo
    const checkDocument = async () => {
      try {
        const response = await fetch(`/api/invoicing/document?order_id=${orderId}`);
        if (response.ok) {
          const data = await response.json();
          if (data.document?.pdf_url) {
            setPdfUrl(data.document.pdf_url);
            setDocumentType(data.document.document_type);
            setLoading(false);
          }
        }
      } catch (error) {
        console.error('Error checking document:', error);
      }
    };

    // Primera verificación inmediata
    checkDocument();

    // Polling cada 3 segundos
    const interval = setInterval(checkDocument, 3000);

    // Timeout después de 2 minutos
    const timeout = setTimeout(() => {
      clearInterval(interval);
      setLoading(false);
    }, 120000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [orderId, pdfUrl]);

  if (loading) {
    return (
      <Button variant="outline" disabled className="flex-1">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        {getLoadingLabel(documentType || initialDocumentType)}
      </Button>
    );
  }

  if (!pdfUrl) {
    return null;
  }

  return (
    <Button variant="outline" asChild className="flex-1">
      <a 
        href={pdfUrl} 
        target="_blank" 
        rel="noopener noreferrer nofollow"
      >
        <FileText className="mr-2 h-4 w-4" />
        {getButtonLabel(documentType)}
      </a>
    </Button>
  );
}
