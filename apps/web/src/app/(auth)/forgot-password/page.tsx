'use client'

import { ResetPasswordForm } from '@/components/auth/reset-password-form'
import { KeyRound } from 'lucide-react'

export default function ForgotPasswordPage() {
  return (
    <main className="bg-[var(--tp-bg-light-10)]">
      <div className="flex min-h-svh flex-col items-center justify-center px-6 py-12 sm:px-8">
        <div className="flex w-full max-w-md flex-col items-center gap-6">
          {/* Header */}
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--tp-buttons-20)] shadow-[var(--tp-shadow-lg)]">
              <KeyRound className="h-8 w-8 text-[var(--tp-buttons)]" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">
              ¿Olvidaste tu contraseña?
            </h1>
            <p className="text-sm text-muted-foreground max-w-sm">
              No te preocupes, te enviaremos instrucciones para restablecerla
            </p>
          </div>

          {/* Card con formulario */}
          <div className="w-full rounded-lg border border-[var(--tp-lines-30)] bg-card p-6">
            <ResetPasswordForm />
          </div>

          {/* Link volver al login */}
          <a
            href="/login"
            className="text-sm text-[var(--tp-buttons)] hover:underline font-medium"
          >
            Volver al login
          </a>
        </div>
      </div>
    </main>
  )
}
