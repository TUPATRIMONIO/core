/**
 * Módulo de facturación externa (invoicing)
 * 
 * Este módulo maneja la emisión de documentos tributarios externos:
 * - Facturas/Boletas electrónicas via Haulmer (Chile)
 * - Invoices via Stripe (Internacional)
 * 
 * Flujo:
 * 1. Cuando una orden cambia a estado "completed", un trigger de BD crea una solicitud
 * 2. El trigger llama al webhook /api/invoicing/process-request via pg_net (si disponible)
 * 3. Si pg_net no está disponible, el cron /api/invoicing/cron procesa solicitudes pendientes
 * 4. El processor determina el proveedor y emite el documento
 * 5. Los resultados se guardan en invoicing.issued_documents y billing.invoices
 * 
 * Configuración en producción:
 * - Configurar CRON_SECRET en variables de entorno para autenticar el cron job
 * - Configurar app.webhook_base_url en PostgreSQL:
 *   SELECT invoicing.set_webhook_url('https://tu-dominio.com');
 */

export * from './document-types';
export { processDocumentRequest } from './processor';

