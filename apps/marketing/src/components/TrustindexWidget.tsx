'use client';

import Script from 'next/script';

interface TrustindexWidgetProps {
  widgetId?: string;
}

export default function TrustindexWidget({ 
  widgetId = 'aa245a3245d22309f4501b6f6d' 
}: TrustindexWidgetProps) {
  return (
    <>
      {/* Script de Trustindex - Se inyecta automáticamente en la página */}
      <Script
        src={`https://cdn.trustindex.io/loader.js?${widgetId}`}
        strategy="lazyOnload"
      />
      
      {/* Trustindex inyecta el widget automáticamente, solo necesitamos un contenedor */}
      <div className="trustindex-5-stars w-full" />
    </>
  );
}

