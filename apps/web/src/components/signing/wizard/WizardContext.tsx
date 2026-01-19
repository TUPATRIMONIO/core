'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

export type WizardCountryCode = string

export type SigningProductCategory = 'signature_type' | 'notary_service'

export type SigningProductIdentifierType = 'rut_only' | 'any'

export type SigningProductBillingUnit = 'per_document' | 'per_signer'

export interface SigningProduct {
  id: string
  slug: string
  name: string
  description: string | null
  category: SigningProductCategory
  country_code: string
  // Precios multi-moneda
  price_usd: number
  price_clp: number
  price_ars: number
  price_cop: number
  price_mxn: number
  price_pen: number
  price_brl: number
  billing_unit: SigningProductBillingUnit
  identifier_type: SigningProductIdentifierType
  notary_service: string | null
  display_order: number
}

export type SignerIdentifierType = 'rut' | 'passport' | 'dni' | 'other'

export interface SignerDraft {
  first_name: string
  last_name: string
  email: string
  phone?: string

  identifier_type: SignerIdentifierType
  identifier_value: string
}

export interface SigningWizardState {
  step: number

  orgId: string | null

  countryCode: WizardCountryCode

  file: File | null
  uploadedFilePath: string | null

  documentId: string | null
  documentType: string | null

  requiresAiReview: boolean
  aiReviewId: string | null
  aiReviewStatus: 'pending' | 'approved' | 'rejected' | null

  signatureProduct: SigningProduct | null
  notaryProduct: SigningProduct | null

  signers: SignerDraft[]
  signingOrder: 'simultaneous' | 'sequential'
  sendToSignersOnComplete: boolean

  orderId: string | null
}

export interface SigningWizardActions {
  setStep: (step: number) => void
  nextStep: () => void
  prevStep: () => void

  setOrgId: (orgId: string | null) => void

  setCountryCode: (countryCode: WizardCountryCode) => void

  setFile: (file: File | null) => void
  setUploadedFilePath: (path: string | null) => void

  setDocumentId: (documentId: string | null) => void
  setDocumentType: (documentType: string | null) => void

  setRequiresAiReview: (enabled: boolean) => void
  setAiReview: (params: { id: string | null; status: SigningWizardState['aiReviewStatus'] }) => void

  setSignatureProduct: (product: SigningProduct | null) => void
  setNotaryProduct: (product: SigningProduct | null) => void

  setSigners: (signers: SignerDraft[]) => void
  setSigningOrder: (order: 'simultaneous' | 'sequential') => void
  setSendToSignersOnComplete: (enabled: boolean) => void

  setOrderId: (orderId: string | null) => void
  reset: () => void
}

const TOTAL_STEPS = 3
const STORAGE_KEY = 'tp_signing_wizard_state'

const defaultState: SigningWizardState = {
  step: 0,

  orgId: null,

  countryCode: 'CL',

  file: null,
  uploadedFilePath: null,

  documentId: null,
  documentType: null,

  requiresAiReview: false,
  aiReviewId: null,
  aiReviewStatus: null,

  signatureProduct: null,
  notaryProduct: null,

  signers: [],
  signingOrder: 'simultaneous',
  sendToSignersOnComplete: true,

  orderId: null,
}

const SigningWizardContext = createContext<
  { state: SigningWizardState; actions: SigningWizardActions; isInitialized: boolean } | undefined
>(undefined)

/**
 * Valida que el estado tenga los datos necesarios para el paso guardado.
 * Si faltan datos críticos, retorna el paso más apropiado al que debe regresar.
 */
function validateStateForStep(state: Partial<SigningWizardState>): number {
  const step = state.step ?? 0

  // Paso 1 (ServiceSelection) requiere: archivo subido (uploadedFilePath O file)
  if (step >= 1) {
    if (!state.uploadedFilePath && !state.file) {
      return 0 // Regresar al inicio
    }
  }

  // Paso 2 (SignerManagement) requiere: producto de firma seleccionado
  if (step >= 2) {
    if (!state.signatureProduct) {
      // Si hay archivo, regresar a selección de servicios
      if (state.uploadedFilePath || state.file) {
        return 1
      }
      // Si no hay archivo, regresar al inicio
      return 0
    }
    // Verificar también que el archivo siga presente
    if (!state.uploadedFilePath && !state.file) {
      return 0 // Regresar al inicio si no hay archivo
    }
  }

  return step // El paso es válido
}

