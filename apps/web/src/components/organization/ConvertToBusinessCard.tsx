'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Building2, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { getDefaultCountries } from '@/lib/pricing/countries-sync'

interface ConvertToBusinessCardProps {
  organizationType: 'personal' | 'business' | 'platform'
  organizationName: string
}

function validateChileanRUT(rut: string): boolean {
  const cleanRut = rut.replace(/\./g, '').replace(/-/g, '').toUpperCase()
  const rutRegex = /^\d{7,8}[0-9K]$/
  if (!rutRegex.test(cleanRut)) return false
  const body = cleanRut.slice(0, -1)
  const dv = cleanRut.slice(-1)
  let sum = 0
  let multiplier = 2
  for (let i = body.length - 1; i >= 0; i -= 1) {
    sum += Number(body[i]) * multiplier
    multiplier = multiplier === 7 ? 2 : multiplier + 1
  }
  const expected = 11 - (sum % 11)
  const expectedDv =
    expected === 11 ? '0' : expected === 10 ? 'K' : String(expected)
  return dv === expectedDv
}

function formatChileanRUT(value: string): string {
  const clean = value.replace(/[^0-9kK]/g, '').toUpperCase()
  if (!clean) return ''
  const body = clean.slice(0, -1)
  const dv = clean.slice(-1)
  const formattedBody = body.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  return body ? `${formattedBody}-${dv}` : dv
}

