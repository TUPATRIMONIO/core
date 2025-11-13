/**
 * Helpers del CRM
 * Funciones utilitarias para el sistema CRM
 */

import { createClient } from '@/lib/supabase/server';
import type { ContactStatus, CompanyType, DealStage, TicketStatus, TicketPriority } from '@/types/crm';

/**
 * Obtiene el ID de la organización activa del usuario
 */
export async function getUserOrganizationId(userId: string): Promise<string | null> {
  const supabase = await createClient();
  
  const { data } = await supabase
    .from('organization_users')
    .select('organization_id')
    .eq('user_id', userId)
    .eq('status', 'active')
    .single();
  
  return data?.organization_id || null;
}

/**
 * Verifica si el usuario puede acceder al CRM
 */
export async function canAccessCRM(userId: string): Promise<boolean> {
  const supabase = await createClient();
  
  const { data } = await supabase.rpc('can_access_crm', {
    user_id: userId
  });
  
  return data || false;
}

/**
 * Verifica si el usuario tiene un permiso específico
 */
export async function hasPermission(
  userId: string,
  resource: 'contacts' | 'companies' | 'deals' | 'tickets' | 'products' | 'quotes',
  action: 'view' | 'create' | 'edit' | 'delete'
): Promise<boolean> {
  const supabase = await createClient();
  
  // Obtener rol del usuario en su org
  const { data: orgUser } = await supabase
    .from('organization_users')
    .select(`
      role:roles(slug, level, permissions)
    `)
    .eq('user_id', userId)
    .eq('status', 'active')
    .single();
  
  if (!orgUser || !orgUser.role) return false;
  
  const role = orgUser.role as any;
  const permissions = role.permissions as any;
  
  // Admin o superior tiene acceso a todo
  if (role.level >= 7) return true;
  
  // Verificar permisos específicos en el rol
  return permissions?.crm?.[resource]?.[action] === true ||
         permissions?.crm?.[resource]?.['*'] === true;
}

/**
 * Formatea currency según locale
 */
export function formatCurrency(
  amount: number,
  currency: string = 'CLP',
  locale: string = 'es-CL'
): string {
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  } catch (error) {
    // Fallback si el currency no es válido
    return `${currency} ${amount.toLocaleString(locale)}`;
  }
}

/**
 * Formatea fecha relativa (hace 2 horas, hace 3 días, etc.)
 */
export function formatRelativeTime(date: string | Date): string {
  const now = new Date();
  const past = new Date(date);
  const diffMs = now.getTime() - past.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffSecs < 60) return 'Hace un momento';
  if (diffMins < 60) return `Hace ${diffMins} ${diffMins === 1 ? 'minuto' : 'minutos'}`;
  if (diffHours < 24) return `Hace ${diffHours} ${diffHours === 1 ? 'hora' : 'horas'}`;
  if (diffDays < 7) return `Hace ${diffDays} ${diffDays === 1 ? 'día' : 'días'}`;
  if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return `Hace ${weeks} ${weeks === 1 ? 'semana' : 'semanas'}`;
  }
  if (diffDays < 365) {
    const months = Math.floor(diffDays / 30);
    return `Hace ${months} ${months === 1 ? 'mes' : 'meses'}`;
  }
  const years = Math.floor(diffDays / 365);
  return `Hace ${years} ${years === 1 ? 'año' : 'años'}`;
}

/**
 * Obtiene el color para un status de contacto
 */
export function getContactStatusColor(status: ContactStatus): string {
  const colors: Record<ContactStatus, string> = {
    lead: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    qualified: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
    customer: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    inactive: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
    lost: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
  };
  return colors[status] || colors.lead;
}

/**
 * Obtiene el color para un tipo de empresa
 */
export function getCompanyTypeColor(type: CompanyType): string {
  const colors: Record<CompanyType, string> = {
    prospect: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    customer: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    partner: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
    vendor: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
    competitor: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    other: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
  };
  return colors[type] || colors.prospect;
}

/**
 * Obtiene el color para un stage de deal
 */
export function getDealStageColor(stage: DealStage): string {
  const colors: Record<DealStage, string> = {
    prospecting: 'bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-200',
    qualification: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    proposal: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    negotiation: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
    closed_won: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    closed_lost: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
  };
  return colors[stage] || colors.prospecting;
}

/**
 * Obtiene el color para un status de ticket
 */
export function getTicketStatusColor(status: TicketStatus): string {
  const colors: Record<TicketStatus, string> = {
    new: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    open: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
    in_progress: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    waiting: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
    resolved: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    closed: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
  };
  return colors[status] || colors.new;
}

/**
 * Obtiene el color para una prioridad de ticket
 */
export function getTicketPriorityColor(priority: TicketPriority): string {
  const colors: Record<TicketPriority, string> = {
    low: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
    medium: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    high: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
    urgent: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
  };
  return colors[priority] || colors.medium;
}

/**
 * Obtiene el color para un status de cotización
 */
export function getQuoteStatusColor(status: QuoteStatus): string {
  const colors: Record<QuoteStatus, string> = {
    draft: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
    sent: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    viewed: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
    accepted: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    rejected: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    expired: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
  };
  return colors[status] || colors.draft;
}

/**
 * Obtiene el label traducido para un status
 */
export function getContactStatusLabel(status: ContactStatus): string {
  const labels: Record<ContactStatus, string> = {
    lead: 'Lead',
    qualified: 'Calificado',
    customer: 'Cliente',
    inactive: 'Inactivo',
    lost: 'Perdido'
  };
  return labels[status] || status;
}

export function getCompanyTypeLabel(type: CompanyType): string {
  const labels: Record<CompanyType, string> = {
    prospect: 'Prospecto',
    customer: 'Cliente',
    partner: 'Partner',
    vendor: 'Proveedor',
    competitor: 'Competidor',
    other: 'Otro'
  };
  return labels[type] || type;
}

export function getDealStageLabel(stage: DealStage): string {
  const labels: Record<DealStage, string> = {
    prospecting: 'Prospección',
    qualification: 'Calificación',
    proposal: 'Propuesta',
    negotiation: 'Negociación',
    closed_won: 'Ganado',
    closed_lost: 'Perdido'
  };
  return labels[stage] || stage;
}

export function getTicketStatusLabel(status: TicketStatus): string {
  const labels: Record<TicketStatus, string> = {
    new: 'Nuevo',
    open: 'Abierto',
    in_progress: 'En Progreso',
    waiting: 'Esperando',
    resolved: 'Resuelto',
    closed: 'Cerrado'
  };
  return labels[status] || status;
}

export function getTicketPriorityLabel(priority: TicketPriority): string {
  const labels: Record<TicketPriority, string> = {
    low: 'Baja',
    medium: 'Media',
    high: 'Alta',
    urgent: 'Urgente'
  };
  return labels[priority] || priority;
}


