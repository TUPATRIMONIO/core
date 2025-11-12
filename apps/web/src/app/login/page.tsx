'use client'

import React, { useState } from 'react'
import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { signIn, signUp, signInWithGitHub } from './actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/custom/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Icon } from '@tupatrimonio/ui'
import { Eye, EyeOff, User, Mail, Lock, ArrowRight, UserPlus, Github } from 'lucide-react'

type AuthMode = 'login' | 'register'

interface FormData {
  email: string
  password: string
  confirmPassword: string
  rememberMe: boolean
}

interface FormErrors {
  email?: string
  password?: string
  confirmPassword?: string
  general?: string
}

// Componente para el botón de GitHub
function GitHubButton() {
  const [loading, setLoading] = useState(false)
  
  const handleGitHubSignIn = async () => {
    setLoading(true)
    try {
      await signInWithGitHub()
    } catch (error) {
      setLoading(false)
      console.error('Error with GitHub sign in:', error)
    }
  }
  
  return (
    <Button
      onClick={handleGitHubSignIn}
      disabled={loading}
      className="w-full bg-gray-900 dark:bg-gray-800 hover:bg-gray-800 dark:hover:bg-gray-700 text-white font-medium py-3 rounded-lg transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-md hover:shadow-lg"
    >
      {loading ? (
        <div className="flex items-center justify-center">
          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
          Conectando...
        </div>
      ) : (
        <div className="flex items-center justify-center">
          <Icon icon={Github} size="md" variant="inherit" className="mr-3" />
          Continuar con GitHub
        </div>
      )}
    </Button>
  )
}

// Componente para el botón de envío
function SubmitButton({ authMode }: { authMode: AuthMode }) {
  const { pending } = useFormStatus()
  
  return (
    <Button
      type="submit"
      disabled={pending}
      className="w-full bg-[var(--tp-brand)] hover:bg-[var(--tp-brand-light)] text-white font-medium py-3 rounded-lg transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg hover:shadow-xl"
    >
      {pending ? (
        <div className="flex items-center justify-center">
          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
          {authMode === 'login' ? 'Iniciando...' : 'Registrando...'}
        </div>
      ) : (
        <div className="flex items-center justify-center">
          {authMode === 'login' ? 'Iniciar Sesión' : 'Crear Cuenta'}
          <Icon icon={ArrowRight} size="sm" variant="inherit" className="ml-2" />
        </div>
      )}
    </Button>
  )
}

