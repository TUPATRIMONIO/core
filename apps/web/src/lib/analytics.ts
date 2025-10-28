// Type-safe analytics helpers para Google Analytics 4 - Web App

declare global {
  interface Window {
    gtag?: (
      command: 'config' | 'event' | 'js' | 'set',
      targetId: string | Date,
      config?: Record<string, any>
    ) => void
    dataLayer?: any[]
  }
}

// Eventos comunes (heredados de marketing)
export type CommonEventName =
  | 'cta_click'
  | 'form_submit'
  | 'navigation_click'
  | 'external_link_click'

// Eventos específicos de la app web
export type WebAppEventName =
  | 'user_login'
  | 'user_logout'
  | 'dashboard_view'
  | 'document_created'
  | 'document_updated'
  | 'document_deleted'
  | 'signature_requested'
  | 'signature_completed'
  | 'verification_started'
  | 'verification_completed'
  | 'profile_updated'
  | 'payment_initiated'
  | 'payment_completed'

export type EventName = CommonEventName | WebAppEventName

export interface EventParams {
  category?: string
  label?: string
  value?: number
  [key: string]: any
}

/**
 * Track a custom event in Google Analytics
 * @param eventName - Name of the event to track
 * @param params - Optional parameters for the event
 */
export function trackEvent(eventName: EventName, params?: EventParams) {
  // Solo trackear en producción y si gtag está disponible
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', eventName, params)
  } else if (process.env.NODE_ENV === 'development') {
    console.log('📊 Analytics Event (dev):', eventName, params)
  }
}

// ============================================
// EVENTOS COMUNES
// ============================================

/**
 * Track CTA button clicks
 */
export function trackCTAClick(ctaName: string, location: string) {
  trackEvent('cta_click', {
    category: 'engagement',
    label: ctaName,
    location,
  })
}

/**
 * Track form submissions
 */
export function trackFormSubmit(formName: string, success: boolean = true) {
  trackEvent('form_submit', {
    category: 'conversion',
    label: formName,
    success,
  })
}

/**
 * Track external link clicks
 */
export function trackExternalLink(url: string, linkText: string) {
  trackEvent('external_link_click', {
    category: 'engagement',
    label: linkText,
    url,
  })
}

/**
 * Track navigation clicks
 */
export function trackNavigation(destination: string, section: string) {
  trackEvent('navigation_click', {
    category: 'navigation',
    label: destination,
    section,
  })
}

// ============================================
// EVENTOS ESPECÍFICOS DE WEB APP
// ============================================

/**
 * Track user authentication
 */
export function trackUserLogin(method: string = 'email') {
  trackEvent('user_login', {
    category: 'authentication',
    label: method,
  })
}

export function trackUserLogout() {
  trackEvent('user_logout', {
    category: 'authentication',
  })
}

/**
 * Track dashboard views
 */
export function trackDashboardView(section?: string) {
  trackEvent('dashboard_view', {
    category: 'engagement',
    label: section || 'main',
  })
}

/**
 * Track document management
 */
export function trackDocumentCreated(documentType: string, documentId?: string) {
  trackEvent('document_created', {
    category: 'document_management',
    label: documentType,
    document_id: documentId,
  })
}

export function trackDocumentUpdated(documentType: string, documentId?: string) {
  trackEvent('document_updated', {
    category: 'document_management',
    label: documentType,
    document_id: documentId,
  })
}

export function trackDocumentDeleted(documentType: string, documentId?: string) {
  trackEvent('document_deleted', {
    category: 'document_management',
    label: documentType,
    document_id: documentId,
  })
}

/**
 * Track signature workflow
 */
export function trackSignatureRequested(documentType: string, recipientCount?: number) {
  trackEvent('signature_requested', {
    category: 'signatures',
    label: documentType,
    recipient_count: recipientCount,
  })
}

export function trackSignatureCompleted(documentType: string, timeToComplete?: number) {
  trackEvent('signature_completed', {
    category: 'signatures',
    label: documentType,
    time_to_complete_minutes: timeToComplete,
  })
}

/**
 * Track identity verification
 */
export function trackVerificationStarted(verificationType: string = 'identity') {
  trackEvent('verification_started', {
    category: 'verification',
    label: verificationType,
  })
}

export function trackVerificationCompleted(verificationType: string = 'identity', success: boolean = true) {
  trackEvent('verification_completed', {
    category: 'verification',
    label: verificationType,
    success,
  })
}

/**
 * Track profile updates
 */
export function trackProfileUpdated(section: string) {
  trackEvent('profile_updated', {
    category: 'user_profile',
    label: section,
  })
}

/**
 * Track payment flow
 */
export function trackPaymentInitiated(plan: string, amount?: number) {
  trackEvent('payment_initiated', {
    category: 'payments',
    label: plan,
    value: amount,
  })
}

export function trackPaymentCompleted(plan: string, amount?: number, success: boolean = true) {
  trackEvent('payment_completed', {
    category: 'payments',
    label: plan,
    value: amount,
    success,
  })
}

