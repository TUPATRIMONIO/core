/**
 * Página de Onboarding
 * Selección de tipo de organización (B2C personal o B2B empresarial)
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  User, 
  Building2, 
  Mail, 
  ArrowRight,
  Sparkles,
  Users,
  Zap
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

type OrgType = 'personal' | 'business' | 'invitation' | null;

export default function OnboardingPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [selectedType, setSelectedType] = useState<OrgType>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [businessFormData, setBusinessFormData] = useState({
    name: '',
    industry: '',
    size: ''
  });

  // Verificar si ya completó onboarding
  useEffect(() => {
    checkOnboardingStatus();
  }, []);

  async function checkOnboardingStatus() {
    try {
      const response = await fetch('/api/onboarding/status');
      if (response.ok) {
        const { has_organization } = await response.json();
        if (has_organization) {
          // Ya completó onboarding, redirigir
          router.push('/dashboard');
        }
      }
    } catch (error) {
      console.error('Error checking onboarding status:', error);
    }
  }

  async function handlePersonalSetup() {
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/onboarding/personal', {
        method: 'POST'
      });

      const result = await response.json();

      if (!response.ok) {
        // Mostrar error específico del servidor
        console.error('Server error:', result);
        throw new Error(result.error || result.details || 'Error al crear organización personal');
      }

      const { organization_id } = result;

      toast({
        title: '¡Bienvenido a TuPatrimonio!',
        description: 'Tu cuenta personal ha sido configurada exitosamente',
      });

      router.push('/dashboard/crm');
    } catch (error) {
      console.error('Error in personal setup:', error);
      
      // Mostrar el mensaje de error real
      const errorMessage = error instanceof Error ? error.message : 'No se pudo completar el registro. Intenta nuevamente.';
      
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
      setSelectedType(null);
    }
  }

  async function handleBusinessSetup() {
    if (!businessFormData.name) {
      toast({
        title: 'Error',
        description: 'El nombre de la empresa es requerido',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/onboarding/business', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(businessFormData)
      });

      if (!response.ok) {
        throw new Error('Error al crear organización empresarial');
      }

      const { organization_id } = await response.json();

      toast({
        title: '¡Bienvenido a TuPatrimonio!',
        description: `${businessFormData.name} ha sido configurada exitosamente`,
      });

      router.push('/dashboard/crm');
    } catch (error) {
      console.error('Error in business setup:', error);
      toast({
        title: 'Error',
        description: 'No se pudo completar el registro. Intenta nuevamente.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
      setSelectedType(null);
    }
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-[var(--tp-background-light)] to-background flex items-center justify-center p-4">
      {/* Fondo decorativo */}
      <div className="absolute inset-0 bg-gradient-to-br from-[var(--tp-brand)]/5 via-transparent to-[var(--tp-buttons)]/5" />
      
      <div className="relative w-full max-w-5xl">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-[var(--tp-brand)] via-[var(--tp-brand-light)] to-[var(--tp-brand-dark)] rounded-full mb-6 shadow-lg">
            <Sparkles className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-3">
            ¿Cómo vas a usar <span className="text-[var(--tp-brand)]">TuPatrimonio</span>?
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Selecciona la opción que mejor se adapte a tus necesidades
          </p>
        </div>

        {/* Opciones */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Uso Personal */}
          <Card 
            className="cursor-pointer border-2 hover:border-[var(--tp-brand)] hover:shadow-xl transition-all group"
            onClick={() => setSelectedType('personal')}
          >
            <CardContent className="pt-8 pb-8 text-center">
              <div className="w-16 h-16 bg-[var(--tp-brand)]/10 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                <User className="w-8 h-8 text-[var(--tp-brand)]" />
              </div>
              <CardTitle className="mb-3">Uso Personal</CardTitle>
              <CardDescription className="text-sm leading-relaxed mb-6">
                Para gestionar tus documentos personales, freelance o proyectos individuales
              </CardDescription>
              <ul className="text-left text-sm text-gray-600 dark:text-gray-400 space-y-2 mb-6">
                <li className="flex items-start gap-2">
                  <Zap className="w-4 h-4 text-[var(--tp-brand)] mt-0.5 flex-shrink-0" />
                  <span>100 contactos incluidos</span>
                </li>
                <li className="flex items-start gap-2">
                  <Zap className="w-4 h-4 text-[var(--tp-brand)] mt-0.5 flex-shrink-0" />
                  <span>CRM completo</span>
                </li>
                <li className="flex items-start gap-2">
                  <Zap className="w-4 h-4 text-[var(--tp-brand)] mt-0.5 flex-shrink-0" />
                  <span>Integración Gmail</span>
                </li>
              </ul>
              <Button 
                className="w-full bg-[var(--tp-brand)] hover:bg-[var(--tp-brand-light)]"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedType('personal');
                }}
              >
                Continuar
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </CardContent>
          </Card>

          {/* Uso Empresarial */}
          <Card 
            className="cursor-pointer border-2 hover:border-[var(--tp-brand)] hover:shadow-xl transition-all group relative"
            onClick={() => setSelectedType('business')}
          >
            <div className="absolute -top-3 -right-3 bg-[var(--tp-brand)] text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
              Recomendado
            </div>
            <CardContent className="pt-8 pb-8 text-center">
              <div className="w-16 h-16 bg-[var(--tp-brand)]/10 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                <Building2 className="w-8 h-8 text-[var(--tp-brand)]" />
              </div>
              <CardTitle className="mb-3">Uso Empresarial</CardTitle>
              <CardDescription className="text-sm leading-relaxed mb-6">
                Para tu empresa o equipo de trabajo con colaboración
              </CardDescription>
              <ul className="text-left text-sm text-gray-600 dark:text-gray-400 space-y-2 mb-6">
                <li className="flex items-start gap-2">
                  <Zap className="w-4 h-4 text-[var(--tp-brand)] mt-0.5 flex-shrink-0" />
                  <span>1,000 contactos incluidos</span>
                </li>
                <li className="flex items-start gap-2">
                  <Zap className="w-4 h-4 text-[var(--tp-brand)] mt-0.5 flex-shrink-0" />
                  <span>Hasta 5 usuarios</span>
                </li>
                <li className="flex items-start gap-2">
                  <Zap className="w-4 h-4 text-[var(--tp-brand)] mt-0.5 flex-shrink-0" />
                  <span>Cotizaciones y facturación</span>
                </li>
                <li className="flex items-start gap-2">
                  <Zap className="w-4 h-4 text-[var(--tp-brand)] mt-0.5 flex-shrink-0" />
                  <span>API access</span>
                </li>
              </ul>
              <Button 
                className="w-full bg-[var(--tp-brand)] hover:bg-[var(--tp-brand-light)]"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedType('business');
                }}
              >
                Continuar
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </CardContent>
          </Card>

          {/* Invitación */}
          <Card 
            className="cursor-pointer border-2 hover:border-[var(--tp-brand)] hover:shadow-xl transition-all group"
            onClick={() => setSelectedType('invitation')}
          >
            <CardContent className="pt-8 pb-8 text-center">
              <div className="w-16 h-16 bg-[var(--tp-brand)]/10 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                <Mail className="w-8 h-8 text-[var(--tp-brand)]" />
              </div>
              <CardTitle className="mb-3">Tengo una Invitación</CardTitle>
              <CardDescription className="text-sm leading-relaxed mb-6">
                Alguien me invitó a su organización
              </CardDescription>
              <ul className="text-left text-sm text-gray-600 dark:text-gray-400 space-y-2 mb-6">
                <li className="flex items-start gap-2">
                  <Zap className="w-4 h-4 text-[var(--tp-brand)] mt-0.5 flex-shrink-0" />
                  <span>Únete a un equipo existente</span>
                </li>
                <li className="flex items-start gap-2">
                  <Zap className="w-4 h-4 text-[var(--tp-brand)] mt-0.5 flex-shrink-0" />
                  <span>Rol asignado por admin</span>
                </li>
                <li className="flex items-start gap-2">
                  <Zap className="w-4 h-4 text-[var(--tp-brand)] mt-0.5 flex-shrink-0" />
                  <span>Colaboración en tiempo real</span>
                </li>
              </ul>
              <Button 
                variant="outline"
                className="w-full border-[var(--tp-brand)] text-[var(--tp-brand)] hover:bg-[var(--tp-brand)]/10"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedType('invitation');
                }}
              >
                Ingresar Código
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Dialog para Uso Personal */}
        <Dialog open={selectedType === 'personal'} onOpenChange={() => setSelectedType(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <User className="w-6 h-6 text-[var(--tp-brand)]" />
                Confirmar Uso Personal
              </DialogTitle>
              <DialogDescription>
                Se creará tu cuenta personal con acceso completo al CRM
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-2 text-sm">
                <p className="flex items-center gap-2">
                  <span className="text-green-600">✓</span>
                  <span>100 contactos incluidos</span>
                </p>
                <p className="flex items-center gap-2">
                  <span className="text-green-600">✓</span>
                  <span>CRM completo con deals y tickets</span>
                </p>
                <p className="flex items-center gap-2">
                  <span className="text-green-600">✓</span>
                  <span>Integración con Gmail</span>
                </p>
                <p className="flex items-center gap-2">
                  <span className="text-green-600">✓</span>
                  <span>Sistema de cotizaciones</span>
                </p>
              </div>
              <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => setSelectedType(null)}
                  disabled={isSubmitting}
                >
                  Volver
                </Button>
                <Button 
                  className="flex-1 bg-[var(--tp-brand)] hover:bg-[var(--tp-brand-light)]"
                  onClick={handlePersonalSetup}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Configurando...' : 'Confirmar'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Dialog para Uso Empresarial */}
        <Dialog open={selectedType === 'business'} onOpenChange={() => setSelectedType(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Building2 className="w-6 h-6 text-[var(--tp-brand)]" />
                Configurar Empresa
              </DialogTitle>
              <DialogDescription>
                Crea tu organización empresarial y comienza a colaborar en equipo
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="company_name">Nombre de la Empresa *</Label>
                <Input
                  id="company_name"
                  placeholder="Mi Empresa SpA"
                  value={businessFormData.name}
                  onChange={(e) => setBusinessFormData(prev => ({ ...prev, name: e.target.value }))}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="industry">Industria (opcional)</Label>
                <Input
                  id="industry"
                  placeholder="Tecnología, Retail, etc."
                  value={businessFormData.industry}
                  onChange={(e) => setBusinessFormData(prev => ({ ...prev, industry: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="size">Tamaño de Empresa (opcional)</Label>
                <select
                  id="size"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-background"
                  value={businessFormData.size}
                  onChange={(e) => setBusinessFormData(prev => ({ ...prev, size: e.target.value }))}
                >
                  <option value="">Seleccionar</option>
                  <option value="1-10">1-10 empleados</option>
                  <option value="11-50">11-50 empleados</option>
                  <option value="51-200">51-200 empleados</option>
                  <option value="201-500">201-500 empleados</option>
                  <option value="501-1000">501-1000 empleados</option>
                  <option value="1000+">1000+ empleados</option>
                </select>
              </div>

              <div className="bg-blue-50 dark:bg-blue-950 rounded-lg p-4 text-sm">
                <p className="text-blue-900 dark:text-blue-100 font-medium mb-2">
                  Incluye en plan Business:
                </p>
                <ul className="space-y-1 text-blue-800 dark:text-blue-200 text-xs">
                  <li>• 1,000 contactos</li>
                  <li>• Hasta 5 usuarios</li>
                  <li>• API access</li>
                  <li>• Integraciones avanzadas</li>
                </ul>
              </div>

              <div className="flex gap-3 pt-2">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => setSelectedType(null)}
                  disabled={isSubmitting}
                >
                  Volver
                </Button>
                <Button 
                  className="flex-1 bg-[var(--tp-brand)] hover:bg-[var(--tp-brand-light)]"
                  onClick={handleBusinessSetup}
                  disabled={isSubmitting || !businessFormData.name}
                >
                  {isSubmitting ? 'Creando...' : 'Crear Empresa'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Dialog para Invitación */}
        <Dialog open={selectedType === 'invitation'} onOpenChange={() => setSelectedType(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Mail className="w-6 h-6 text-[var(--tp-brand)]" />
                Aceptar Invitación
              </DialogTitle>
              <DialogDescription>
                Ingresa el código de invitación que recibiste
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="invitation_code">Código de Invitación</Label>
                <Input
                  id="invitation_code"
                  placeholder="INV-XXXXXXXX"
                  className="font-mono"
                />
              </div>
              <p className="text-xs text-gray-500">
                El código de invitación fue enviado por email por el administrador de la organización
              </p>
              <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => setSelectedType(null)}
                >
                  Cancelar
                </Button>
                <Button 
                  className="flex-1 bg-[var(--tp-brand)] hover:bg-[var(--tp-brand-light)]"
                  disabled
                >
                  Validar Código
                </Button>
              </div>
              <p className="text-xs text-center text-gray-400">
                Sistema de invitaciones próximamente
              </p>
            </div>
          </DialogContent>
        </Dialog>

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-gray-500">
          <p>
            Puedes cambiar de plan en cualquier momento desde la configuración
          </p>
        </div>
      </div>
    </div>
  );
}

