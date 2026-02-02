/**
 * Estados de documentos de firma y sus etiquetas legibles
 * Este archivo centraliza toda la lógica de estados para mantener consistencia en la UI
 */

export type DocumentStatus =
  | 'draft'
  | 'pending_review'
  | 'pending_ai_review'
  | 'manual_review'
  | 'approved'
  | 'ai_rejected'
  | 'rejected'
  | 'needs_correction'
  | 'pending_signature'
  | 'partially_signed'
  | 'signed'
  | 'pending_notary'
  | 'notary_observed'
  | 'notary_rejected'
  | 'notarized'
  | 'completed'
  | 'cancelled'

export interface StatusInfo {
  label: string
  description: string
  color: 'default' | 'warning' | 'success' | 'destructive' | 'info' | 'purple' | 'orange' | 'indigo'
  bgClass: string
  textClass: string
  borderClass: string
}

/**
 * Obtiene la información completa de un estado de documento
 */
export function getDocumentStatusInfo(status: string): StatusInfo {
  switch (status) {
    case 'draft':
      return {
        label: 'Borrador',
        description: 'El documento está en borrador y aún no ha sido enviado',
        color: 'default',
        bgClass: 'bg-gray-100',
        textClass: 'text-gray-800',
        borderClass: 'border-gray-200',
      }

    case 'pending_review':
      return {
        label: 'Esperando revisión',
        description: 'El documento está esperando la revisión de un revisor asignado',
        color: 'orange',
        bgClass: 'bg-orange-100',
        textClass: 'text-orange-800',
        borderClass: 'border-orange-200',
      }

    case 'pending_ai_review':
      return {
        label: 'Revisión IA',
        description: 'El documento está siendo revisado por inteligencia artificial',
        color: 'purple',
        bgClass: 'bg-purple-100',
        textClass: 'text-purple-800',
        borderClass: 'border-purple-200',
      }

    case 'manual_review':
      return {
        label: 'En revisión manual',
        description: 'El documento requiere revisión por parte de nuestro equipo antes de continuar',
        color: 'orange',
        bgClass: 'bg-orange-100',
        textClass: 'text-orange-800',
        borderClass: 'border-orange-200',
      }

    case 'approved':
      return {
        label: 'Aprobado',
        description: 'El documento ha sido aprobado y está listo para enviar a firma',
        color: 'info',
        bgClass: 'bg-blue-100',
        textClass: 'text-blue-800',
        borderClass: 'border-blue-200',
      }

    case 'ai_rejected':
      return {
        label: 'Rechazado por IA',
        description: 'La revisión de IA encontró problemas que deben corregirse',
        color: 'destructive',
        bgClass: 'bg-red-100',
        textClass: 'text-red-800',
        borderClass: 'border-red-200',
      }

    case 'rejected':
      return {
        label: 'Rechazado',
        description: 'El documento ha sido rechazado por un revisor',
        color: 'destructive',
        bgClass: 'bg-red-100',
        textClass: 'text-red-800',
        borderClass: 'border-red-200',
      }

    case 'needs_correction':
      return {
        label: 'Requiere corrección',
        description: 'El documento necesita correcciones antes de continuar',
        color: 'warning',
        bgClass: 'bg-amber-100',
        textClass: 'text-amber-800',
        borderClass: 'border-amber-200',
      }

    case 'pending_signature':
      return {
        label: 'Esperando firmas',
        description: 'El documento ha sido enviado a los firmantes y está esperando sus firmas',
        color: 'warning',
        bgClass: 'bg-yellow-100',
        textClass: 'text-yellow-800',
        borderClass: 'border-yellow-200',
      }

    case 'partially_signed':
      return {
        label: 'Firmando',
        description: 'Algunos firmantes ya han firmado, pero faltan más firmas',
        color: 'indigo',
        bgClass: 'bg-indigo-100',
        textClass: 'text-indigo-800',
        borderClass: 'border-indigo-200',
      }

    case 'signed':
      return {
        label: 'Firmado',
        description: 'Todos los firmantes han completado su firma',
        color: 'success',
        bgClass: 'bg-green-100',
        textClass: 'text-green-800',
        borderClass: 'border-green-200',
      }

    case 'pending_notary':
      return {
        label: 'En notaría',
        description: 'El documento ha sido enviado a la notaría para su procesamiento',
        color: 'purple',
        bgClass: 'bg-purple-100',
        textClass: 'text-purple-800',
        borderClass: 'border-purple-200',
      }

    case 'notary_observed':
      return {
        label: 'Observado por notaría',
        description: 'La notaría ha solicitado observaciones sobre el documento',
        color: 'orange',
        bgClass: 'bg-orange-100',
        textClass: 'text-orange-800',
        borderClass: 'border-orange-200',
      }

    case 'notary_rejected':
      return {
        label: 'Rechazado por notaría',
        description: 'La notaría ha rechazado el documento',
        color: 'destructive',
        bgClass: 'bg-red-100',
        textClass: 'text-red-800',
        borderClass: 'border-red-200',
      }

    case 'notarized':
      return {
        label: 'Notariado',
        description: 'El documento ha sido notariado exitosamente',
        color: 'success',
        bgClass: 'bg-emerald-100',
        textClass: 'text-emerald-800',
        borderClass: 'border-emerald-200',
      }

    case 'completed':
      return {
        label: 'Completado',
        description: 'El proceso del documento ha sido completado exitosamente',
        color: 'success',
        bgClass: 'bg-green-600',
        textClass: 'text-white',
        borderClass: 'border-green-700',
      }

    case 'cancelled':
      return {
        label: 'Cancelado',
        description: 'El documento ha sido cancelado',
        color: 'default',
        bgClass: 'bg-gray-100',
        textClass: 'text-gray-600',
        borderClass: 'border-gray-200',
      }

    default:
      return {
        label: status,
        description: 'Estado desconocido',
        color: 'default',
        bgClass: 'bg-gray-100',
        textClass: 'text-gray-800',
        borderClass: 'border-gray-200',
      }
  }
}

