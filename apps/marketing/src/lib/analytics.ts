// Type-safe analytics helpers para Google Analytics 4

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

export type EventName =
  | 'cta_click'
  | 'form_submit'
  | 'download_resource'
  | 'blog_read'
  | 'navigation_click'
  | 'external_link_click'

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
 * Track resource downloads
 */
export function trackDownload(resourceName: string, resourceType: string) {
  trackEvent('download_resource', {
    category: 'engagement',
    label: resourceName,
    resource_type: resourceType,
  })
}

/**
 * Track blog post reading (call when user scrolls to certain depth)
 */
export function trackBlogRead(postTitle: string, scrollDepth: number) {
  trackEvent('blog_read', {
    category: 'content',
    label: postTitle,
    scroll_depth: scrollDepth,
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

