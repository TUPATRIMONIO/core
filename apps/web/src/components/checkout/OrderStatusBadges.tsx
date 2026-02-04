'use client';

import { Badge } from '@/components/ui/badge';
import { getDocumentStatusInfo } from '@/lib/signing/document-status';
import type { OrderStatus } from '@/lib/checkout/core';

interface OrderStatusBadgesProps {
  orderStatus: OrderStatus;
  signingDocument?: {
    status: string;
    signers_count?: number;
    signed_count?: number;
  } | null;
  className?: string;
  showOnlyDocumentStatus?: boolean; // Para casos donde solo queremos mostrar el estado del documento
}

/**
 * Componente reutilizable que muestra el estado del pedido y opcionalmente el estado del documento de firma asociado
 */
export function OrderStatusBadges({ 
  orderStatus, 
  signingDocument, 
  className = '',
  showOnlyDocumentStatus = false 
}: OrderStatusBadgesProps) {
  // Estados finales del documento que indican que el proceso está completo
  const documentFinalStates = ['completed', 'notarized', 'cancelled', 'rejected', 'ai_rejected', 'notary_rejected'];
  
  // Si la orden está "completed" pero hay un documento en proceso (no finalizado),
  // mostrar "Pagado" en lugar de "Completado" para no confundir al usuario
  const isDocumentInProgress = signingDocument && 
    !documentFinalStates.includes(signingDocument.status);
  
  const effectiveOrderStatus = (orderStatus === 'completed' && isDocumentInProgress) 
    ? 'paid' 
    : orderStatus;
  
  // Configuración de badges para estados de pedido
  const orderStatusConfig: Record<OrderStatus, { label: string; className: string }> = {
    pending_payment: {
      label: 'Pendiente de pago',
      className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
    },
    paid: {
      label: 'Pagado',
      className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
    },
    completed: {
      label: 'Completado',
      className: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
    },
    cancelled: {
      label: 'Cancelado',
      className: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
    },
    refunded: {
      label: 'Reembolsado',
      className: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
    }
  };

  // Determinar si debemos mostrar el estado del documento
  const shouldShowDocumentStatus = signingDocument && 
    (effectiveOrderStatus === 'paid' || effectiveOrderStatus === 'completed') &&
    !['cancelled'].includes(signingDocument.status);

  // Si solo queremos mostrar el estado del documento
  if (showOnlyDocumentStatus && signingDocument) {
    const docInfo = getDocumentStatusInfo(signingDocument.status);
    const signersInfo = signingDocument.signers_count !== undefined && signingDocument.signed_count !== undefined
      ? ` (${signingDocument.signed_count}/${signingDocument.signers_count})`
      : '';
    
    return (
      <Badge className={`${docInfo.bgClass} ${docInfo.textClass} ${docInfo.borderClass} border ${className}`}>
        {docInfo.label}{signersInfo}
      </Badge>
    );
  }

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      {/* Badge del estado del pedido */}
      <Badge className={orderStatusConfig[effectiveOrderStatus].className}>
        {orderStatusConfig[effectiveOrderStatus].label}
      </Badge>

      {/* Badge del estado del documento (solo si aplica) */}
      {shouldShowDocumentStatus && (
        <Badge 
          className={`${getDocumentStatusInfo(signingDocument.status).bgClass} ${getDocumentStatusInfo(signingDocument.status).textClass} ${getDocumentStatusInfo(signingDocument.status).borderClass} border`}
        >
          {getDocumentStatusInfo(signingDocument.status).label}
          {signingDocument.signers_count !== undefined && signingDocument.signed_count !== undefined && (
            <span className="ml-1">
              ({signingDocument.signed_count}/{signingDocument.signers_count})
            </span>
          )}
        </Badge>
      )}
    </div>
  );
}

/**
 * Componente simplificado que solo muestra el badge del estado del pedido
 */
export function OrderStatusBadge({ 
  status, 
  className = '' 
}: { 
  status: OrderStatus; 
  className?: string;
}) {
  const config: Record<OrderStatus, { label: string; className: string }> = {
    pending_payment: {
      label: 'Pendiente',
      className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
    },
    paid: {
      label: 'Pagada',
      className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
    },
    completed: {
      label: 'Completada',
      className: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
    },
    cancelled: {
      label: 'Cancelada',
      className: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
    },
    refunded: {
      label: 'Reembolsada',
      className: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
    }
  };

  return (
    <Badge className={`${config[status].className} ${className}`}>
      {config[status].label}
    </Badge>
  );
}

/**
 * Componente que solo muestra el badge del estado del documento
 */
export function DocumentStatusBadge({ 
  status, 
  signersCount,
  signedCount,
  className = '' 
}: { 
  status: string;
  signersCount?: number;
  signedCount?: number;
  className?: string;
}) {
  const docInfo = getDocumentStatusInfo(status);
  const signersInfo = signersCount !== undefined && signedCount !== undefined
    ? ` (${signedCount}/${signersCount})`
    : '';
  
  return (
    <Badge className={`${docInfo.bgClass} ${docInfo.textClass} ${docInfo.borderClass} border ${className}`}>
      {docInfo.label}{signersInfo}
    </Badge>
  );
}
