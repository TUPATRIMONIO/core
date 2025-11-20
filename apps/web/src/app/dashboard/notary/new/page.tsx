'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Upload, Trash2, FileText } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@tupatrimonio/ui'
import { Button } from '@tupatrimonio/ui'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/stores/auth-store'
import { useToast } from '@/hooks/use-toast'
import { useCurrency } from '@/hooks/use-currency'

interface ServiceType {
  id: string
  name: string
  slug: string
  description: string | null
  base_price: number
  requires_document: boolean
  is_active: boolean
  sort_order: number
}

interface SignatureDocument {
  id: string
  title: string
  status: string
}

export default function NewNotaryRequestPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { currentOrganization, user } = useAuthStore()
  const { formatPrice } = useCurrency()

  const [serviceTypes, setServiceTypes] = useState<ServiceType[]>([])
  const [signatureDocuments, setSignatureDocuments] = useState<SignatureDocument[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingData, setIsLoadingData] = useState(true)

  // Form state
  const [documentTitle, setDocumentTitle] = useState('')
  const [serviceTypeId, setServiceTypeId] = useState('')
  const [signatureDocumentId, setSignatureDocumentId] = useState<string>('')
  const [priority, setPriority] = useState<'normal' | 'high' | 'urgent'>('normal')
  const [notes, setNotes] = useState('')
  const [file, setFile] = useState<File | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setIsLoadingData(true)
    try {
      const supabase = createClient()

      // Load service types
      const { data: servicesData } = await supabase
        .schema('notary')
        .from('service_types')
        .select('*')
        .eq('is_active', true)
        .order('sort_order')

      if (servicesData) {
        setServiceTypes(servicesData)
        if (servicesData.length > 0) {
          setServiceTypeId(servicesData[0].id)
        }
      }

      // Load user's signature documents
      if (currentOrganization) {
        const { data: docsData } = await supabase
          .schema('signatures')
          .from('documents')
          .select('id, title, status')
          .eq('organization_id', currentOrganization.id)
          .in('status', ['fully_signed', 'completed'])
          .order('created_at', { ascending: false })
          .limit(20)

        if (docsData) {
          setSignatureDocuments(docsData)
        }
      }
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setIsLoadingData(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      if (selectedFile.type !== 'application/pdf') {
        toast({
          title: 'Error',
          description: 'Solo se permiten archivos PDF',
          variant: 'destructive',
        })
        return
      }
      setFile(selectedFile)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!currentOrganization || !user) {
      toast({
        title: 'Error',
        description: 'Faltan datos requeridos',
        variant: 'destructive',
      })
      return
    }

    // Verificar que tenga documento o archivo
    if (!signatureDocumentId && !file) {
      toast({
        title: 'Error',
        description: 'Debes vincular un documento firmado o subir un archivo',
        variant: 'destructive',
      })
      return
    }

    setIsLoading(true)

    try {
      const supabase = createClient()
      let documentUrl = null

      // Upload file if provided
      if (file) {
        const fileName = `${currentOrganization.id}/${crypto.randomUUID()}.pdf`
        const { error: uploadError } = await supabase.storage
          .from('notary-documents')
          .upload(fileName, file)

        if (uploadError) {
          throw new Error('Error al subir el archivo')
        }

        const { data: { publicUrl } } = supabase.storage
          .from('notary-documents')
          .getPublicUrl(fileName)

        documentUrl = publicUrl
      }

      // Get available notary (for now, just get any active one)
      // TODO: Implement proper notary assignment logic
      const { data: notary } = await supabase
        .schema('notary')
        .from('notaries')
        .select('id')
        .eq('is_active', true)
        .limit(1)
        .single()

      if (!notary) {
        throw new Error('No hay notarías disponibles en este momento')
      }

      // Create request
      const { data: request, error: requestError } = await supabase
        .schema('notary')
        .from('requests')
        .insert({
          organization_id: currentOrganization.id,
          notary_id: notary.id,
          service_type_id: serviceTypeId,
          signature_document_id: signatureDocumentId || null,
          document_url: documentUrl,
          document_title: documentTitle,
          priority: priority,
          notes: notes || null,
          status: 'pending',
          created_by: user.id,
        })
        .select()
        .single()

      if (requestError || !request) {
        throw new Error('Error al crear la solicitud')
      }

      toast({
        title: 'Solicitud creada',
        description: 'Tu solicitud notarial ha sido creada correctamente',
      })

      router.push(`/dashboard/notary/${request.id}`)
    } catch (error) {
      console.error('Error creating request:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Error al crear la solicitud',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const selectedService = serviceTypes.find(s => s.id === serviceTypeId)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/notary">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Nueva solicitud notarial</h1>
          <p className="text-muted-foreground">
            Solicita un servicio notarial en línea
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Service selection */}
        <Card>
          <CardHeader>
            <CardTitle>Tipo de servicio</CardTitle>
            <CardDescription>
              Selecciona el servicio notarial que necesitas
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="serviceType" className="text-sm font-medium">
                Servicio notarial *
              </label>
              <select
                id="serviceType"
                value={serviceTypeId}
                onChange={(e) => setServiceTypeId(e.target.value)}
                required
                disabled={isLoadingData}
                className="w-full px-3 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {serviceTypes.map((service) => (
                  <option key={service.id} value={service.id}>
                    {service.name} - {formatPrice(service.base_price * 100, 'CLP')}
                  </option>
                ))}
              </select>
              {selectedService?.description && (
                <p className="text-sm text-muted-foreground">
                  {selectedService.description}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="priority" className="text-sm font-medium">
                Prioridad
              </label>
              <select
                id="priority"
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
                className="w-full px-3 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="normal">Normal</option>
                <option value="high">Alta</option>
                <option value="urgent">Urgente</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Document */}
        <Card>
          <CardHeader>
            <CardTitle>Documento</CardTitle>
            <CardDescription>
              Vincula un documento firmado o sube un nuevo archivo
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="title" className="text-sm font-medium">
                Título del documento *
              </label>
              <input
                id="title"
                type="text"
                value={documentTitle}
                onChange={(e) => setDocumentTitle(e.target.value)}
                placeholder="Ej: Escritura de compraventa"
                required
                className="w-full px-3 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            {signatureDocuments.length > 0 && (
              <div className="space-y-2">
                <label htmlFor="signatureDoc" className="text-sm font-medium">
                  Vincular documento firmado (opcional)
                </label>
                <select
                  id="signatureDoc"
                  value={signatureDocumentId}
                  onChange={(e) => setSignatureDocumentId(e.target.value)}
                  disabled={!!file}
                  className="w-full px-3 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
                >
                  <option value="">Ninguno</option>
                  {signatureDocuments.map((doc) => (
                    <option key={doc.id} value={doc.id}>
                      {doc.title}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-muted-foreground">
                  Solo documentos completamente firmados
                </p>
              </div>
            )}

            {!signatureDocumentId && (
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  O sube un documento {!signatureDocuments.length && '*'}
                </label>
                <div className="border-2 border-dashed rounded-lg p-6 text-center">
                  {file ? (
                    <div className="flex items-center justify-between">
                      <span className="text-sm">{file.name}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setFile(null)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <label className="cursor-pointer">
                      <Upload className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                      <span className="text-sm text-muted-foreground">
                        Haz clic para subir un archivo PDF
                      </span>
                      <input
                        type="file"
                        accept="application/pdf"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label htmlFor="notes" className="text-sm font-medium">
                Notas adicionales (opcional)
              </label>
              <textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Información adicional para la notaría..."
                rows={3}
                className="w-full px-3 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring resize-none"
              />
            </div>
          </CardContent>
        </Card>

        {/* Summary */}
        {selectedService && (
          <Card>
            <CardHeader>
              <CardTitle>Resumen</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Servicio:</span>
                <span className="font-medium">{selectedService.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Precio base:</span>
                <span className="font-medium">{formatPrice(selectedService.base_price * 100, 'CLP')}</span>
              </div>
              <div className="pt-2 border-t">
                <div className="flex justify-between text-lg font-bold">
                  <span>Total:</span>
                  <span>{formatPrice(selectedService.base_price * 100, 'CLP')}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" asChild>
            <Link href="/dashboard/notary">Cancelar</Link>
          </Button>
          <Button type="submit" disabled={isLoading || (!file && !signatureDocumentId)}>
            {isLoading ? 'Creando...' : 'Crear solicitud'}
          </Button>
        </div>
      </form>
    </div>
  )
}

