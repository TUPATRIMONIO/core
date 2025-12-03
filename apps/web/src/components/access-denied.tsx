'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { ShieldX, ArrowLeft, Lock } from 'lucide-react'

interface AccessDeniedProps {
  applicationName?: string
  reason?: string
  showUpgrade?: boolean
}

export function AccessDenied({ 
  applicationName = 'esta aplicación',
  reason,
  showUpgrade = false 
}: AccessDeniedProps) {
  const router = useRouter()

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--tp-buttons-10)]">
            <ShieldX className="h-8 w-8 text-[var(--tp-buttons)]" />
          </div>
          <CardTitle className="text-2xl">Acceso Denegado</CardTitle>
          <CardDescription className="text-base">
            No tienes permiso para acceder a {applicationName}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {reason && (
            <div className="rounded-lg bg-muted p-4">
              <div className="flex items-start gap-2">
                <Lock className="mt-0.5 h-4 w-4 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">{reason}</p>
              </div>
            </div>
          )}
          
          {showUpgrade && (
            <div className="rounded-lg border border-[var(--tp-buttons-30)] bg-[var(--tp-buttons-5)] p-4">
              <p className="text-sm font-medium text-foreground">
                ¿Necesitas acceso a esta funcionalidad?
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Considera actualizar tu plan de suscripción para acceder a más características.
              </p>
            </div>
          )}

          <div className="space-y-2 text-sm text-muted-foreground">
            <p>Posibles razones:</p>
            <ul className="list-disc space-y-1 pl-5">
              <li>La aplicación está desactivada temporalmente</li>
              <li>Tu organización no tiene acceso a esta funcionalidad</li>
              <li>Tu plan de suscripción no incluye esta aplicación</li>
              <li>Esta funcionalidad está disponible solo en ciertos países</li>
            </ul>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-2">
          <Button 
            onClick={() => router.push('/admin')}
            className="w-full"
            variant="default"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver al Dashboard
          </Button>
          {showUpgrade && (
            <Button 
              onClick={() => router.push('/admin/subscriptions')}
              variant="outline"
              className="w-full"
            >
              Ver Planes Disponibles
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  )
}

