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
  orderId: string;
  orderNumber: string;
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
    orderId: orderData.orderId,
    orderNumber: orderData.orderNumber,
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

    // Generar Idempotency Key única para esta orden
    const idempotencyKey = `order-${orderData.orderId}-${Date.now()}`;

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
      const pdfFileName = `haulmer/${orderData.organizationId}/${orderData.orderNumber}-${haulmerResponse.FOLIO}.pdf`;
      pdfUrl = await saveToStorage(haulmerResponse.PDF, pdfFileName, 'application/pdf');
      console.log('[emitHaulmerInvoice] PDF guardado:', pdfUrl);
    }

    if (haulmerResponse.XML && haulmerResponse.FOLIO) {
      const xmlFileName = `haulmer/${orderData.organizationId}/${orderData.orderNumber}-${haulmerResponse.FOLIO}.xml`;
      xmlUrl = await saveToStorage(haulmerResponse.XML, xmlFileName, 'application/xml');
      console.log('[emitHaulmerInvoice] XML guardado:', xmlUrl);
    }
    
    // Agregar URLs a la respuesta para que el processor las pueda usar
    // Nota: Esto extiende HaulmerEmitirResponse pero no rompe compatibilidad
    (haulmerResponse as any).pdfUrl = pdfUrl;
    (haulmerResponse as any).xmlUrl = xmlUrl;

    // Los datos del documento tributario se guardarán en invoicing.documents
    // cuando el processor procese la solicitud de emisión

    console.log('[emitHaulmerInvoice] Factura emitida exitosamente:', {
      orderId: orderData.orderId,
      orderNumber: orderData.orderNumber,
      folio: haulmerResponse.FOLIO,
      pdfUrl,
      xmlUrl,
      updatedDatabase: shouldUpdateDB,
    });

    return haulmerResponse;
  } catch (error: any) {
    console.error('[emitHaulmerInvoice] Error emitiendo factura:', {
      orderId: orderData.orderId,
      orderNumber: orderData.orderNumber,
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
 * @param orderId - ID de la orden en nuestra BD
 * @returns Respuesta de Haulmer
 */
export async function syncHaulmerInvoice(
  transactionToken: string,
  orderId: string
): Promise<HaulmerEmitirResponse> {
  const supabase = createServiceRoleClient();

  console.log('[syncHaulmerInvoice] Iniciando proceso:', {
    transactionToken: transactionToken.substring(0, 20) + '...',
    orderId,
  });

  try {
    // Obtener datos de la orden
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      throw new Error(`Orden no encontrada: ${orderError?.message}`);
    }

    // Obtener organización
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .select('id, name, tax_id, address, city, email')
      .eq('id', order.organization_id)
      .single();

    if (orgError || !org) {
      throw new Error(`Organización no encontrada: ${orgError?.message}`);
    }

    // Verificar que la organización tenga RUT
    if (!org.tax_id) {
      console.warn('[syncHaulmerInvoice] Organización sin RUT:', {
        organizationId: order.organization_id,
      });
      throw new Error('La organización debe tener RUT configurado para emitir factura electrónica');
    }

    // Preparar datos para emisión
    const productData = order.product_data as any || { name: 'Servicio' };
    const orderData: OrderDataForInvoice = {
      orderId: order.id,
      orderNumber: order.order_number,
      organizationId: order.organization_id,
      amount: order.amount,
      currency: order.currency,
      productType: order.product_type,
      productData: productData,
      paymentProvider: 'transbank',
      transactionToken,
    };

    const orgData: OrganizationData = {
      rut: org.tax_id,
      razonSocial: org.name,
      giro: 'SERVICIOS', // Por defecto, idealmente obtener de la BD
      direccion: org.address || 'Sin dirección',
      comuna: org.city || 'Santiago',
      email: org.email || undefined,
    };

    // Emitir factura
    return await emitHaulmerInvoice(orderData, orgData);
  } catch (error: any) {
    console.error('[syncHaulmerInvoice] Error:', {
      orderId,
      error: error.message,
    });
    throw error;
  }
}

