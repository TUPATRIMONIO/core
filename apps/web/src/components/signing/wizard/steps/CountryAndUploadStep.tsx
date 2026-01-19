'use client'

import { Suspense, useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { useDropzone } from 'react-dropzone'
import { jsPDF } from 'jspdf'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, UploadCloud, FileText, Sparkles, CheckCircle2, XCircle, AlertTriangle, ExternalLink, Download, X, Info } from 'lucide-react'
import { toast } from 'sonner'
import { useSigningWizard } from '../WizardContext'
import { useGlobalCountryOptional } from '@/providers/GlobalCountryProvider'
import { useOrganization } from '@/hooks/useOrganization'

export function CountryAndUploadStep() {
  return (
    <Suspense fallback={
      <Card>
        <CardHeader>
          <CardTitle>Paso 1 · Documento</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Cargando...
          </div>
        </CardContent>
      </Card>
    }>
      <CountryAndUploadStepContent />
    </Suspense>
  )
}

function CountryAndUploadStepContent() {
  const supabase = useMemo(() => createClient(), [])
  const { state, actions } = useSigningWizard()
  const globalCountry = useGlobalCountryOptional()
  const { activeOrganization, isLoading: orgLoading } = useOrganization()
  const searchParams = useSearchParams()
  const fromDocumentId = searchParams.get('fromDocument')

  const [title, setTitle] = useState('')
  const [documentType, setDocumentType] = useState<string>('')
  const [documentTypes, setDocumentTypes] = useState<any[]>([])
  const [isBootstrapping, setIsBootstrapping] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isAnalyzingAi, setIsAnalyzingAi] = useState(false)
  const [analysisStep, setAnalysisStep] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const [creditCost, setCreditCost] = useState<number | null>(null)
  const [creditBalance, setCreditBalance] = useState<number | null>(null)
  const [orgCountryCode, setOrgCountryCode] = useState<string | null>(null)

  const [aiReviewData, setAiReviewData] = useState<any | null>(null)
  const [countrySettings, setCountrySettings] = useState<
    Record<string, { ai_analysis_available: boolean; ai_analysis_message: string | null }>
  >({})
  const [promptAvailable, setPromptAvailable] = useState<Record<string, boolean>>({})
  
  // Estado para aceptación de riesgos (documentos observados)
  const [riskAccepted, setRiskAccepted] = useState(false)
  const [isAcceptingRisk, setIsAcceptingRisk] = useState(false)
  
  // Estado para previsualización del PDF
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [showPreview, setShowPreview] = useState(false)

  const countries = useMemo(
    () => [
      { code: 'CL', name: 'Chile' },
      { code: 'AR', name: 'Argentina' },
      { code: 'CO', name: 'Colombia' },
      { code: 'MX', name: 'México' },
      { code: 'PE', name: 'Perú' },
      { code: 'US', name: 'Estados Unidos' },
    ],
    []
  )

  const selectedCountry = useMemo(() => {
    return countries.find((c) => c.code === state.countryCode) || null
  }, [countries, state.countryCode])

  const orgCountryName = useMemo(() => {
    if (!orgCountryCode) return null
    return countries.find((c) => c.code === orgCountryCode)?.name || orgCountryCode
  }, [countries, orgCountryCode])

  const aiConfig = useMemo(() => {
    const key = (state.countryCode || '').toString().toUpperCase()
    return countrySettings[key] || null
  }, [countrySettings, state.countryCode])

  const aiAvailable = Boolean(aiConfig?.ai_analysis_available) && Boolean(promptAvailable[state.countryCode] || promptAvailable['ALL'])

  const canUseAi = useMemo(() => {
    if (!creditCost || creditBalance === null) return true
    return creditBalance >= creditCost
  }, [creditBalance, creditCost])

  const loadOrgAndCredits = useCallback(async () => {
    // Si estamos cargando organizaciones, esperamos
    if (orgLoading) return

    setIsBootstrapping(true)
    setError(null)

    try {
      const { data: auth } = await supabase.auth.getUser()
      const user = auth?.user

      // 1. Carga básica de configuraciones (países, prompts, precios) que no dependen de la org
      // Country settings (AI availability)
      const { data: settings, error: settingsError } = await supabase
        .from('signing_country_settings')
        .select('country_code, ai_analysis_available, ai_analysis_message')

      if (!settingsError && Array.isArray(settings)) {
        const next: Record<string, { ai_analysis_available: boolean; ai_analysis_message: string | null }> = {}
        for (const s of settings) {
          const code = (s as any)?.country_code?.toString?.()?.toUpperCase?.()
          if (!code) continue
          next[code] = {
            ai_analysis_available: Boolean((s as any)?.ai_analysis_available),
            ai_analysis_message: ((s as any)?.ai_analysis_message ?? null) as string | null,
          }
        }
        setCountrySettings(next)
      }

      // Check for active prompts per country
      const { data: prompts, error: promptsError } = await supabase
        .from('ai_prompts')
        .select('country_code')
        .eq('feature_type', 'document_review')
        .eq('is_active', true)

      if (!promptsError && Array.isArray(prompts)) {
        const promptMap: Record<string, boolean> = {}
        for (const p of prompts) {
          const code = (p as any)?.country_code?.toString?.()?.toUpperCase?.()
          if (code) promptMap[code] = true
        }
        setPromptAvailable(promptMap)
      }

      // Credit cost (ai_document_review_full)
      const { data: prices, error: priceError } = await supabase
        .from('credit_prices')
        .select('credit_cost')
        .eq('service_code', 'ai_document_review_full')
        .limit(1)

      if (!priceError && prices?.length) {
        const cost = Number(prices[0]?.credit_cost ?? 0)
        setCreditCost(cost > 0 ? cost : null)
      }

      // 2. Si no hay usuario, permitimos continuar sin errores de org
      if (!user) {
        // Cargar tipos de documentos para el país actual
        const currentCountry = state.countryCode || 'CL'
        const { data: docTypes } = await supabase
          .from('signing_document_types')
          .select('*')
          .eq('country_code', currentCountry)
          .eq('is_active', true)
          .order('display_order', { ascending: true })

        if (docTypes) setDocumentTypes(docTypes)
        return
      }

      // 3. Si hay usuario, validar organización
      if (!activeOrganization?.id) {
        // Si no hay organización activa, permitimos continuar.
        // El CheckoutStep se encargará de crear una organización personal automáticamente.
        console.log('[CountryAndUploadStep] Usuario logueado sin organización activa. Se creará en el checkout.')
        setOrgCountryCode(null)
      } else {
        const organizationId = activeOrganization.id
        actions.setOrgId(organizationId)

        // Balance
        const { data: balance, error: balanceError } = await supabase.rpc('get_balance', {
          org_id_param: organizationId,
        })

        if (!balanceError) {
          setCreditBalance(Number(balance ?? 0))
        }

        // Default country priority: 1) organization.country, 2) global context
        let resolvedCountry = state.countryCode || 'CL'
        const { data: org } = await supabase
          .from('organizations')
          .select('country')
          .eq('id', organizationId)
          .maybeSingle()

        if (org?.country) {
          const orgCountry = org.country.toString().toUpperCase()
          if (orgCountry && orgCountry.length === 2) {
            resolvedCountry = orgCountry
            setOrgCountryCode(orgCountry)
            actions.setCountryCode(orgCountry)
          }
        } else if (globalCountry?.country && !globalCountry.isLoading) {
          resolvedCountry = globalCountry.country.toUpperCase()
          setOrgCountryCode(null)
          actions.setCountryCode(resolvedCountry)
        } else {
          setOrgCountryCode(null)
        }

        // Load document types for the resolved country
        const { data: docTypes } = await supabase
          .from('signing_document_types')
          .select('*')
          .eq('country_code', resolvedCountry)
          .eq('is_active', true)
          .order('display_order', { ascending: true })

        if (docTypes) {
          setDocumentTypes(docTypes)
        }
        return
      }

      // Load document types for the selected country
      const currentCountry = state.countryCode || 'CL'
      const { data: docTypes } = await supabase
        .from('signing_document_types')
        .select('*')
        .eq('country_code', currentCountry)
        .eq('is_active', true)
        .order('display_order', { ascending: true })

      if (docTypes) {
        setDocumentTypes(docTypes)
      }
    } catch (e: any) {
      console.error('[CountryAndUploadStep] bootstrap error', e)
      setError(e?.message || 'Ocurrió un error cargando tu información.')
    } finally {
      setIsBootstrapping(false)
    }
  }, [actions, supabase, globalCountry, activeOrganization, orgLoading, state.countryCode])

  useEffect(() => {
    loadOrgAndCredits()
  }, [loadOrgAndCredits])

  // Efecto para auto-cargar documento desde el editor si viene por query param
  useEffect(() => {
    if (fromDocumentId && !state.file && !isBootstrapping) {
      const loadFromDocument = async () => {
        try {
          // 1. Obtener el documento desde la API (puedes usar Supabase directamente si prefieres)
          const { data, error } = await supabase
            .from('documents_documents')
            .select('*')
            .eq('id', fromDocumentId)
            .single()

          if (error) throw error
          if (!data) throw new Error('Documento no encontrado')

          // 2. Generar PDF usando jsPDF
          const doc = new jsPDF()
          
          // Configuración básica para generar algo legible desde el contenido
          // TipTap guarda en JSON, pero aquí podemos intentar obtener el HTML si lo guardáramos o procesar el JSON.
          // Por el plan, asumiré que podemos renderizar el contenido básico.
          
          doc.setFontSize(12)
          
          let y = 20
          const margin = 20
          const pageWidth = doc.internal.pageSize.getWidth()
          const maxLineWidth = pageWidth - margin * 2

          // Función auxiliar para agregar texto con wrap
          const addWrappedText = (text: string) => {
            const lines = doc.splitTextToSize(text, maxLineWidth)
            doc.text(lines, margin, y)
            y += lines.length * 7
          }


          if (data.content && typeof data.content === 'object') {
            const content = data.content.content || []
            
            // State for rendering
            let currentY = 20
            const margin = 20
            const pageWidth = doc.internal.pageSize.getWidth()
            const maxLineWidth = pageWidth - margin * 2
            const lineHeight = 7
            
            // Helper to check page break
            const checkPageBreak = (heightIfNeeded: number = lineHeight) => {
              if (currentY + heightIfNeeded > 280) {
                doc.addPage()
                currentY = 20
                return true
              }
              return false
            }

            // Recursive render function
            const renderNodes = (nodes: any[], indent: number = 0, listType: 'bullet' | 'ordered' | null = null, listIndex: number = 0) => {
              nodes.forEach((node, index) => {
                const nodeIndent = indent * 10
                const availableWidth = maxLineWidth - nodeIndent
                const startX = margin + nodeIndent

                if (node.type === 'heading') {
                  const level = node.attrs?.level || 1
                  const fontSize = level === 1 ? 24 : level === 2 ? 20 : 16
                  const isBold = true
                  
                  checkPageBreak(fontSize * 0.5 + 5)
                  
                  doc.setFontSize(fontSize)
                  doc.setFont('helvetica', 'bold') // Headings always bold
                  
                  const text = (node.content || []).map((c: any) => c.text).join('')
                  const lines = doc.splitTextToSize(text, availableWidth)
                  
                  const align = node.attrs?.textAlign || 'left'
                  let x = startX
                  if (align === 'center') x = pageWidth / 2
                  else if (align === 'right') x = pageWidth - margin
                  
                  doc.text(lines, x, currentY, { align: align as any })
                  currentY += lines.length * (fontSize * 0.5) + 5 // Margin bottom
                  
                } else if (node.type === 'paragraph') {
                  // If empty paragraph, just add space
                  if (!node.content) {
                    currentY += lineHeight
                    return
                  }
                  
                  checkPageBreak()
                  
                  doc.setFontSize(12)
                  const align = node.attrs?.textAlign || 'left'
                  
                  // For simple paragraphs without complex marks, we could use splitTextToSize
                  // But to support inline styles, we need to flow word by word
                  
                  let cursorX = startX
                  // Adjustment for alignment (simplified: only works for block, tricky for inline flow)
                  // For now, inline flow + alignment is hard. Defaulting to left for rich text.
                  
                  const paragraphNodes = node.content || []
                  
                  paragraphNodes.forEach((child: any) => {
                    if (child.type === 'text') {
                      const text = child.text || ''
                      const marks = child.marks || []
                      
                      // Set Font Style
                      const isBold = marks.some((m: any) => m.type === 'bold')
                      const isItalic = marks.some((m: any) => m.type === 'italic')
                      const isUnderline = marks.some((m: any) => m.type === 'underline')
                      const isHighlight = marks.some((m: any) => m.type === 'highlight')
                      const linkMark = marks.find((m: any) => m.type === 'link')
                      
                      let fontStyle = 'normal'
                      if (isBold && isItalic) fontStyle = 'bolditalic'
                      else if (isBold) fontStyle = 'bold'
                      else if (isItalic) fontStyle = 'italic'
                      
                      doc.setFont('helvetica', fontStyle)
                      
                      // Split by words to handle wrapping
                      // We keep spaces attached to previous word or as separate chunks? 
                      // Simplest: split by space, but preserve space width
                      const words = text.split(/(\s+)/)
                      
                      words.forEach((word: string) => {
                        if (!word) return
                        
                        const wordWidth = doc.getTextWidth(word)
                        
                        if (cursorX + wordWidth > pageWidth - margin) {
                          currentY += lineHeight
                          cursorX = startX
                          checkPageBreak()
                        }
                        
                        // Draw Background (Highlight)
                        if (isHighlight) {
                          doc.setFillColor(255, 255, 0)
                          doc.rect(cursorX, currentY - 5, wordWidth, 7, 'F')
                          doc.setFillColor(0)
                        }
                        
                        // Draw Text
                        if (linkMark) {
                          doc.setTextColor(0, 0, 255)
                          doc.textWithLink(word, cursorX, currentY, { url: linkMark.attrs.href })
                          doc.setTextColor(0)
                        } else {
                           doc.text(word, cursorX, currentY)
                        }
                        
                        // Draw Underline
                        if (isUnderline) {
                          doc.setLineWidth(0.5)
                          doc.line(cursorX, currentY + 1, cursorX + wordWidth, currentY + 1)
                        }
                        
                        cursorX += wordWidth
                      })
                    }
                  })
                  
                  currentY += lineHeight // End of paragraph
                  
                } else if (node.type === 'bulletList') {
                  renderNodes(node.content || [], indent + 1, 'bullet')
                } else if (node.type === 'orderedList') {
                  renderNodes(node.content || [], indent + 1, 'ordered')
                } else if (node.type === 'listItem') {
                   // Draw bullet/number
                   const itemX = startX - 5
                   if (listType === 'bullet') {
                     doc.setFontSize(14)
                     doc.text('•', itemX, currentY)
                     doc.setFontSize(12)
                   } else if (listType === 'ordered') {
                     doc.setFontSize(12)
                     doc.text(String(listIndex + 1) + '.', itemX, currentY)
                   }
                   
                   // Render children (usually paragraphs)
                   // Note: listItem content usually starts with a paragraph.
                   // We need to ensure that paragraph doesn't add extra newline at start
                   // For simplicity: render children normally, but maybe adjust Y?
                   renderNodes(node.content || [], indent, null, 0)
                }
              })
            }

            renderNodes(content)

          } else if (typeof data.content === 'string') {
            doc.setFontSize(12)
            doc.setFont('helvetica', 'normal')
            const lines = doc.splitTextToSize(data.content, maxLineWidth)
            doc.text(lines, margin, y)
            y += lines.length * 7
          }

          // 3. Convertir a Blob y luego a File
          const pdfBlob = doc.output('blob')
          const fileName = `${(data.title || 'documento').replace(/\s+/g, '_')}.pdf`
          const file = new File([pdfBlob], fileName, { type: 'application/pdf' })

          // 4. Establecer en el wizard
          actions.setFile(file)
          setTitle(data.title || '')
          
          toast.success('Documento cargado desde el editor')
        } catch (err: any) {
          console.error('Error auto-loading document:', err)
          toast.error('No se pudo cargar el documento para firmar')
        }
      }

      loadFromDocument()
    }
  }, [fromDocumentId, state.file, isBootstrapping, supabase, actions])

  // Efecto para generar URL de previsualización del PDF
  useEffect(() => {
    if (state.file) {
      const url = URL.createObjectURL(state.file)
      setPreviewUrl(url)
      setShowPreview(true)
      
      // Cleanup: revocar URL cuando cambie el archivo o se desmonte
      return () => {
        URL.revokeObjectURL(url)
      }
    } else {
      setPreviewUrl(null)
      setShowPreview(false)
    }
  }, [state.file])

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const file = acceptedFiles[0] ?? null
      actions.setFile(file)
      actions.setUploadedFilePath(null)
      actions.setDocumentId(null)
      actions.setRequiresAiReview(false)
      actions.setAiReview({ id: null, status: null })
      setAiReviewData(null)
      setRiskAccepted(false)
      setError(null)

      if (file && !title) {
        const base = file.name.replace(/\.pdf$/i, '')
        setTitle(base)
      }
    },
    [actions, title]
  )

  const { getRootProps, getInputProps, isDragActive, fileRejections } = useDropzone({
    onDrop,
    multiple: false,
    maxSize: 10 * 1024 * 1024, // 10MB
    accept: { 'application/pdf': ['.pdf'] },
  })

  const rejectionMessage = useMemo(() => {
    const first = fileRejections[0]
    if (!first) return null
    const err = first.errors[0]
    if (!err) return 'Archivo no válido.'
    if (err.code === 'file-too-large') return 'El PDF no debe superar los 10MB.'
    if (err.code === 'file-invalid-type') return 'Solo se permiten archivos PDF.'
    return err.message
  }, [fileRejections])

  const fetchAiReviewById = useCallback(
    async (reviewId: string) => {
      const { data, error: fetchError } = await supabase
        .from('signing_ai_reviews')
        .select('id, status, reasons, suggestions, metadata, completed_at, created_at')
        .eq('id', reviewId)
        .maybeSingle()
      if (!fetchError && data) return data
      return null
    },
    [supabase]
  )

  const ensureDocumentAndUpload = useCallback(
    async (opts: { requiresAiReview: boolean }) => {
      if (!state.file) {
        throw new Error('Debes subir un PDF para continuar.')
      }

      const { data: auth } = await supabase.auth.getUser()
      const user = auth?.user

      // Si no hay usuario logueado, no podemos crear el documento en la DB todavía.
      // Guardamos la configuración en el estado local del wizard y continuamos.
      if (!user) {
        actions.setRequiresAiReview(opts.requiresAiReview)
        return { documentId: null, userId: null }
      }

      if (!state.orgId) {
        throw new Error('No pudimos determinar tu organización. Intenta recargar.')
      }

      // Si ya existe doc + path, no re-subimos (el usuario no cambió el archivo)
      if (state.documentId && state.uploadedFilePath) {
        // Asegurar flag en el doc (por si se activó IA después)
        await supabase
          .from('signing_documents')
          .update({ requires_ai_review: opts.requiresAiReview })
          .eq('id', state.documentId)
        return { documentId: state.documentId, userId: auth.user.id }
      }

      // 1) Crear documento (draft)
      const safeTitle = title?.trim() || state.file.name.replace(/\.pdf$/i, '')

      const { data: newDoc, error: createError } = await supabase.rpc('create_signing_document', {
        p_organization_id: state.orgId,
        p_title: safeTitle,
        p_description: null,
        p_signing_order: 'simultaneous',
        p_notary_service: 'none',
        p_requires_approval: false,
        p_requires_ai_review: opts.requiresAiReview,
        p_order_id: null,
      })

      if (createError || !newDoc?.id) {
        throw new Error(createError?.message || 'No se pudo crear el documento')
      }

      const documentId = newDoc.id as string
      actions.setDocumentId(documentId)

      // 2) Subir archivo a docs-originals
      const v1Path = `${state.orgId}/${documentId}/v1/original.pdf`

      const { error: uploadError } = await supabase.storage.from('docs-originals').upload(v1Path, state.file!, {
        contentType: 'application/pdf',
        upsert: false,
      })

      if (uploadError) {
        throw new Error(`Error al subir archivo: ${uploadError.message}`)
      }

      actions.setUploadedFilePath(v1Path)

      // 3) Actualizar documento con referencia al archivo + metadata país
      const { error: updateError } = await supabase
        .from('signing_documents')
        .update({
          original_file_path: v1Path,
          original_file_name: state.file.name,
          original_file_size: state.file.size,
          original_file_type: state.file.type || 'application/pdf',
          requires_ai_review: opts.requiresAiReview,
          metadata: {
            country_code: state.countryCode,
            document_type: state.documentType,
            originals_bucket: 'docs-originals',
            originals_version: 1,
          },
          status: 'draft',
        })
        .eq('id', documentId)

      if (updateError) throw updateError

      // 4) Crear versión 1
      await supabase.from('signing_document_versions').insert({
        document_id: documentId,
        version_number: 1,
        version_type: 'original',
        file_path: v1Path,
        file_name: state.file.name,
        file_size: state.file.size,
        created_by: auth.user.id,
      })


      return { documentId, userId: auth.user.id }
    },
    [actions, state.countryCode, state.documentId, state.file, state.orgId, state.uploadedFilePath, supabase, title]
  )

  const handleAnalyzeAi = useCallback(async () => {
    setError(null)
    setAnalysisStep(null)

    if (!aiAvailable) return
    if (!state.file) {
      setError('Debes subir un PDF para analizar.')
      return
    }
    if (!canUseAi) {
      setError('Créditos insuficientes para usar IA. Puedes continuar sin revisión.')
      return
    }

    try {
      setIsAnalyzingAi(true)
      actions.setRequiresAiReview(true)

      // Paso 1: Preparando documento
      setAnalysisStep('Preparando documento...')
      const { documentId } = await ensureDocumentAndUpload({ requiresAiReview: true })

      // Paso 2: Enviando a IA
      setAnalysisStep('Enviando documento a la IA...')
      
      // Pequeña pausa para que se vea el paso
      await new Promise(r => setTimeout(r, 500))
      
      setAnalysisStep('La IA está analizando tu documento...')

      const resp = await fetch('/api/signing/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ document_id: documentId }),
      })

      const data = await resp.json().catch(() => ({}))
      
      // Log para debug
      console.log('[CountryAndUploadStep] Respuesta de /api/signing/analyze:', { status: resp.status, data })
      
      if (!resp.ok) {
        const errorMsg = data?.error || data?.message || 'No se pudo analizar el documento con IA'
        console.error('[CountryAndUploadStep] Error del servidor:', data)
        throw new Error(errorMsg)
      }

      setAnalysisStep('Procesando resultados...')

      const reviewId = (data?.review_id || '').toString()
      const status = (data?.status || '').toString()
      const reviewFromApi = data?.ai_review

      if (reviewFromApi) {
        setAiReviewData(reviewFromApi)
      } else if (reviewId) {
        const review = await fetchAiReviewById(reviewId)
        if (review) setAiReviewData(review)
      }

      if (status) {
        actions.setAiReview({
          id: reviewId || null,
          status: (status as 'pending' | 'approved' | 'rejected' | null) || null,
        })
      }

      setAnalysisStep(null)

      if (status === 'approved') {
        toast.success('IA: Aprobado. Puedes continuar.')
      } else if (status === 'needs_changes') {
        toast.message('IA: Observado. Puedes corregir o continuar igual.')
      } else if (status === 'rejected') {
        toast.message('IA: Rechazado. Puedes revisar las sugerencias y continuar si lo deseas.')
      } else {
        toast.message('Análisis completado.')
      }

      // Refrescar el balance de créditos después de consumirlos
      if (state.orgId) {
        try {
          const { data: newBalance } = await supabase.rpc('get_balance', {
            org_id_param: state.orgId,
          })
          if (typeof newBalance === 'number') {
            setCreditBalance(newBalance)
          }
        } catch (balanceErr) {
          console.warn('[CountryAndUploadStep] Error refrescando balance:', balanceErr)
        }
      }
    } catch (e: unknown) {
      const err = e as Error
      console.error('[CountryAndUploadStep] analyze error', err)
      setError(err?.message || 'Ocurrió un error al analizar con IA.')
      setAnalysisStep(null)
    } finally {
      setIsAnalyzingAi(false)
    }
  }, [actions, aiAvailable, canUseAi, ensureDocumentAndUpload, fetchAiReviewById, state.file, state.orgId, supabase])

  const handleContinue = useCallback(async () => {
    setError(null)

    try {
      setIsSubmitting(true)

      // SIEMPRE requerir revisión IA post-compra (obligatorio para el backend)
      // La revisión IA del frontend es opcional para el usuario
      await ensureDocumentAndUpload({ requiresAiReview: true })

      toast.success('Documento cargado. ¡Vamos al siguiente paso!')
      actions.nextStep()
    } catch (e: any) {
      console.error('[CountryAndUploadStep] submit error', e)
      setError(e?.message || 'Ocurrió un error al subir el documento.')
    } finally {
      setIsSubmitting(false)
    }
  }, [actions, ensureDocumentAndUpload])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Paso 1 · Documento</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {isBootstrapping ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Cargando configuración...
          </div>
        ) : (
          <>
            {orgCountryCode && (
              <Alert className="border-[var(--tp-lines-30)] bg-[var(--tp-bg-light-10)]">
                <AlertDescription>
                  Tu país está definido por tu organización: {orgCountryName} ({orgCountryCode}). Los precios y la moneda se calculan con ese país.
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label>Título (opcional)</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ej: Contrato de Arrendamiento"
                disabled={isSubmitting}
              />
            </div>

            {documentTypes.length > 0 && (
              <div className="space-y-2">
                <Label>Tipo de Documento</Label>
                <Select
                  value={documentType}
                  onValueChange={(value) => {
                    setDocumentType(value)
                    actions.setDocumentType(value)
                  }}
                  disabled={isSubmitting}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un tipo..." />
                  </SelectTrigger>
                  <SelectContent>
                    {documentTypes.map((type) => (
                      <SelectItem key={type.id} value={type.slug}>
                        {type.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {documentType && (
                  <p className="text-xs text-muted-foreground">
                    {documentTypes.find((t) => t.slug === documentType)?.description || ''}
                  </p>
                )}
              </div>
            )}

            <div className="space-y-2">
              <Label>Documento (PDF)</Label>
              <div
                {...getRootProps()}
                className={[
                  'rounded-lg border border-dashed p-5 transition-colors cursor-pointer',
                  isDragActive ? 'border-[var(--tp-buttons)] bg-[var(--tp-buttons-10)]' : 'border-[var(--tp-lines-30)]',
                ].join(' ')}
              >
                <input {...getInputProps()} />
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 rounded-md bg-muted p-2">
                    <UploadCloud className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold">
                      {state.file ? 'PDF seleccionado' : 'Arrastra tu PDF aquí o haz clic para buscar'}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Solo PDF · Máx 10MB
                    </div>
                    {state.file && (
                      <div className="mt-2 flex items-center gap-2 text-xs">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span className="truncate">{state.file.name}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {rejectionMessage && (
                <p className="text-xs text-destructive">{rejectionMessage}</p>
              )}
            </div>

            {/* Previsualización del PDF */}
            {state.file && previewUrl && (
              <div className="rounded-lg border overflow-hidden">
                <div className="flex items-center justify-between bg-muted/50 px-4 py-2 border-b">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span className="truncate max-w-[200px] sm:max-w-none">{state.file.name}</span>
                    <span className="text-xs text-muted-foreground">
                      ({(state.file.size / 1024 / 1024).toFixed(2)} MB)
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => window.open(previewUrl, '_blank')}
                      className="h-8 px-2"
                      title="Abrir en nueva pestaña"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const link = document.createElement('a')
                        link.href = previewUrl
                        link.download = state.file?.name || 'document.pdf'
                        link.click()
                      }}
                      className="h-8 px-2"
                      title="Descargar"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowPreview(!showPreview)}
                      className="h-8 px-2"
                      title={showPreview ? 'Ocultar vista previa' : 'Mostrar vista previa'}
                    >
                      {showPreview ? 'Ocultar' : 'Mostrar'}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        actions.setFile(null)
                        actions.setUploadedFilePath(null)
                        actions.setDocumentId(null)
                        actions.setRequiresAiReview(false)
                        actions.setAiReview({ id: null, status: null })
                        setAiReviewData(null)
                        setRiskAccepted(false)
                      }}
                      className="h-8 px-2 text-destructive hover:text-destructive"
                      title="Eliminar archivo"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                {showPreview && (
                  <div className="relative bg-gray-100 dark:bg-gray-900">
                    <iframe
                      src={previewUrl}
                      className="w-full h-[500px] border-0"
                      title={`Vista previa: ${state.file.name}`}
                    />
                  </div>
                )}
              </div>
            )}

            {aiAvailable && state.file && (
              <div className="rounded-lg border p-4">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 rounded-md bg-[var(--tp-buttons-10)] p-2">
                    <Sparkles className="h-5 w-5 text-[var(--tp-buttons)]" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="text-sm font-semibold">Revisión por IA (opcional)</div>
                    <div className="text-xs text-muted-foreground">
                      {aiConfig?.ai_analysis_message ||
                        `Disponible para ${selectedCountry?.name || state.countryCode}. Revisa el documento antes de elegir servicios.`}
                    </div>

                    <div className="text-xs text-muted-foreground">
                      {creditCost !== null ? (
                        <>
                          Costo: <span className="font-semibold">{creditCost}</span> créditos
                        </>
                      ) : (
                        'Costo: por definir'
                      )}
                      {creditBalance !== null && (
                        <>
                          {' '}· Tu saldo: <span className="font-semibold">{creditBalance}</span> créditos
                        </>
                      )}
                    </div>

                    {!canUseAi && (
                      <p className="text-xs text-destructive">
                        Créditos insuficientes para usar IA. Puedes continuar sin revisión.
                      </p>
                    )}

                    {isAnalyzingAi && analysisStep ? (
                      <div className="mt-3 rounded-lg bg-muted/50 p-3 space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                          <Loader2 className="h-4 w-4 animate-spin text-[var(--tp-buttons)]" />
                          <span className="font-medium">{analysisStep}</span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          La IA está revisando el documento en busca de riesgos, cláusulas problemáticas y oportunidades de mejora...
                        </div>
                      </div>
                    ) : (
                      <div className="mt-3">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleAnalyzeAi}
                          disabled={isSubmitting || isAnalyzingAi || !canUseAi}
                          className="w-full sm:w-auto"
                        >
                          {state.aiReviewId ? (
                            'Re-analizar con IA'
                          ) : (
                            'Analizar con IA'
                          )}
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {aiReviewData && (
              <div
                className={[
                  'rounded-lg border p-4 space-y-4 transition-colors',
                  aiReviewData.status === 'approved'
                    ? 'border-emerald-500/40 bg-emerald-50 dark:bg-emerald-500/10 dark:border-emerald-400/40'
                    : '',
                  aiReviewData.status === 'rejected'
                    ? 'border-red-500/40 bg-red-50 dark:bg-red-500/10 dark:border-red-400/40'
                    : '',
                  aiReviewData.status === 'needs_changes'
                    ? 'border-amber-500/40 bg-amber-50 dark:bg-amber-500/10 dark:border-amber-400/40'
                    : '',
                  !['approved', 'rejected', 'needs_changes'].includes(aiReviewData.status)
                    ? 'border-[var(--tp-lines-30,#7a7a7a50)] bg-[var(--tp-bg-light-10,#f7f7f7)] dark:bg-white/5 dark:border-white/10'
                    : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
              >
                {/* Header con resultado */}
                <div className="flex items-center gap-2">
                  {aiReviewData.status === 'approved' && (
                    <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  )}
                  {aiReviewData.status === 'rejected' && (
                    <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                  )}
                  {aiReviewData.status === 'needs_changes' && (
                    <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                  )}
                  {!['approved', 'rejected', 'needs_changes'].includes(aiReviewData.status) && (
                    <Sparkles className="h-5 w-5 text-[var(--tp-buttons)]" />
                  )}
                  <div className="font-semibold">
                    {aiReviewData.status === 'approved' && 'Documento Aprobado'}
                    {aiReviewData.status === 'rejected' && 'Documento Rechazado'}
                    {aiReviewData.status === 'needs_changes' && 'Documento Observado'}
                    {!['approved', 'rejected', 'needs_changes'].includes(aiReviewData.status) &&
                      'Resultado del análisis'}
                  </div>
                </div>

                {/* Tipo de documento y cantidad de firmantes */}
                {(aiReviewData.metadata?.tipo_documento || aiReviewData.metadata?.cantidad_firmantes) && (
                  <div className="flex flex-wrap gap-4 text-sm">
                    {aiReviewData.metadata?.tipo_documento && (
                      <div className="flex items-center gap-1.5">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">Tipo:</span>
                        <span>{aiReviewData.metadata.tipo_documento}</span>
                      </div>
                    )}
                    {aiReviewData.metadata?.cantidad_firmantes !== undefined && (
                      <div className="flex items-center gap-1.5">
                        <Info className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">Firmantes requeridos:</span>
                        <span>{aiReviewData.metadata.cantidad_firmantes}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Resumen */}
                {aiReviewData.metadata?.summary && (
                  <div className="text-sm">
                    <div className="font-semibold mb-1">Resumen</div>
                    <p className="text-muted-foreground">{aiReviewData.metadata.summary}</p>
                  </div>
                )}

                {/* Puntos importantes */}
                {Array.isArray(aiReviewData.metadata?.puntos_importantes) && aiReviewData.metadata.puntos_importantes.length > 0 && (
                  <div className="text-sm">
                    <div className="font-semibold mb-2">Puntos importantes</div>
                    <ul className="space-y-1.5">
                      {aiReviewData.metadata.puntos_importantes.map((punto: string, idx: number) => (
                        <li key={idx} className="flex gap-2">
                          <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-[var(--tp-buttons)] shrink-0" />
                          <span className="text-muted-foreground">{punto}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Observaciones/Riesgos detectados */}
                {Array.isArray(aiReviewData.reasons) && aiReviewData.reasons.length > 0 && (
                  <div className="text-sm space-y-2">
                    <div className="font-semibold">
                      {aiReviewData.status === 'needs_changes' ? 'Observaciones' : 'Riesgos detectados'}
                    </div>
                    <div className="space-y-2">
                      {aiReviewData.reasons.map(
                        (
                          r: { level?: 'high' | 'medium' | 'low'; text?: string; explanation?: string },
                          idx: number
                        ) => (
                          <div
                            key={idx}
                            className={[
                              'rounded-md p-3 text-sm border-l-4',
                              r.level === 'high'
                                ? 'bg-red-50 border-red-500 dark:bg-red-500/10'
                                : '',
                              r.level === 'medium'
                                ? 'bg-amber-50 border-amber-500 dark:bg-amber-500/10'
                                : '',
                              r.level === 'low'
                                ? 'bg-sky-50 border-sky-500 dark:bg-sky-500/10'
                                : '',
                              !r.level ? 'bg-gray-50 dark:bg-white/5 border-gray-300' : '',
                            ]
                              .filter(Boolean)
                              .join(' ')}
                          >
                            <div className="flex items-center gap-2 mb-1">
                              <span className={[
                                'text-xs font-semibold uppercase',
                                r.level === 'high' ? 'text-red-700 dark:text-red-400' : '',
                                r.level === 'medium' ? 'text-amber-700 dark:text-amber-400' : '',
                                r.level === 'low' ? 'text-sky-700 dark:text-sky-400' : '',
                                !r.level ? 'text-gray-600 dark:text-gray-400' : '',
                              ].filter(Boolean).join(' ')}>
                                {r.level === 'high' && 'Error'}
                                {r.level === 'medium' && 'Advertencia'}
                                {r.level === 'low' && 'Sugerencia'}
                                {!r.level && 'Info'}
                              </span>
                            </div>
                            <p className="text-muted-foreground">
                              {r.explanation || r.text || ''}
                            </p>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                )}

                {/* Sugerencias de modificación (solo para observados) */}
                {Array.isArray(aiReviewData.suggestions) && aiReviewData.suggestions.length > 0 && aiReviewData.status === 'needs_changes' && (
                  <div className="text-sm space-y-2">
                    <div className="font-semibold">Sugerencias de modificación</div>
                    <ul className="space-y-1.5">
                      {aiReviewData.suggestions.map((s: string, idx: number) => (
                        <li key={idx} className="flex gap-2">
                          <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0" />
                          <span className="text-muted-foreground">{s}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Razones de rechazo (solo para rechazados) */}
                {Array.isArray(aiReviewData.metadata?.razones_rechazo) && aiReviewData.metadata.razones_rechazo.length > 0 && aiReviewData.status === 'rejected' && (
                  <div className="text-sm space-y-2">
                    <div className="font-semibold text-red-700 dark:text-red-400">Razones del rechazo</div>
                    <ul className="space-y-1.5">
                      {aiReviewData.metadata.razones_rechazo.map((r: string, idx: number) => (
                        <li key={idx} className="flex gap-2">
                          <XCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                          <span className="text-muted-foreground">{r}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Servicio notarial sugerido */}
                {aiReviewData.metadata?.servicio_notarial_sugerido && aiReviewData.metadata.servicio_notarial_sugerido !== 'ninguno' && (
                  <Alert className="bg-blue-50 border-blue-200 dark:bg-blue-500/10 dark:border-blue-400/40">
                    <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    <AlertDescription className="text-blue-800 dark:text-blue-200">
                      <span className="font-medium">Servicio notarial sugerido: </span>
                      {aiReviewData.metadata.servicio_notarial_sugerido === 'protocolizacion' && 'Protocolización'}
                      {aiReviewData.metadata.servicio_notarial_sugerido === 'firma_autorizada_notario' && 'Firma Autorizada por Notario'}
                      {aiReviewData.metadata.servicio_notarial_sugerido === 'copia_legalizada' && 'Copia Legalizada'}
                    </AlertDescription>
                  </Alert>
                )}

                {/* Confianza del modelo */}
                {typeof aiReviewData.confidence_score === 'number' && (
                  <div className="text-xs text-muted-foreground pt-2 border-t">
                    Confianza del análisis: {(aiReviewData.confidence_score * 100).toFixed(0)}%
                  </div>
                )}

                {/* Advertencia y checkbox para documentos observados o rechazados */}
                {(aiReviewData.status === 'needs_changes' || aiReviewData.status === 'rejected') && (
                  <div className="mt-4 space-y-3">
                    <Alert className={aiReviewData.status === 'rejected' 
                      ? 'bg-red-50 border-red-300 dark:bg-red-500/10 dark:border-red-400/40'
                      : 'bg-amber-50 border-amber-300 dark:bg-amber-500/10 dark:border-amber-400/40'}>
                      <AlertTriangle className={`h-4 w-4 ${aiReviewData.status === 'rejected' 
                        ? 'text-red-600 dark:text-red-400' 
                        : 'text-amber-600 dark:text-amber-400'}`} />
                      <AlertDescription className={aiReviewData.status === 'rejected'
                        ? 'text-red-800 dark:text-red-200'
                        : 'text-amber-800 dark:text-amber-200'}>
                        <span className="font-medium">Atención:</span> {aiReviewData.status === 'rejected' 
                          ? 'Este documento fue rechazado por la IA debido a problemas detectados. Si decides continuar de todas formas, aceptas los riesgos asociados. Esta decisión quedará registrada para auditoría.'
                          : 'Este documento tiene observaciones que podrían generar problemas a futuro. Si decides continuar sin corregirlas, aceptas los riesgos asociados. Esta decisión quedará registrada para auditoría.'}
                      </AlertDescription>
                    </Alert>
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-white dark:bg-white/5 border">
                      <Checkbox
                        id="accept-risks"
                        checked={riskAccepted}
                        onCheckedChange={(checked) => setRiskAccepted(checked === true)}
                        disabled={isAcceptingRisk}
                      />
                      <Label 
                        htmlFor="accept-risks" 
                        className="text-sm leading-relaxed cursor-pointer"
                      >
                        {aiReviewData.status === 'rejected'
                          ? 'Acepto continuar con el documento rechazado y asumo los riesgos asociados. Entiendo que esta decisión será registrada para efectos de auditoría.'
                          : 'Acepto continuar con las observaciones indicadas y asumo los riesgos asociados. Entiendo que esta decisión será registrada para efectos de auditoría.'}
                      </Label>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
              <Button
                onClick={async () => {
                  // Si es observado o rechazado y no ha aceptado, no dejar continuar
                  if ((aiReviewData?.status === 'needs_changes' || aiReviewData?.status === 'rejected') && !riskAccepted) {
                    toast.error(aiReviewData?.status === 'rejected' 
                      ? 'Debes aceptar los riesgos para continuar con un documento rechazado.'
                      : 'Debes aceptar los riesgos para continuar con un documento observado.')
                    return
                  }

                  // Si es observado o rechazado y aceptó, registrar la aceptación
                  if ((aiReviewData?.status === 'needs_changes' || aiReviewData?.status === 'rejected') && riskAccepted && aiReviewData.id) {
                    setIsAcceptingRisk(true)
                    try {
                      const resp = await fetch('/api/signing/accept-risk', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ review_id: aiReviewData.id }),
                      })
                      if (!resp.ok) {
                        const data = await resp.json().catch(() => ({}))
                        throw new Error(data.error || 'Error al registrar la aceptación')
                      }
                      toast.success('Aceptación de riesgos registrada.')
                    } catch (e: any) {
                      console.error('[CountryAndUploadStep] Error accepting risk:', e)
                      toast.error(e?.message || 'Error al registrar la aceptación de riesgos')
                      setIsAcceptingRisk(false)
                      return
                    } finally {
                      setIsAcceptingRisk(false)
                    }
                  }

                  handleContinue()
                }}
                disabled={isSubmitting || isBootstrapping || isAnalyzingAi || isAcceptingRisk || ((aiReviewData?.status === 'needs_changes' || aiReviewData?.status === 'rejected') && !riskAccepted)}
                className="bg-[var(--tp-buttons)] hover:bg-[var(--tp-buttons-hover)]"
              >
                {isSubmitting || isAcceptingRisk ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Procesando...
                  </>
                ) : (
                  'Continuar'
                )}
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}

