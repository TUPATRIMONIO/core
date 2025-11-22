/**
 * Calcula el costo en créditos de una operación de IA
 */
export interface AICostParams {
  tokens?: number;
  pages?: number;
  documents?: number;
}

/**
 * Calcula costo de mensaje de chat básico
 */
export function calculateChatMessageCost(tokens: number = 0): number {
  // 0.5 créditos por 1K tokens (redondeado hacia arriba)
  const tokenThousands = Math.ceil(tokens / 1000);
  return tokenThousands * 0.5;
}

/**
 * Calcula costo de mensaje de chat con base de conocimiento
 */
export function calculateChatMessageWithKBCost(tokens: number = 0): number {
  // 1.0 créditos por 1K tokens (redondeado hacia arriba)
  const tokenThousands = Math.ceil(tokens / 1000);
  return tokenThousands * 1.0;
}

/**
 * Calcula costo de revisión de página de documento
 */
export function calculateDocumentReviewPageCost(pages: number = 1): number {
  // 2 créditos por página
  return pages * 2.0;
}

/**
 * Calcula costo de revisión completa de documento
 */
export function calculateDocumentReviewFullCost(pages: number = 1): number {
  // 10 créditos base + 2 por página adicional después de la primera
  if (pages <= 1) {
    return 10.0;
  }
  return 10.0 + (pages - 1) * 2.0;
}

/**
 * Calcula costo de comparación de documentos
 */
export function calculateDocumentCompareCost(documents: number = 2): number {
  // 15 créditos base por comparación
  return 15.0;
}

/**
 * Calcula costo según código de servicio
 */
export function calculateAICost(
  serviceCode: string,
  params: AICostParams = {}
): number {
  switch (serviceCode) {
    case 'ai_chat_message':
      return calculateChatMessageCost(params.tokens || 0);
    
    case 'ai_chat_message_kb':
      return calculateChatMessageWithKBCost(params.tokens || 0);
    
    case 'ai_document_review_page':
      return calculateDocumentReviewPageCost(params.pages || 1);
    
    case 'ai_document_review_full':
      return calculateDocumentReviewFullCost(params.pages || 1);
    
    case 'ai_document_compare':
      return calculateDocumentCompareCost(params.documents || 2);
    
    default:
      throw new Error(`Unknown service code: ${serviceCode}`);
  }
}

