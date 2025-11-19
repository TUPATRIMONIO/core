/**
 * Funciones de formateo para el CRM
 */

/**
 * Formatea un número como moneda en pesos chilenos
 * @param amount - Monto a formatear
 * @returns String con el formato de moneda
 */
export function formatCurrency(amount: number | null | undefined): string {
  if (amount === null || amount === undefined) {
    return '$0'
  }

  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount)
}

/**
 * Formatea una fecha a tiempo relativo (ej: "hace 2 horas")
 * @param date - Fecha a formatear
 * @returns String con el tiempo relativo
 */
export function formatRelativeTime(date: string | Date | null | undefined): string {
  if (!date) {
    return 'Fecha desconocida'
  }

  const now = new Date()
  const targetDate = typeof date === 'string' ? new Date(date) : date
  const diffMs = now.getTime() - targetDate.getTime()
  const diffSec = Math.floor(diffMs / 1000)
  const diffMin = Math.floor(diffSec / 60)
  const diffHour = Math.floor(diffMin / 60)
  const diffDay = Math.floor(diffHour / 24)

  if (diffSec < 60) {
    return 'Hace un momento'
  } else if (diffMin < 60) {
    return `Hace ${diffMin} ${diffMin === 1 ? 'minuto' : 'minutos'}`
  } else if (diffHour < 24) {
    return `Hace ${diffHour} ${diffHour === 1 ? 'hora' : 'horas'}`
  } else if (diffDay < 7) {
    return `Hace ${diffDay} ${diffDay === 1 ? 'día' : 'días'}`
  } else if (diffDay < 30) {
    const weeks = Math.floor(diffDay / 7)
    return `Hace ${weeks} ${weeks === 1 ? 'semana' : 'semanas'}`
  } else if (diffDay < 365) {
    const months = Math.floor(diffDay / 30)
    return `Hace ${months} ${months === 1 ? 'mes' : 'meses'}`
  } else {
    const years = Math.floor(diffDay / 365)
    return `Hace ${years} ${years === 1 ? 'año' : 'años'}`
  }
}

/**
 * Formatea una fecha en formato legible
 * @param date - Fecha a formatear
 * @returns String con la fecha formateada
 */