/**
 * Obtiene solo la etiqueta legible de un estado
 */
export function getDocumentStatusLabel(status: string): string {
  return getDocumentStatusInfo(status).label
}

/**
 * Obtiene la descripción de un estado
 */
export function getDocumentStatusDescription(status: string): string {
  return getDocumentStatusInfo(status).description
}

/**
 * Determina el siguiente paso en el flujo según el estado actual
 */
export function getNextStepMessage(status: string, notaryService: string = 'none'): string | null {
  switch (status) {
    case 'draft':
      return 'Envía el documento para iniciar el proceso de firma'
    case 'pending_review':
      return 'Esperando que los revisores aprueben el documento'
    case 'pending_ai_review':
      return 'La IA está analizando tu documento'
    case 'manual_review':
      return 'Nuestro equipo está revisando tu documento. Te notificaremos cuando esté listo.'
    case 'approved':
      return 'Puedes enviar el documento a los firmantes'
    case 'pending_signature':
      return 'Los firmantes recibirán un enlace para firmar'
    case 'partially_signed':
      return 'Esperando que los demás firmantes completen su firma'
    case 'signed':
      if (notaryService !== 'none') {
        return 'Todas las firmas completadas. Enviando a notaría...'
      }
      return 'Proceso de firma completado'
    case 'pending_notary':
      return 'La notaría está procesando tu documento'
    case 'notary_observed':
      return 'Revisando observaciones de la notaría'
    case 'notarized':
    case 'completed':
      return null // No hay siguiente paso
    default:
      return null
  }
}

/**
 * Determina si un documento está en un estado editable
 */
export function isDocumentEditable(status: string): boolean {
  return !['signed', 'notarized', 'completed', 'cancelled', 'rejected', 'notary_rejected', 'ai_rejected'].includes(status)
}

/**
 * Determina si un documento está en proceso de firma
 */
export function isInSigningProcess(status: string): boolean {
  return ['pending_signature', 'partially_signed', 'signed'].includes(status)
}

/**
 * Determina si un documento está en proceso de notaría
 */
export function isInNotaryProcess(status: string): boolean {
  return ['pending_notary', 'notary_observed', 'notarized'].includes(status)
}

/**
 * Obtiene el orden de los estados para ordenar documentos
 */
export function getStatusOrder(status: string): number {
  const order: Record<string, number> = {
    'draft': 0,
    'pending_review': 1,
    'pending_ai_review': 1,
    'manual_review': 1,
    'approved': 2,
    'pending_signature': 3,
    'partially_signed': 4,
    'signed': 5,
    'pending_notary': 6,
    'notary_observed': 7,
    'notarized': 8,
    'completed': 9,
    'rejected': 10,
    'ai_rejected': 10,
    'notary_rejected': 10,
    'needs_correction': 10,
    'cancelled': 11,
  }
  return order[status] ?? 99
}
