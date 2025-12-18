"use client";

import { useState, useEffect } from "react";
import { Loader2, ExternalLink, RefreshCw, FileText } from "lucide-react";

// #region agent log
const debugLog = (location: string, message: string, data: any, hypothesisId: string) => {
  fetch('http://127.0.0.1:7242/ingest/bdc2afec-cbea-4620-96e6-e667e032dc96',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location,message,data,timestamp:Date.now(),sessionId:'debug-session',hypothesisId})}).catch(()=>{});
};
// #endregion

interface PDFViewerProps {
  url: string;
  className?: string;
}

/**
 * Simple PDF Viewer using native browser embed.
 * Falls back to a link if embedding fails.
 */
export default function PDFViewer({ url, className = "" }: PDFViewerProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  // #region agent log
  useEffect(() => {
    debugLog('PDFViewer:mount','PDFViewer mounted',{url:url.substring(0,50)+'...',isLoading,hasError},'A,B');
  }, []);
  // #endregion

  // Reset states when URL changes
  useEffect(() => {
    setIsLoading(true);
    setHasError(false);
    // #region agent log
    debugLog('PDFViewer:urlChange','URL changed, resetting states',{url:url.substring(0,50)+'...',retryCount},'A,B');
    // #endregion
  }, [url, retryCount]);

  const handleLoad = () => {
    // #region agent log
    debugLog('PDFViewer:onLoad','Embed onLoad fired',{url:url.substring(0,50)+'...'},'B');
    // #endregion
    setIsLoading(false);
    setHasError(false);
  };

  const handleError = () => {
    // #region agent log
    debugLog('PDFViewer:onError','Embed onError fired',{url:url.substring(0,50)+'...'},'B');
    // #endregion
    setIsLoading(false);
    setHasError(true);
  };

  const handleRetry = () => {
    setRetryCount((prev) => prev + 1);
  };

  // Use embed tag - better browser support for PDFs
  const embedUrl = `${url}#toolbar=1&navpanes=0&scrollbar=1`;

  return (
    <div className={`flex flex-col ${className}`}>
      {/* Header Bar */}
      <div className="flex items-center justify-between bg-gray-800 text-white px-4 py-2 rounded-t-lg">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5" />
          <span className="text-sm font-medium">Vista previa del documento</span>
        </div>
        <div className="flex items-center gap-2">
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 px-3 py-1 text-sm bg-gray-700 hover:bg-gray-600 rounded transition-colors"
            title="Abrir en nueva pestaña"
          >
            <ExternalLink className="w-4 h-4" />
            Abrir
          </a>
        </div>
      </div>

      {/* PDF Container */}
      <div className="relative flex-1 bg-gray-200 rounded-b-lg overflow-hidden" style={{ minHeight: "500px" }}>
        {isLoading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-100 z-10">
            <Loader2 className="w-10 h-10 text-[#800039] animate-spin mb-4" />
            <p className="text-gray-600 text-sm">Cargando documento...</p>
          </div>
        )}

        {hasError ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-50 z-10">
            <p className="text-gray-500 mb-4 text-center px-4">
              No se pudo cargar la vista previa del documento en el navegador.
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleRetry}
                className="flex items-center gap-2 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Reintentar
              </button>
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 bg-[#800039] hover:bg-[#a00048] text-white rounded-lg transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                Abrir en nueva pestaña
              </a>
            </div>
          </div>
        ) : (
          <embed
            key={retryCount}
            src={embedUrl}
            type="application/pdf"
            className="w-full h-full"
            style={{ minHeight: "500px" }}
            onLoad={handleLoad}
            onError={handleError}
          />
        )}
      </div>
    </div>
  );
}
