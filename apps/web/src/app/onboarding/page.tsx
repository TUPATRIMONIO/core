'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Building2, Link2, CheckCircle, Loader2, Stamp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { getDefaultCountries } from '@/lib/pricing/countries-sync'

export default function OnboardingPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--tp-buttons)]" />
      </div>
    }>
      <OnboardingContent />
    </Suspense>
  )
}

function OnboardingContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const next = searchParams.get('next')
  const isCreatingNew = searchParams.get('new') === 'true'
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [selectedType, setSelectedType] = useState<'business' | 'notary' | 'invitation' | null>(null)
  const [showBusinessDialog, setShowBusinessDialog] = useState(false)
  const [showNotaryDialog, setShowNotaryDialog] = useState(false)
  const [isCheckingOrgs, setIsCheckingOrgs] = useState(isCreatingNew)
  const [businessForm, setBusinessForm] = useState({
    name: '',
    industry: '',
    size: '',
  })
  const [notaryForm, setNotaryForm] = useState({
    name: '',
    countryCode: 'CL',
    city: '',
    address: '',
    email: '',
    phone: '',
  })

  // Verificar estado al cargar
  useEffect(() => {
    const checkStatus = async () => {
      try {
        // Si estamos creando una nueva organización, verificar si ya tiene Personal
        if (isCreatingNew) {
          setIsCheckingOrgs(false)
          return
        }

        // Si no es creación nueva, verificar si tiene organización y redirigir
        const response = await fetch('/api/onboarding/status')
        const data = await response.json()

        if (data.has_organization) {
          router.replace(next || '/dashboard')
        }
      } catch (err) {
        console.error('Error verificando estado:', err)
        setIsCheckingOrgs(false)
      }
    }

    checkStatus()
  }, [router, next, isCreatingNew])

  const handleCreateBusiness = async () => {
    if (!businessForm.name.trim()) {
      setError('El nombre de la empresa es requerido')
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/onboarding/business', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: businessForm.name.trim(),
          industry: businessForm.industry.trim() || undefined,
          size: businessForm.size.trim() || undefined,
        }),
      })

      const data = await response.json()

      if (data.error) {
        setError(data.error)
        setLoading(false)
        return
      }

      // Éxito - cerrar dialog y redirigir con recarga completa para refrescar el contexto de organizaciones
      setShowBusinessDialog(false)
      window.location.href = next || '/dashboard'
    } catch (err) {
      setError('Ocurrió un error al crear tu organización. Por favor intenta de nuevo.')
      setLoading(false)
    }
  }

  const handleCreateNotary = async () => {
    if (!notaryForm.name.trim()) {
      setError('El nombre de la notaría es requerido')
      return
    }
    if (!notaryForm.countryCode) {
      setError('El país es requerido')
      return
    }
    if (!notaryForm.city.trim()) {
      setError('La ciudad es requerida')
      return
    }
    if (!notaryForm.address.trim()) {
      setError('La dirección es requerida')
      return
    }
    if (!notaryForm.email.trim()) {
      setError('El email de contacto es requerido')
      return
    }
    if (!notaryForm.phone.trim()) {
      setError('El teléfono es requerido')
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/onboarding/notary', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: notaryForm.name.trim(),
          country_code: notaryForm.countryCode,
          city: notaryForm.city.trim(),
          address: notaryForm.address.trim(),
          email: notaryForm.email.trim(),
          phone: notaryForm.phone.trim(),
        }),
      })

      const data = await response.json()

      if (data.error) {
        setError(data.error)
        setLoading(false)
        return
      }

      setShowNotaryDialog(false)
      window.location.href = next || '/dashboard'
    } catch (err) {
      setError('Ocurrió un error al crear tu notaría. Por favor intenta de nuevo.')
      setLoading(false)
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-4xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mb-4 flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--tp-buttons)] font-semibold text-white shadow-[var(--tp-shadow-md)]">
              TP
            </div>
          </div>
          <h1 className="mb-2 text-3xl font-bold text-foreground sm:text-4xl">
            Crear Nueva Organización
          </h1>
          <p className="text-lg text-muted-foreground">
            Agrega una organización empresarial o una notaría
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert className="mb-6 border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950">
            <AlertDescription className="text-red-600 dark:text-red-400">
              {error}
            </AlertDescription>
          </Alert>
        )}

        {/* Cards de Selección */}
        <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2">

          {/* Uso Empresarial */}
          <Card
            className={`relative cursor-pointer transition-all hover:shadow-lg ${
              selectedType === 'business'
                ? 'border-[var(--tp-buttons)] ring-2 ring-[var(--tp-buttons-20)]'
                : 'border-[var(--tp-lines-30)]'
            }`}
            onClick={() => setSelectedType('business')}
          >
            <div className="absolute right-4 top-4">
              <Badge className="bg-[var(--tp-buttons)] text-white">
                Recomendado
              </Badge>
            </div>
            <CardHeader>
              <div className="mb-2 flex items-center justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[var(--tp-buttons-20)]">
                  <Building2 className="h-6 w-6 text-[var(--tp-buttons)]" />
                </div>
              </div>
              <CardTitle>Uso Empresarial</CardTitle>
              <CardDescription>
                Ideal para equipos que necesitan gestionar múltiples clientes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-[var(--tp-buttons)]" />
                  <span>Hasta 1,000 contactos</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-[var(--tp-buttons)]" />
                  <span>Hasta 5 usuarios</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-[var(--tp-buttons)]" />
                  <span>Acceso a API</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* Notaría */}
          <Card
            className={`relative cursor-pointer transition-all hover:shadow-lg ${
              selectedType === 'notary'
                ? 'border-[var(--tp-buttons)] ring-2 ring-[var(--tp-buttons-20)]'
                : 'border-[var(--tp-lines-30)]'
            }`}
            onClick={() => setSelectedType('notary')}
          >
            <CardHeader>
              <div className="mb-2 flex items-center justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[var(--tp-buttons-20)]">
                  <Stamp className="h-6 w-6 text-[var(--tp-buttons)]" />
                </div>
              </div>
              <CardTitle>Notaría</CardTitle>
              <CardDescription>
                Registra tu notaría y espera la aprobación para operar
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-[var(--tp-buttons)]" />
                  <span>Gestión por servicios y pesos</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-[var(--tp-buttons)]" />
                  <span>Asignación automática por país</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-[var(--tp-buttons)]" />
                  <span>Requiere aprobación</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* Tengo Invitación - Ocultar si está creando nueva organización */}
          {!isCreatingNew && (
          <Card
            className={`cursor-pointer transition-all hover:shadow-lg ${
              selectedType === 'invitation'
                ? 'border-[var(--tp-buttons)] ring-2 ring-[var(--tp-buttons-20)]'
                : 'border-[var(--tp-lines-30)] opacity-60'
            }`}
            onClick={() => {
              setSelectedType('invitation')
              setError('Esta funcionalidad estará disponible próximamente')
            }}
          >
            <CardHeader>
              <div className="mb-2 flex items-center justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[var(--tp-lines-20)]">
                  <Link2 className="h-6 w-6 text-muted-foreground" />
                </div>
              </div>
              <CardTitle>Tengo Invitación</CardTitle>
              <CardDescription>
                Únete a una organización existente con un código de invitación
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Próximamente podrás unirte a organizaciones usando un código de invitación.
              </p>
            </CardContent>
          </Card>
          )}
        </div>

        {/* Botón de Continuar */}
        {selectedType && selectedType !== 'invitation' && !isCheckingOrgs && (
          <div className="mt-8 flex justify-center">
            <Button
              onClick={() => {
                if (selectedType === 'business') {
                  setShowBusinessDialog(true)
                } else if (selectedType === 'notary') {
                  setShowNotaryDialog(true)
                }
              }}
              disabled={loading}
              className="min-w-[200px] bg-[var(--tp-buttons)] hover:bg-[var(--tp-buttons-hover)] text-white"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creando...
                </>
              ) : (
                'Continuar'
              )}
            </Button>
          </div>
        )}

        {/* Loading state cuando está verificando organizaciones */}
        {isCheckingOrgs && (
          <div className="mt-8 flex justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-[var(--tp-buttons)]" />
          </div>
        )}

        {/* Dialog para Formulario Empresarial */}
        <Dialog open={showBusinessDialog} onOpenChange={setShowBusinessDialog}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Información de tu Empresa</DialogTitle>
              <DialogDescription>
                Completa los datos de tu organización para continuar
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="company-name">
                  Nombre de la Empresa <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="company-name"
                  placeholder="Mi Empresa S.A."
                  value={businessForm.name}
                  onChange={(e) =>
                    setBusinessForm({ ...businessForm, name: e.target.value })
                  }
                  className="focus:border-[var(--tp-buttons)] focus:ring-[var(--tp-buttons)]/20"
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="industry">Industria (Opcional)</Label>
                <Input
                  id="industry"
                  placeholder="Ej: Tecnología, Inmobiliaria, Legal..."
                  value={businessForm.industry}
                  onChange={(e) =>
                    setBusinessForm({ ...businessForm, industry: e.target.value })
                  }
                  className="focus:border-[var(--tp-buttons)] focus:ring-[var(--tp-buttons)]/20"
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="size">Tamaño (Opcional)</Label>
                <Input
                  id="size"
                  placeholder="Ej: 1-10 empleados, 11-50 empleados..."
                  value={businessForm.size}
                  onChange={(e) =>
                    setBusinessForm({ ...businessForm, size: e.target.value })
                  }
                  className="focus:border-[var(--tp-buttons)] focus:ring-[var(--tp-buttons)]/20"
                  disabled={loading}
                />
              </div>

              {error && (
                <Alert className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950">
                  <AlertDescription className="text-red-600 dark:text-red-400">
                    {error}
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowBusinessDialog(false)}
                  disabled={loading}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleCreateBusiness}
                  disabled={loading || !businessForm.name.trim()}
                  className="flex-1 bg-[var(--tp-buttons)] hover:bg-[var(--tp-buttons-hover)] text-white"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creando...
                    </>
                  ) : (
                    'Crear Organización'
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Dialog para Registro de Notaría */}
        <Dialog open={showNotaryDialog} onOpenChange={setShowNotaryDialog}>
          <DialogContent className="max-h-[90vh] w-[95vw] max-w-[500px] flex flex-col p-0 gap-0">
            <DialogHeader className="px-4 pt-4 pb-2 sm:px-6 sm:pt-6">
              <DialogTitle>Registro de Notaría</DialogTitle>
              <DialogDescription>
                Completa los datos para enviar tu solicitud.
              </DialogDescription>
            </DialogHeader>
            
            <div className="flex-1 overflow-y-auto px-4 sm:px-6">
              <div className="space-y-3 py-2">
                {/* Fila 1: Nombre */}
                <div className="space-y-1.5">
                  <Label htmlFor="notary-name" className="text-sm">
                    Nombre de la Notaría <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="notary-name"
                    placeholder="Notaría Central"
                    value={notaryForm.name}
                    onChange={(e) =>
                      setNotaryForm({ ...notaryForm, name: e.target.value })
                    }
                    className="h-9 focus:border-[var(--tp-buttons)] focus:ring-[var(--tp-buttons)]/20"
                    disabled={loading}
                  />
                </div>

                {/* Fila 2: País y Ciudad en grid */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-sm">
                      País <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={notaryForm.countryCode}
                      onValueChange={(value) =>
                        setNotaryForm({ ...notaryForm, countryCode: value })
                      }
                      disabled={loading}
                    >
                      <SelectTrigger className="h-9 focus:border-[var(--tp-buttons)] focus:ring-[var(--tp-buttons)]/20">
                        <SelectValue placeholder="País" />
                      </SelectTrigger>
                      <SelectContent>
                        {getDefaultCountries()
                          .filter((country) => country.is_active)
                          .sort((a, b) => a.display_order - b.display_order)
                          .map((country) => (
                            <SelectItem key={country.country_code} value={country.country_code}>
                              {country.flag_emoji ? `${country.flag_emoji} ` : ''}
                              {country.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="notary-city" className="text-sm">
                      Ciudad <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="notary-city"
                      placeholder="Santiago"
                      value={notaryForm.city}
                      onChange={(e) =>
                        setNotaryForm({ ...notaryForm, city: e.target.value })
                      }
                      className="h-9 focus:border-[var(--tp-buttons)] focus:ring-[var(--tp-buttons)]/20"
                      disabled={loading}
                    />
                  </div>
                </div>

                {/* Fila 3: Dirección */}
                <div className="space-y-1.5">
                  <Label htmlFor="notary-address" className="text-sm">
                    Dirección <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="notary-address"
                    placeholder="Av. Principal 123, Oficina 45"
                    value={notaryForm.address}
                    onChange={(e) =>
                      setNotaryForm({ ...notaryForm, address: e.target.value })
                    }
                    className="h-9 focus:border-[var(--tp-buttons)] focus:ring-[var(--tp-buttons)]/20"
                    disabled={loading}
                  />
                </div>

                {/* Fila 4: Email y Teléfono en grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="notary-email" className="text-sm">
                      Email <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="notary-email"
                      type="email"
                      placeholder="contacto@notaria.cl"
                      value={notaryForm.email}
                      onChange={(e) =>
                        setNotaryForm({ ...notaryForm, email: e.target.value })
                      }
                      className="h-9 focus:border-[var(--tp-buttons)] focus:ring-[var(--tp-buttons)]/20"
                      disabled={loading}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="notary-phone" className="text-sm">
                      Teléfono <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="notary-phone"
                      placeholder="+56 9 1234 5678"
                      value={notaryForm.phone}
                      onChange={(e) =>
                        setNotaryForm({ ...notaryForm, phone: e.target.value })
                      }
                      className="h-9 focus:border-[var(--tp-buttons)] focus:ring-[var(--tp-buttons)]/20"
                      disabled={loading}
                    />
                  </div>
                </div>

                {/* Info */}
                <div className="rounded-md border border-[var(--tp-lines-30)] bg-[var(--tp-bg-light-10)] p-2.5 text-xs text-muted-foreground">
                  Tu solicitud quedará pendiente de aprobación. Te notificaremos cuando esté habilitada.
                </div>

                {error && (
                  <Alert className="border-red-200 bg-red-50 py-2 dark:border-red-800 dark:bg-red-950">
                    <AlertDescription className="text-sm text-red-600 dark:text-red-400">
                      {error}
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </div>

            {/* Footer fijo */}
            <div className="flex gap-3 border-t border-[var(--tp-lines-20)] px-4 py-3 sm:px-6 sm:py-4">
              <Button
                variant="outline"
                onClick={() => setShowNotaryDialog(false)}
                disabled={loading}
                className="flex-1 h-9"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleCreateNotary}
                disabled={
                  loading ||
                  !notaryForm.name.trim() ||
                  !notaryForm.countryCode ||
                  !notaryForm.city.trim() ||
                  !notaryForm.address.trim() ||
                  !notaryForm.email.trim() ||
                  !notaryForm.phone.trim()
                }
                className="flex-1 h-9 bg-[var(--tp-buttons)] hover:bg-[var(--tp-buttons-hover)] text-white"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  'Enviar Solicitud'
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </main>
  )
}

