'use client';

import { useEffect } from 'react';

interface TrustindexWidgetProps {
  widgetId?: string;
}

export default function TrustindexWidget({ 
  widgetId = 'aa245a3245d22309f4501b6f6d' 
}: TrustindexWidgetProps) {
  useEffect(() => {
    // Crear y agregar el script de Trustindex
    const script = document.createElement('script');
    script.src = `https://cdn.trustindex.io/loader.js?${widgetId}`;
    script.defer = true;
    script.async = true;
    
    document.body.appendChild(script);

    // Cleanup al desmontar
    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, [widgetId]);

  return (
    <div className="trustindex-widget-container">
      {/* El widget de Trustindex se renderizará aquí automáticamente */}
      <div id="trustindex-widget" />
    </div>
  );
}

