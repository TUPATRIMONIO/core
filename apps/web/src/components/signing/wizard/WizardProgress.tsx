'use client'

import { cn } from '@/lib/utils'
import { SIGNING_WIZARD_STEPS, useSigningWizard } from './WizardContext'

export function WizardProgress() {
  const {
    state: { step },
  } = useSigningWizard()

  return (
    <div className="rounded-lg border bg-background p-4">
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

