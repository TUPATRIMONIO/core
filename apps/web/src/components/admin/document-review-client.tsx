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
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
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
    review_type?: string
  }>
  document_messages?: Array<{ count: number }>
}

interface DocumentReviewClientProps {
  initialDocuments: Document[]
  initialTotal: number
  initialStatus: string
  initialPage: number
  initialTab?: string
}

export function DocumentReviewClient({
  initialDocuments,
  initialTotal,
  initialStatus,
  initialPage,
  initialTab = 'pendientes',
}: DocumentReviewClientProps) {
  const router = useRouter()
  const supabase = createClient()
  const [documents, setDocuments] = useState(initialDocuments)
  const [status, setStatus] = useState(initialStatus)
  const [page, setPage] = useState(initialPage)
  const [tab, setTab] = useState(initialTab)
  const [isLoading, setIsLoading] = useState(false)

  const totalPages = Math.ceil(initialTotal / 20)

  const handleTabChange = (newTab: string) => {
    setTab(newTab)
    setPage(1)
    router.push(`/admin/document-review?tab=${newTab}&status=${status}&page=1`)
  }

  const handleStatusChange = (newStatus: string) => {
    setStatus(newStatus)
    setPage(1)
    router.push(`/admin/document-review?tab=${tab}&status=${newStatus}&page=1`)
  }

  const getStatusBadge = (docStatus: string) => {
    const variants: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      draft: { label: 'Borrador', variant: 'outline' },
      pending_review: { label: 'En Revisión', variant: 'secondary' },
      approved: { label: 'Aprobado', variant: 'default' },
      pending_ai_review: { label: 'Revisión IA', variant: 'secondary' },
      ai_rejected: { label: 'Rechazado IA', variant: 'destructive' },
      manual_review: { label: 'Revisión Manual', variant: 'secondary' },
      needs_correction: { label: 'Necesita Corrección', variant: 'destructive' },
      pending_signature: { label: 'En Firma', variant: 'default' },
      partially_signed: { label: 'Parcialmente Firmado', variant: 'default' },
      signed: { label: 'Firmado', variant: 'default' },
      pending_notary: { label: 'En Notaría', variant: 'secondary' },
      notary_observed: { label: 'Observado Notaría', variant: 'secondary' },
      notary_rejected: { label: 'Rechazado Notaría', variant: 'destructive' },
      notarized: { label: 'Notarizado', variant: 'default' },
      completed: { label: 'Completado', variant: 'default' },
      cancelled: { label: 'Cancelado', variant: 'outline' },
      rejected: { label: 'Rechazado', variant: 'destructive' },
    }
    const config = variants[docStatus] || { label: docStatus, variant: 'default' }
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  const getAiReviewStatus = (doc: Document) => {
    const review = doc.ai_review?.[0]
    if (!review || !review.completed_at) {
      return <Badge variant="outline">Sin revisión</Badge>
    }

    const score = review.confidence_score
    const scoreDisplay = score ? ` (${Math.round(score * 100)}%)` : ''

    if (review.status === 'approved') {
      return <Badge variant="default" className="bg-green-500">IA Aprobó{scoreDisplay}</Badge>
    } else if (review.status === 'rejected') {
      return <Badge variant="destructive">IA Rechazó{scoreDisplay}</Badge>
    } else if (review.status === 'needs_changes') {
      return <Badge variant="secondary">IA Observó{scoreDisplay}</Badge>
    }
    return <Badge variant="outline">{review.status}</Badge>
  }

  const getReviewType = (doc: Document) => {
    const review = doc.ai_review?.[0]
    const hasMessages = (doc.document_messages?.[0]?.count || 0) > 0
    
    if (review && hasMessages) {
      return 'IA + Manual'
    } else if (review) {
      return 'IA'
    } else if (hasMessages) {
      return 'Manual'
    }
    return '-'
  }

  const getMessageCount = (doc: Document) => {
    return doc.document_messages?.[0]?.count || 0
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Revisión de Documentos</CardTitle>
          {tab === 'pendientes' && (
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
          )}
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={tab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="pendientes">
              Pendientes {tab === 'pendientes' && initialTotal > 0 && `(${initialTotal})`}
            </TabsTrigger>
            <TabsTrigger value="historial">
              Historial {tab === 'historial' && initialTotal > 0 && `(${initialTotal})`}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pendientes" className="mt-0">
            {documents.length === 0 ? (
              <EmptyState
                icon={AlertCircle}
                title="No hay documentos pendientes"
                description="No hay documentos en cola de revisión manual"
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
                      <TableHead>Mensajes</TableHead>
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
                          {getMessageCount(doc) > 0 ? (
                            <div className="flex items-center gap-1">
                              <MessageSquare className="h-4 w-4" />
                              <span>{getMessageCount(doc)}</span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
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
                          router.push(`/admin/document-review?tab=${tab}&status=${status}&page=${newPage}`)
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
                          router.push(`/admin/document-review?tab=${tab}&status=${status}&page=${newPage}`)
                        }}
                      >
                        Siguiente
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </TabsContent>

          <TabsContent value="historial" className="mt-0">
            {documents.length === 0 ? (
              <EmptyState
                icon={AlertCircle}
                title="No hay historial de revisiones"
                description="Aún no hay documentos que hayan pasado por el proceso de revisión"
              />
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Documento</TableHead>
                      <TableHead>Organización</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Tipo Revisión</TableHead>
                      <TableHead>Revisión IA</TableHead>
                      <TableHead>Mensajes</TableHead>
                      <TableHead>Última Revisión</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {documents.map((doc) => {
                      const review = doc.ai_review?.[0]
                      const lastReviewDate = review?.completed_at || doc.updated_at
                      return (
                        <TableRow key={doc.id}>
                          <TableCell className="font-medium">{doc.title}</TableCell>
                          <TableCell>{doc.organization?.name || 'N/A'}</TableCell>
                          <TableCell>{getStatusBadge(doc.status)}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{getReviewType(doc)}</Badge>
                          </TableCell>
                          <TableCell>{getAiReviewStatus(doc)}</TableCell>
                          <TableCell>
                            {getMessageCount(doc) > 0 ? (
                              <div className="flex items-center gap-1">
                                <MessageSquare className="h-4 w-4" />
                                <span>{getMessageCount(doc)}</span>
                              </div>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {new Date(lastReviewDate).toLocaleDateString('es-CL', {
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
                                Ver Detalle
                              </Button>
                            </Link>
                          </TableCell>
                        </TableRow>
                      )
                    })}
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
                          router.push(`/admin/document-review?tab=${tab}&status=${status}&page=${newPage}`)
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
                          router.push(`/admin/document-review?tab=${tab}&status=${status}&page=${newPage}`)
                        }}
                      >
                        Siguiente
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

