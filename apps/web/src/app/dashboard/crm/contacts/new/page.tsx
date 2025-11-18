/**
 * Crear Nuevo Contacto CRM
 * Formulario para agregar contactos
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, Save, AlertCircle, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import DuplicateContactDialog from '@/components/crm/DuplicateContactDialog';

interface DuplicateContact {
  id: string;
  full_name: string | null;
  email: string;
  company_name?: string | null;
  job_title?: string | null;
  status?: string;
}

export default function NewContactPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);
  const [emailValidation, setEmailValidation] = useState<{
    isDuplicate: boolean;
    contact: DuplicateContact | null;
  } | null>(null);
  const [showDuplicateDialog, setShowDuplicateDialog] = useState(false);
  
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    mobile: '',
    company_name: '',
    job_title: '',
    website: '',
    address: '',
    city: '',
    country: '',
    status: 'lead' as const,
    source: '',
    notes: ''
  });

  // Debounce para validación de email
  const checkEmailDuplicate = useCallback(async (email: string) => {
    if (!email || !email.includes('@')) {
      setEmailValidation(null);
      return;
    }

    setIsCheckingEmail(true);
    
    try {
      const response = await fetch('/api/crm/contacts/check-duplicate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      if (response.ok) {
        const data = await response.json();
        setEmailValidation({
          isDuplicate: data.exists,
          contact: data.contact
        });
      }
    } catch (error) {
      console.error('Error checking duplicate:', error);
    } finally {
      setIsCheckingEmail(false);
    }
  }, []);

  // Effect para validar email con debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (formData.email) {
        checkEmailDuplicate(formData.email);
      }
    }, 800); // Espera 800ms después de que el usuario deja de escribir

    return () => clearTimeout(timer);
  }, [formData.email, checkEmailDuplicate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Si hay duplicado detectado, mostrar diálogo en lugar de enviar
    if (emailValidation?.isDuplicate && emailValidation.contact) {
      setShowDuplicateDialog(true);
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/crm/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      // Manejar caso de duplicado (por si acaso)
      if (response.status === 409 && data.error === 'duplicate_email') {
        if (data.existingContact) {
          setEmailValidation({
            isDuplicate: true,
            contact: data.existingContact
          });
          setShowDuplicateDialog(true);
        } else {
          toast({
            title: 'Correo duplicado',
            description: data.message || 'Ya existe un contacto con este correo electrónico',
            variant: 'destructive',
          });
        }
        setIsSubmitting(false);
        return;
      }

      if (!response.ok) {
        throw new Error(data.error || 'Error al crear contacto');
      }

      toast({
        title: '¡Contacto creado!',
        description: `${data.full_name || data.email} ha sido agregado exitosamente a tu CRM`,
      });

      router.push(`/dashboard/crm/contacts/${data.id}`);
    } catch (error) {
      console.error('Error creating contact:', error);
      toast({
        title: 'Error',
        description: 'No se pudo crear el contacto. Por favor, intenta nuevamente.',
        variant: 'destructive',
      });
      setIsSubmitting(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Limpiar validación de email si cambia el email
    if (field === 'email') {
      setEmailValidation(null);
    }
  };

  return (
    <div className="max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/crm/contacts">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Nuevo Contacto
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Agrega un nuevo contacto al CRM
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Información Básica</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Nombre */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="first_name">Nombre *</Label>
                <Input
                  id="first_name"
                  value={formData.first_name}
                  onChange={(e) => handleChange('first_name', e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="last_name">Apellido</Label>
                <Input
                  id="last_name"
                  value={formData.last_name}
                  onChange={(e) => handleChange('last_name', e.target.value)}
                />
              </div>
            </div>

            {/* Email y Teléfono */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <div className="relative">
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    className={
                      emailValidation?.isDuplicate
                        ? 'border-amber-500 focus-visible:ring-amber-500'
                        : emailValidation?.isDuplicate === false
                        ? 'border-green-500 focus-visible:ring-green-500'
                        : ''
                    }
                    required
                  />
                  {isCheckingEmail && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-[var(--tp-buttons)]"></div>
                    </div>
                  )}
                  {!isCheckingEmail && emailValidation?.isDuplicate && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <AlertCircle className="h-4 w-4 text-amber-500" />
                    </div>
                  )}
                  {!isCheckingEmail && emailValidation?.isDuplicate === false && formData.email && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    </div>
                  )}
                </div>
                {emailValidation?.isDuplicate && emailValidation.contact && (
                  <p className="text-sm text-amber-600 dark:text-amber-500 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    Ya existe un contacto con este correo
                  </p>
                )}
                {!isCheckingEmail && emailValidation?.isDuplicate === false && formData.email && (
                  <p className="text-sm text-green-600 dark:text-green-500 flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    Correo disponible
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Teléfono</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                />
              </div>
            </div>

            {/* Empresa y Cargo */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="company_name">Empresa</Label>
                <Input
                  id="company_name"
                  value={formData.company_name}
                  onChange={(e) => handleChange('company_name', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="job_title">Cargo</Label>
                <Input
                  id="job_title"
                  value={formData.job_title}
                  onChange={(e) => handleChange('job_title', e.target.value)}
                />
              </div>
            </div>

            {/* Estado y Fuente */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="status">Estado</Label>
                <Select value={formData.status} onValueChange={(value) => handleChange('status', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="lead">Lead</SelectItem>
                    <SelectItem value="qualified">Calificado</SelectItem>
                    <SelectItem value="customer">Cliente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="source">Fuente</Label>
                <Input
                  id="source"
                  value={formData.source}
                  onChange={(e) => handleChange('source', e.target.value)}
                  placeholder="web_form, referral, etc."
                />
              </div>
            </div>

            {/* Notas */}
            <div className="space-y-2">
              <Label htmlFor="notes">Notas</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => handleChange('notes', e.target.value)}
                rows={4}
                placeholder="Información adicional sobre este contacto..."
              />
            </div>

            {/* Botones */}
            <div className="flex gap-4 justify-end pt-4">
              <Link href="/dashboard/crm/contacts">
                <Button type="button" variant="outline">
                  Cancelar
                </Button>
              </Link>
              <Button 
                type="submit"
                disabled={isSubmitting || isCheckingEmail}
                className="bg-[var(--tp-buttons)] hover:bg-[var(--tp-buttons-hover)]"
              >
                <Save className="w-4 h-4 mr-2" />
                {isSubmitting ? 'Guardando...' : 'Crear Contacto'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>

      {/* Dialog de contacto duplicado */}
      {emailValidation?.contact && (
        <DuplicateContactDialog
          open={showDuplicateDialog}
          onOpenChange={setShowDuplicateDialog}
          contact={emailValidation.contact}
        />
      )}
    </div>
  );
}








