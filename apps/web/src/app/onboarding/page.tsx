'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Home, Building2, Link2, CheckCircle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'

export default function OnboardingPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [selectedType, setSelectedType] = useState<'personal' | 'business' | 'invitation' | null>(null)
  const [showBusinessDialog, setShowBusinessDialog] = useState(false)
  const [businessForm, setBusinessForm] = useState({
    name: '',
    industry: '',
    size: '',
  })

  // Verificar estado al cargar
  useEffect(() => {
    const checkStatus = async () => {
      try {
        const response = await fetch('/api/onboarding/status')
        const data = await response.json()

        if (data.has_organization) {
          router.replace('/dashboard')
        }
      } catch (err) {
        console.error('Error verificando estado:', err)
      }
    }

    checkStatus()
  }, [router])

  const handleCreatePersonal = async () => {
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/onboarding/personal', {
        method: 'POST',
      })

      const data = await response.json()

      if (data.error) {
        setError(data.error)
        setLoading(false)
        return
      }

      // Éxito - redirigir al dashboard
      router.push('/dashboard')
    } catch (err) {
      setError('Ocurrió un error al crear tu organización. Por favor intenta de nuevo.')
      setLoading(false)
    }
  }

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

      // Éxito - cerrar dialog y redirigir al dashboard
      setShowBusinessDialog(false)
      router.push('/dashboard')
    } catch (err) {
      setError('Ocurrió un error al crear tu organización. Por favor intenta de nuevo.')
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
            Bienvenido a TuPatrimonio
          </h1>
          <p className="text-lg text-muted-foreground">
            Elige cómo quieres usar nuestra plataforma
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
        <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-3">
          {/* Uso Personal */}
          <Card
            className={`cursor-pointer transition-all hover:shadow-lg ${
              selectedType === 'personal'
                ? 'border-[var(--tp-buttons)] ring-2 ring-[var(--tp-buttons-20)]'
                : 'border-[var(--tp-lines-30)]'
            }`}
            onClick={() => setSelectedType('personal')}
          >
            <CardHeader>
              <div className="mb-2 flex items-center justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[var(--tp-buttons-20)]">
                  <Home className="h-6 w-6 text-[var(--tp-buttons)]" />
                </div>
              </div>
              <CardTitle>Uso Personal</CardTitle>
              <CardDescription>
                Perfecto para gestionar tus propios trámites y documentos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-[var(--tp-buttons)]" />
                  <span>Hasta 100 contactos</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-[var(--tp-buttons)]" />
                  <span>1 usuario</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-[var(--tp-buttons)]" />
                  <span>Integración de email</span>
                </li>
              </ul>
            </CardContent>
          </Card>

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

          {/* Tengo Invitación */}
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
        </div>

        {/* Botón de Continuar */}
        {selectedType && selectedType !== 'invitation' && (
          <div className="mt-8 flex justify-center">
            <Button
              onClick={() => {
                if (selectedType === 'personal') {
                  handleCreatePersonal()
                } else if (selectedType === 'business') {
                  setShowBusinessDialog(true)
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
      </div>
    </main>
  )
}

