'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Building2, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'
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

interface ConvertToBusinessCardProps {
  organizationType: 'personal' | 'business' | 'platform'
  organizationName: string
}

export function ConvertToBusinessCard({ 
  organizationType, 
  organizationName 
}: ConvertToBusinessCardProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Solo mostrar si es organización personal
  if (organizationType !== 'personal') {
    return null
  }

  const handleConvert = async () => {
    setLoading(true)
    setError(null)
    setSuccess(false)

    try {
      const response = await fetch('/api/organizations/convert-to-business', {
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
          <Building2 className="h-5 w-5 text-[var(--tp-buttons)]" />
          <CardTitle>Actualizar a Cuenta Empresarial</CardTitle>
        </div>
        <CardDescription>
          Convierte tu cuenta personal en una cuenta empresarial para acceder a más funciones
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {success ? (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              ¡Tu organización ha sido convertida exitosamente a empresarial! Estás siendo redirigido...
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
                <p className="font-medium mb-2">Al convertir tu cuenta obtendrás:</p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Hasta 1,000 contactos (actualmente 100)</li>
                  <li>Hasta 5 usuarios en tu equipo (actualmente 1)</li>
                  <li>Acceso a la API para integraciones</li>
                  <li>Funciones avanzadas de gestión empresarial</li>
                </ul>
              </div>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button 
                    className="w-full bg-[var(--tp-buttons)] hover:bg-[var(--tp-buttons-hover)]"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Convirtiendo...
                      </>
                    ) : (
                      <>
                        <Building2 className="mr-2 h-4 w-4" />
                        Convertir a Cuenta Empresarial
                      </>
                    )}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>¿Convertir a cuenta empresarial?</AlertDialogTitle>
                    <AlertDialogDescription className="space-y-2">
                      <p>
                        Estás a punto de convertir tu organización <strong>"{organizationName}"</strong> de personal a empresarial.
                      </p>
                      <p className="font-medium text-foreground">
                        Esta acción aumentará tus límites y te dará acceso a funciones empresariales.
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






