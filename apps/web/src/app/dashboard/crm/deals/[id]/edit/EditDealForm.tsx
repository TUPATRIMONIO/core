/**
 * Formulario de Edición de Deal
 * Client component para editar deals
 */

'use client';

import { useState, useEffect } from 'react';
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
import { ArrowLeft, Save } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import type { Deal } from '@/types/crm';

interface EditDealFormProps {
  deal: Deal;
}

export default function EditDealForm({ deal }: EditDealFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: deal.title || '',
    description: deal.description || '',
    value: deal.value?.toString() || '',
    currency: deal.currency || 'CLP',
    stage: deal.stage,
    probability: deal.probability || 0,
    expected_close_date: deal.expected_close_date || '',
    source: deal.source || ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const dataToSend = {
        ...formData,
        value: formData.value ? parseFloat(formData.value) : null,
        expected_close_date: formData.expected_close_date || null
      };

      const response = await fetch(`/api/crm/deals/${deal.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSend)
      });

      if (!response.ok) {
        throw new Error('Error al actualizar negocio');
      }

      toast({
        title: 'Negocio actualizado',
        description: 'Los cambios han sido guardados correctamente',
      });

      router.push(`/dashboard/crm/deals/${deal.id}`);
      router.refresh();
    } catch (error) {
      console.error('Error updating deal:', error);
      toast({
        title: 'Error',
        description: 'No se pudo actualizar el negocio. Intenta nuevamente.',
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
      <div className="flex items-center gap-4">
        <Link href={`/dashboard/crm/deals/${deal.id}`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Editar Negocio
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {deal.title}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Información del Negocio</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Título *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleChange('title', e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descripción</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="value">Valor</Label>
                <Input
                  id="value"
                  type="number"
                  value={formData.value}
                  onChange={(e) => handleChange('value', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="currency">Moneda</Label>
                <Select value={formData.currency} onValueChange={(value) => handleChange('currency', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CLP">CLP</SelectItem>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="MXN">MXN</SelectItem>
                    <SelectItem value="COP">COP</SelectItem>
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

            <div className="flex gap-4 justify-end pt-4">
              <Link href={`/dashboard/crm/deals/${deal.id}`}>
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
                {isSubmitting ? 'Guardando...' : 'Guardar Cambios'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}






