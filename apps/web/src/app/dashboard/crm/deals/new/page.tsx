/**
 * Crear Nuevo Deal/Negocio CRM
 * Formulario para crear oportunidades de venta
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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
import { ArrowLeft, Save } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';

export default function NewDealPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    value: '',
    currency: 'CLP',
    stage: 'prospecting' as const,
    probability: 10,
    contact_id: searchParams.get('contact_id') || '',
    company_id: searchParams.get('company_id') || '',
    expected_close_date: '',
    source: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const dataToSend = {
        ...formData,
        value: formData.value ? parseFloat(formData.value) : null,
        contact_id: formData.contact_id || null,
        company_id: formData.company_id || null,
        expected_close_date: formData.expected_close_date || null
      };

      const response = await fetch('/api/crm/deals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSend)
      });

      if (!response.ok) {
        throw new Error('Error al crear negocio');
      }

      const deal = await response.json();

      toast({
        title: 'Negocio creado',
        description: `${deal.title} ha sido agregado al pipeline`,
      });

      router.push(`/dashboard/crm/deals/${deal.id}`);
    } catch (error) {
      console.error('Error creating deal:', error);
      toast({
        title: 'Error',
        description: 'No se pudo crear el negocio. Intenta nuevamente.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Actualizar probability cuando cambia el stage
  useEffect(() => {
    const probabilityByStage: Record<string, number> = {
      prospecting: 10,
      qualification: 25,
      proposal: 50,
      negotiation: 75,
      closed_won: 100,
      closed_lost: 0
    };
    setFormData(prev => ({ 
      ...prev, 
      probability: probabilityByStage[prev.stage] || 0 
    }));
  }, [formData.stage]);

  return (
    <div className="max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/crm/deals">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Nuevo Negocio
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Crea una nueva oportunidad de venta
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Información del Negocio</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Título */}
            <div className="space-y-2">
              <Label htmlFor="title">Título del Negocio *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleChange('title', e.target.value)}
                placeholder="Ej: Proyecto Firma Electrónica para Empresa XYZ"
                required
              />
            </div>

            {/* Descripción */}
            <div className="space-y-2">
              <Label htmlFor="description">Descripción</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                rows={3}
                placeholder="Detalles del negocio..."
              />
            </div>

            {/* Valor y Stage */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="value">Valor</Label>
                <Input
                  id="value"
                  type="number"
                  value={formData.value}
                  onChange={(e) => handleChange('value', e.target.value)}
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="currency">Moneda</Label>
                <Select value={formData.currency} onValueChange={(value) => handleChange('currency', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CLP">CLP (Peso Chileno)</SelectItem>
                    <SelectItem value="USD">USD (Dólar)</SelectItem>
                    <SelectItem value="MXN">MXN (Peso Mexicano)</SelectItem>
                    <SelectItem value="COP">COP (Peso Colombiano)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="expected_close_date">Cierre Esperado</Label>
                <Input
                  id="expected_close_date"
                  type="date"
                  value={formData.expected_close_date}
                  onChange={(e) => handleChange('expected_close_date', e.target.value)}
                />
              </div>
            </div>

            {/* Stage */}
            <div className="space-y-2">
              <Label htmlFor="stage">Etapa del Pipeline</Label>
              <Select value={formData.stage} onValueChange={(value) => handleChange('stage', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="prospecting">Prospección</SelectItem>
                  <SelectItem value="qualification">Calificación</SelectItem>
                  <SelectItem value="proposal">Propuesta</SelectItem>
                  <SelectItem value="negotiation">Negociación</SelectItem>
                  <SelectItem value="closed_won">Ganado</SelectItem>
                  <SelectItem value="closed_lost">Perdido</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500">
                Probabilidad: {formData.probability}%
              </p>
            </div>

            {/* Fuente */}
            <div className="space-y-2">
              <Label htmlFor="source">Fuente</Label>
              <Input
                id="source"
                value={formData.source}
                onChange={(e) => handleChange('source', e.target.value)}
                placeholder="web, referral, cold_call, etc."
              />
            </div>

            {/* Botones */}
            <div className="flex gap-4 justify-end pt-4">
              <Link href="/dashboard/crm/deals">
                <Button type="button" variant="outline">
                  Cancelar
                </Button>
              </Link>
              <Button 
                type="submit"
                disabled={isSubmitting}
                className="bg-[var(--tp-brand)] hover:bg-[var(--tp-brand-light)]"
              >
                <Save className="w-4 h-4 mr-2" />
                {isSubmitting ? 'Creando...' : 'Crear Negocio'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}









