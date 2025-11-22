import { jsPDF } from 'jspdf';

export interface InvoiceData {
  id: string;
  invoice_number: string;
  status: string;
  type: string;
  subtotal: number;
  tax: number;
  total: number;
  currency: string;
  created_at: string;
  due_date?: string;
  paid_at?: string;
  line_items?: Array<{
    description: string;
    quantity: number;
    unit_price: number;
    total: number;
  }>;
}

export interface OrganizationData {
  name: string;
  email?: string;
  address?: string;
  tax_id?: string;
}

/**
 * Genera un PDF de factura usando jsPDF
 */
export async function generateInvoicePDF(
  invoice: InvoiceData,
  organization: OrganizationData
): Promise<Buffer> {
  try {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    let yPos = margin;

    // Header - TuPatrimonio
    doc.setFillColor(128, 0, 57); // Color de marca #800039
    doc.rect(0, 0, pageWidth, 40, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('TuPatrimonio', margin, 25);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Factura', margin, 35);

    // Información de la factura (derecha)
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text(`Factura ${invoice.invoice_number}`, pageWidth - margin, 25, {
      align: 'right',
    });

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(
      `Fecha: ${new Date(invoice.created_at).toLocaleDateString('es-CL', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })}`,
      pageWidth - margin,
      35,
      { align: 'right' }
    );

    if (invoice.due_date) {
      doc.text(
        `Vence: ${new Date(invoice.due_date).toLocaleDateString('es-CL')}`,
        pageWidth - margin,
        42,
        { align: 'right' }
      );
    }

    // Estado de la factura
    const statusColor = invoice.status === 'paid' 
      ? [34, 197, 94] 
      : invoice.status === 'overdue' 
      ? [239, 68, 68] 
      : [102, 102, 102];
    
    doc.setTextColor(statusColor[0], statusColor[1], statusColor[2]);
    doc.text(
      `Estado: ${getStatusLabel(invoice.status)}`,
      pageWidth - margin,
      invoice.due_date ? 49 : 42,
      { align: 'right' }
    );

    yPos = 60;

    // Información de la organización (cliente)
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Facturar a:', margin, yPos);
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(organization.name, margin, yPos + 8);

    if (organization.email) {
      doc.text(`Email: ${organization.email}`, margin, yPos + 16);
    }
    if (organization.address) {
      doc.text(`Dirección: ${organization.address}`, margin, yPos + 24);
    }
    if (organization.tax_id) {
      doc.text(`RUT: ${organization.tax_id}`, margin, yPos + 32);
    }

    // Tabla de items
    yPos = yPos + 50;
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Detalle de la Factura', margin, yPos);

    yPos += 10;

    // Encabezados de tabla
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(102, 102, 102);
    doc.text('Descripción', margin, yPos);
    doc.text('Cantidad', margin + 100, yPos);
    doc.text('Precio Unit.', margin + 130, yPos);
    doc.text('Total', pageWidth - margin, yPos, { align: 'right' });

    // Línea separadora
    doc.setDrawColor(204, 204, 204);
    doc.setLineWidth(0.5);
    doc.line(margin, yPos + 3, pageWidth - margin, yPos + 3);

    yPos += 8;

    // Items
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    
    if (invoice.line_items && invoice.line_items.length > 0) {
      invoice.line_items.forEach((item) => {
        // Verificar si necesitamos una nueva página
        if (yPos > pageHeight - 40) {
          doc.addPage();
          yPos = margin;
        }

        // Descripción (puede ser multilínea)
        const descriptionLines = doc.splitTextToSize(
          item.description,
          pageWidth - margin - 130 - 30
        );
        
        doc.setFontSize(10);
        doc.text(descriptionLines, margin, yPos);
        
        // Cantidad
        doc.text(item.quantity.toString(), margin + 100, yPos);
        
        // Precio Unitario
        doc.text(
          formatCurrency(item.unit_price, invoice.currency),
          margin + 130,
          yPos
        );
        
        // Total
        doc.text(
          formatCurrency(item.total, invoice.currency),
          pageWidth - margin,
          yPos,
          { align: 'right' }
        );

        // Ajustar posición Y según líneas de descripción
        yPos += Math.max(7, descriptionLines.length * 7);
      });
    } else {
      doc.setFontSize(10);
      doc.setTextColor(102, 102, 102);
      doc.text('No hay items en esta factura', margin, yPos);
      yPos += 10;
    }

    // Totales
    yPos = Math.max(yPos + 10, pageHeight - 60);
    
    // Línea separadora
    doc.setDrawColor(204, 204, 204);
    doc.setLineWidth(0.5);
    doc.line(margin + 100, yPos, pageWidth - margin, yPos);

    yPos += 8;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(102, 102, 102);
    doc.text('Subtotal:', pageWidth - margin - 50, yPos, { align: 'right' });
    doc.text(
      formatCurrency(invoice.subtotal, invoice.currency),
      pageWidth - margin,
      yPos,
      { align: 'right' }
    );

    yPos += 8;

    if (invoice.tax > 0) {
      doc.text('Impuestos:', pageWidth - margin - 50, yPos, { align: 'right' });
      doc.text(
        formatCurrency(invoice.tax, invoice.currency),
        pageWidth - margin,
        yPos,
        { align: 'right' }
      );
      yPos += 8;
    }

    // Línea separadora más gruesa
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(1);
    doc.line(margin + 100, yPos, pageWidth - margin, yPos);

    yPos += 8;

    // Total
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('Total:', pageWidth - margin - 50, yPos, { align: 'right' });
    doc.text(
      formatCurrency(invoice.total, invoice.currency),
      pageWidth - margin,
      yPos,
      { align: 'right' }
    );

    // Footer
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(153, 153, 153);
    doc.text(
      `Generado por TuPatrimonio.app - ${new Date().toLocaleDateString('es-CL')}`,
      pageWidth / 2,
      pageHeight - 10,
      { align: 'center' }
    );

    // Convertir a Buffer
    const pdfOutput = doc.output('arraybuffer');
    return Buffer.from(pdfOutput);
  } catch (error) {
    console.error('Error generando PDF:', error);
    throw error;
  }
}

/**
 * Formatea moneda
 */
function formatCurrency(amount: number, currency: string): string {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: currency,
  }).format(amount);
}

/**
 * Obtiene etiqueta de estado
 */
function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    paid: 'Pagada',
    open: 'Abierta',
    cancelled: 'Cancelada',
    overdue: 'Vencida',
  };
  return labels[status] || status;
}