export default function LoginPage() {
  const [authMode, setAuthMode] = useState<AuthMode>('login')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  
  // Estados para las acciones del servidor
  const [signInState, signInAction] = useActionState(signIn, null)
  const [signUpState, signUpAction] = useActionState(signUp, null)
  
  // Obtener el estado actual según el modo
  const currentState = authMode === 'login' ? signInState : signUpState
  const currentAction = authMode === 'login' ? signInAction : signUpAction
  
  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: '',
    confirmPassword: '',
    rememberMe: false
  })
  
  const [errors, setErrors] = useState<FormErrors>({})

  // La validación ahora se hace en el servidor, no necesitamos esta función del lado del cliente

  // Manejar cambios en inputs
  const handleInputChange = (field: keyof FormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Limpiar error cuando el usuario empiece a escribir
    if (errors[field as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }

  // No necesitamos handleSubmit personalizado, usamos las Server Actions directamente

  // Limpiar errores cuando cambie el estado del servidor
  React.useEffect(() => {
    if (currentState?.error) {
      setErrors({ general: currentState.error })
    } else if (currentState?.success) {
      setErrors({})
    }
  }, [currentState])

  // Manejar errores de OAuth desde URL
  React.useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const urlError = urlParams.get('error')
    if (urlError) {
      setErrors({ general: urlError })
      // Limpiar la URL sin recargar la página
      window.history.replaceState({}, '', window.location.pathname)
    }
  }, [])

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
              <Icon icon={User} size="xl" variant="white" />
            </div>
            <CardTitle className="text-3xl mb-2">
              <span className="text-[var(--tp-brand)]">TuPatrimonio</span>
            </CardTitle>
            <CardDescription className="text-base">
              {authMode === 'login' 
                ? 'Ingresa a tu cuenta para continuar' 
                : 'Crea tu cuenta y comienza ahora'
              }
            </CardDescription>
          </CardHeader>

          <CardContent>

            {/* Toggle de modo */}
            <div className="flex bg-muted rounded-lg p-1 mb-6">
              <button
                type="button"
                onClick={() => {
                  setAuthMode('login')
                  setFormData({
                    email: '',
                    password: '',
                    confirmPassword: '',
                    rememberMe: false
                  })
                  setErrors({})
                }}
                className={`flex-1 py-3 px-4 rounded-md text-sm font-medium transition-all duration-200 ${
                  authMode === 'login'
                    ? 'bg-background shadow-md text-[var(--tp-brand)] border border-[var(--tp-brand-20)]'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Icon icon={User} size="sm" variant="inherit" className="inline mr-2" />
                Iniciar Sesión
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthMode('register')
                  setFormData({
                    email: '',
                    password: '',
                    confirmPassword: '',
                    rememberMe: false
                  })
                  setErrors({})
                }}
                className={`flex-1 py-3 px-4 rounded-md text-sm font-medium transition-all duration-200 ${
                  authMode === 'register'
                    ? 'bg-background shadow-md text-[var(--tp-brand)] border border-[var(--tp-brand-20)]'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Icon icon={UserPlus} size="sm" variant="inherit" className="inline mr-2" />
                Registrarse
              </button>
            </div>

          {/* Botón de GitHub */}
          <div className="mb-6">
            <GitHubButton />
          </div>

            {/* Separador */}
            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-card text-muted-foreground font-medium">
                  o continúa con email
                </span>
              </div>
            </div>

            {/* Formulario */}
            <form action={currentAction} className="space-y-4">
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
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className={`pl-10 focus:border-[var(--tp-brand)] focus:ring-[var(--tp-brand)]/20 ${
                      errors.email ? 'border-red-500 focus:border-red-500' : ''
                    }`}
                    required
                  />
                </div>
                {errors.email && (
                  <p className="text-red-500 text-xs mt-1">{errors.email}</p>
                )}
              </div>

              {/* Contraseña */}
              <div>
                <Label htmlFor="password" className="mb-2 block">
                  Contraseña
                </Label>
                <div className="relative">
                  <Icon icon={Lock} size="md" variant="muted" className="absolute left-3 top-1/2 transform -translate-y-1/2" />
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    className={`pl-10 pr-10 focus:border-[var(--tp-brand)] focus:ring-[var(--tp-brand)]/20 ${
                      errors.password ? 'border-red-500 focus:border-red-500' : ''
                    }`}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <Icon icon={showPassword ? EyeOff : Eye} size="md" variant="inherit" />
                  </button>
                </div>
                {errors.password && (
                  <p className="text-red-500 text-xs mt-1">{errors.password}</p>
                )}
              </div>

              {/* Confirmar Contraseña (solo en registro) */}
              {authMode === 'register' && (
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
                      value={formData.confirmPassword}
                      onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                      className={`pl-10 pr-10 focus:border-[var(--tp-brand)] focus:ring-[var(--tp-brand)]/20 ${
                        errors.confirmPassword ? 'border-red-500 focus:border-red-500' : ''
                      }`}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      <Icon icon={showConfirmPassword ? EyeOff : Eye} size="md" variant="inherit" />
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="text-red-500 text-xs mt-1">{errors.confirmPassword}</p>
                  )}
                </div>
              )}

              {/* Recordar sesión */}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="rememberMe"
                  checked={formData.rememberMe}
                  onCheckedChange={(checked) => handleInputChange('rememberMe', checked as boolean)}
                  className="border-[var(--tp-brand)] data-[state=checked]:bg-[var(--tp-brand)] data-[state=checked]:border-[var(--tp-brand)]"
                />
                <Label
                  htmlFor="rememberMe"
                  className="text-sm text-muted-foreground cursor-pointer"
                >
                  Recordar mi sesión
                </Label>
              </div>

              {/* Mensajes de error y éxito */}
              {currentState?.error && (
                <div className="p-3 rounded-md bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800">
                  <p className="text-red-600 dark:text-red-400 text-sm">{currentState.error}</p>
                </div>
              )}
              
              {currentState?.success && currentState?.message && (
                <div className="p-3 rounded-md bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800">
                  <p className="text-green-600 dark:text-green-400 text-sm">{currentState.message}</p>
                </div>
              )}

              {errors.general && !currentState?.error && (
                <div className="p-3 rounded-md bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800">
                  <p className="text-red-600 dark:text-red-400 text-sm">{errors.general}</p>
                </div>
              )}

              {/* Botón submit */}
              <SubmitButton authMode={authMode} />
            </form>

            {/* Enlaces adicionales */}
            <div className="mt-6 space-y-3">
              {authMode === 'login' && (
                <div className="text-center">
                  <button className="text-sm text-[var(--tp-brand)] hover:text-[var(--tp-brand-light)] transition-colors">
                    ¿Olvidaste tu contraseña?
                  </button>
                </div>
              )}

              {/* Enlaces legales */}
              <div className="text-center text-xs text-muted-foreground space-y-1">
                <p>
                  Al continuar, aceptas nuestros{' '}
                  <a href="/legal/terminos" rel="noopener noreferrer nofollow" className="text-[var(--tp-brand)] hover:text-[var(--tp-brand-light)] underline transition-colors">
                    Términos de Servicio
                  </a>
                  {' '}y{' '}
                  <a href="/legal/privacidad" rel="noopener noreferrer nofollow" className="text-[var(--tp-brand)] hover:text-[var(--tp-brand-light)] underline transition-colors">
                    Política de Privacidad
                  </a>
                </p>
              </div>
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
