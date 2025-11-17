'use client'

import { useState } from 'react'
import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { resendConfirmationEmail } from '../actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Icon } from '@tupatrimonio/ui'
import { Mail, ArrowLeft, RefreshCcw } from 'lucide-react'
import Link from 'next/link'

function SubmitButton() {
  const { pending } = useFormStatus()
  
  return (
    <Button
      type="submit"
      disabled={pending}
      className="w-full bg-[var(--tp-brand)] hover:bg-[var(--tp-brand-light)] text-white font-medium py-3 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl"
    >
      {pending ? (
        <div className="flex items-center justify-center">
          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
          Enviando...
        </div>
      ) : (
        <div className="flex items-center justify-center">
          <Icon icon={RefreshCcw} size="sm" variant="inherit" className="mr-2" />
          Reenviar Email de Confirmación
        </div>
      )}
    </Button>
  )
}

export default function ResendConfirmationPage() {
  const [state, action] = useActionState(resendConfirmationEmail, null)
  const [email, setEmail] = useState('')
  
  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-[var(--tp-background-light)] to-background flex items-center justify-center p-4">
      {/* Fondo con gradiente sutil */}
      <div className="absolute inset-0 bg-gradient-to-br from-[var(--tp-brand)]/5 via-transparent to-[var(--tp-buttons)]/5" />
      
      {/* Card principal */}
      <div className="relative w-full max-w-md">
        <Card className="border-2 border-[var(--tp-brand)] shadow-2xl bg-card">
          <CardHeader className="text-center pt-8">
            {/* Logo con estilo de marca */}
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-[var(--tp-brand)] via-[var(--tp-brand-light)] to-[var(--tp-brand-dark)] rounded-full mb-6 shadow-lg">
              <Icon icon={Mail} size="xl" variant="white" />
            </div>
            <CardTitle className="text-3xl mb-2">
              <span className="text-[var(--tp-brand)]">Confirmar Email</span>
            </CardTitle>
            <CardDescription className="text-base">
              Te reenviaremos el email de confirmación a tu correo
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form action={action} className="space-y-4">
              {/* Email */}
              <div>
                <Label htmlFor="email" className="mb-2 block">
                  Correo Electrónico
                </Label>
                <div className="relative">
                  <Icon icon={Mail} size="md" variant="muted" className="absolute left-3 top-1/2 transform -translate-y-1/2" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="tu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 focus:border-[var(--tp-brand)] focus:ring-[var(--tp-brand)]/20"
                    required
                  />
                </div>
              </div>
              
              {/* Mensaje de error */}
              {state?.error && (
                <div className="p-3 rounded-md bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800">
                  <p className="text-red-600 dark:text-red-400 text-sm">{state.error}</p>
                </div>
              )}
              
              {/* Mensaje de éxito */}
              {state?.success && (
                <div className="p-3 rounded-md bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800">
                  <p className="text-green-600 dark:text-green-400 text-sm">{state.message}</p>
                </div>
              )}
              
              {/* Info adicional */}
              <div className="p-3 rounded-md bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800">
                <p className="text-blue-600 dark:text-blue-400 text-xs">
                  Si no has recibido el email de confirmación, revisa tu carpeta de spam o correo no deseado.
                </p>
              </div>
              
              {/* Botón submit */}
              <SubmitButton />
            </form>

            {/* Volver al login */}
            <div className="mt-6 text-center">
              <Link 
                href="/login"
                className="inline-flex items-center text-sm text-[var(--tp-brand)] hover:text-[var(--tp-brand-light)] transition-colors"
              >
                <Icon icon={ArrowLeft} size="sm" variant="inherit" className="mr-2" />
                Volver al inicio de sesión
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Decoración de fondo */}
        <div className="absolute -top-4 -right-4 w-24 h-24 bg-gradient-to-br from-[var(--tp-brand-20)] to-[var(--tp-brand-light)]/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-gradient-to-tr from-[var(--tp-buttons-10)] to-[var(--tp-buttons-20)] rounded-full blur-3xl" />
      </div>
    </div>
  )
}



