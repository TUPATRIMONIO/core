'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Mail, Lock, Eye, EyeOff } from 'lucide-react'
import { signIn } from '@/lib/auth/actions'
import { OAuthButtons } from './oauth-buttons'
import { MagicLinkForm } from './magic-link-form'
import { EmailOTPForm } from './email-otp-form'

export function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const formData = new FormData()
    formData.append('email', email)
    formData.append('password', password)

    try {
      const result = await signIn(formData)
      
      if (result?.error) {
        setError(result.error)
      }
      // Si es exitoso, la función signIn redirige automáticamente
    } catch (err) {
      setError('Ocurrió un error. Por favor intenta de nuevo')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full space-y-6">
      <Tabs defaultValue="password" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="password">Contraseña</TabsTrigger>
          <TabsTrigger value="magic">Magic Link</TabsTrigger>
          <TabsTrigger value="otp">Código OTP</TabsTrigger>
        </TabsList>

        {/* Tab: Password Login */}
        <TabsContent value="password" className="space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="login-email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="login-email"
                  type="email"
                  placeholder="tu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 focus:border-[var(--tp-buttons)] focus:ring-[var(--tp-buttons)]/20"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="login-password">Contraseña</Label>
                <a
                  href="/forgot-password"
                  className="text-xs text-[var(--tp-buttons)] hover:underline"
                >
                  ¿Olvidaste tu contraseña?
                </a>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10 focus:border-[var(--tp-buttons)] focus:ring-[var(--tp-buttons)]/20"
                  required
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-md bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800">
                <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-[var(--tp-buttons)] hover:bg-[var(--tp-buttons-hover)] text-white font-medium"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                  Iniciando sesión...
                </div>
              ) : (
                'Iniciar sesión'
              )}
            </Button>
          </form>
        </TabsContent>

        {/* Tab: Magic Link */}
        <TabsContent value="magic" className="space-y-4">
          <MagicLinkForm />
        </TabsContent>

        {/* Tab: Email OTP */}
        <TabsContent value="otp" className="space-y-4">
          <EmailOTPForm />
        </TabsContent>
      </Tabs>

      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-[var(--tp-lines-30)]" />
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="bg-background px-2 text-muted-foreground">
            O continuar con
          </span>
        </div>
      </div>

      {/* OAuth Buttons */}
      <OAuthButtons mode="login" />

      {/* Link a Register */}
      <p className="text-center text-sm text-muted-foreground">
        ¿No tienes una cuenta?{' '}
        <a href="/register" className="text-[var(--tp-buttons)] hover:underline font-medium">
          Regístrate gratis
        </a>
      </p>
    </div>
  )
}

