'use client';

import { useEffect } from 'react';

interface TrustindexWidgetProps {
  widgetId?: string;
}

export default function TrustindexWidget({ 
  widgetId = 'aa245a3245d22309f4501b6f6d' 
}: TrustindexWidgetProps) {
  useEffect(() => {
    // Crear script de Trustindex
    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = `https://cdn.trustindex.io/loader.js?${widgetId}`;
    script.async = true;
    script.defer = true;
    
    // Cuando el script se cargue, inicializar el widget
    script.onload = () => {
      // Trustindex carga automáticamente, pero podemos forzar re-render
      const trustboxElement = document.getElementById('trustindex-widget');
      if (trustboxElement && (window as any).Trustindex) {
        try {
          (window as any).Trustindex.loadFromElement(trustboxElement);
        } catch (e) {
          console.log('Trustindex auto-loading...');
        }
      }
    };
    
    document.head.appendChild(script);
    
    // Cleanup al desmontar
    return () => {
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
    };
  }, [widgetId]);

  return (
    <div 
      id="trustindex-widget" 
      className="trustindex-widget w-full"
      data-widget-id={widgetId}
    >
      {/* Trustindex inyectará el contenido aquí */}
    </div>
  );
}