export function SigningWizardProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<SigningWizardState>(defaultState)
  const [isInitialized, setIsInitialized] = useState(false)

  // Cargar estado desde localStorage al montar
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        // El objeto File no se puede serializar, se perderá en recargas de página
        // pero se mantiene mientras navegamos en la SPA.
        
        // Asegurar que el paso guardado sea válido después de cambios en el wizard
        if (parsed.step !== undefined && parsed.step >= SIGNING_WIZARD_STEPS.length) {
          parsed.step = SIGNING_WIZARD_STEPS.length - 1
        }

        // Si estamos en un paso avanzado pero no hay datos críticos, resetear
        if (parsed.step > 0 && !parsed.uploadedFilePath) {
          console.warn('[WizardContext] Estado inválido detectado - reseteando wizard')
          localStorage.removeItem(STORAGE_KEY)
          setIsInitialized(true)
          return
        }

        // Validar que los datos necesarios para el paso existan
        const validatedStep = validateStateForStep(parsed)
        if (validatedStep !== parsed.step) {
          console.warn('[WizardContext] Datos insuficientes para paso', parsed.step, '- regresando a paso', validatedStep)
          parsed.step = validatedStep
        }

        setState((s) => ({ ...s, ...parsed, file: null }))

        // Intentar recuperar el archivo de IndexedDB
        import('@/lib/utils/indexeddb').then(({ getFileFromIndexedDB }) => {
          getFileFromIndexedDB().then((file) => {
            if (file) {
              setState((s) => ({ ...s, file }))
            } else {
              // Si no se pudo recuperar el archivo y estamos en un paso avanzado,
              // validar nuevamente y ajustar el paso si es necesario
              setState((currentState) => {
                const revalidatedStep = validateStateForStep(currentState)
                if (revalidatedStep !== currentState.step) {
                  console.warn('[WizardContext] Archivo no recuperado de IndexedDB - regresando a paso', revalidatedStep)
                  return { ...currentState, step: revalidatedStep }
                }
                return currentState
              })
            }
          })
        }).catch(err => console.error('[WizardContext] Error cargando IndexedDB:', err))
      } catch (e) {
        console.error('[WizardContext] Error cargando estado desde localStorage', e)
      }
    }
    setIsInitialized(true)
  }, [])

  // Guardar estado en localStorage cuando cambie
  useEffect(() => {
    if (!isInitialized) return
    // No serializamos el archivo ni objetos complejos que no sean JSON
    const { file, ...serializableState } = state
    localStorage.setItem(STORAGE_KEY, JSON.stringify(serializableState))

    // Persistir el archivo en IndexedDB si existe
    if (file) {
      import('@/lib/utils/indexeddb').then(({ saveFileToIndexedDB }) => {
        saveFileToIndexedDB(file).catch(err => 
          console.error('[WizardContext] Error persistiendo archivo en IndexedDB:', err)
        )
      })
    }
  }, [state, isInitialized])

  const setStep = useCallback((step: number) => {
    setState((s) => ({ ...s, step: Math.max(0, Math.min(TOTAL_STEPS - 1, step)) }))
  }, [])

  const nextStep = useCallback(() => {
    setState((s) => ({ ...s, step: Math.min(TOTAL_STEPS - 1, s.step + 1) }))
  }, [])

  const prevStep = useCallback(() => {
    setState((s) => ({ ...s, step: Math.max(0, s.step - 1) }))
  }, [])

  const actions: SigningWizardActions = useMemo(
    () => ({
      setStep,
      nextStep,
      prevStep,

      setOrgId: (orgId) => setState((s) => ({ ...s, orgId })),

      setCountryCode: (countryCode) =>
        setState((s) => ({
          ...s,
          countryCode,
          // Al cambiar país, limpiamos selección de servicios
          signatureProduct: null,
          notaryProduct: null,
        })),

      setFile: (file) => setState((s) => ({ ...s, file })),
      setUploadedFilePath: (uploadedFilePath) => setState((s) => ({ ...s, uploadedFilePath })),

      setDocumentId: (documentId) => setState((s) => ({ ...s, documentId })),

      setDocumentType: (documentType) => setState((s) => ({ ...s, documentType })),

      setRequiresAiReview: (requiresAiReview) =>
        setState((s) => ({
          ...s,
          requiresAiReview,
          aiReviewId: requiresAiReview ? s.aiReviewId : null,
          aiReviewStatus: requiresAiReview ? s.aiReviewStatus : null,
        })),

      setAiReview: ({ id, status }) => setState((s) => ({ ...s, aiReviewId: id, aiReviewStatus: status })),

      setSignatureProduct: (signatureProduct) => setState((s) => ({ ...s, signatureProduct })),
      setNotaryProduct: (notaryProduct) => setState((s) => ({ ...s, notaryProduct })),

      setSigners: (signers) => setState((s) => ({ ...s, signers })),
      setSigningOrder: (signingOrder) => setState((s) => ({ ...s, signingOrder })),
      setSendToSignersOnComplete: (sendToSignersOnComplete) =>
        setState((s) => ({ ...s, sendToSignersOnComplete })),

      setOrderId: (orderId) => setState((s) => ({ ...s, orderId })),

      reset: () => {
        setState(defaultState)
        localStorage.removeItem(STORAGE_KEY)
        import('@/lib/utils/indexeddb').then(({ clearFileFromIndexedDB }) => {
          clearFileFromIndexedDB().catch(err => console.error('[WizardContext] Error limpiando IndexedDB:', err))
        })
      },
    }),
    [nextStep, prevStep, setStep]
  )

  const value = useMemo(
    () => ({ state, actions, isInitialized }),
    [state, actions, isInitialized]
  )

  return <SigningWizardContext.Provider value={value}>{children}</SigningWizardContext.Provider>
}

export function useSigningWizard() {
  const ctx = useContext(SigningWizardContext)
  if (!ctx) {
    throw new Error('useSigningWizard debe usarse dentro de SigningWizardProvider')
  }
  return ctx
}

export const SIGNING_WIZARD_STEPS = [
  { key: 'upload', title: 'Documento', description: 'PDF y Pre-revisión IA' },
  { key: 'services', title: 'Servicios', description: 'Tipo de firma y notaría' },
  { key: 'signers', title: 'Firmantes', description: 'Datos y validación' },
] as const

