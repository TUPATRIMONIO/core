'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'
import { Button } from '@/components/ui/button'
import { 
  Loader2, 
  ChevronLeft, 
  ChevronRight, 
  ZoomIn, 
  ZoomOut, 
  Download, 
  ExternalLink, 
  FileText,
  RotateCw
} from 'lucide-react'
import { cn } from '@/lib/utils'

// Import styles
import 'react-pdf/dist/Page/AnnotationLayer.css'
import 'react-pdf/dist/Page/TextLayer.css'

if (typeof window !== 'undefined') {
  pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`
}

interface PDFCanvasViewerProps {
  url: string | null | undefined
  title?: string
  className?: string
  showToolbar?: boolean
  initialScale?: number
  onError?: () => void
}

export function PDFCanvasViewer({
  url,
  title = 'Documento',
  className,
  showToolbar = true,
  initialScale = 1,
  onError
}: PDFCanvasViewerProps) {
  const [numPages, setNumPages] = useState<number | null>(null)
  const [pageNumber, setPageNumber] = useState(1)
  const [scale, setScale] = useState(initialScale)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [containerWidth, setContainerWidth] = useState<number>(0)
  
  const containerRef = useRef<HTMLDivElement>(null)
  const pageRefs = useRef<Map<number, HTMLDivElement>>(new Map())

  const setPageRef = useCallback((pageNum: number, el: HTMLDivElement | null) => {
    if (el) {
      pageRefs.current.set(pageNum, el)
    } else {
      pageRefs.current.delete(pageNum)
    }
  }, [])
  
  // ResizeObserver to handle responsive width
  useEffect(() => {
    if (!containerRef.current) return

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.contentRect) {
          setContainerWidth(entry.contentRect.width)
        }
      }
    })

    resizeObserver.observe(containerRef.current)
    
    // Initial width
    setContainerWidth(containerRef.current.clientWidth)

    return () => {
      resizeObserver.disconnect()
    }
  }, [])

  // IntersectionObserver to detect current page
  useEffect(() => {
    if (!numPages || !containerRef.current) return

    const observer = new IntersectionObserver(
      (entries) => {
        let maxRatio = 0
        let mostVisiblePage = -1
        entries.forEach((entry) => {
          const page = Number(entry.target.getAttribute('data-page-number'))
          if (entry.intersectionRatio > maxRatio) {
            maxRatio = entry.intersectionRatio
            mostVisiblePage = page
          }
        })
        if (maxRatio > 0 && mostVisiblePage !== -1) {
          setPageNumber(mostVisiblePage)
        }
      },
      {
        root: containerRef.current,
        threshold: [0, 0.25, 0.5, 0.75, 1],
      }
    )

    pageRefs.current.forEach((el) => observer.observe(el))

    return () => observer.disconnect()
  }, [numPages])

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages)
    setLoading(false)
    setError(null)
  }

  function onDocumentLoadError(err: Error) {
    console.error('Error loading PDF:', err)
    setError(err)
    setLoading(false)
    if (onError) onError()
  }

  const scrollToPage = useCallback((page: number) => {
    // Ensure page number is within bounds 1..numPages
    if (numPages) {
      page = Math.max(1, Math.min(page, numPages))
    } else {
      page = 1
    }
    
    const el = pageRefs.current.get(page)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [numPages])

  function changeScale(delta: number) {
    setScale(prevScale => {
      const newScale = prevScale + delta
      return Math.max(0.5, Math.min(newScale, 3.0))
    })
  }

  const handleDownload = () => {
    if (!url) return
    const link = document.createElement('a')
    link.href = url
    link.download = `${title}.pdf`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  if (!url) {
    return (
      <div className={cn("flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-900 rounded-lg min-h-[300px] p-8", className)}>
        <FileText className="w-12 h-12 text-gray-400 mb-4" />
        <p className="text-gray-500 dark:text-gray-400">No hay documento para visualizar</p>
      </div>
    )
  }

  return (
    <div className={cn("flex flex-col bg-gray-100 dark:bg-gray-900 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-800 h-full", className)}>
      {/* Toolbar */}
      {showToolbar && (
        <div className="flex flex-wrap items-center justify-between gap-2 p-2 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10 shadow-sm">
          {/* Page Navigation */}
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => scrollToPage(pageNumber - 1)}
              disabled={pageNumber <= 1 || loading || !!error}
              className="h-8 w-8"
              title="Página anterior"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-xs sm:text-sm font-medium min-w-[60px] sm:min-w-[80px] text-center truncate">
              {loading ? '...' : `${pageNumber} / ${numPages || '--'}`}
            </span>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => scrollToPage(pageNumber + 1)}
              disabled={pageNumber >= (numPages || 1) || loading || !!error}
              className="h-8 w-8"
              title="Página siguiente"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Zoom Controls - Hidden on very small screens if needed, or compact */}
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => changeScale(-0.25)}
              disabled={scale <= 0.5 || loading || !!error}
              className="h-8 w-8"
              title="Reducir zoom"
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <span className="text-xs sm:text-sm font-medium w-[40px] text-center">
              {Math.round(scale * 100)}%
            </span>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => changeScale(0.25)}
              disabled={scale >= 3.0 || loading || !!error}
              className="h-8 w-8"
              title="Aumentar zoom"
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 ml-auto">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.open(url, '_blank')}
              className="h-8 px-2"
              title="Abrir en nueva pestaña"
            >
              <ExternalLink className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Abrir</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDownload}
              className="h-8 px-2"
              title="Descargar PDF"
            >
              <Download className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Descargar</span>
            </Button>
          </div>
        </div>
      )}

      {/* PDF Content */}
      <div 
        ref={containerRef}
        className="flex-1 overflow-auto bg-gray-100 dark:bg-gray-900 relative min-h-[300px] md:min-h-[500px] flex justify-center p-4"
      >
        {loading && !error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-100/80 dark:bg-gray-900/80 z-10">
            <Loader2 className="w-8 h-8 text-primary animate-spin mb-4" />
            <p className="text-sm text-gray-500 dark:text-gray-400">Cargando documento...</p>
          </div>
        )}

        {error ? (
          <div className="flex flex-col items-center justify-center p-8 text-center h-full w-full">
            <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-full mb-4">
              <FileText className="w-8 h-8 text-red-500" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No se pudo cargar el documento</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 max-w-xs mx-auto">
              Hubo un problema al intentar visualizar el PDF. Puedes intentar descargarlo o abrirlo en una nueva pestaña.
            </p>
            <div className="flex gap-3 flex-wrap justify-center">
              <Button onClick={() => window.open(url, '_blank')} variant="outline">
                <ExternalLink className="w-4 h-4 mr-2" />
                Abrir en nueva pestaña
              </Button>
              <Button onClick={() => window.location.reload()} variant="ghost">
                <RotateCw className="w-4 h-4 mr-2" />
                Recargar página
              </Button>
            </div>
          </div>
        ) : (
          <Document
            key={url}
            file={url}
            onLoadSuccess={onDocumentLoadSuccess}
            onLoadError={onDocumentLoadError}
            loading={null}
            className="flex flex-col items-center"
          >
            {numPages && Array.from({ length: numPages }, (_, i) => i + 1).map((page) => (
              <div
                key={page}
                ref={(el) => setPageRef(page, el)}
                data-page-number={page}
                className="mb-4 shadow-lg"
              >
                <Page 
                  pageNumber={page} 
                  scale={scale} 
                  width={containerWidth ? Math.min(containerWidth - 32, 1000) : undefined}
                  renderTextLayer={true}
                  renderAnnotationLayer={true}
                  className="bg-white max-w-full"
                  loading={
                    <div className="h-[500px] w-full bg-white flex items-center justify-center">
                      <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                    </div>
                  }
                />
              </div>
            ))}
          </Document>
        )}
      </div>
    </div>
  )
}
