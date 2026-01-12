import { Toaster } from 'sonner'
import { OrganizationProvider } from '@/providers/OrganizationProvider'
import { GlobalCountryProvider } from '@/providers/GlobalCountryProvider'
import { GlobalCurrencyProvider } from '@/providers/GlobalCurrencyProvider'
import { CountrySelectorDropdown } from '@/components/shared/CountrySelectorDropdown'
import { CurrencySelectorDropdown } from '@/components/shared/CurrencySelectorDropdown'

export function PublicShell({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <OrganizationProvider>
      <GlobalCountryProvider>
        <GlobalCurrencyProvider>
          <div className="min-h-screen bg-[var(--tp-background-light)] dark:bg-[var(--tp-background-dark)]">
            <header className="flex h-16 items-center justify-between border-b px-6 bg-white dark:bg-zinc-950 sticky top-0 z-10">
              <div className="flex items-center gap-2">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--tp-buttons)] font-semibold text-white">
                  TP
                </span>
                <span className="font-bold text-xl text-foreground">TuPatrimonio</span>
              </div>
              <div className="flex items-center gap-2">
                <CurrencySelectorDropdown variant="compact" />
                <CountrySelectorDropdown variant="compact" showReset />
              </div>
            </header>
            
            <main>
              {children}
            </main>
            <Toaster />
          </div>
        </GlobalCurrencyProvider>
      </GlobalCountryProvider>
    </OrganizationProvider>
  )
}

