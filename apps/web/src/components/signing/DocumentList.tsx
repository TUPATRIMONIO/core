'use client'

import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  FileSignature, 
  MoreHorizontal, 
  Eye, 
  Download,
  Trash2,
  Stamp
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { getDocumentStatusInfo } from '@/lib/signing/document-status'

interface DocumentListProps {
  initialDocuments: any[]
  basePath?: string
}

export function DocumentList({ initialDocuments, basePath = '/dashboard/signing/documents' }: DocumentListProps) {
  if (initialDocuments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 border rounded-lg bg-background border-dashed min-h-[300px]">
        <div className="p-4 rounded-full bg-muted/50 mb-4">
          <FileSignature className="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-medium mb-2">No hay documentos</h3>
        <p className="text-muted-foreground text-center max-w-sm mb-6">
          Comienza subiendo un documento para enviarlo a firmar o notarizar.
        </p>
        <Link href={`${basePath}/new`}>
          <Button>Crear primer documento</Button>
        </Link>
      </div>
    )
  }

  const getStatusBadge = (status: string) => {
    const statusInfo = getDocumentStatusInfo(status)
    return (
      <Badge 
        className={`${statusInfo.bgClass} ${statusInfo.textClass} ${statusInfo.borderClass} hover:opacity-90`}
      >
        {statusInfo.label}
      </Badge>
    )
  }

  return (
    <div className="rounded-md border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Documento</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead>Servicios</TableHead>
            <TableHead>Pedido</TableHead>
            <TableHead>Firmantes</TableHead>
            <TableHead>Creado</TableHead>
            <TableHead className="w-[70px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {initialDocuments.map((doc) => (
            <TableRow key={doc.id}>
              <TableCell>
                <Link 
                  href={`${basePath}/${doc.id}`}
                  className="font-medium hover:underline block"
                >
                  {doc.title}
                </Link>
                {doc.description && (
                  <p className="text-xs text-muted-foreground truncate max-w-[300px]">
                    {doc.description}
                  </p>
                )}
                {doc.qr_identifier && (
                  <span className="text-[10px] text-muted-foreground font-mono">
                    {doc.qr_identifier}
                  </span>
                )}
              </TableCell>
              
              <TableCell>
                {getStatusBadge(doc.status)}
              </TableCell>

              <TableCell>
                <div className="flex flex-col gap-1">
                  {doc.metadata?.signature_product && (
                    <div className="flex items-center gap-1.5 text-sm">
                      <FileSignature className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="font-medium text-xs">
                        {doc.metadata.signature_product.name}
                      </span>
                    </div>
                  )}
                  {doc.metadata?.notary_product ? (
                    <div className="flex items-center gap-1.5 text-sm">
                      <Stamp className="h-3.5 w-3.5 text-orange-600/80" />
                      <span className="font-medium text-xs text-muted-foreground">
                        {doc.metadata.notary_product.name}
                      </span>
                    </div>
                  ) : (
                   doc.metadata?.signature_product && (
                      <div className="flex items-center gap-1.5 text-sm">
                        <Stamp className="h-3.5 w-3.5 text-muted-foreground/40" />
                        <span className="font-medium text-xs text-muted-foreground/60">
                          Sin notaría
                        </span>
                      </div>
                    )
                  )}
                  {!doc.metadata?.signature_product && !doc.metadata?.notary_product && (
                    <span className="text-xs text-muted-foreground">-</span>
                  )}
                </div>
              </TableCell>
              
              <TableCell>
                <div className="text-sm">
                  {doc.order_number ? (
                    <span className="font-mono text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                      {doc.order_number}
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground">-</span>
                  )}
                </div>
              </TableCell>

              <TableCell>
                <div className="text-sm">
                  <span className={cn(
                    "font-medium", 
                    doc.signed_count === doc.signers_count && doc.signers_count > 0 
                      ? "text-green-600" 
                      : "text-muted-foreground"
                  )}>
                    {doc.signed_count} / {doc.signers_count}
                  </span>
                </div>
              </TableCell>
              
              <TableCell className="text-sm text-muted-foreground">
                {format(new Date(doc.created_at), "d MMM yyyy", { locale: es })}
              </TableCell>
              
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <span className="sr-only">Abrir menú</span>
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                    <DropdownMenuItem asChild>
                      <Link href={`${basePath}/${doc.id}`}>
                        <Eye className="mr-2 h-4 w-4" />
                        Ver detalles
                      </Link>
                    </DropdownMenuItem>
                    
                    {doc.current_signed_file_path || doc.original_file_path ? (
                      <DropdownMenuItem>
                         {/* TODO: Implementar descarga */}
                        <Download className="mr-2 h-4 w-4" />
                        Descargar PDF
                      </DropdownMenuItem>
                    ) : null}
                    
                    <DropdownMenuSeparator />
                    
                    <DropdownMenuItem className="text-red-600 focus:text-red-600">
                      <Trash2 className="mr-2 h-4 w-4" />
                      Eliminar
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
