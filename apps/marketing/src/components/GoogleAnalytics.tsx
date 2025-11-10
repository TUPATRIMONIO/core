'use client'

import { useEffect, useState } from 'react'
import Script from 'next/script'
import { hasAnalyticsConsent } from '@/lib/cookie-consent'

export function GoogleAnalytics() {
  const measurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID
  const [shouldLoadGA, setShouldLoadGA] = useState(false)
  const [gaLoaded, setGaLoaded] = useState(false)

  // Solo cargar en producción y si existe el ID
  if (process.env.NODE_ENV !== 'production' || !measurementId) {
    return null
  }

  useEffect(() => {
    // Verificar consentimiento inicial
    const checkConsent = () => {
      const hasConsent = hasAnalyticsConsent()
      setShouldLoadGA(hasConsent)
      
      if (hasConsent && !gaLoaded) {
        // Si ya hay consentimiento y GA no está cargado, marcarlo para cargar
        setGaLoaded(true)
      }
    }

    checkConsent()

    // Escuchar cambios en el consentimiento
    const handleConsentChange = (event: Event) => {
      const customEvent = event as CustomEvent
      const consent = customEvent.detail
      
      if (consent?.analytics && !gaLoaded) {
        // Usuario aceptó analytics, cargar GA
        setShouldLoadGA(true)
        setGaLoaded(true)
      } else if (!consent?.analytics && gaLoaded) {
        // Usuario revocó analytics
        setShouldLoadGA(false)
        // Limpiar dataLayer
        if (typeof window !== 'undefined' && window.gtag) {
          window.gtag('consent', 'update', {
            analytics_storage: 'denied'
          })
        }
      }
    }

    window.addEventListener('cookieConsentChange', handleConsentChange)
    
    return () => {
      window.removeEventListener('cookieConsentChange', handleConsentChange)
    }
  }, [gaLoaded])

  // No cargar scripts si no hay consentimiento
  if (!shouldLoadGA) {
    return null
  }

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${measurementId}', {
            page_path: window.location.pathname,
            anonymize_ip: true,
          });
          gtag('consent', 'update', {
            analytics_storage: 'granted'
          });
        `}
      </Script>
    </>
  )
}

