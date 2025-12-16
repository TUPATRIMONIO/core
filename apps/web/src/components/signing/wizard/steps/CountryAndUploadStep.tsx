'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, UploadCloud, FileText, Sparkles, CheckCircle2, XCircle, AlertTriangle, ExternalLink, Download, X } from 'lucide-react'
import { toast } from 'sonner'
import { useSigningWizard } from '../WizardContext'
import { useGlobalCountryOptional } from '@/providers/GlobalCountryProvider'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

export function CountryAndUploadStep() {
  const supabase = useMemo(() => createClient(), [])
  const { state, actions } = useSigningWizard()
  const globalCountry = useGlobalCountryOptional()

  const [title, setTitle] = useState('')
  const [isBootstrapping, setIsBootstrapping] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isAnalyzingAi, setIsAnalyzingAi] = useState(false)
  const [analysisStep, setAnalysisStep] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const [creditCost, setCreditCost] = useState<number | null>(null)
  const [creditBalance, setCreditBalance] = useState<number | null>(null)

  const [aiReviewData, setAiReviewData] = useState<any | null>(null)
  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false)
  const [countrySettings, setCountrySettings] = useState<
    Record<string, { ai_analysis_available: boolean; ai_analysis_message: string | null }>
  >({})
  const [promptAvailable, setPromptAvailable] = useState<Record<string, boolean>>({})
  
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
    setIsBootstrapping(true)
    setError(null)

    try {
      const { data: auth } = await supabase.auth.getUser()
      if (!auth?.user) {
        setError('Necesitas iniciar sesión para crear un documento.')
        return
      }

      // Buscar la primera organización activa del usuario
      const { data: orgUsers, error: orgError } = await supabase
        .from('organization_users')
        .select('organization_id')
        .eq('user_id', auth.user.id)
        .eq('status', 'active')
        .limit(1)

      if (orgError) throw orgError
      const orgUser = orgUsers?.[0]
      if (!orgUser?.organization_id) {
        setError('No encontramos una organización activa asociada a tu usuario.')
        return
      }

      actions.setOrgId(orgUser.organization_id)

      // Default country priority: 1) global context, 2) organization.country
      // Check if we already have a country set from global context
      if (globalCountry?.country && !globalCountry.isLoading) {
        actions.setCountryCode(globalCountry.country.toUpperCase())
      } else {
        // Fallback to organization country
        const { data: org, error: orgCountryError } = await supabase
          .from('organizations')
          .select('country')
          .eq('id', orgUser.organization_id)
          .maybeSingle()

        if (!orgCountryError) {
          const orgCountry = (org?.country || '').toString().toUpperCase()
          if (orgCountry && orgCountry.length === 2) {
            actions.setCountryCode(orgCountry)
          }
        }
      }

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

      // Balance
      const { data: balance, error: balanceError } = await supabase.rpc('get_balance', {
        org_id_param: orgUser.organization_id,
      })

      if (!balanceError) {
        setCreditBalance(Number(balance ?? 0))
      }
    } catch (e: any) {
      console.error('[CountryAndUploadStep] bootstrap error', e)
      setError(e?.message || 'Ocurrió un error cargando tu información.')
    } finally {
      setIsBootstrapping(false)
    }
  }, [actions, supabase, globalCountry])

  useEffect(() => {
    loadOrgAndCredits()
  }, [loadOrgAndCredits])

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
      if (!state.orgId) {
        throw new Error('No pudimos determinar tu organización. Intenta recargar.')
      }
      if (!state.file) {
        throw new Error('Debes subir un PDF para continuar.')
      }

      const { data: auth } = await supabase.auth.getUser()
      if (!auth?.user) {
        throw new Error('Necesitas iniciar sesión para continuar.')
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

      // 2) Subir archivo (prioridad: docs-originals, fallback: signing-documents)
      const v1Path = `${state.orgId}/${documentId}/v1/original.pdf`
      const legacyPath = `${state.orgId}/${documentId}/${documentId}_original.pdf`

      let chosenBucket = 'docs-originals'
      let chosenPath = v1Path

      const uploadTo = async (bucket: string, path: string) => {
        const { error: uploadError } = await supabase.storage.from(bucket).upload(path, state.file!, {
          contentType: 'application/pdf',
          upsert: false,
        })
        if (uploadError) throw uploadError
      }

      try {
        await uploadTo('docs-originals', v1Path)
      } catch (e) {
        chosenBucket = 'signing-documents'
        chosenPath = legacyPath
        await uploadTo('signing-documents', legacyPath)
      }

      actions.setUploadedFilePath(chosenPath)

      // 3) Actualizar documento con referencia al archivo + metadata país
      const { error: updateError } = await supabase
        .from('signing_documents')
        .update({
          original_file_path: chosenPath,
          original_file_name: state.file.name,
          original_file_size: state.file.size,
          original_file_type: state.file.type || 'application/pdf',
          requires_ai_review: opts.requiresAiReview,
          metadata: {
            country_code: state.countryCode,
            originals_bucket: chosenBucket,
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
        file_path: chosenPath,
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
        toast.error('IA: Rechazado. Te recomendamos subir un nuevo documento.')
      } else {
        toast.message('Análisis completado.')
      }
    } catch (e: unknown) {
      const err = e as Error
      console.error('[CountryAndUploadStep] analyze error', err)
      setError(err?.message || 'Ocurrió un error al analizar con IA.')
      setAnalysisStep(null)
    } finally {
      setIsAnalyzingAi(false)
    }
  }, [actions, aiAvailable, canUseAi, ensureDocumentAndUpload, fetchAiReviewById, state.file])

  const handleContinue = useCallback(async () => {
    setError(null)

    // Si IA rechazó, no dejamos avanzar (para evitar frustración más adelante)
    if (state.aiReviewStatus === 'rejected') {
      setError('La IA rechazó este documento. Sube un nuevo PDF para continuar.')
      return
    }

    try {
      setIsSubmitting(true)

      // Si el usuario no analizó, creamos igual el documento (sin IA)
      await ensureDocumentAndUpload({ requiresAiReview: Boolean(state.aiReviewId) })

      toast.success('Documento cargado. ¡Vamos al siguiente paso!')
      actions.nextStep()
    } catch (e: any) {
      console.error('[CountryAndUploadStep] submit error', e)
      setError(e?.message || 'Ocurrió un error al subir el documento.')
    } finally {
      setIsSubmitting(false)
    }
  }, [actions, ensureDocumentAndUpload, state.aiReviewId, state.aiReviewStatus])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Paso 1 · País y Documento</CardTitle>
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
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>País</Label>
                <Select
                  value={state.countryCode}
                  onValueChange={(v) => actions.setCountryCode(v)}
                  disabled={isSubmitting}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un país" />
                  </SelectTrigger>
                  <SelectContent>
                    {countries.map((c) => (
                      <SelectItem key={c.code} value={c.code}>
                        {c.name} ({c.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Título (opcional)</Label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ej: Contrato de Arrendamiento"
                  disabled={isSubmitting}
                />
              </div>
            </div>

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
                  'rounded-lg border p-4 space-y-3 transition-colors',
                  aiReviewData.status === 'approved'
                    ? 'border-emerald-500/40 bg-emerald-100/70 text-emerald-900 dark:bg-emerald-500/10 dark:border-emerald-400/40 dark:text-emerald-50'
                    : '',
                  aiReviewData.status === 'rejected'
                    ? 'border-red-500/40 bg-red-100/70 text-red-900 dark:bg-red-500/10 dark:border-red-400/40 dark:text-red-50'
                    : '',
                  aiReviewData.status === 'needs_changes'
                    ? 'border-amber-500/40 bg-amber-100/70 text-amber-900 dark:bg-amber-500/10 dark:border-amber-400/40 dark:text-amber-50'
                    : '',
                  !['approved', 'rejected', 'needs_changes'].includes(aiReviewData.status)
                    ? 'border-[var(--tp-lines-30,#7a7a7a50)] bg-[var(--tp-bg-light-10,#f7f7f7)] dark:bg-white/5 dark:border-white/10 text-foreground'
                    : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
              >
                <div className="flex items-center gap-2">
                  {aiReviewData.status === 'approved' && (
                    <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-300" />
                  )}
                  {aiReviewData.status === 'rejected' && (
                    <XCircle className="h-5 w-5 text-red-600 dark:text-red-300" />
                  )}
                  {aiReviewData.status === 'needs_changes' && (
                    <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-300" />
                  )}
                  {!['approved', 'rejected', 'needs_changes'].includes(aiReviewData.status) && (
                    <Sparkles className="h-5 w-5 text-[var(--tp-buttons)]" />
                  )}
                  <div className="text-sm font-semibold">
                    {aiReviewData.status === 'approved' && 'Documento aprobado'}
                    {aiReviewData.status === 'rejected' && 'Documento rechazado'}
                    {aiReviewData.status === 'needs_changes' && 'Documento con observaciones'}
                    {!['approved', 'rejected', 'needs_changes'].includes(aiReviewData.status) &&
                      'Resultado del análisis'}
                  </div>
                </div>

                {aiReviewData.metadata?.summary && (
                  <div className="text-sm text-foreground/80 dark:text-white/80">
                    {aiReviewData.metadata.summary}
                  </div>
                )}

                {Array.isArray(aiReviewData.reasons) && aiReviewData.reasons.length > 0 && (
                  <div className="text-xs space-y-2">
                    <div className="font-semibold text-foreground dark:text-white">Riesgos detectados:</div>
                    <div className="space-y-1.5">
                      {aiReviewData.reasons.slice(0, 5).map(
                        (
                          r: { level?: 'high' | 'medium' | 'low'; text?: string; explanation?: string },
                          idx: number
                        ) => (
                          <div
                            key={idx}
                            className={[
                              'rounded-md p-2 text-xs border-l-2',
                              r.level === 'high'
                                ? 'bg-red-100/80 border-red-500 text-red-900 dark:bg-red-500/10 dark:text-red-50'
                                : '',
                              r.level === 'medium'
                                ? 'bg-amber-100/80 border-amber-500 text-amber-900 dark:bg-amber-500/10 dark:text-amber-50'
                                : '',
                              r.level === 'low'
                                ? 'bg-sky-100/80 border-sky-500 text-sky-900 dark:bg-sky-500/10 dark:text-sky-50'
                                : '',
                              !r.level ? 'bg-white/70 dark:bg-white/5 border-[var(--tp-lines-30,#7a7a7a50)]' : '',
                            ]
                              .filter(Boolean)
                              .join(' ')}
                          >
                            <span className="font-semibold capitalize">{r.level || 'info'}:</span>{' '}
                            {(r.explanation || r.text || '').trim()}
                          </div>
                        )
                      )}
                    </div>
                    {aiReviewData.reasons.length > 5 && (
                      <div className="flex items-center justify-between text-muted-foreground dark:text-white/70">
                        <span>+ {aiReviewData.reasons.length - 5} riesgos más</span>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 text-xs text-[var(--tp-buttons)] hover:text-[var(--tp-buttons-hover)]"
                          onClick={() => setIsReviewDialogOpen(true)}
                        >
                          Ver todo
                        </Button>
                      </div>
                    )}
                  </div>
                )}

                {Array.isArray(aiReviewData.suggestions) && aiReviewData.suggestions.length > 0 && (
                  <div className="text-xs space-y-1">
                    <div className="font-semibold text-foreground dark:text-white">Sugerencias:</div>
                    <ul className="list-disc pl-5 space-y-0.5 text-foreground/80 dark:text-white/80">
                      {aiReviewData.suggestions.slice(0, 3).map((s: string, idx: number) => (
                        <li key={idx}>{s}</li>
                      ))}
                    </ul>
                    {aiReviewData.suggestions.length > 3 && (
                      <div className="flex items-center justify-between text-muted-foreground dark:text-white/70">
                        <span>+ {aiReviewData.suggestions.length - 3} recomendaciones más</span>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 text-xs text-[var(--tp-buttons)] hover:text-[var(--tp-buttons-hover)]"
                          onClick={() => setIsReviewDialogOpen(true)}
                        >
                          Ver todo
                        </Button>
                      </div>
                    )}
                  </div>
                )}

                {aiReviewData.status === 'rejected' && (
                  <div className="text-xs font-medium mt-2 text-red-700 dark:text-red-200">
                    Te recomendamos revisar el documento y subir una nueva versión antes de continuar.
                  </div>
                )}
                <div className="flex justify-end pt-1">
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs text-[var(--tp-buttons)] hover:text-[var(--tp-buttons-hover)] border-[var(--tp-buttons-20,#80003930)]"
                    onClick={() => setIsReviewDialogOpen(true)}
                  >
                    Ver revisión completa
                  </Button>
                </div>
              </div>
            )}

            <Dialog open={isReviewDialogOpen} onOpenChange={setIsReviewDialogOpen}>
              <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Detalle de la revisión IA</DialogTitle>
                  <DialogDescription>
                    Revisión automatizada del documento. Usa esta información como guía para corregir el archivo.
                  </DialogDescription>
                </DialogHeader>

                {aiReviewData && (
                  <div className="space-y-4">
                    <div className="rounded-md border border-[var(--tp-lines-30,#7a7a7a30)] bg-[var(--tp-bg-light-10,#f7f7f7)] p-4 dark:bg-white/5 dark:border-white/10">
                      <div className="flex items-center gap-2 text-sm font-semibold">
                        {aiReviewData.status === 'approved' && (
                          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                        )}
                        {aiReviewData.status === 'rejected' && (
                          <XCircle className="h-4 w-4 text-red-500" />
                        )}
                        {aiReviewData.status === 'needs_changes' && (
                          <AlertTriangle className="h-4 w-4 text-amber-500" />
                        )}
                        <span>
                          {aiReviewData.status === 'approved' && 'Documento aprobado'}
                          {aiReviewData.status === 'rejected' && 'Documento rechazado'}
                          {aiReviewData.status === 'needs_changes' && 'Documento con observaciones'}
                          {!['approved', 'rejected', 'needs_changes'].includes(aiReviewData.status) &&
                            'Resultado del análisis'}
                        </span>
                      </div>
                      {aiReviewData.metadata?.summary && (
                        <p className="mt-2 text-sm text-foreground/80 dark:text-white/80">
                          {aiReviewData.metadata.summary}
                        </p>
                      )}
                      {typeof aiReviewData.confidence_score === 'number' && (
                        <p className="mt-1 text-xs text-muted-foreground">
                          Confianza del modelo: {(aiReviewData.confidence_score * 100).toFixed(0)}%
                        </p>
                      )}
                    </div>

                    {Array.isArray(aiReviewData.reasons) && aiReviewData.reasons.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="text-sm font-semibold">Riesgos detectados</h4>
                        <div className="space-y-2">
                          {aiReviewData.reasons.map(
                            (
                              r: { level?: 'high' | 'medium' | 'low'; text?: string; explanation?: string; clause?: string },
                              idx: number
                            ) => (
                              <div
                                key={`dialog-risk-${idx}`}
                                className={[
                                  'rounded-md border p-3 text-sm',
                                  r.level === 'high'
                                    ? 'border-red-500/40 bg-red-500/5'
                                    : r.level === 'medium'
                                      ? 'border-amber-500/40 bg-amber-500/5'
                                      : r.level === 'low'
                                        ? 'border-sky-500/40 bg-sky-500/5'
                                        : 'border-[var(--tp-lines-30,#7a7a7a30)]',
                                ]
                                  .filter(Boolean)
                                  .join(' ')}
                              >
                                <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wide">
                                  <span>
                                    Riesgo {r.level ? r.level : 'info'}
                                  </span>
                                  {r.clause && <span className="text-muted-foreground">Cláusula {r.clause}</span>}
                                </div>
                                <p className="mt-1 text-xs font-medium text-foreground dark:text-white">
                                  {r.text}
                                </p>
                                <p className="mt-1 text-xs text-foreground/80 dark:text-white/80">
                                  {r.explanation}
                                </p>
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    )}

                    {Array.isArray(aiReviewData.suggestions) && aiReviewData.suggestions.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="text-sm font-semibold">Recomendaciones</h4>
                        <ul className="space-y-2 text-sm text-foreground/80 dark:text-white/80">
                          {aiReviewData.suggestions.map((s: string, idx: number) => (
                            <li key={`dialog-suggestion-${idx}`} className="flex gap-2">
                              <span className="mt-1 h-1.5 w-1.5 rounded-full bg-[var(--tp-buttons)]" />
                              <span>{s}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </DialogContent>
            </Dialog>

            <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
              <Button
                onClick={handleContinue}
                disabled={isSubmitting || isBootstrapping || isAnalyzingAi}
                className="bg-[var(--tp-buttons)] hover:bg-[var(--tp-buttons-hover)]"
              >
                {isSubmitting ? (
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