export function ConvertToBusinessCard({
  organizationType,
  organizationName,
}: ConvertToBusinessCardProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [form, setForm] = useState({
    name: '',
    industry: '',
    size: '',
    countryCode: 'CL',
    billing: {
      documentType: 'boleta_electronica',
      taxId: '',
      name: '',
      email: '',
      giro: '',
      address: '',
      city: '',
      state: '',
    },
  })
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  // Solo mostrar si es organización personal
  if (organizationType !== 'personal') {
    return null
  }

  const countries = useMemo(
    () =>
      getDefaultCountries()
        .filter((country) => country.is_active)
        .sort((a, b) => a.display_order - b.display_order),
    []
  )

  const isChile = form.countryCode === 'CL'
  const requiresFullData =
    isChile && form.billing.documentType === 'factura_electronica'

  const validateForm = () => {
    const nextErrors: Record<string, string> = {}

    if (!form.name.trim()) {
      nextErrors.name = 'El nombre de la empresa es requerido'
    }

    if (!form.countryCode) {
      nextErrors.countryCode = 'El país es requerido'
    }

    if (!form.billing.name.trim()) {
      nextErrors.billingName = 'La razón social es requerida'
    }

    if (!form.billing.email.trim()) {
      nextErrors.billingEmail = 'El email de facturación es requerido'
    }

    if (isChile) {
      if (!form.billing.taxId.trim()) {
        nextErrors.taxId = 'El RUT es requerido'
      } else if (!validateChileanRUT(form.billing.taxId)) {
        nextErrors.taxId = 'RUT inválido. Formato: XX.XXX.XXX-X'
      }
    }

    if (requiresFullData) {
      if (!form.billing.giro.trim()) {
        nextErrors.giro = 'El giro es requerido para factura electrónica'
      }
      if (!form.billing.address.trim()) {
        nextErrors.address = 'La dirección es requerida para factura electrónica'
      }
      if (!form.billing.city.trim()) {
        nextErrors.city = 'La ciudad es requerida para factura electrónica'
      }
    }

    setFormErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const hasRutValue = form.billing.taxId.trim().length > 0
  const isRutInvalid = isChile && hasRutValue ? !validateChileanRUT(form.billing.taxId) : false

  const isCreateDisabled =
    loading ||
    !form.name.trim() ||
    !form.countryCode ||
    !form.billing.name.trim() ||
    !form.billing.email.trim() ||
    (isChile && (!form.billing.taxId.trim() || isRutInvalid)) ||
    (requiresFullData &&
      (!form.billing.giro.trim() ||
        !form.billing.address.trim() ||
        !form.billing.city.trim()))

  const handleCreateBusiness = async () => {
    if (!validateForm()) {
      return
    }

    setLoading(true)
    setError(null)
    setSuccess(false)

    try {
      const response = await fetch('/api/organizations/create-business', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: form.name.trim(),
          industry: form.industry.trim() || null,
          size: form.size.trim() || null,
          country_code: form.countryCode,
          billing_data: {
            document_type: isChile
              ? form.billing.documentType
              : 'stripe_invoice',
            tax_id: form.billing.taxId.trim() || undefined,
            name: form.billing.name.trim(),
            email: form.billing.email.trim(),
            giro: form.billing.giro.trim() || undefined,
            address: form.billing.address.trim() || undefined,
            city: form.billing.city.trim() || undefined,
            state: form.billing.state.trim() || undefined,
          },
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error al crear la organización')
      }

      setSuccess(true)
      setOpen(false)

      // La función SQL ya actualizó last_active_organization_id
      // Recargar completamente para que el sidebar y toda la app reflejen la nueva organización
      setTimeout(() => {
        window.location.href = '/settings/organization'
      }, 1500)
    } catch (err: any) {
      setError(err.message || 'Ocurrió un error inesperado')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="border-2 border-dashed">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Building2 className="h-5 w-5 text-[var(--tp-buttons)]" />
          <CardTitle>Crear Organización Empresarial</CardTitle>
        </div>
        <CardDescription>
          Crea una empresa separada para gestionar equipos, clientes y facturación
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {success ? (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              ¡Tu empresa fue creada! Tu cuenta personal se mantiene separada.
            </AlertDescription>
          </Alert>
        ) : (
          <>
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-3">
              <div className="text-sm text-muted-foreground">
                <p className="font-medium mb-2">Al crear tu empresa obtendrás:</p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Hasta 1,000 contactos (actualmente 100)</li>
                  <li>Hasta 5 usuarios en tu equipo (actualmente 1)</li>
                  <li>Acceso a la API para integraciones</li>
                  <li>Funciones avanzadas de gestión empresarial</li>
                </ul>
              </div>

              <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                  <Button
                    className="w-full bg-[var(--tp-buttons)] hover:bg-[var(--tp-buttons-hover)]"
                    disabled={loading}
                  >
                    <Building2 className="mr-2 h-4 w-4" />
                    Crear Empresa
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-h-[90vh] w-[95vw] max-w-[720px] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Crear Organización Empresarial</DialogTitle>
                    <DialogDescription>
                      Tu organización personal seguirá existiendo por separado.
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-6 py-2">
                    <div className="space-y-4">
                      <p className="text-sm font-medium">Datos de la empresa</p>
                      <div className="space-y-2">
                        <Label htmlFor="business-name">
                          Nombre de la empresa <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="business-name"
                          placeholder="Mi Empresa SpA"
                          value={form.name}
                          onChange={(e) =>
                            setForm((prev) => ({ ...prev, name: e.target.value }))
                          }
                          className={formErrors.name ? 'border-red-500' : ''}
                        />
                        {formErrors.name && (
                          <p className="text-sm text-red-500">{formErrors.name}</p>
                        )}
                      </div>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="business-industry">Industria (Opcional)</Label>
                          <Input
                            id="business-industry"
                            placeholder="Ej: Inmobiliaria, Legal, Tecnología"
                            value={form.industry}
                            onChange={(e) =>
                              setForm((prev) => ({ ...prev, industry: e.target.value }))
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="business-size">Tamaño (Opcional)</Label>
                          <Input
                            id="business-size"
                            placeholder="Ej: 1-10 empleados"
                            value={form.size}
                            onChange={(e) =>
                              setForm((prev) => ({ ...prev, size: e.target.value }))
                            }
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>
                          País <span className="text-red-500">*</span>
                        </Label>
                        <Select
                          value={form.countryCode}
                          onValueChange={(value) =>
                            setForm((prev) => ({ ...prev, countryCode: value }))
                          }
                        >
                          <SelectTrigger className={formErrors.countryCode ? 'border-red-500' : ''}>
                            <SelectValue placeholder="Selecciona un país" />
                          </SelectTrigger>
                          <SelectContent>
                            {countries.map((country) => (
                              <SelectItem key={country.country_code} value={country.country_code}>
                                {country.flag_emoji ? `${country.flag_emoji} ` : ''}
                                {country.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {formErrors.countryCode && (
                          <p className="text-sm text-red-500">{formErrors.countryCode}</p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <p className="text-sm font-medium">Datos de facturación</p>

                      {isChile && (
                        <div className="space-y-2">
                          <Label>Tipo de documento</Label>
                          <Select
                            value={form.billing.documentType}
                            onValueChange={(value) =>
                              setForm((prev) => ({
                                ...prev,
                                billing: { ...prev.billing, documentType: value },
                              }))
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selecciona un tipo" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="boleta_electronica">
                                Boleta electrónica
                              </SelectItem>
                              <SelectItem value="factura_electronica">
                                Factura electrónica
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <p className="text-xs text-muted-foreground">
                            La factura electrónica requiere datos completos de la empresa.
                          </p>
                        </div>
                      )}

                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="billing-tax-id">
                            {isChile ? 'RUT' : 'Tax ID'} {isChile ? '' : '(Opcional)'}
                          </Label>
                          <Input
                            id="billing-tax-id"
                            placeholder={isChile ? '12.345.678-9' : 'Tax ID'}
                            value={form.billing.taxId}
                            onChange={(e) =>
                              setForm((prev) => ({
                                ...prev,
                                billing: {
                                  ...prev.billing,
                                  taxId: isChile
                                    ? formatChileanRUT(e.target.value)
                                    : e.target.value,
                                },
                              }))
                            }
                            className={formErrors.taxId ? 'border-red-500' : ''}
                          />
                          {formErrors.taxId && (
                            <p className="text-sm text-red-500">{formErrors.taxId}</p>
                          )}
                          {isChile && hasRutValue && isRutInvalid && !formErrors.taxId && (
                            <p className="text-sm text-red-500">
                              RUT inválido, revisa el dígito verificador.
                            </p>
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="billing-name">
                            Razón social <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            id="billing-name"
                            placeholder="Razón social"
                            value={form.billing.name}
                            onChange={(e) =>
                              setForm((prev) => ({
                                ...prev,
                                billing: { ...prev.billing, name: e.target.value },
                              }))
                            }
                            className={formErrors.billingName ? 'border-red-500' : ''}
                          />
                          {formErrors.billingName && (
                            <p className="text-sm text-red-500">{formErrors.billingName}</p>
                          )}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="billing-email">
                          Email de facturación <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="billing-email"
                          type="email"
                          placeholder="facturacion@empresa.com"
                          value={form.billing.email}
                          onChange={(e) =>
                            setForm((prev) => ({
                              ...prev,
                              billing: { ...prev.billing, email: e.target.value },
                            }))
                          }
                          className={formErrors.billingEmail ? 'border-red-500' : ''}
                        />
                        {formErrors.billingEmail && (
                          <p className="text-sm text-red-500">{formErrors.billingEmail}</p>
                        )}
                      </div>

                      {requiresFullData && (
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="billing-giro">
                              Giro <span className="text-red-500">*</span>
                            </Label>
                            <Input
                              id="billing-giro"
                              placeholder="Giro comercial"
                              value={form.billing.giro}
                              onChange={(e) =>
                                setForm((prev) => ({
                                  ...prev,
                                  billing: { ...prev.billing, giro: e.target.value },
                                }))
                              }
                              className={formErrors.giro ? 'border-red-500' : ''}
                            />
                            {formErrors.giro && (
                              <p className="text-sm text-red-500">{formErrors.giro}</p>
                            )}
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="billing-address">
                              Dirección <span className="text-red-500">*</span>
                            </Label>
                            <Input
                              id="billing-address"
                              placeholder="Dirección de facturación"
                              value={form.billing.address}
                              onChange={(e) =>
                                setForm((prev) => ({
                                  ...prev,
                                  billing: { ...prev.billing, address: e.target.value },
                                }))
                              }
                              className={formErrors.address ? 'border-red-500' : ''}
                            />
                            {formErrors.address && (
                              <p className="text-sm text-red-500">{formErrors.address}</p>
                            )}
                          </div>

                          <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                              <Label htmlFor="billing-city">
                                Ciudad <span className="text-red-500">*</span>
                              </Label>
                              <Input
                                id="billing-city"
                                placeholder="Ciudad"
                                value={form.billing.city}
                                onChange={(e) =>
                                  setForm((prev) => ({
                                    ...prev,
                                    billing: { ...prev.billing, city: e.target.value },
                                  }))
                                }
                                className={formErrors.city ? 'border-red-500' : ''}
                              />
                              {formErrors.city && (
                                <p className="text-sm text-red-500">{formErrors.city}</p>
                              )}
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="billing-state">Región/Estado</Label>
                              <Input
                                id="billing-state"
                                placeholder="Región o estado"
                                value={form.billing.state}
                                onChange={(e) =>
                                  setForm((prev) => ({
                                    ...prev,
                                    billing: { ...prev.billing, state: e.target.value },
                                  }))
                                }
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col gap-3 sm:flex-row">
                      <Button
                        variant="outline"
                        type="button"
                        onClick={() => setOpen(false)}
                        disabled={loading}
                        className="sm:flex-1"
                      >
                        Cancelar
                      </Button>
                      <Button
                        type="button"
                        onClick={handleCreateBusiness}
                        disabled={isCreateDisabled}
                        className="bg-[var(--tp-buttons)] hover:bg-[var(--tp-buttons-hover)] sm:flex-1"
                      >
                        {loading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Creando...
                          </>
                        ) : (
                          'Crear Empresa'
                        )}
                      </Button>
                    </div>

                    <p className="text-xs text-muted-foreground">
                      Estás creando una nueva organización. Tu cuenta personal seguirá disponible.
                    </p>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}

















