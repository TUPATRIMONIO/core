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
  base_price: number
  currency: string
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

  setOrderId: (orderId: string | null) => void
  reset: () => void
}

const TOTAL_STEPS = 4
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

  orderId: null,
}

const SigningWizardContext = createContext<
  { state: SigningWizardState; actions: SigningWizardActions } | undefined
>(undefined)

export function SigningWizardProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<SigningWizardState>(defaultState)
  const [isInitialized, setIsInitialized] = useState(false)

  // Cargar estado desde sessionStorage al montar
  useEffect(() => {
    const saved = sessionStorage.getItem(STORAGE_KEY)
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        // El objeto File no se puede serializar, se perderá en recargas de página
        // pero se mantiene mientras navegamos en la SPA.
        setState((s) => ({ ...s, ...parsed, file: null }))
      } catch (e) {
        console.error('[WizardContext] Error cargando estado desde sessionStorage', e)
      }
    }
    setIsInitialized(true)
  }, [])

  // Guardar estado en sessionStorage cuando cambie
  useEffect(() => {
    if (!isInitialized) return
    // No serializamos el archivo ni objetos complejos que no sean JSON
    const { file, ...serializableState } = state
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(serializableState))
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

      setOrderId: (orderId) => setState((s) => ({ ...s, orderId })),

      reset: () => {
        setState(defaultState)
        sessionStorage.removeItem(STORAGE_KEY)
      },
    }),
    [nextStep, prevStep, setStep]
  )

  const value = useMemo(() => ({ state, actions }), [state, actions])

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
  { key: 'checkout', title: 'Pago', description: 'Resumen y checkout' },
] as const

