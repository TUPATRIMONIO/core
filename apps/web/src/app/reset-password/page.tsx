'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Icon } from '@tupatrimonio/ui'
import { Lock, Eye, EyeOff, CheckCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/hooks/use-toast'

export default function ResetPasswordPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    
    // Validaciones
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres')
      return
    }
    
    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden')
      return
    }
    
    setLoading(true)
    
    try {
      const supabase = createClient()
      
      // Actualizar contraseña
      const { error: updateError } = await supabase.auth.updateUser({
        password: password
      })
      
      if (updateError) {
        throw updateError
      }
      
      // Mostrar éxito
      toast({
        title: '¡Contraseña actualizada!',
        description: 'Tu contraseña ha sido cambiada exitosamente',
      })
      
      // Redirigir al dashboard después de 2 segundos
      setTimeout(() => {
        router.push('/dashboard')
      }, 2000)
      
    } catch (err: any) {
      console.error('Error updating password:', err)
      setError(err.message || 'Error al actualizar la contraseña')
      setLoading(false)
    }
  }
  
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
              <Icon icon={Lock} size="xl" variant="white" />
            </div>
            <CardTitle className="text-3xl mb-2">
              <span className="text-[var(--tp-brand)]">Nueva Contraseña</span>
            </CardTitle>
            <CardDescription className="text-base">
              Establece una nueva contraseña para tu cuenta
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Nueva Contraseña */}
              <div>
                <Label htmlFor="password" className="mb-2 block">
                  Nueva Contraseña
                </Label>
                <div className="relative">
                  <Icon icon={Lock} size="md" variant="muted" className="absolute left-3 top-1/2 transform -translate-y-1/2" />
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10 focus:border-[var(--tp-brand)] focus:ring-[var(--tp-brand)]/20"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <Icon icon={showPassword ? EyeOff : Eye} size="md" variant="inherit" />
                  </button>
                </div>
              </div>

              {/* Confirmar Contraseña */}
              <div>
                <Label htmlFor="confirmPassword" className="mb-2 block">
                  Confirmar Contraseña
                </Label>
                <div className="relative">
                  <Icon icon={Lock} size="md" variant="muted" className="absolute left-3 top-1/2 transform -translate-y-1/2" />
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-10 pr-10 focus:border-[var(--tp-brand)] focus:ring-[var(--tp-brand)]/20"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <Icon icon={showConfirmPassword ? EyeOff : Eye} size="md" variant="inherit" />
                  </button>
                </div>
              </div>
              
              {/* Mensaje de error */}
              {error && (
                <div className="p-3 rounded-md bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800">
                  <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
                </div>
              )}
              
              {/* Botón submit */}
              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-[var(--tp-brand)] hover:bg-[var(--tp-brand-light)] text-white font-medium py-3 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                    Actualizando...
                  </div>
                ) : (
                  <div className="flex items-center justify-center">
                    <Icon icon={CheckCircle} size="sm" variant="inherit" className="mr-2" />
                    Actualizar Contraseña
                  </div>
                )}
              </Button>
            </form>

            {/* Info adicional */}
            <div className="mt-4 p-3 rounded-md bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800">
              <p className="text-blue-600 dark:text-blue-400 text-xs">
                La contraseña debe tener al menos 6 caracteres. Te recomendamos usar una combinación de letras, números y símbolos.
              </p>
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


