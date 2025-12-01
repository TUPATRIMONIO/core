/**
 * Servicio de Facturación Externa (invoicing)
 * 
 * Este módulo maneja la emisión de documentos tributarios externos:
 * - Facturas/Boletas electrónicas via Haulmer (Chile)
 * - Invoices via Stripe (Internacional)
 * 
 * Acceso:
 * - Usuarios autenticados de TuPatrimonio
 * - Sistemas externos via API Keys
 * 
 * Endpoints:
 * - POST /api/invoicing/documents - Emitir documento
 * - GET /api/invoicing/documents - Listar documentos
 * - GET /api/invoicing/documents/:id - Obtener documento
 * - POST /api/invoicing/documents/:id/void - Anular documento
 * - POST /api/invoicing/customers - Crear customer
 * - GET /api/invoicing/customers - Listar customers
 * - POST /api/invoicing/api-keys - Crear API key
 * - GET /api/invoicing/api-keys - Listar API keys
 */

export * from './types';
export * from './auth';
export * from './api-keys';
export * from './emitter';
