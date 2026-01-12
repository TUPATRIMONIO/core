'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Trash2, AlertCircle, CheckCircle2, UserPlus, ArrowUp, ArrowDown } from 'lucide-react'
import { toast } from 'sonner'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from '@/components/ui/dialog'
import { useSigningWizard, type SignerIdentifierType } from '../WizardContext'
import { SavedSignersSelector, type SavedSigner } from '../SavedSignersSelector'
import { SaveSignerCheckbox } from '../SaveSignerCheckbox'
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
  const router = useRouter()
  const { state, actions } = useSigningWizard()

  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const [signers, setSigners] = useState<any[]>([])

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [identifierType, setIdentifierType] = useState<SignerIdentifierType>('rut')
  const [identifierValue, setIdentifierValue] = useState('')
  const [rutError, setRutError] = useState<string | null>(null)
  const [role, setRole] = useState<'signer' | 'approver' | 'reviewer'>('signer')

  // Estados para firmantes guardados
  const [saveEnabled, setSaveEnabled] = useState(false)
  const [saveType, setSaveType] = useState<'personal' | 'organization'>('personal')
  const [selectedSavedSignerId, setSelectedSavedSignerId] = useState<string | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setIsAuthenticated(!!data.user)
    })
  }, [supabase])

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
    // Si no hay documentId (flujo público), usamos los firmantes del estado del wizard
    if (!state.documentId) {
      setSigners(state.signers.map((s, idx) => ({
        id: `local-${idx}`,
        first_name: s.first_name,
        last_name: s.last_name,
        email: s.email,
        phone: s.phone,
        signing_order: idx + 1,
        metadata: {
          identifier_type: s.identifier_type,
          identifier_value: s.identifier_value,
        }
      })))
      setIsLoading(false)
      return
    }

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

    // Si la DB tiene firmantes, usarlos
    if (data && data.length > 0) {
      setSigners(data)

      // sincronizar estado para el checkout
      const mappedSigners = data.map((s: any) => ({
        first_name: s.first_name || '',
        last_name: s.last_name || '',
        email: s.email,
        phone: s.phone || undefined,
        identifier_type:
          (s.metadata?.identifier_type as SignerIdentifierType) || (s.rut ? 'rut' : 'other'),
        identifier_value: (s.metadata?.identifier_value as string) || s.rut || '',
      }))
      
      console.log('[SignerManagementStep] Syncing signers to wizard context:', mappedSigners.length, 'signers')
      actions.setSigners(mappedSigners)
    } else {
      // Si la DB está vacía, usar firmantes locales si existen
      if (state.signers.length > 0) {
        setSigners(
          state.signers.map((s, idx) => ({
            id: `local-${idx}`,
            first_name: s.first_name,
            last_name: s.last_name,
            email: s.email,
            phone: s.phone,
            signing_order: idx + 1,
            metadata: {
              identifier_type: s.identifier_type,
              identifier_value: s.identifier_value,
            },
          }))
        )
        // Mantener sincronización con wizard context (ya están en state.signers)
        // No necesitamos llamar actions.setSigners porque ya están ahí
      } else {
        setSigners([])
        // Limpiar también el estado global para consistencia
        actions.setSigners([])
      }
    }
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

  // Sincronizar automáticamente cuando cambian los signers locales (cuando hay documentId)
  useEffect(() => {
    if (!state.documentId) return
    if (signers.length === 0) return
    
    // Solo sincronizar si los signers locales son diferentes a los del wizard context
    // Comparar por cantidad y emails para evitar sincronizaciones innecesarias
    const localEmails = signers.map((s: any) => s.email).sort().join(',')
    const wizardEmails = state.signers.map((s: any) => s.email).sort().join(',')
    
    if (localEmails !== wizardEmails || signers.length !== state.signers.length) {
      const mappedSigners = signers.map((s: any) => ({
        first_name: s.first_name || '',
        last_name: s.last_name || '',
        email: s.email,
        phone: s.phone || undefined,
        identifier_type:
          (s.metadata?.identifier_type as SignerIdentifierType) || (s.rut ? 'rut' : 'other'),
        identifier_value: (s.metadata?.identifier_value as string) || s.rut || '',
      }))
      
      console.log('[SignerManagementStep] Auto-syncing', mappedSigners.length, 'signers to wizard context')
      actions.setSigners(mappedSigners)
    }
  }, [signers, state.documentId, state.signers, actions])

  // Sync mode from DB
  useEffect(() => {
    if (!state.documentId) return
    supabase
      .from('signing_documents')
      .select('signing_order')
      .eq('id', state.documentId)
      .single()
      .then(({ data, error }) => {
        if (!error && data) {
          actions.setSigningOrder(data.signing_order)
        }
      })
  }, [state.documentId, supabase, actions])

  const handleModeChange = useCallback(
    async (mode: 'simultaneous' | 'sequential') => {
      actions.setSigningOrder(mode)
      if (!state.documentId) return

      try {
        const { error: updateError } = await supabase
          .from('signing_documents')
          .update({ signing_order: mode })
          .eq('id', state.documentId)

        if (updateError) throw updateError
      } catch (e: any) {
        console.error('[SignerManagementStep] mode update error', e)
        toast.error('Error al actualizar el modo de firma')
      }
    },
    [actions, state.documentId, supabase]
  )

  const resetForm = useCallback(() => {
    setFirstName('')
    setLastName('')
    setEmail('')
    setPhone('')
    setIdentifierType(requiresRutOnly ? 'rut' : 'rut')
    setIdentifierValue('')
    setRole('signer')
    setSaveEnabled(false)
    setSelectedSavedSignerId(null)
  }, [requiresRutOnly])

  const handleSelectSavedSigner = useCallback((signer: SavedSigner) => {
    setFirstName(signer.first_name)
    setLastName(signer.last_name)
    setEmail(signer.email)
    setPhone(signer.phone || '')
    setIdentifierType(signer.identifier_type as SignerIdentifierType)
    setIdentifierValue(signer.identifier_value)
    setSelectedSavedSignerId(signer.id)
    setSaveEnabled(false) // Ya está guardado
  }, [])

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

      // MODO PÚBLICO: No persistimos en DB todavía
      if (!state.documentId) {
        const newSigner: any = {
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          email: email.trim(),
          phone: phone.trim() || undefined,
          identifier_type: isRutType ? 'rut' : identifierType,
          identifier_value: isRutType ? normalizeRutToDb(identifierValue) : identifierValue.trim(),
        }
        
        const updatedSigners = [...state.signers, newSigner]
        actions.setSigners(updatedSigners)
        
        // Actualizar estado local directamente para invitados
        setSigners(updatedSigners.map((s, idx) => ({
          id: `local-${idx}`,
          first_name: s.first_name,
          last_name: s.last_name,
          email: s.email,
          phone: s.phone,
          signing_order: idx + 1,
          metadata: {
            identifier_type: s.identifier_type,
            identifier_value: s.identifier_value,
          }
        })))

        // Intentar guardar en saved_signers si está habilitado
        console.log('[SavedSigner] Check conditions:', { isAuthenticated, saveEnabled, saveType })
        if (isAuthenticated && saveEnabled) {
          try {
            const { data: userData } = await supabase.auth.getUser()
            console.log('[SavedSigner] User data:', userData.user?.id)
            const insertPayload = {
              user_id: saveType === 'personal' ? userData.user?.id : null,
              organization_id: saveType === 'organization' ? state.orgId : null,
              type: saveType,
              email: email.trim(),
              first_name: firstName.trim(),
              last_name: lastName.trim(),
              phone: phone.trim() || null,
              identifier_type: isRutType ? 'rut' : identifierType,
              identifier_value: isRutType ? normalizeRutToDb(identifierValue) : identifierValue.trim(),
              usage_count: 0,
              last_used_at: null
            }
            console.log('[SavedSigner] Insert payload:', insertPayload)
            const { error: insertError } = await supabase.from('saved_signers').insert(insertPayload)
            
            if (insertError) {
              console.error('[SavedSigner] Error saving (guest mode):', insertError)
            } else {
              console.log('[SavedSigner] Saved successfully in guest mode')
            }
          } catch (err) {
            console.error('[SavedSigner] Unexpected error (guest mode):', err)
          }
        }

        toast.success('Firmante agregado')
        resetForm()
        setIsModalOpen(false)
        return
      }

      // MODO LOGUEADO: Flujo original con DB
      const { data, error: rpcError } = await supabase.rpc('add_document_signer', {
        p_document_id: state.documentId,
        p_email: email.trim(),
        p_full_name: fullName,
        p_rut: rutDb,
        p_phone: phone.trim() || null,
        p_is_foreigner: false,
        p_signing_order: signers.length + 1,
        p_user_id: null,
      })

      if (rpcError) throw new Error(rpcError.message)
      
      const signerId = data?.id
      if (!signerId) throw new Error('No se pudo crear el firmante')

      const { error: updateError } = await supabase
        .from('signing_signers')
        .update({
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          is_foreigner: false,
          metadata: {
            identifier_type: isRutType ? 'rut' : identifierType,
            identifier_value: isRutType ? normalizeRutToDb(identifierValue) : identifierValue.trim(),
            country_code: state.countryCode,
            role: role,
          },
        })
        .eq('id', signerId)

      if (updateError) throw updateError

      // Manejar guardado de firmante si está autenticado
      console.log('[SavedSigner] Check conditions (logged mode):', { isAuthenticated, saveEnabled, selectedSavedSignerId, saveType })
      if (isAuthenticated) {
        try {
          if (selectedSavedSignerId) {
            // Incrementar uso si se seleccionó de la lista
            console.log('[SavedSigner] Incrementing usage for:', selectedSavedSignerId)
            try {
              const { error: usageError } = await supabase.rpc('increment_saved_signer_usage', {
                p_signer_id: selectedSavedSignerId
              })
              if (usageError) {
                console.warn('[SavedSigner] Error incrementing usage (non-critical):', usageError.message || usageError)
              }
            } catch (err: any) {
              // Si la función RPC no existe o hay un error, no es crítico para el flujo principal
              console.warn('[SavedSigner] Could not increment usage (non-critical):', err?.message || err)
            }
          } else if (saveEnabled) {
            // Guardar como nuevo si se marcó el checkbox
            const { data: userData } = await supabase.auth.getUser()
            console.log('[SavedSigner] User ID:', userData.user?.id)
            const insertPayload = {
              user_id: saveType === 'personal' ? userData.user?.id : null,
              organization_id: saveType === 'organization' ? state.orgId : null,
              type: saveType,
              email: email.trim(),
              first_name: firstName.trim(),
              last_name: lastName.trim(),
              phone: phone.trim() || null,
              identifier_type: isRutType ? 'rut' : identifierType,
              identifier_value: isRutType ? normalizeRutToDb(identifierValue) : identifierValue.trim(),
              usage_count: 1,
              last_used_at: new Date().toISOString()
            }
            console.log('[SavedSigner] Insert payload (logged mode):', insertPayload)
            const { error: insertError } = await supabase.from('saved_signers').insert(insertPayload)
            
            if (insertError) {
              console.error('[SavedSigner] Error saving:', insertError)
              toast.error('Error al guardar firmante: ' + insertError.message)
            } else {
              console.log('[SavedSigner] Saved successfully!')
              toast.success('Firmante guardado para uso futuro')
            }
          } else {
            console.log('[SavedSigner] Not saving - saveEnabled is false')
          }
        } catch (err: any) {
          console.error('[SavedSigner] Unexpected error:', err)
        }
      } else {
        console.log('[SavedSigner] Not saving - not authenticated')
      }

      toast.success('Firmante agregado')
      resetForm()
      setIsModalOpen(false)
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
    isRutType,
    lastName,
    loadSigners,
    phone,
    resetForm,
    role,
    signatureProduct,
    signers.length,
    state.countryCode,
    state.documentId,
    state.orgId,
    state.signers,
    actions,
    supabase,
    validateForm,
    // Dependencias para guardado de firmantes frecuentes
    saveEnabled,
    saveType,
    isAuthenticated,
    selectedSavedSignerId,
  ])

  const handleRemoveSigner = useCallback(
    async (signerId: string) => {
      if (!confirm('¿Quitar a este firmante?')) return
      try {
        setIsSaving(true)

        if (!state.documentId) {
          const index = parseInt(signerId.replace('local-', ''))
          if (!isNaN(index)) {
            const updated = [...state.signers]
            updated.splice(index, 1)
            actions.setSigners(updated)
            
            // Actualizar estado local directamente para invitados
            setSigners(updated.map((s, idx) => ({
              id: `local-${idx}`,
              first_name: s.first_name,
              last_name: s.last_name,
              email: s.email,
              phone: s.phone,
              signing_order: idx + 1,
              metadata: {
                identifier_type: s.identifier_type,
                identifier_value: s.identifier_value,
              }
            })))

            toast.success('Firmante removido')
          }
          return
        }

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
    [loadSigners, supabase, state.documentId, state.signers, actions]
  )

  const handleMoveSigner = useCallback(
    async (index: number, direction: 'up' | 'down') => {
      if (direction === 'up' && index === 0) return
      if (direction === 'down' && index === signers.length - 1) return

      try {
        setIsSaving(true)
        const neighborIndex = direction === 'up' ? index - 1 : index + 1

        if (!state.documentId) {
          const updated = [...state.signers]
          const temp = updated[index]
          updated[index] = updated[neighborIndex]
          updated[neighborIndex] = temp
          actions.setSigners(updated)
          
          // Actualizar estado local directamente para invitados
          setSigners(updated.map((s, idx) => ({
            id: `local-${idx}`,
            first_name: s.first_name,
            last_name: s.last_name,
            email: s.email,
            phone: s.phone,
            signing_order: idx + 1,
            metadata: {
              identifier_type: s.identifier_type,
              identifier_value: s.identifier_value,
            }
          })))
          return
        }

        const currentSigner = signers[index]
        const neighborSigner = signers[neighborIndex]
        
        // We use the values from the array to respect the current visible order.
        const currentOrder = currentSigner.signing_order
        const neighborOrder = neighborSigner.signing_order

        // If for some reason they have the same order or invalid, we might need a robust reorder.
        // But assuming sequential integers 1..N based on previous logic (length + 1):
        
        // Update current signer to neighbor's order
        const { error: e1 } = await supabase
          .from('signing_signers')
          .update({ signing_order: neighborOrder })
          .eq('id', currentSigner.id)
        
        if (e1) throw e1

        // Update neighbor to current's order
        const { error: e2 } = await supabase
          .from('signing_signers')
          .update({ signing_order: currentOrder })
          .eq('id', neighborSigner.id)
        
        if (e2) throw e2

        await loadSigners()
      } catch (e: any) {
        console.error('[SignerManagementStep] move error', e)
        toast.error('Error al reordenar firmantes')
      } finally {
        setIsSaving(false)
      }
    },
    [signers, supabase, loadSigners, state.documentId, state.signers, actions]
  )

  const handleBack = useCallback(() => {
    actions.prevStep()
  }, [actions])

  const handleContinue = useCallback(() => {
    setError(null)
    
    if (signers.length === 0) {
      setError('Debes agregar al menos 1 firmante para continuar.')
      return
    }
    
    // Asegurar sincronización con wizard context antes de continuar
    // Si tenemos documentId (usuario logueado), los firmantes pueden estar en DB o locales
    // Si NO tenemos documentId pero hay firmantes locales, necesitamos asegurar que estén sincronizados
    const signersToSync = signers.map((s: any) => ({
      first_name: s.first_name || '',
      last_name: s.last_name || '',
      email: s.email,
      phone: s.phone || undefined,
      identifier_type:
        (s.metadata?.identifier_type as SignerIdentifierType) || (s.rut ? 'rut' : 'other'),
      identifier_value: (s.metadata?.identifier_value as string) || s.rut || '',
    }))
    
    console.log('[SignerManagementStep] handleContinue - Syncing', signersToSync.length, 'signers to wizard context')
    console.log('[SignerManagementStep] handleContinue - Current wizard state.signers:', state.signers.length)
    
    actions.setSigners(signersToSync)
    
    router.push('/checkout/signing')
  }, [router, signers, state.documentId, actions])

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

        {!state.file && !state.uploadedFilePath ? (
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
            <div className="space-y-6">
              <div>
                <p className="text-sm text-muted-foreground mb-4">
                  Agrega a las personas que deben firmar el documento.
                </p>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div
                    className={`relative flex cursor-pointer flex-col gap-1 rounded-lg border p-4 hover:bg-muted/50 ${
                      state.signingOrder === 'simultaneous' ? 'border-[var(--tp-buttons)] bg-muted/50' : ''
                    }`}
                    onClick={() => handleModeChange('simultaneous')}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold">Firma Simultánea</span>
                      {state.signingOrder === 'simultaneous' && (
                        <CheckCircle2 className="h-4 w-4 text-[var(--tp-buttons)]" />
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Todos pueden firmar en cualquier momento y orden.
                    </p>
                  </div>

                  <div
                    className={`relative flex cursor-pointer flex-col gap-1 rounded-lg border p-4 hover:bg-muted/50 ${
                      state.signingOrder === 'sequential' ? 'border-[var(--tp-buttons)] bg-muted/50' : ''
                    }`}
                    onClick={() => handleModeChange('sequential')}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold">Firma Secuencial</span>
                      {state.signingOrder === 'sequential' && (
                        <CheckCircle2 className="h-4 w-4 text-[var(--tp-buttons)]" />
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Orden específico. Permite roles adicionales (aprobadores).
                    </p>
                  </div>
                </div>
              </div>
              
              <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="sm:max-w-xl">
                  <DialogHeader>
                    <DialogTitle>Nuevo firmante</DialogTitle>
                  <DialogDescription>
                    Ingresa los datos del firmante. Todos los campos son obligatorios salvo que se indique lo contrario.
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                  {isAuthenticated && (
                    <div className="space-y-2 pb-4 border-b">
                      <Label className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                        Reutilizar firmante guardado
                      </Label>
                      <SavedSignersSelector 
                        onSelect={handleSelectSavedSigner} 
                        organizationId={state.orgId || undefined} 
                      />
                    </div>
                  )}
                  
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Nombres</Label>
                        <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} disabled={isSaving} placeholder="Ej: Juan Andrés" />
                      </div>
                      <div className="space-y-2">
                        <Label>Apellidos</Label>
                        <Input value={lastName} onChange={(e) => setLastName(e.target.value)} disabled={isSaving} placeholder="Ej: Pérez González" />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Email</Label>
                        <Input value={email} onChange={(e) => setEmail(e.target.value)} disabled={isSaving} placeholder="correo@ejemplo.com" type="email" />
                      </div>
                      <div className="space-y-2">
                        <Label>Teléfono (opcional)</Label>
                        <Input value={phone} onChange={(e) => setPhone(e.target.value)} disabled={isSaving} placeholder="+56 9 1234 5678" />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Rol del participante</Label>
                      <Select value={role} onValueChange={(v) => setRole(v as 'signer' | 'approver' | 'reviewer')} disabled={isSaving}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="signer">Firmante - Debe firmar el documento</SelectItem>
                          <SelectItem value="approver">Aprobador - Aprueba antes de enviar a firma</SelectItem>
                          <SelectItem value="reviewer">Revisor - Solo revisa, no firma</SelectItem>
                        </SelectContent>
                      </Select>
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
                      </div>
                    </div>

                    {isAuthenticated && !selectedSavedSignerId && (
                      <SaveSignerCheckbox
                        enabled={saveEnabled}
                        onEnabledChange={setSaveEnabled}
                        type={saveType}
                        onTypeChange={setSaveType}
                        hasOrganization={!!state.orgId}
                      />
                    )}
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setIsModalOpen(false)} disabled={isSaving}>
                      Cancelar
                    </Button>
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
                </DialogContent>
              </Dialog>
            </div>

              <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold">Participantes del proceso</div>
                {state.signingOrder === 'sequential' && signers.length > 0 && (
                  <p className="text-xs text-muted-foreground">Usa las flechas para definir el orden</p>
                )}
              </div>

              {isLoading ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Cargando participantes...
                </div>
              ) : signers.length === 0 ? (
                <p className="text-sm text-muted-foreground">Aún no has agregado participantes.</p>
              ) : (
                <div className="space-y-3">
                  {signers.map((s, index) => {
                    const roleName = s.metadata?.role || 'signer'
                    const roleLabel = roleName === 'signer' ? 'Firmante' : roleName === 'approver' ? 'Aprobador' : 'Revisor'
                    const roleColor = roleName === 'signer' ? 'bg-blue-100 text-blue-700' : roleName === 'approver' ? 'bg-purple-100 text-purple-700' : 'bg-orange-100 text-orange-700'
                    
                    return (
                      <div key={s.id} className="group relative flex items-center gap-4 rounded-lg border bg-card p-4 hover:border-[var(--tp-buttons)] transition-colors">
                        {state.signingOrder === 'sequential' && (
                          <div className="flex flex-col items-center gap-1 pr-3 border-r">
                            <span className="text-2xl font-bold text-muted-foreground/30">{index + 1}</span>
                            <div className="flex flex-col gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 opacity-50 group-hover:opacity-100 transition-opacity"
                                onClick={() => handleMoveSigner(index, 'up')}
                                disabled={isSaving || index === 0}
                              >
                                <ArrowUp className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 opacity-50 group-hover:opacity-100 transition-opacity"
                                onClick={() => handleMoveSigner(index, 'down')}
                                disabled={isSaving || index === signers.length - 1}
                              >
                                <ArrowDown className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </div>
                        )}
                        
                        <div className="flex-1 min-w-0 space-y-2">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-semibold truncate">
                                  {(s.first_name || '') + (s.last_name ? ` ${s.last_name}` : '') || s.full_name}
                                </span>
                                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${roleColor}`}>
                                  {roleLabel}
                                </span>
                              </div>
                              <div className="text-xs text-muted-foreground truncate mt-1">{s.email}</div>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0"
                              onClick={() => handleRemoveSigner(s.id)}
                              disabled={isSaving}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            <span>{s.rut ? `RUT: ${s.rut}` : `ID: ${s.metadata?.identifier_value || '-'}`}</span>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
              
              <div className="flex justify-center">
                <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-[var(--tp-buttons)] hover:bg-[var(--tp-buttons-hover)] gap-2">
                      <UserPlus className="h-4 w-4" />
                      Nuevo participante
                    </Button>
                  </DialogTrigger>
                </Dialog>
              </div>
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

