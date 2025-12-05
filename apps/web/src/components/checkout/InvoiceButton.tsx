'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { FileText, Loader2 } from 'lucide-react';

interface InvoiceButtonProps {
  orderId: string;
  initialPdfUrl?: string | null;
  initialDocumentNumber?: string | null;
}

export default function InvoiceButton({ 
  orderId, 
  initialPdfUrl,
  initialDocumentNumber 
}: InvoiceButtonProps) {
  const [pdfUrl, setPdfUrl] = useState(initialPdfUrl);
  const [documentNumber, setDocumentNumber] = useState(initialDocumentNumber);
  const [loading, setLoading] = useState(!initialPdfUrl);

  useEffect(() => {
    if (pdfUrl) {
      setLoading(false);
      return;
    }

    // Polling cada 3 segundos para verificar si el invoice está listo
    const checkInvoice = async () => {
      try {
        const response = await fetch(`/api/invoicing/document?order_id=${orderId}`);
        if (response.ok) {
          const data = await response.json();
          if (data.document?.pdf_url) {
            setPdfUrl(data.document.pdf_url);
            setDocumentNumber(data.document.document_number);
            setLoading(false);
          }
        }
      } catch (error) {
        console.error('Error checking invoice:', error);
      }
    };

    // Primera verificación inmediata
    checkInvoice();

    // Polling cada 3 segundos
    const interval = setInterval(checkInvoice, 3000);

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
        Generando Invoice...
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
        Ver Invoice
        {documentNumber && (
          <span className="ml-1 text-xs text-muted-foreground">
            ({documentNumber})
          </span>
        )}
      </a>
    </Button>
  );
}

