import { 
  haulmerClient, 
  HaulmerEmitirResponse, 
  HaulmerReceptor, 
  HaulmerDetalle, 
  HaulmerTotales,
  TipoDTE 
} from './client';
import { createServiceRoleClient } from '@/lib/supabase/server';

const IVA_RATE = 0.19; // 19% IVA Chile

/**
 * Guarda un archivo Base64 en Supabase Storage
 * 
 * @param base64Data - Contenido del archivo en Base64
 * @param fileName - Nombre del archivo
 * @param contentType - Tipo MIME del archivo
 * @returns URL pública del archivo
 */
async function saveToStorage(
  base64Data: string,
  fileName: string,
  contentType: string
): Promise<string> {
  const supabase = createServiceRoleClient();
  
  // Convertir Base64 a Buffer
  const buffer = Buffer.from(base64Data, 'base64');
  
  // Subir a Supabase Storage
  const { data, error } = await supabase.storage
    .from('invoices')
    .upload(fileName, buffer, {
      contentType,
      upsert: true,
    });
  
  if (error) {
    console.error('[saveToStorage] Error subiendo archivo:', {
      fileName,
      error: error.message,
    });
    throw new Error(`Error guardando archivo: ${error.message}`);
  }
  
  // Obtener URL pública
  const { data: publicUrl } = supabase.storage
    .from('invoices')
    .getPublicUrl(fileName);
  
  return publicUrl.publicUrl;
}

/**
 * Interfaz para datos de la orden necesarios para emitir factura
 */
interface OrderDataForInvoice {
  invoiceId: string;
  invoiceNumber: string;
  organizationId: string;
  amount: number;
  currency: string;
  productType: string;
  productData: {
    name: string;
    description?: string;
    credits_amount?: number;
  };
  paymentProvider: string;
  transactionToken?: string;
}

/**
 * Interfaz para datos de la organización (receptor)
 */
interface OrganizationData {
  rut: string; // tax_id
  razonSocial: string; // name
  giro: string;
  direccion: string; // address
  comuna: string;
  email?: string;
}

/**
 * Emite una factura electrónica con Haulmer y guarda los PDFs en Storage
 * 
 * Se llama cuando una orden pasa al estado "completed" y el pago fue con Transbank.
 * 
 * @param orderData - Datos de la orden
 * @param orgData - Datos de la organización (receptor)
 * @param options - Opciones adicionales
 * @param options.updateDatabase - Si true, actualiza la BD directamente (default: true para compatibilidad)
 * @returns Datos de la factura emitida
 */
