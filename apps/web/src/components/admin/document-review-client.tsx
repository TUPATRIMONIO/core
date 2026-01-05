'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Eye, CheckCircle, XCircle, MessageSquare, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { EmptyState } from '@/components/admin/empty-state'

interface Document {
  id: string
  title: string
  status: string
  created_at: string
  updated_at: string
  organization?: {
    id: string
    name: string
    slug: string
  }
  created_by_user?: {
    id: string
    email: string
    full_name: string
  }
  ai_review?: Array<{
    id: string
    status: string
    passed: boolean
    confidence_score: number
    reasons: any[]
    suggestions: any[]
    completed_at: string
  }>
}

interface DocumentReviewClientProps {
  initialDocuments: Document[]
  initialTotal: number
  initialStatus: string
  initialPage: number
}

export function DocumentReviewClient({
  initialDocuments,
  initialTotal,
  initialStatus,
  initialPage,
}: DocumentReviewClientProps) {
  const router = useRouter()
  const supabase = createClient()
  const [documents, setDocuments] = useState(initialDocuments)
  const [status, setStatus] = useState(initialStatus)
  const [page, setPage] = useState(initialPage)
  const [isLoading, setIsLoading] = useState(false)

  const totalPages = Math.ceil(initialTotal / 20)

  const handleStatusChange = (newStatus: string) => {
    setStatus(newStatus)
    setPage(1)
    router.push(`/admin/document-review?status=${newStatus}&page=1`)
  }

  const getStatusBadge = (docStatus: string) => {
    const variants: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      manual_review: { label: 'Revisión Manual', variant: 'secondary' },
      needs_correction: { label: 'Necesita Corrección', variant: 'destructive' },
    }
    const config = variants[docStatus] || { label: docStatus, variant: 'default' }
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  const getAiReviewStatus = (doc: Document) => {
    const review = doc.ai_review?.[0]
    if (!review) return null

    if (review.status === 'approved') {
      return <Badge variant="default" className="bg-green-500">IA Aprobó</Badge>
    } else if (review.status === 'rejected') {
      return <Badge variant="destructive">IA Rechazó</Badge>
    } else if (review.status === 'needs_changes') {
      return <Badge variant="secondary">IA Observó</Badge>
    }
    return null
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Documentos en Revisión</CardTitle>
          <Select value={status} onValueChange={handleStatusChange}>
            <SelectTrigger className="w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="manual_review">Revisión Manual</SelectItem>
              <SelectItem value="needs_correction">Necesita Corrección</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {documents.length === 0 ? (
          <EmptyState
            icon={AlertCircle}
            title="No hay documentos en revisión"
            description={`No hay documentos con estado "${status === 'all' ? 'en revisión' : status}"`}
          />
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Documento</TableHead>
                  <TableHead>Organización</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Revisión IA</TableHead>
                  <TableHead>Actualizado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {documents.map((doc) => (
                  <TableRow key={doc.id}>
                    <TableCell className="font-medium">{doc.title}</TableCell>
                    <TableCell>{doc.organization?.name || 'N/A'}</TableCell>
                    <TableCell>{getStatusBadge(doc.status)}</TableCell>
                    <TableCell>{getAiReviewStatus(doc)}</TableCell>
                    <TableCell>
                      {new Date(doc.updated_at).toLocaleDateString('es-CL', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </TableCell>
                    <TableCell className="text-right">
                      <Link href={`/admin/document-review/${doc.id}`}>
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4 mr-2" />
                          Revisar
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-muted-foreground">
                  Página {page} de {totalPages}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page === 1}
                    onClick={() => {
                      const newPage = page - 1
                      setPage(newPage)
                      router.push(`/admin/document-review?status=${status}&page=${newPage}`)
                    }}
                  >
                    Anterior
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= totalPages}
                    onClick={() => {
                      const newPage = page + 1
                      setPage(newPage)
                      router.push(`/admin/document-review?status=${status}&page=${newPage}`)
                    }}
                  >
                    Siguiente
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}

