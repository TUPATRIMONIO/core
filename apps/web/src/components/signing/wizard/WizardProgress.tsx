'use client'

import { cn } from '@/lib/utils'
import { SIGNING_WIZARD_STEPS, useSigningWizard } from './WizardContext'
import { RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
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

export function WizardProgress() {
  const {
    state: { step, file, signers, signatureProduct, notaryProduct },
    actions: { reset },
  } = useSigningWizard()

  const hasProgress = step > 0 || !!file || signers.length > 0 || !!signatureProduct || !!notaryProduct

  return (
    <div className="rounded-lg border bg-background p-4 space-y-3">
      {hasProgress && (
        <div className="flex justify-end">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="text-muted-foreground hover:text-[var(--tp-buttons)] hover:border-[var(--tp-buttons)] hover:bg-[var(--tp-buttons-10)] transition-all flex gap-2 h-8 px-3 text-xs font-medium"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Comenzar de nuevo
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>¿Comenzar de nuevo?</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta acción borrará todos los datos ingresados hasta ahora, incluyendo el documento
                  cargado y la selección de servicios. Esta acción no se puede deshacer.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  onClick={reset}
                  className="bg-[var(--tp-buttons)] hover:bg-[var(--tp-buttons-hover)] text-white"
                >
                  Sí, comenzar de nuevo
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      )}
      <ol className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {SIGNING_WIZARD_STEPS.map((s, idx) => {
          const isActive = idx === step
          const isDone = idx < step

          return (
            <li
              key={s.key}
              className={cn(
                'rounded-md border p-3 transition-colors',
                isActive && 'border-[var(--tp-buttons)] bg-[var(--tp-buttons-10)]',
                isDone && 'border-[var(--tp-lines-30)] bg-[var(--tp-bg-light-10)]'
              )}
            >
              <div className="flex items-center gap-2">
                <div
                  className={cn(
                    'flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold',
                    isActive
                      ? 'bg-[var(--tp-buttons)] text-white'
                      : isDone
                        ? 'bg-[var(--tp-lines-30)] text-foreground'
                        : 'bg-muted text-muted-foreground'
                  )}
                >
                  {idx + 1}
                </div>
                <div className="min-w-0">
                  <div className={cn('text-sm font-semibold', !isActive && 'text-muted-foreground')}>
                    {s.title}
                  </div>
                  <div className="text-xs text-muted-foreground truncate">{s.description}</div>
                </div>
              </div>
            </li>
          )
        })}
      </ol>
    </div>
  )
}

