'use client'

import React, { useState } from 'react'
import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { signIn, signUp } from './actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/custom/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Eye, EyeOff, User, Mail, Lock, ArrowRight, UserPlus } from 'lucide-react'

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

// Componente para el botón de envío
function SubmitButton({ authMode }: { authMode: AuthMode }) {
  const { pending } = useFormStatus()
  
  return (
    <Button
      type="submit"
      disabled={pending}
      className="w-full bg-[#800039] hover:bg-[#a50049] text-white font-medium py-3 rounded-lg transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
    >
      {pending ? (
        <div className="flex items-center justify-center">
          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
          {authMode === 'login' ? 'Iniciando...' : 'Registrando...'}
        </div>
      ) : (
        <div className="flex items-center justify-center">
          {authMode === 'login' ? 'Iniciar Sesión' : 'Crear Cuenta'}
          <ArrowRight className="w-4 h-4 ml-2" />
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

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200 flex items-center justify-center p-4">
      {/* Fondo con gradiente sutil */}
      <div className="absolute inset-0 bg-gradient-to-br from-red-900/5 via-transparent to-gray-600/5" />
      
      {/* Card principal */}
      <div className="relative w-full max-w-md">
        <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-2xl border border-white/60 p-8">
          {/* Header con logo/título */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-[#800039] to-[#a50049] rounded-full mb-4">
              <User className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-semibold text-gray-900 mb-2">
              TuPatrimonio
            </h1>
            <p className="text-sm text-gray-600">
              {authMode === 'login' 
                ? 'Ingresa a tu cuenta' 
                : 'Crea tu cuenta nueva'
              }
            </p>
          </div>

          {/* Toggle de modo */}
          <div className="flex bg-gray-100 rounded-lg p-1 mb-6">
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
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all duration-200 ${
                authMode === 'login'
                  ? 'bg-white shadow-sm text-[#800039]'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <User className="w-4 h-4 inline mr-2" />
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
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all duration-200 ${
                authMode === 'register'
                  ? 'bg-white shadow-sm text-[#800039]'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <UserPlus className="w-4 h-4 inline mr-2" />
              Registrarse
            </button>
          </div>

          {/* Formulario */}
          <form action={currentAction} className="space-y-4">
            {/* Email */}
            <div>
              <Label htmlFor="email" className="text-gray-700 mb-2 block">
                Correo Electrónico
              </Label>
              <div className="relative">
                <Mail className="w-5 h-5 text-gray-600 absolute left-3 top-1/2 transform -translate-y-1/2" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="tu@email.com"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className={`pl-10 border-gray-300 focus:border-[#800039] focus:ring-[#800039]/20 ${
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
              <Label htmlFor="password" className="text-gray-700 mb-2 block">
                Contraseña
              </Label>
              <div className="relative">
                <Lock className="w-5 h-5 text-gray-600 absolute left-3 top-1/2 transform -translate-y-1/2" />
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  className={`pl-10 pr-10 border-gray-300 focus:border-[#800039] focus:ring-[#800039]/20 ${
                    errors.password ? 'border-red-500 focus:border-red-500' : ''
                  }`}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-600 hover:text-gray-700"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-red-500 text-xs mt-1">{errors.password}</p>
              )}
            </div>

            {/* Confirmar Contraseña (solo en registro) */}
            {authMode === 'register' && (
              <div>
                <Label htmlFor="confirmPassword" className="text-gray-700 mb-2 block">
                  Confirmar Contraseña
                </Label>
                <div className="relative">
                  <Lock className="w-5 h-5 text-gray-600 absolute left-3 top-1/2 transform -translate-y-1/2" />
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                    className={`pl-10 pr-10 border-gray-300 focus:border-[#800039] focus:ring-[#800039]/20 ${
                      errors.confirmPassword ? 'border-red-500 focus:border-red-500' : ''
                    }`}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-600 hover:text-gray-700"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
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
                className="border-tp-lines data-[state=checked]:bg-tp-primary data-[state=checked]:border-tp-primary"
              />
              <Label
                htmlFor="rememberMe"
                className="text-sm text-tp-gray-600 cursor-pointer"
              >
                Recordar mi sesión
              </Label>
            </div>

            {/* Mensajes de error y éxito */}
            {currentState?.error && (
              <div className="p-3 rounded-md bg-tp-error-light border border-red-500-border">
                <p className="text-red-500 text-sm">{currentState.error}</p>
              </div>
            )}
            
            {currentState?.success && currentState?.message && (
              <div className="p-3 rounded-md bg-green-50 border border-green-200">
                <p className="text-green-600 text-sm">{currentState.message}</p>
              </div>
            )}

            {errors.general && !currentState?.error && (
              <div className="p-3 rounded-md bg-tp-error-light border border-red-500-border">
                <p className="text-red-500 text-sm">{errors.general}</p>
              </div>
            )}

            {/* Botón submit */}
            <SubmitButton authMode={authMode} />
          </form>

          {/* Enlaces adicionales */}
          <div className="mt-6 space-y-3">
            {authMode === 'login' && (
              <div className="text-center">
                <button className="text-sm text-[#800039] hover:text-[#800039]-hover transition-colors">
                  ¿Olvidaste tu contraseña?
                </button>
              </div>
            )}

            {/* Enlaces legales */}
            <div className="text-center text-xs text-gray-600 space-y-1">
              <p>
                Al continuar, aceptas nuestros{' '}
                <button className="text-[#800039] hover:text-[#800039]-hover underline transition-colors">
                  Términos de Servicio
                </button>
                {' '}y{' '}
                <button className="text-[#800039] hover:text-[#800039]-hover underline transition-colors">
                  Política de Privacidad
                </button>
              </p>
            </div>
          </div>
        </div>

        {/* Decoración de fondo */}
        <div className="absolute -top-4 -right-4 w-24 h-24 bg-gradient-to-br from-tp-primary-20 to-tp-primary-hover/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-gradient-to-tr from-tp-bg-dark-10 to-tp-lines-10 rounded-full blur-3xl" />
      </div>
    </div>
  )
}
