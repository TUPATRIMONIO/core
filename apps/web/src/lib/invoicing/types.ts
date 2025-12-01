/**
 * Tipos para el servicio de facturación externa (invoicing)
 */

export type DocumentType = 
  | 'factura_electronica'    // Factura electrónica (Haulmer TipoDTE: 33)
  | 'boleta_electronica'     // Boleta electrónica (Haulmer TipoDTE: 39)
  | 'stripe_invoice';        // Invoice de Stripe

export type DocumentStatus = 
  | 'pending'      // Pendiente de emisión
  | 'processing'  // En proceso
  | 'issued'      // Emitido exitosamente
  | 'failed'      // Falló la emisión
  | 'voided';     // Anulado

export type ProviderType = 
  | 'haulmer'    // Haulmer/OpenFactura (Chile)
  | 'stripe';    // Stripe (Internacional)

export type CustomerType = 
  | 'persona_natural'  // Persona natural
  | 'empresa';         // Empresa

/**
 * Customer (Receptor de documento)
 */
export interface Customer {
  id: string;
  organization_id: string;
  tax_id: string;
  name: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country: string;
  customer_type: CustomerType;
  giro?: string;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

/**
 * Document Item (Línea de detalle)
 */
export interface DocumentItem {
  id?: string;
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
  tax_exempt?: boolean;
  tax_rate?: number;
  metadata?: Record<string, any>;
}

/**
 * Document (Documento tributario)
 */
export interface Document {
  id: string;
  organization_id: string;
  customer_id: string;
  document_number: string;
  document_type: DocumentType;
  provider: ProviderType;
  status: DocumentStatus;
  subtotal: number;
  tax: number;
  total: number;
  currency: string;
  external_id?: string;
  pdf_url?: string;
  xml_url?: string;
  issued_at?: string;
  voided_at?: string;
  order_id?: string;
  metadata: Record<string, any>;
  provider_response: Record<string, any>;
  created_at: string;
  updated_at: string;
}

/**
 * Request para crear documento
 */
export interface CreateDocumentRequest {
  customer: {
    tax_id: string;
    name: string;
    email?: string;
    address?: string;
    city?: string;
    state?: string;
    postal_code?: string;
    country?: string;
    customer_type?: CustomerType;
    giro?: string;
  };
  document_type?: DocumentType; // Si no se especifica, se determina por país
  items: DocumentItem[];
  currency?: string;
  send_email?: boolean;
  order_id?: string;
  metadata?: Record<string, any>;
}

/**
 * Response de documento creado
 */
export interface CreateDocumentResponse {
  document: Document;
  items: DocumentItem[];
  customer: Customer;
}

