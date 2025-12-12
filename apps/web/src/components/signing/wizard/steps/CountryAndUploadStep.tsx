'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useDropzone } from 'react-dropzone'
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
import { Loader2, UploadCloud, FileText, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import { useSigningWizard } from '../WizardContext'

export function CountryAndUploadStep() {
  const supabase = useMemo(() => createClient(), [])
  const { state, actions } = useSigningWizard()

  const [title, setTitle] = useState('')
  const [isBootstrapping, setIsBootstrapping] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [creditCost, setCreditCost] = useState<number | null>(null)
  const [creditBalance, setCreditBalance] = useState<number | null>(null)

  const [aiReviewData, setAiReviewData] = useState<any | null>(null)

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

      // Default country: organization.country if exists
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

      // Credit cost (ai_document_review_full)
      const { data: prices, error: priceError } = await supabase
        .from('credit_prices')
        .select('credit_cost')
        .eq('service_code', 'ai_document_review_full')
        .eq('is_active', true)
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
  }, [actions, supabase])

  useEffect(() => {
    loadOrgAndCredits()
  }, [loadOrgAndCredits])

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const file = acceptedFiles[0] ?? null
      actions.setFile(file)
      actions.setUploadedFilePath(null)
      actions.setDocumentId(null)
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

  const waitForAiReview = useCallback(
    async (documentId: string) => {
      // Poll hasta 90s
      for (let i = 0; i < 45; i++) {
        const { data, error: fetchError } = await supabase
          .from('signing_ai_reviews')
          .select('id, status, reasons, suggestions, metadata, completed_at, created_at')
          .eq('document_id', documentId)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()

        if (!fetchError && data) {
          // pending | approved | rejected | needs_changes (enum review_status)
          if (data.status && data.status !== 'pending') {
            return data
          }
        }

        await new Promise((r) => setTimeout(r, 2000))
      }
      return null
    },
    [supabase]
  )

  const handleContinue = useCallback(async () => {
    setError(null)

    if (!state.orgId) {
      setError('No pudimos determinar tu organización. Intenta recargar.')
      return
    }
    if (!state.file) {
      setError('Debes subir un PDF para continuar.')
      return
    }

    try {
      setIsSubmitting(true)

      const { data: auth } = await supabase.auth.getUser()
      if (!auth?.user) {
        setError('Necesitas iniciar sesión para continuar.')
        return
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
        p_requires_ai_review: state.requiresAiReview,
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
        // fallback bucket existente
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

      toast.success('Documento cargado. ¡Vamos al siguiente paso!')

      // 5) Si IA habilitada, esperar resultado y mostrar resumen
      if (state.requiresAiReview) {
        const review = await waitForAiReview(documentId)
        if (review) {
          actions.setAiReview({ id: review.id, status: review.status })
          setAiReviewData(review)
        } else {
          toast.message('La revisión por IA está tardando más de lo normal. Puedes continuar igual.')
        }
      }

      actions.nextStep()
    } catch (e: any) {
      console.error('[CountryAndUploadStep] submit error', e)
      setError(e?.message || 'Ocurrió un error al subir el documento.')
    } finally {
      setIsSubmitting(false)
    }
  }, [actions, state.countryCode, state.file, state.orgId, state.requiresAiReview, supabase, title, waitForAiReview])

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

            <div className="rounded-lg border p-4">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 rounded-md bg-[var(--tp-buttons-10)] p-2">
                  <Sparkles className="h-5 w-5 text-[var(--tp-buttons)]" />
                </div>
                <div className="flex-1 space-y-1">
                  <div className="text-sm font-semibold">Revisión por IA (opcional)</div>
                  <div className="text-xs text-muted-foreground">
                    Revisa el documento antes de seleccionar servicios. Consume créditos.
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <Checkbox
                      id="ai-review"
                      checked={state.requiresAiReview}
                      onCheckedChange={(v) => actions.setRequiresAiReview(Boolean(v))}
                      disabled={isSubmitting || !canUseAi}
                    />
                    <Label htmlFor="ai-review" className="text-sm">
                      Solicitar análisis por IA
                    </Label>
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
                </div>
              </div>
            </div>

            {aiReviewData && (
              <div className="rounded-lg border p-4 space-y-2">
                <div className="text-sm font-semibold">Resultado IA</div>
                <div className="text-xs text-muted-foreground">
                  Estado: <span className="font-semibold">{aiReviewData.status}</span>
                </div>
                {Array.isArray(aiReviewData.reasons) && aiReviewData.reasons.length > 0 && (
                  <div className="text-xs">
                    <div className="font-semibold mb-1">Riesgos detectados:</div>
                    <ul className="list-disc pl-5 space-y-1">
                      {aiReviewData.reasons.slice(0, 3).map((r: any, idx: number) => (
                        <li key={idx}>
                          <span className="font-semibold">{r.level}:</span> {r.explanation || r.text}
                        </li>
                      ))}
                    </ul>
                    {aiReviewData.reasons.length > 3 && (
                      <div className="text-muted-foreground mt-1">+ {aiReviewData.reasons.length - 3} más</div>
                    )}
                  </div>
                )}
              </div>
            )}

            <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
              <Button
                onClick={handleContinue}
                disabled={isSubmitting || isBootstrapping}
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

