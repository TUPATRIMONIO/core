'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { User, CheckCircle2, AlertCircle, Loader2, AlertTriangle } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { useRouter } from 'next/navigation'

interface ConvertToPersonalCardProps {
  organizationType: 'personal' | 'business' | 'platform'
  organizationName: string
  organizationId?: string
}

export function ConvertToPersonalCard({ 
  organizationType, 
  organizationName,
  organizationId
}: ConvertToPersonalCardProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [warnings, setWarnings] = useState<string[]>([])

  // Solo mostrar si es organización business
  if (organizationType !== 'business') {
    return null
  }

  // Las advertencias se obtendrán de la respuesta del API al convertir

  const handleConvert = async () => {
    setLoading(true)
    setError(null)
    setSuccess(false)

    try {
      const response = await fetch('/api/organizations/convert-to-personal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error al convertir la organización')
      }

      setSuccess(true)
      
      // Las advertencias ya se muestran antes de convertir, pero se pueden actualizar si vienen en la respuesta
      if (data.warnings && data.warnings.length > 0) {
        setWarnings(data.warnings)
      }
      
      // Refrescar la página después de 2 segundos para mostrar los cambios
      setTimeout(() => {
        router.refresh()
      }, 2000)
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
          <User className="h-5 w-5 text-[var(--tp-buttons)]" />
          <CardTitle>Convertir a Cuenta Personal</CardTitle>
        </div>
        <CardDescription>
          Convierte tu cuenta empresarial en una cuenta personal
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {success ? (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              ¡Tu organización ha sido convertida exitosamente a personal! Estás siendo redirigido...
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

            {warnings.length > 0 && (
              <Alert className="border-yellow-200 bg-yellow-50">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                <AlertDescription className="text-yellow-800">
                  <div className="space-y-1">
                    <p className="font-medium">Advertencias importantes:</p>
                    <ul className="list-disc list-inside space-y-1 ml-2">
                      {warnings.map((warning, index) => (
                        <li key={index} className="text-sm">{warning}</li>
                      ))}
                    </ul>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-3">
              <div className="text-sm text-muted-foreground">
                <p className="font-medium mb-2">Al convertir tu cuenta a personal:</p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Límite de contactos: 1,000 → 100</li>
                  <li>Límite de usuarios: 5 → 1 (solo tú)</li>
                  <li>Acceso a la API será deshabilitado</li>
                  <li>Los datos existentes se mantendrán</li>
                </ul>
              </div>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button 
                    variant="outline"
                    className="w-full"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Convirtiendo...
                      </>
                    ) : (
                      <>
                        <User className="mr-2 h-4 w-4" />
                        Convertir a Cuenta Personal
                      </>
                    )}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>¿Convertir a cuenta personal?</AlertDialogTitle>
                    <AlertDialogDescription className="space-y-2">
                      <p>
                        Estás a punto de convertir tu organización <strong>"{organizationName}"</strong> de empresarial a personal.
                      </p>
                      {warnings.length > 0 && (
                        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                          <p className="font-medium text-yellow-900 mb-2">⚠️ Advertencias:</p>
                          <ul className="list-disc list-inside space-y-1 text-sm text-yellow-800">
                            {warnings.map((warning, index) => (
                              <li key={index}>{warning}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      <p className="font-medium text-foreground">
                        Esta acción reducirá tus límites y deshabilitará funciones empresariales.
                      </p>
                      <p className="text-sm text-muted-foreground">
                        ¿Estás seguro de que deseas continuar?
                      </p>
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel disabled={loading}>Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleConvert}
                      disabled={loading}
                      className="bg-[var(--tp-buttons)] hover:bg-[var(--tp-buttons-hover)]"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Convirtiendo...
                        </>
                      ) : (
                        'Sí, convertir'
                      )}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}

