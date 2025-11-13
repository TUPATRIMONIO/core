/**
 * StatusBadge Component
 * Badge reutilizable para mostrar estados con colores
 */

import { Badge } from '@/components/ui/badge';
import { 
  getContactStatusColor,
  getContactStatusLabel,
  getCompanyTypeColor,
  getCompanyTypeLabel,
  getDealStageColor,
  getDealStageLabel,
  getTicketStatusColor,
  getTicketStatusLabel,
  getTicketPriorityColor,
  getTicketPriorityLabel,
  getQuoteStatusColor
} from '@/lib/crm/helpers';
import type { 
  ContactStatus, 
  CompanyType, 
  DealStage, 
  TicketStatus, 
  TicketPriority,
  QuoteStatus 
} from '@/types/crm';

interface StatusBadgeProps {
  type: 'contact' | 'company' | 'deal' | 'ticket-status' | 'ticket-priority' | 'quote';
  value: ContactStatus | CompanyType | DealStage | TicketStatus | TicketPriority | QuoteStatus;
  className?: string;
}

export function StatusBadge({ type, value, className = '' }: StatusBadgeProps) {
  let colorClass = '';
  let label = '';

  switch (type) {
    case 'contact':
      colorClass = getContactStatusColor(value as ContactStatus);
      label = getContactStatusLabel(value as ContactStatus);
      break;
    case 'company':
      colorClass = getCompanyTypeColor(value as CompanyType);
      label = getCompanyTypeLabel(value as CompanyType);
      break;
    case 'deal':
      colorClass = getDealStageColor(value as DealStage);
      label = getDealStageLabel(value as DealStage);
      break;
    case 'ticket-status':
      colorClass = getTicketStatusColor(value as TicketStatus);
      label = getTicketStatusLabel(value as TicketStatus);
      break;
    case 'ticket-priority':
      colorClass = getTicketPriorityColor(value as TicketPriority);
      label = getTicketPriorityLabel(value as TicketPriority);
      break;
    case 'quote':
      colorClass = getQuoteStatusColor(value as QuoteStatus);
      label = value;
      break;
  }

  return (
    <Badge className={`${colorClass} border-0 font-medium ${className}`}>
      {label}
    </Badge>
  );
}


