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
  History,
  Trash2
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

interface DocumentListProps {
  initialDocuments: any[]
}

export function DocumentList({ initialDocuments }: DocumentListProps) {
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
        <Link href="/admin/signing/documents/new">
          <Button>Crear primer documento</Button>
        </Link>
      </div>
    )
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return <Badge variant="outline">Borrador</Badge>
      case 'pending_review':
        return <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100/80 border-orange-200">En Revisión</Badge>
      case 'approved':
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100/80 border-blue-200">Aprobado</Badge>
      case 'pending_signature':
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100/80 border-yellow-200">Pendiente Firma</Badge>
      case 'partially_signed':
        return <Badge className="bg-indigo-100 text-indigo-800 hover:bg-indigo-100/80 border-indigo-200">Firmando</Badge>
      case 'signed':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100/80 border-green-200">Firmado</Badge>
      case 'completed':
        return <Badge className="bg-green-600 text-white hover:bg-green-700">Completado</Badge>
      case 'pending_notary':
        return <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-100/80 border-purple-200">En Notaría</Badge>
      case 'rejected':
      case 'notary_rejected':
      case 'ai_rejected':
        return <Badge variant="destructive">Rechazado</Badge>
      case 'cancelled':
        return <Badge variant="secondary">Cancelado</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <div className="rounded-md border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Documento</TableHead>
            <TableHead>Estado</TableHead>
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
                  href={`/admin/signing/documents/${doc.id}`}
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
                      <Link href={`/admin/signing/documents/${doc.id}`}>
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
