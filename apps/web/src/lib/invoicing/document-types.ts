/**
 * Tipos y helpers para el sistema de facturación externa
 */

export type DocumentType = 
  | 'factura_electronica'    // Factura electrónica (Haulmer TipoDTE: 33)
  | 'boleta_electronica'     // Boleta electrónica (Haulmer TipoDTE: 39)
  | 'stripe_invoice';        // Invoice de Stripe

export type ProviderType = 
  | 'haulmer'    // Haulmer/OpenFactura (Chile)
  | 'stripe';    // Stripe (Internacional)

export type RequestStatus = 
  | 'pending'      // Pendiente de procesar
  | 'processing'  // En proceso
  | 'completed'   // Completado exitosamente
  | 'failed';     // Falló

/**
 * Interfaz para solicitud de documento
 */
export interface DocumentRequest {
  id: string;
  order_id: string;
  invoice_id: string;
  organization_id: string;
  document_type: DocumentType;
  provider: ProviderType;
  status: RequestStatus;
  attempts: number;
  max_attempts: number;
  last_error?: string;
  last_error_at?: string;
  request_data: Record<string, any>;
  created_at: string;
  updated_at: string;
  processed_at?: string;
  completed_at?: string;
}

/**
 * Interfaz para documento emitido
 */
export interface IssuedDocument {
  id: string;
  request_id: string;
  order_id: string;
  invoice_id: string;
  organization_id: string;
  document_type: DocumentType;
  provider: ProviderType;
  external_id: string;
  pdf_url?: string;
  xml_url?: string;
  provider_response: Record<string, any>;
  provider_status?: string;
  issued_at: string;
  created_at: string;
}

/**
 * Interfaz para resultado de emisión
 */
export interface EmissionResult {
  external_id: string;
  pdf_url?: string;
  xml_url?: string;
  provider_response: Record<string, any>;
  provider_status?: string;
}

/**
 * Determina el tipo de documento según el país
 */
export function determineDocumentTypeByCountry(countryCode: string): DocumentType {
  // Chile usa factura/boleta electrónica
  if (countryCode === 'CL') {
    return 'factura_electronica';
  }
  
  // Otros países usan Stripe Invoice
  return 'stripe_invoice';
}

/**
 * Determina el proveedor según el tipo de documento
 */
export function determineProviderByDocumentType(documentType: DocumentType): ProviderType {
  if (documentType === 'factura_electronica' || documentType === 'boleta_electronica') {
    return 'haulmer';
  }
  
  if (documentType === 'stripe_invoice') {
    return 'stripe';
  }
  
  throw new Error(`Tipo de documento desconocido: ${documentType}`);
}

