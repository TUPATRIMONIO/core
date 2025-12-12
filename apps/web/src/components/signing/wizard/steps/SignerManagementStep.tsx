'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Trash2, AlertCircle, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useSigningWizard, type SignerIdentifierType } from '../WizardContext'
import {
  formatRutOnInput,
  isValidRut,
  getRutError,
  cleanRut,
} from '@/lib/utils/rut'

function normalizeRutToDb(input: string) {
  const clean = cleanRut(input)
  if (!clean) return ''
  if (clean.length < 2) return clean
  return `${clean.slice(0, -1)}-${clean.slice(-1)}`
}

export function SignerManagementStep() {
  const supabase = useMemo(() => createClient(), [])
  const { state, actions } = useSigningWizard()

  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [signers, setSigners] = useState<any[]>([])

  // Form
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [identifierType, setIdentifierType] = useState<SignerIdentifierType>('rut')
  const [identifierValue, setIdentifierValue] = useState('')
  const [rutError, setRutError] = useState<string | null>(null)

  const signatureProduct = state.signatureProduct
  const requiresRutOnly = signatureProduct?.identifier_type === 'rut_only'
  const isRutType = requiresRutOnly || identifierType === 'rut'

  // Handler para el input de RUT con autoformato
  const handleIdentifierChange = useCallback(
    (value: string) => {
      if (isRutType) {
        // Autoformatear RUT mientras escribe
        const formatted = formatRutOnInput(value)
        setIdentifierValue(formatted)

        // Validar en tiempo real (solo si tiene suficiente longitud)
        if (formatted.length >= 3) {
          const error = getRutError(formatted)
          setRutError(error)
        } else {
          setRutError(null)
        }
      } else {
        setIdentifierValue(value)
        setRutError(null)
      }
    },
    [isRutType]
  )

  // Limpiar error de RUT cuando cambia el tipo
  useEffect(() => {
    if (!isRutType) {
      setRutError(null)
    }
  }, [isRutType])

  useEffect(() => {
    if (requiresRutOnly) {
      setIdentifierType('rut')
    }
  }, [requiresRutOnly])

  const loadSigners = useCallback(async () => {
    if (!state.documentId) return

    setIsLoading(true)
    setError(null)
    try {
      const { data, error: fetchError } = await supabase
        .from('signing_signers')
        .select('*')
        .eq('document_id', state.documentId)
        .neq('status', 'removed')
        .order('signing_order', { ascending: true })

      if (fetchError) throw fetchError
      
      setSigners(data || [])

      // sincronizar estado para el checkout
      actions.setSigners(
        (data || []).map((s: any) => ({
          first_name: s.first_name || '',
          last_name: s.last_name || '',
          email: s.email,
          phone: s.phone || undefined,
          identifier_type:
            (s.metadata?.identifier_type as SignerIdentifierType) || (s.rut ? 'rut' : 'other'),
          identifier_value: (s.metadata?.identifier_value as string) || s.rut || '',
        }))
      )
    } catch (e: any) {
      console.error('[SignerManagementStep] load error', e)
      setError(e?.message || 'No se pudieron cargar los firmantes.')
    } finally {
      setIsLoading(false)
    }
  }, [actions, state.documentId, supabase])

  useEffect(() => {
    loadSigners()
  }, [loadSigners])

  const resetForm = useCallback(() => {
    setFirstName('')
    setLastName('')
    setEmail('')
    setPhone('')
    setIdentifierType(requiresRutOnly ? 'rut' : 'rut')
    setIdentifierValue('')
  }, [requiresRutOnly])

  const validateForm = useCallback(() => {
    const errs: string[] = []

    if (!firstName.trim()) errs.push('Nombres es requerido')
    if (!lastName.trim()) errs.push('Apellidos es requerido')

    if (!email.trim()) errs.push('Email es requerido')
    else if (!/^[^@]+@[^@]+\.[^@]+$/.test(email.trim())) errs.push('Email inválido')

    const idVal = identifierValue.trim()
    if (!idVal) errs.push('N° Identificador es requerido')
    else if (isRutType) {
      // Usar validación mejorada de RUT
      const rutValidationError = getRutError(idVal)
      if (rutValidationError) {
        errs.push(rutValidationError)
      }
    } else if (idVal.length < 5) {
      errs.push('El identificador debe tener al menos 5 caracteres')
    }

    return errs
  }, [email, firstName, identifierValue, isRutType, lastName])

  const handleAddSigner = useCallback(async () => {
    setError(null)

    if (!state.documentId) {
      setError('No encontramos el documento. Vuelve al paso anterior.')
      return
    }
    if (!signatureProduct) {
      setError('Primero debes seleccionar el tipo de firma.')
      return
    }

    const errs = validateForm()
    if (errs.length > 0) {
      setError(errs[0])
      return
    }

    try {
      setIsSaving(true)

      const fullName = `${firstName.trim()} ${lastName.trim()}`.trim()
      const rutDb = isRutType ? normalizeRutToDb(identifierValue) : null

      const { data, error: rpcError } = await supabase.rpc('add_document_signer', {
        p_document_id: state.documentId,
        p_email: email.trim(),
        p_full_name: fullName,
        p_rut: rutDb,
        p_phone: phone.trim() || null,
        p_is_foreigner: !isRutType,
        p_signing_order: signers.length + 1,
        p_user_id: null,
      })

      if (rpcError) throw new Error(rpcError.message)
      
      const signerId = data?.id
      if (!signerId) throw new Error('No se pudo crear el firmante')

      // Guardar first_name / last_name + metadata identificador
      const { error: updateError } = await supabase
        .from('signing_signers')
        .update({
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          metadata: {
            identifier_type: isRutType ? 'rut' : identifierType,
            identifier_value: isRutType ? normalizeRutToDb(identifierValue) : identifierValue.trim(),
            country_code: state.countryCode,
          },
        })
        .eq('id', signerId)

      if (updateError) throw updateError

      toast.success('Firmante agregado')
      resetForm()
      await loadSigners()
    } catch (e: any) {
      console.error('[SignerManagementStep] add error', e)
      setError(e?.message || 'No se pudo agregar el firmante.')
    } finally {
      setIsSaving(false)
    }
  }, [
    email,
    firstName,
    identifierType,
    identifierValue,
    lastName,
    loadSigners,
    phone,
    requiresRutOnly,
    resetForm,
    signatureProduct,
    signers.length,
    state.countryCode,
    state.documentId,
    supabase,
    validateForm,
  ])

  const handleRemoveSigner = useCallback(
    async (signerId: string) => {
      if (!confirm('¿Quitar a este firmante?')) return
      try {
        setIsSaving(true)
        const { error: rpcError } = await supabase.rpc('remove_document_signer', {
          p_signer_id: signerId,
          p_reason: 'Removido en wizard',
        })
        if (rpcError) throw new Error(rpcError.message)
        toast.success('Firmante removido')
        await loadSigners()
      } catch (e: any) {
        console.error('[SignerManagementStep] remove error', e)
        setError(e?.message || 'No se pudo remover el firmante.')
      } finally {
        setIsSaving(false)
      }
    },
    [loadSigners, supabase]
  )

  const handleBack = useCallback(() => {
    actions.prevStep()
  }, [actions])

  const handleContinue = useCallback(() => {
    setError(null)
    if (!state.documentId) {
      setError('No encontramos el documento. Vuelve al paso anterior.')
      return
    }
    if (signers.length === 0) {
      setError('Debes agregar al menos 1 firmante para continuar.')
      return
    }
    actions.nextStep()
  }, [actions, signers.length, state.documentId])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Paso 3 · Firmantes</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {!state.documentId ? (
          <Alert>
            <AlertDescription>
              No hay documento cargado. Vuelve al paso anterior y sube un PDF.
            </AlertDescription>
          </Alert>
        ) : !signatureProduct ? (
          <Alert>
            <AlertDescription>
              Primero selecciona el tipo de firma en el paso anterior.
            </AlertDescription>
          </Alert>
        ) : (
          <>
            <div className="rounded-lg border p-4 space-y-4">
              <div className="text-sm font-semibold">Nuevo firmante</div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Nombres</Label>
                  <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} disabled={isSaving} />
                </div>
                <div className="space-y-2">
                  <Label>Apellidos</Label>
                  <Input value={lastName} onChange={(e) => setLastName(e.target.value)} disabled={isSaving} />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input value={email} onChange={(e) => setEmail(e.target.value)} disabled={isSaving} />
                </div>
                <div className="space-y-2">
                  <Label>Teléfono (opcional)</Label>
                  <Input value={phone} onChange={(e) => setPhone(e.target.value)} disabled={isSaving} placeholder="+56 9 1234 5678" />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label>Tipo de Identificador</Label>
                  <Select
                    value={requiresRutOnly ? 'rut' : identifierType}
                    onValueChange={(v) => setIdentifierType(v as SignerIdentifierType)}
                    disabled={isSaving || requiresRutOnly}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="rut">RUT</SelectItem>
                      <SelectItem value="passport">Pasaporte</SelectItem>
                      <SelectItem value="dni">DNI</SelectItem>
                      <SelectItem value="other">Otro</SelectItem>
                    </SelectContent>
                  </Select>
                  {requiresRutOnly && (
                    <div className="text-xs text-muted-foreground">
                      Este tipo de firma requiere RUT chileno.
                    </div>
                  )}
                </div>

                <div className="space-y-2 sm:col-span-2">
                  <Label>N° Identificador</Label>
                  <div className="relative">
                    <Input
                      value={identifierValue}
                      onChange={(e) => handleIdentifierChange(e.target.value)}
                      disabled={isSaving}
                      placeholder={isRutType ? '12.345.678-9' : 'Ej: AB1234567'}
                      className={
                        isRutType && identifierValue.length >= 3
                          ? rutError
                            ? 'border-red-500 pr-10'
                            : 'border-green-500 pr-10'
                          : ''
                      }
                    />
                    {isRutType && identifierValue.length >= 3 && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        {rutError ? (
                          <AlertCircle className="h-4 w-4 text-red-500" />
                        ) : (
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                        )}
                      </div>
                    )}
                  </div>
                  {isRutType && rutError && (
                    <p className="text-xs text-red-500">{rutError}</p>
                  )}
                  {isRutType && identifierValue.length >= 3 && !rutError && (
                    <p className="text-xs text-green-600">RUT válido ✓</p>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                <Button
                  onClick={handleAddSigner}
                  disabled={isSaving}
                  className="bg-[var(--tp-buttons)] hover:bg-[var(--tp-buttons-hover)]"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    'Agregar firmante'
                  )}
                </Button>
              </div>
            </div>

            <div className="space-y-3">
              <div className="text-sm font-semibold">Firmantes agregados</div>

              {isLoading ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Cargando firmantes...
                </div>
              ) : signers.length === 0 ? (
                <p className="text-sm text-muted-foreground">Aún no has agregado firmantes.</p>
              ) : (
                <div className="space-y-2">
                  {signers.map((s) => (
                    <div key={s.id} className="flex items-start justify-between gap-3 rounded-lg border p-4">
                      <div className="min-w-0">
                        <div className="text-sm font-semibold truncate">
                          {(s.first_name || '') + (s.last_name ? ` ${s.last_name}` : '') || s.full_name}
                        </div>
                        <div className="text-xs text-muted-foreground truncate">{s.email}</div>
                        <div className="text-xs text-muted-foreground">
                          {s.rut ? `RUT: ${s.rut}` : `ID: ${s.metadata?.identifier_value || '-'}`}
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleRemoveSigner(s.id)}
                        disabled={isSaving}
                        className="shrink-0"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:justify-between">
              <Button variant="outline" onClick={handleBack} disabled={isSaving}>
                Volver
              </Button>
              <Button
                onClick={handleContinue}
                disabled={isSaving || isLoading}
                className="bg-[var(--tp-buttons)] hover:bg-[var(--tp-buttons-hover)]"
              >
                Continuar
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}

