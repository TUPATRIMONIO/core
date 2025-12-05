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
 * Emite un documento tributario con Haulmer (factura o boleta) y guarda los PDFs en Storage
 * 
 * Se llama cuando una orden pasa al estado "completed" y el pago fue con Transbank.
 * 
 * @param orderData - Datos de la orden
 * @param orgData - Datos de la organización (receptor)
 * @param options - Opciones adicionales
 * @param options.updateDatabase - Si true, actualiza la BD directamente (default: true para compatibilidad)
 * @param options.documentType - Tipo de documento: 'factura_electronica' o 'boleta_electronica' (default: 'factura_electronica')
 * @returns Datos del documento emitido
 */
export async function emitHaulmerInvoice(
  orderData: OrderDataForInvoice,
  orgData: OrganizationData,
  options?: { updateDatabase?: boolean; documentType?: 'factura_electronica' | 'boleta_electronica' }
): Promise<HaulmerEmitirResponse> {
  const supabase = createServiceRoleClient();
  const shouldUpdateDB = options?.updateDatabase !== false; // Default: true para compatibilidad
  const documentType = options?.documentType || 'factura_electronica';
  const isBoleta = documentType === 'boleta_electronica';

  console.log('[emitHaulmerInvoice] Iniciando emisión de documento:', {
    orderId: orderData.orderId,
    orderNumber: orderData.orderNumber,
    organizationId: orderData.organizationId,
    amount: orderData.amount,
    documentType,
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

    // Calcular montos según tipo de documento
    // Para FACTURA: el monto del pedido INCLUYE IVA, hay que desglosarlo
    // Para BOLETA: el monto ya incluye IVA y se usa directo
    const montoTotal = Math.round(orderData.amount);
    
    let montoNeto: number;
    let iva: number;
    let precioItem: number;
    
    if (isBoleta) {
      // BOLETA: El precio ya incluye IVA, no se desglosa en el detalle
      // El monto total es el mismo que el precio del item
      montoNeto = Math.round(montoTotal / (1 + IVA_RATE));
      iva = montoTotal - montoNeto;
      precioItem = montoTotal; // Precio con IVA incluido
    } else {
      // FACTURA: Hay que desglosar el IVA
      // El precio en el detalle debe ser NETO (sin IVA)
      montoNeto = Math.round(montoTotal / (1 + IVA_RATE));
      iva = Math.round(montoNeto * IVA_RATE);
      precioItem = montoNeto; // Precio NETO sin IVA
    }
    
    // Para factura, el total debe ser neto + IVA calculado
    const totalFinal = isBoleta ? montoTotal : (montoNeto + iva);

    // Construir detalle
    const detalle: HaulmerDetalle[] = [{
      NroLinDet: 1,
      NmbItem: orderData.productData.name || `Compra de ${orderData.productType}`,
      DscItem: orderData.productData.description,
      QtyItem: 1,
      PrcItem: precioItem,
      MontoItem: precioItem,
    }];

    const totales: HaulmerTotales = {
      MntNeto: montoNeto,
      TasaIVA: '19',
      IVA: iva,
      MntTotal: totalFinal,
    };

    // Generar Idempotency Key única para esta orden
    const idempotencyKey = `order-${orderData.orderId}-${Date.now()}`;

    // Emitir documento con Haulmer según tipo
    const haulmerResponse = isBoleta
      ? await haulmerClient.emitirBoleta(
          receptor,
          detalle,
          totales,
          {
            idempotencyKey,
            sendEmail: orgData.email ? { to: orgData.email } : undefined,
          }
        )
      : await haulmerClient.emitirFactura(
          receptor,
          detalle,
          totales,
          {
            idempotencyKey,
            sendEmail: orgData.email ? { to: orgData.email } : undefined,
          }
        );

    console.log(`[emitHaulmerInvoice] ${isBoleta ? 'Boleta' : 'Factura'} emitida en Haulmer:`, {
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

    console.log(`[emitHaulmerInvoice] ${isBoleta ? 'Boleta' : 'Factura'} emitida exitosamente:`, {
      orderId: orderData.orderId,
      orderNumber: orderData.orderNumber,
      documentType,
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

