"use client";

import { PDFCanvasViewer } from "@/components/shared/PDFCanvasViewer";

interface PDFViewerProps {
  url: string;
  className?: string;
}

/**
 * Simple PDF Viewer using PDFCanvasViewer for consistent rendering across devices.
 * Replaces the old embed/iframe based viewer.
 */
export default function PDFViewer({ url, className = "" }: PDFViewerProps) {
  return (
    <div className={`flex flex-col ${className}`}>
      <PDFCanvasViewer 
        url={url} 
        className="h-full border-0 rounded-lg"
        title="Vista previa del documento"
      />
    </div>
  );
}
