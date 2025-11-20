'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Check, CreditCard, Sparkles } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@tupatrimonio/ui'
import { Button } from '@tupatrimonio/ui'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/stores/auth-store'
import { useToast } from '@/hooks/use-toast'
import type { CreditPackage, CreditPackagePrice, Currency } from '@/types/database'

export default function BuyCreditsPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { currentOrganization, profile } = useAuthStore()

  const [packages, setPackages] = useState<CreditPackage[]>([])
  const [currencies, setCurrencies] = useState<Currency[]>([])
  const [selectedCurrency, setSelectedCurrency] = useState<string>('CLP')
  const [packagePrices, setPackagePrices] = useState<Record<string, CreditPackagePrice>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [isProcessing, setIsProcessing] = useState<string | null>(null)

  useEffect(() => {
    if (currentOrganization) {
      loadData()
    }
  }, [currentOrganization?.id])

  useEffect(() => {
    if (selectedCurrency && packages.length > 0) {
      loadPrices()
    }
  }, [selectedCurrency, packages])

  const loadData = async () => {
    if (!currentOrganization) return

    setIsLoading(true)
    try {
      const supabase = createClient()

      // Load currencies
      const { data: currenciesData } = await supabase
        .schema('core')
        .from('currencies')
        .select('*')
        .eq('is_active', true)
        .order('sort_order')

      if (currenciesData) {
        setCurrencies(currenciesData)
        // Use user's default currency or CLP
        const defaultCurrency = profile?.default_currency || 'CLP'
        setSelectedCurrency(
          currenciesData.find(c => c.code === defaultCurrency)?.code || 'CLP'
        )
      }

      // Load credit packages
      const { data: packagesData } = await supabase
        .schema('core')
        .from('credit_packages')
        .select('*')
        .eq('is_active', true)
        .order('sort_order')

      if (packagesData) {
        setPackages(packagesData)
      }
    } catch (error) {
      console.error('Error loading data:', error)
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los paquetes',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const loadPrices = async () => {
    if (!selectedCurrency || packages.length === 0) return

    try {
      const supabase = createClient()

      const packageIds = packages.map(p => p.id)
      const { data: pricesData } = await supabase
        .schema('core')
        .from('credit_package_prices')
        .select('*')
        .in('package_id', packageIds)
        .eq('currency', selectedCurrency)

      if (pricesData) {
        const pricesMap: Record<string, CreditPackagePrice> = {}
        pricesData.forEach(price => {
          pricesMap[price.package_id] = price
        })
        setPackagePrices(pricesMap)
      }
    } catch (error) {
      console.error('Error loading prices:', error)
    }
  }

  const handlePurchase = async (packageId: string, paymentMethod: 'stripe' | 'dlocalgo') => {
    if (!currentOrganization) return

    const pkg = packages.find(p => p.id === packageId)
    const price = packagePrices[packageId]

    if (!pkg || !price) {
      toast({
        title: 'Error',
        description: 'Paquete no disponible',
        variant: 'destructive',
      })
      return
    }

    setIsProcessing(packageId)

    try {
      const response = await fetch(`/api/payments/create-checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          packageId: pkg.id,
          currency: selectedCurrency,
          paymentMethod,
          organizationId: currentOrganization.id,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error al crear el pago')
      }

      // Redirect to payment URL
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl
      }
    } catch (error) {
      console.error('Error creating checkout:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Error al procesar el pago',
        variant: 'destructive',
      })
      setIsProcessing(null)
    }
  }

  const formatPrice = (price: number, currency: Currency) => {
    const formatted = (price / 100).toFixed(currency.decimal_places)
    return `${currency.symbol} ${formatted}`
  }

  const selectedCurrencyData = currencies.find(c => c.code === selectedCurrency)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/credits">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Comprar créditos</h1>
          <p className="text-muted-foreground">
            Elige un paquete de créditos para tu organización
          </p>
        </div>
      </div>

      {/* Currency selector */}
      {currencies.length > 1 && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">Moneda</label>
              <select
                value={selectedCurrency}
                onChange={(e) => setSelectedCurrency(e.target.value)}
                className="w-full px-3 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {currencies.map((currency) => (
                  <option key={currency.code} value={currency.code}>
                    {currency.name} ({currency.code})
                  </option>
                ))}
              </select>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Packages grid */}
      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">
          Cargando paquetes...
        </div>
      ) : packages.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <CreditCard className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">No hay paquetes disponibles</h3>
            <p className="text-muted-foreground">
              Contacta con soporte para más información
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {packages.map((pkg) => {
            const price = packagePrices[pkg.id]
            const totalCredits = pkg.credits + pkg.bonus_credits

            return (
              <Card
                key={pkg.id}
                className={pkg.is_popular ? 'border-primary border-2' : ''}
              >
                {pkg.is_popular && (
                  <div className="bg-primary text-primary-foreground text-center py-1 text-xs font-medium">
                    Más popular
                  </div>
                )}
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{pkg.name}</span>
                    {pkg.bonus_credits > 0 && (
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                        +{pkg.bonus_credits} bonus
                      </span>
                    )}
                  </CardTitle>
                  {pkg.description && (
                    <CardDescription>{pkg.description}</CardDescription>
                  )}
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="text-3xl font-bold">
                      {price && selectedCurrencyData
                        ? formatPrice(price.price, selectedCurrencyData)
                        : 'Cargando...'}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {totalCredits.toLocaleString()} créditos totales
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-green-600" />
                      <span>{pkg.credits.toLocaleString()} créditos base</span>
                    </div>
                    {pkg.bonus_credits > 0 && (
                      <div className="flex items-center gap-2 text-sm">
                        <Sparkles className="h-4 w-4 text-yellow-600" />
                        <span>{pkg.bonus_credits.toLocaleString()} créditos bonus</span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2 pt-2">
                    <Button
                      className="w-full"
                      onClick={() => handlePurchase(pkg.id, 'stripe')}
                      disabled={!price || isProcessing === pkg.id}
                    >
                      {isProcessing === pkg.id ? (
                        'Procesando...'
                      ) : (
                        <>
                          <CreditCard className="mr-2 h-4 w-4" />
                          Pagar con Stripe
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => handlePurchase(pkg.id, 'dlocalgo')}
                      disabled={!price || isProcessing === pkg.id}
                    >
                      {isProcessing === pkg.id ? (
                        'Procesando...'
                      ) : (
                        'Pagar con DLocalGo'
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}