export function formatDate(date: string | Date | null | undefined): string {
  if (!date) {
    return 'Sin fecha'
  }

  const targetDate = typeof date === 'string' ? new Date(date) : date

  return new Intl.DateTimeFormat('es-CL', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(targetDate)
}

/**
 * Formatea una fecha con hora
 * @param date - Fecha a formatear
 * @returns String con la fecha y hora formateada
 */
export function formatDateTime(date: string | Date | null | undefined): string {
  if (!date) {
    return 'Sin fecha'
  }

  const targetDate = typeof date === 'string' ? new Date(date) : date

  return new Intl.DateTimeFormat('es-CL', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(targetDate)
}

/**
 * Formatea un número de teléfono chileno
 * @param phone - Número de teléfono
 * @returns String con el teléfono formateado
 */
export function formatPhone(phone: string | null | undefined): string {
  if (!phone) {
    return ''
  }

  // Remover todo lo que no sea dígitos
  const cleaned = phone.replace(/\D/g, '')

  // Formato chileno: +56 9 1234 5678
  if (cleaned.length === 11 && cleaned.startsWith('56')) {
    return `+${cleaned.slice(0, 2)} ${cleaned.slice(2, 3)} ${cleaned.slice(3, 7)} ${cleaned.slice(7)}`
  } else if (cleaned.length === 9) {
    return `${cleaned.slice(0, 1)} ${cleaned.slice(1, 5)} ${cleaned.slice(5)}`
  }

  return phone
}

/**
 * Formatea un RUT chileno
 * @param rut - RUT a formatear
 * @returns String con el RUT formateado
 */
export function formatRUT(rut: string | null | undefined): string {
  if (!rut) {
    return ''
  }

  // Remover puntos y guiones
  const cleaned = rut.replace(/\./g, '').replace(/-/g, '')

  if (cleaned.length < 2) {
    return rut
  }

  // Obtener dígito verificador
  const dv = cleaned.slice(-1)
  const number = cleaned.slice(0, -1)

  // Formatear con puntos
  const formatted = number.replace(/\B(?=(\d{3})+(?!\d))/g, '.')

  return `${formatted}-${dv}`
}

/**
 * Obtiene el color para el estado de un contacto
 * @param status - Estado del contacto
 * @returns String con la clase de color de Tailwind
 */
export function getContactStatusColor(status: string | null | undefined): string {
  switch (status) {
    case 'active':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
    case 'inactive':
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
    case 'lead':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
    case 'customer':
      return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300'
    case 'prospect':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
  }
}

/**
 * Obtiene la etiqueta para el estado de un contacto
 * @param status - Estado del contacto
 * @returns String con la etiqueta en español
 */
export function getContactStatusLabel(status: string | null | undefined): string {
  switch (status) {
    case 'active':
      return 'Activo'
    case 'inactive':
      return 'Inactivo'
    case 'lead':
      return 'Lead'
    case 'customer':
      return 'Cliente'
    case 'prospect':
      return 'Prospecto'
    default:
      return 'Desconocido'
  }
}

/**
 * Obtiene el color para el tipo de empresa
 * @param type - Tipo de empresa
 * @returns String con la clase de color de Tailwind
 */
export function getCompanyTypeColor(type: string | null | undefined): string {
  switch (type) {
    case 'client':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
    case 'prospect':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
    case 'partner':
      return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300'
    case 'vendor':
      return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300'
    case 'competitor':
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
  }
}

/**
 * Obtiene la etiqueta para el tipo de empresa
 * @param type - Tipo de empresa
 * @returns String con la etiqueta en español
 */
export function getCompanyTypeLabel(type: string | null | undefined): string {
  switch (type) {
    case 'client':
      return 'Cliente'
    case 'prospect':
      return 'Prospecto'
    case 'partner':
      return 'Socio'
    case 'vendor':
      return 'Proveedor'
    case 'competitor':
      return 'Competidor'
    default:
      return 'Otro'
  }
}

/**
 * Obtiene el color para la etapa de un deal
 * @param stage - Etapa del deal
 * @returns String con la clase de color de Tailwind
 */
export function getDealStageColor(stage: string | null | undefined): string {
  switch (stage) {
    case 'lead':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
    case 'qualified':
      return 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-300'
    case 'proposal':
      return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300'
    case 'negotiation':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
    case 'closed_won':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
    case 'closed_lost':
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
  }
}

/**
 * Obtiene la etiqueta para la etapa de un deal
 * @param stage - Etapa del deal
 * @returns String con la etiqueta en español
 */
export function getDealStageLabel(stage: string | null | undefined): string {
  switch (stage) {
    case 'lead':
      return 'Lead'
    case 'qualified':
      return 'Calificado'
    case 'proposal':
      return 'Propuesta'
    case 'negotiation':
      return 'Negociación'
    case 'closed_won':
      return 'Ganado'
    case 'closed_lost':
      return 'Perdido'
    default:
      return 'Desconocido'
  }
}

/**
 * Obtiene el color para el estado de un ticket
 * @param status - Estado del ticket
 * @returns String con la clase de color de Tailwind
 */
export function getTicketStatusColor(status: string | null | undefined): string {
  switch (status) {
    case 'open':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
    case 'in_progress':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
    case 'pending':
      return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300'
    case 'resolved':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
    case 'closed':
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
  }
}

/**
 * Obtiene la etiqueta para el estado de un ticket
 * @param status - Estado del ticket
 * @returns String con la etiqueta en español
 */
export function getTicketStatusLabel(status: string | null | undefined): string {
  switch (status) {
    case 'open':
      return 'Abierto'
    case 'in_progress':
      return 'En Progreso'
    case 'pending':
      return 'Pendiente'
    case 'resolved':
      return 'Resuelto'
    case 'closed':
      return 'Cerrado'
    default:
      return 'Desconocido'
  }
}

/**
 * Obtiene el color para la prioridad
 * @param priority - Prioridad
 * @returns String con la clase de color de Tailwind
 */
export function getPriorityColor(priority: string | null | undefined): string {
  switch (priority) {
    case 'low':
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
    case 'medium':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
    case 'high':
      return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300'
    case 'urgent':
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
  }
}

/**
 * Obtiene la etiqueta para la prioridad
 * @param priority - Prioridad
 * @returns String con la etiqueta en español
 */
export function getPriorityLabel(priority: string | null | undefined): string {
  switch (priority) {
    case 'low':
      return 'Baja'
    case 'medium':
      return 'Media'
    case 'high':
      return 'Alta'
    case 'urgent':
      return 'Urgente'
    default:
      return 'Sin prioridad'
  }
}

// Alias para mantener compatibilidad con StatusBadge
export const getTicketPriorityColor = getPriorityColor
export const getTicketPriorityLabel = getPriorityLabel

/**
 * Obtiene el color para el estado de una cotización
 * @param status - Estado de la cotización
 * @returns String con la clase de color de Tailwind
 */
export function getQuoteStatusColor(status: string | null | undefined): string {
  switch (status) {
    case 'draft':
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
    case 'sent':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
    case 'viewed':
      return 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-300'
    case 'accepted':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
    case 'rejected':
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
    case 'expired':
      return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300'
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
  }
}

/**
 * Obtiene la etiqueta para el estado de una cotización
 * @param status - Estado de la cotización
 * @returns String con la etiqueta en español
 */
export function getQuoteStatusLabel(status: string | null | undefined): string {
  switch (status) {
    case 'draft':
      return 'Borrador'
    case 'sent':
      return 'Enviada'
    case 'viewed':
      return 'Vista'
    case 'accepted':
      return 'Aceptada'
    case 'rejected':
      return 'Rechazada'
    case 'expired':
      return 'Expirada'
    default:
      return 'Desconocido'
  }
}

