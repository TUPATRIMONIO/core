// Helpers y utilidades para el CRM

import { ContactStatus, CompanyType, DealStage, TicketStatus, TicketPriority, QuoteStatus } from '@/types/crm';

/**
 * Obtiene el color para un estado de contacto
 */
export function getContactStatusColor(status: ContactStatus): string {
  const colors: Record<ContactStatus, string> = {
    lead: 'bg-blue-100 text-blue-800',
    qualified: 'bg-purple-100 text-purple-800',
    customer: 'bg-green-100 text-green-800',
    inactive: 'bg-gray-100 text-gray-800',
    lost: 'bg-red-100 text-red-800',
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
}

/**
 * Obtiene el label en español para un estado de contacto
 */
export function getContactStatusLabel(status: ContactStatus): string {
  const labels: Record<ContactStatus, string> = {
    lead: 'Lead',
    qualified: 'Calificado',
    customer: 'Cliente',
    inactive: 'Inactivo',
    lost: 'Perdido',
  };
  return labels[status] || status;
}

/**
 * Obtiene el color para un tipo de empresa
 */
export function getCompanyTypeColor(type: CompanyType): string {
  const colors: Record<CompanyType, string> = {
    prospect: 'bg-blue-100 text-blue-800',
    customer: 'bg-green-100 text-green-800',
    partner: 'bg-purple-100 text-purple-800',
    vendor: 'bg-yellow-100 text-yellow-800',
    competitor: 'bg-red-100 text-red-800',
    other: 'bg-gray-100 text-gray-800',
  };
  return colors[type] || 'bg-gray-100 text-gray-800';
}

/**
 * Obtiene el label en español para un tipo de empresa
 */
export function getCompanyTypeLabel(type: CompanyType): string {
  const labels: Record<CompanyType, string> = {
    prospect: 'Prospecto',
    customer: 'Cliente',
    partner: 'Partner',
    vendor: 'Proveedor',
    competitor: 'Competidor',
    other: 'Otro',
  };
  return labels[type] || type;
}

/**
 * Obtiene el color para un stage de deal
 */
export function getDealStageColor(stage: DealStage): string {
  const colors: Record<DealStage, string> = {
    prospecting: 'bg-gray-100 text-gray-800',
    qualification: 'bg-blue-100 text-blue-800',
    proposal: 'bg-purple-100 text-purple-800',
    negotiation: 'bg-yellow-100 text-yellow-800',
    closed_won: 'bg-green-100 text-green-800',
    closed_lost: 'bg-red-100 text-red-800',
  };
  return colors[stage] || 'bg-gray-100 text-gray-800';
}

/**
 * Obtiene el label en español para un stage de deal
 */
export function getDealStageLabel(stage: DealStage): string {
  const labels: Record<DealStage, string> = {
    prospecting: 'Prospección',
    qualification: 'Calificación',
    proposal: 'Propuesta',
    negotiation: 'Negociación',
    closed_won: 'Ganado',
    closed_lost: 'Perdido',
  };
  return labels[stage] || stage;
}

/**
 * Obtiene el color para un estado de ticket
 */
export function getTicketStatusColor(status: TicketStatus): string {
  const colors: Record<TicketStatus, string> = {
    new: 'bg-blue-100 text-blue-800',
    open: 'bg-yellow-100 text-yellow-800',
    in_progress: 'bg-purple-100 text-purple-800',
    waiting: 'bg-orange-100 text-orange-800',
    resolved: 'bg-green-100 text-green-800',
    closed: 'bg-gray-100 text-gray-800',
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
}

/**
 * Obtiene el label en español para un estado de ticket
 */
export function getTicketStatusLabel(status: TicketStatus): string {
  const labels: Record<TicketStatus, string> = {
    new: 'Nuevo',
    open: 'Abierto',
    in_progress: 'En Progreso',
    waiting: 'Esperando',
    resolved: 'Resuelto',
    closed: 'Cerrado',
  };
  return labels[status] || status;
}

/**
 * Obtiene el color para una prioridad de ticket
 */
export function getTicketPriorityColor(priority: TicketPriority): string {
  const colors: Record<TicketPriority, string> = {
    low: 'bg-gray-100 text-gray-800',
    medium: 'bg-blue-100 text-blue-800',
    high: 'bg-orange-100 text-orange-800',
    urgent: 'bg-red-100 text-red-800',
  };
  return colors[priority] || 'bg-gray-100 text-gray-800';
}

/**
 * Obtiene el label en español para una prioridad de ticket
 */
export function getTicketPriorityLabel(priority: TicketPriority): string {
  const labels: Record<TicketPriority, string> = {
    low: 'Baja',
    medium: 'Media',
    high: 'Alta',
    urgent: 'Urgente',
  };
  return labels[priority] || priority;
}

/**
 * Obtiene el color para un estado de cotización
 */
export function getQuoteStatusColor(status: QuoteStatus): string {
  const colors: Record<QuoteStatus, string> = {
    draft: 'bg-gray-100 text-gray-800',
    sent: 'bg-blue-100 text-blue-800',
    viewed: 'bg-purple-100 text-purple-800',
    accepted: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
    expired: 'bg-orange-100 text-orange-800',
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
}

/**
 * Obtiene el label en español para un estado de cotización
 */
export function getQuoteStatusLabel(status: QuoteStatus): string {
  const labels: Record<QuoteStatus, string> = {
    draft: 'Borrador',
    sent: 'Enviada',
    viewed: 'Vista',
    accepted: 'Aceptada',
    rejected: 'Rechazada',
    expired: 'Expirada',
  };
  return labels[status] || status;
}

/**
 * Formatea un número de moneda
 */
export function formatCurrency(amount: number, currency: string = 'CLP'): string {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: currency,
  }).format(amount);
}

/**
 * Formatea una fecha
 */
export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('es-CL', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(d);
}

/**
 * Formatea una fecha con hora
 */
export function formatDateTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('es-CL', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
}

/**
 * Obtiene el nombre completo de un contacto
 */
export function getContactFullName(contact: { first_name?: string; last_name?: string; full_name?: string }): string {
  if (contact.full_name) return contact.full_name;
  if (contact.first_name && contact.last_name) {
    return `${contact.first_name} ${contact.last_name}`;
  }
  return contact.first_name || contact.last_name || 'Sin nombre';
}