export async function emitHaulmerInvoice(
  orderData: OrderDataForInvoice,
  orgData: OrganizationData,
  options?: { updateDatabase?: boolean }
): Promise<HaulmerEmitirResponse> {
  const supabase = createServiceRoleClient();
  const shouldUpdateDB = options?.updateDatabase !== false; // Default: true para compatibilidad

  console.log('[emitHaulmerInvoice] Iniciando emisión de factura:', {
    invoiceId: orderData.invoiceId,
    invoiceNumber: orderData.invoiceNumber,
    organizationId: orderData.organizationId,
    amount: orderData.amount,
    updateDatabase: shouldUpdateDB,
  });

  // Verificar que Haulmer está configurado
  if (!haulmerClient.isConfigured()) {
    console.error('[emitHaulmerInvoice] Haulmer no está configurado correctamente');
    throw new Error('Haulmer no está configurado. Revisar variables de entorno.');
  }

  try {
    // Construir datos del receptor
    const receptor: HaulmerReceptor = {
      RUTRecep: orgData.rut,
      RznSocRecep: orgData.razonSocial,
      GiroRecep: orgData.giro || 'SERVICIOS',
      DirRecep: orgData.direccion || 'Sin dirección',
      CmnaRecep: orgData.comuna || 'Santiago',
      CorreoRecep: orgData.email,
    };

    // Construir detalle
    const detalle: HaulmerDetalle[] = [{
      NroLinDet: 1,
      NmbItem: orderData.productData.name || `Compra de ${orderData.productType}`,
      DscItem: orderData.productData.description,
      QtyItem: 1,
      PrcItem: Math.round(orderData.amount),
      MontoItem: Math.round(orderData.amount),
    }];

    // Calcular totales
    const montoNeto = Math.round(orderData.amount / (1 + IVA_RATE));
    const iva = Math.round(montoNeto * IVA_RATE);
    const montoTotal = montoNeto + iva;

    const totales: HaulmerTotales = {
      MntNeto: montoNeto,
      TasaIVA: '19',
      IVA: iva,
      MntTotal: montoTotal,
    };

    // Generar Idempotency Key única para esta factura
    const idempotencyKey = `invoice-${orderData.invoiceId}-${Date.now()}`;

    // Emitir factura con Haulmer
    const haulmerResponse = await haulmerClient.emitirFactura(
      receptor,
      detalle,
      totales,
      {
        idempotencyKey,
        sendEmail: orgData.email ? { to: orgData.email } : undefined,
      }
    );

    console.log('[emitHaulmerInvoice] Factura emitida en Haulmer:', {
      token: haulmerResponse.TOKEN,
      folio: haulmerResponse.FOLIO,
      tienePDF: !!haulmerResponse.PDF,
      tieneXML: !!haulmerResponse.XML,
    });

    // Guardar PDF y XML en Supabase Storage (siempre se guardan, independientemente de updateDatabase)
    let pdfUrl: string | null = null;
    let xmlUrl: string | null = null;

    if (haulmerResponse.PDF && haulmerResponse.FOLIO) {
      const pdfFileName = `haulmer/${orderData.organizationId}/${orderData.invoiceNumber}-${haulmerResponse.FOLIO}.pdf`;
      pdfUrl = await saveToStorage(haulmerResponse.PDF, pdfFileName, 'application/pdf');
      console.log('[emitHaulmerInvoice] PDF guardado:', pdfUrl);
    }

    if (haulmerResponse.XML && haulmerResponse.FOLIO) {
      const xmlFileName = `haulmer/${orderData.organizationId}/${orderData.invoiceNumber}-${haulmerResponse.FOLIO}.xml`;
      xmlUrl = await saveToStorage(haulmerResponse.XML, xmlFileName, 'application/xml');
      console.log('[emitHaulmerInvoice] XML guardado:', xmlUrl);
    }
    
    // Agregar URLs a la respuesta para que el processor las pueda usar
    // Nota: Esto extiende HaulmerEmitirResponse pero no rompe compatibilidad
    (haulmerResponse as any).pdfUrl = pdfUrl;
    (haulmerResponse as any).xmlUrl = xmlUrl;

    // Actualizar factura en nuestra BD con datos externos (solo si se solicita)
    if (shouldUpdateDB) {
      const { data: updatedInvoice, error: updateError } = await supabase
        .from('invoices')
        .update({
          external_provider: 'haulmer',
          external_document_id: haulmerResponse.FOLIO?.toString() || haulmerResponse.TOKEN,
          external_pdf_url: pdfUrl,
          external_xml_url: xmlUrl,
          external_status: 'emitido',
          updated_at: new Date().toISOString(),
        })
        .eq('id', orderData.invoiceId)
        .select()
        .single();

      if (updateError || !updatedInvoice) {
        console.error('[emitHaulmerInvoice] Error actualizando factura en BD:', {
          invoiceId: orderData.invoiceId,
          error: updateError?.message,
        });
        // No lanzar error aquí - la factura ya se emitió en Haulmer
        // Solo logear el error
      }
    }

    console.log('[emitHaulmerInvoice] Factura emitida exitosamente:', {
      invoiceId: orderData.invoiceId,
      folio: haulmerResponse.FOLIO,
      pdfUrl,
      xmlUrl,
      updatedDatabase: shouldUpdateDB,
    });

    return haulmerResponse;
  } catch (error: any) {
    console.error('[emitHaulmerInvoice] Error emitiendo factura:', {
      invoiceId: orderData.invoiceId,
      error: error.message,
    });
    throw error;
  }
}

/**
 * Wrapper para sincronizar/emitir factura de Haulmer
 * Se llama desde invoice-sync.ts cuando el proveedor es Transbank
 * 
 * @param transactionToken - Token de la transacción de Transbank (no usado directamente)
 * @param invoiceId - ID de la factura en nuestra BD
 * @returns Respuesta de Haulmer
 */
export async function syncHaulmerInvoice(
  transactionToken: string,
  invoiceId: string
): Promise<HaulmerEmitirResponse> {
  const supabase = createServiceRoleClient();

  console.log('[syncHaulmerInvoice] Iniciando proceso:', {
    transactionToken: transactionToken.substring(0, 20) + '...',
    invoiceId,
  });

  try {
    // Obtener datos de la factura y orden
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .select(`
        id,
        invoice_number,
        organization_id,
        total,
        currency,
        type,
        organizations (
          id,
          name,
          tax_id,
          address,
          city,
          email
        )
      `)
      .eq('id', invoiceId)
      .single();

    if (invoiceError || !invoice) {
      throw new Error(`Factura no encontrada: ${invoiceError?.message}`);
    }

    // Obtener orden asociada
    const { data: order } = await supabase
      .from('orders')
      .select('product_type, product_data')
      .eq('invoice_id', invoiceId)
      .single();

    const org = invoice.organizations as any;

    // Verificar que la organización tenga RUT
    if (!org?.tax_id) {
      console.warn('[syncHaulmerInvoice] Organización sin RUT:', {
        organizationId: invoice.organization_id,
      });
      throw new Error('La organización debe tener RUT configurado para emitir factura electrónica');
    }

    // Preparar datos para emisión
    const orderData: OrderDataForInvoice = {
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoice_number,
      organizationId: invoice.organization_id,
      amount: invoice.total,
      currency: invoice.currency,
      productType: order?.product_type || invoice.type,
      productData: order?.product_data || { name: 'Servicio' },
      paymentProvider: 'transbank',
      transactionToken,
    };

    const orgData: OrganizationData = {
      rut: org.tax_id,
      razonSocial: org.name,
      giro: 'SERVICIOS', // Por defecto, idealmente obtener de la BD
      direccion: org.address || 'Sin dirección',
      comuna: org.city || 'Santiago',
      email: org.email,
    };

    // Emitir factura
    return await emitHaulmerInvoice(orderData, orgData);
  } catch (error: any) {
    console.error('[syncHaulmerInvoice] Error:', {
      invoiceId,
      error: error.message,
    });
    throw error;
  }
}

