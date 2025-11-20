'use client'

import { useRouter } from 'next/navigation'
import { LogOut, User, Settings, HelpCircle, CreditCard, Globe } from 'lucide-react'
import { useAuthStore } from '@/stores/auth-store'
import { useCredits } from '@/hooks/use-credits'
import { useCurrency } from '@/hooks/use-currency'
import { createClient } from '@/lib/supabase/client'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

export function TopMenu() {
  const router = useRouter()
  const { profile, reset, setProfile } = useAuthStore()
  const { balance } = useCredits()
  const { currencies, selectedCurrency, updateUserCurrency } = useCurrency()

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    reset()
    router.push('/login')
  }

  const getInitials = (name: string | null) => {
    if (!name) return '?'
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <header className="sticky top-0 z-40 bg-background border-b h-16">
      <div className="flex items-center justify-between h-full px-4 md:px-6">
        {/* Left side - could add breadcrumbs or search */}
        <div className="flex items-center gap-4">
          {/* Mobile menu button would go here */}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-4">
          {/* Currency selector */}
          {currencies.length > 1 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="hidden md:flex items-center gap-2 px-3 py-1.5 text-sm bg-secondary rounded-md hover:bg-secondary/80 transition-colors">
                  <Globe className="h-4 w-4" />
                  <span>{selectedCurrency}</span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Seleccionar moneda</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {currencies.map((currency) => (
                  <DropdownMenuItem
                    key={currency.code}
                    onClick={() => updateUserCurrency(currency.code)}
                    className="cursor-pointer"
                  >
                    <div className="flex items-center justify-between w-full">
                      <span>{currency.name}</span>
                      <span className="text-xs text-muted-foreground ml-2">{currency.symbol}</span>
                    </div>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* Credits display */}
          <button
            onClick={() => router.push('/dashboard/credits')}
            className="hidden sm:flex items-center gap-2 px-3 py-1.5 text-sm bg-secondary rounded-md hover:bg-secondary/80 transition-colors"
          >
            <CreditCard className="h-4 w-4" />
            <span className="font-medium">{balance.toLocaleString()}</span>
            <span className="text-muted-foreground">créditos</span>
          </button>

          {/* User menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-ring rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={profile?.avatar_url || undefined} />
                  <AvatarFallback>{getInitials(profile?.full_name)}</AvatarFallback>
                </Avatar>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium">{profile?.full_name || 'Usuario'}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {profile?.email}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => router.push('/dashboard/settings')}
                className="cursor-pointer"
              >
                <User className="mr-2 h-4 w-4" />
                Mi perfil
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => router.push('/dashboard/settings/security')}
                className="cursor-pointer"
              >
                <Settings className="mr-2 h-4 w-4" />
                Configuración
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => router.push('/dashboard/credits')}
                className="cursor-pointer sm:hidden"
              >
                <CreditCard className="mr-2 h-4 w-4" />
                Créditos ({balance.toLocaleString()})
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => window.open('https://tupatrimonio.cl/ayuda', '_blank')}
                className="cursor-pointer"
              >
                <HelpCircle className="mr-2 h-4 w-4" />
                Ayuda
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleSignOut}
                className="cursor-pointer text-destructive focus:text-destructive"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Cerrar sesión
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
