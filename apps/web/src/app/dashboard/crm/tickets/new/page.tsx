/**
 * Crear Nuevo Ticket CRM
 * Formulario para crear tickets de soporte
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
import { useToast } from '@/hooks/useToast';

export default function NewTicketPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingPipeline, setLoadingPipeline] = useState(true);
  const [formData, setFormData] = useState({
    subject: '',
    description: '',
    priority: 'medium' as const,
    category: 'general' as const,
    status: 'new' as const,
    contact_id: searchParams.get('contact_id') || '',
    company_id: searchParams.get('company_id') || '',
    due_date: '',
    pipeline_id: '',
    stage_id: ''
  });

  // Cargar pipeline por defecto al montar
  useEffect(() => {
    fetchDefaultPipeline();
  }, []);

  const fetchDefaultPipeline = async () => {
    try {
      const response = await fetch('/api/crm/pipelines?entity_type=ticket&is_active=true&include_stages=true');
      if (!response.ok) throw new Error('Error loading pipeline');
      
      const pipelines = await response.json();
      const defaultPipeline = pipelines.find((p: any) => p.is_default) || pipelines[0];
      
      if (defaultPipeline && defaultPipeline.stages && defaultPipeline.stages.length > 0) {
        // Asignar pipeline y primera etapa automáticamente
        const firstStage = defaultPipeline.stages.sort((a: any, b: any) => a.display_order - b.display_order)[0];
        setFormData(prev => ({
          ...prev,
          pipeline_id: defaultPipeline.id,
          stage_id: firstStage.id
        }));
      }
    } catch (error) {
      console.error('Error fetching default pipeline:', error);
    } finally {
      setLoadingPipeline(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const dataToSend = {
        ...formData,
        contact_id: formData.contact_id || null,
        company_id: formData.company_id || null,
        due_date: formData.due_date || null,
        pipeline_id: formData.pipeline_id || null,
        stage_id: formData.stage_id || null
      };

      const response = await fetch('/api/crm/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSend)
      });

      if (!response.ok) {
        throw new Error('Error al crear ticket');
      }

      const ticket = await response.json();

      toast({
        title: 'Ticket creado',
        description: `Ticket ${ticket.ticket_number} ha sido creado exitosamente`,
      });

      router.push(`/dashboard/crm/tickets/${ticket.id}`);
    } catch (error) {
      console.error('Error creating ticket:', error);
      toast({
        title: 'Error',
        description: 'No se pudo crear el ticket. Intenta nuevamente.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/crm/tickets">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Nuevo Ticket
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Crea un nuevo ticket de soporte
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Información del Ticket</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Asunto */}
            <div className="space-y-2">
              <Label htmlFor="subject">Asunto *</Label>
              <Input
                id="subject"
                value={formData.subject}
                onChange={(e) => handleChange('subject', e.target.value)}
                placeholder="Resumen del problema o solicitud"
                required
              />
            </div>

            {/* Descripción */}
            <div className="space-y-2">
              <Label htmlFor="description">Descripción *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                rows={6}
                placeholder="Describe el problema o solicitud en detalle..."
                required
              />
            </div>

            {/* Prioridad y Categoría */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="priority">Prioridad</Label>
                <Select value={formData.priority} onValueChange={(value) => handleChange('priority', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Baja</SelectItem>
                    <SelectItem value="medium">Media</SelectItem>
                    <SelectItem value="high">Alta</SelectItem>
                    <SelectItem value="urgent">Urgente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Categoría</Label>
                <Select value={formData.category} onValueChange={(value) => handleChange('category', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">General</SelectItem>
                    <SelectItem value="technical">Soporte Técnico</SelectItem>
                    <SelectItem value="billing">Facturación</SelectItem>
                    <SelectItem value="sales">Ventas</SelectItem>
                    <SelectItem value="feature_request">Solicitud de Feature</SelectItem>
                    <SelectItem value="bug_report">Reporte de Bug</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Fecha de vencimiento */}
            <div className="space-y-2">
              <Label htmlFor="due_date">Fecha de Vencimiento (SLA)</Label>
              <Input
                id="due_date"
                type="datetime-local"
                value={formData.due_date}
                onChange={(e) => handleChange('due_date', e.target.value)}
              />
              <p className="text-xs text-gray-500">
                Define cuándo debe resolverse este ticket
              </p>
            </div>

            {/* Info del pipeline */}
            {loadingPipeline && (
              <div className="text-sm text-muted-foreground">
                Cargando configuración...
              </div>
            )}
            {!loadingPipeline && formData.pipeline_id && (
              <div className="text-xs text-muted-foreground bg-muted p-3 rounded-md">
                ℹ️ Este ticket se creará en el pipeline configurado por defecto
              </div>
            )}

            {/* Botones */}
            <div className="flex gap-4 justify-end pt-4">
              <Link href="/dashboard/crm/tickets">
                <Button type="button" variant="outline">
                  Cancelar
                </Button>
              </Link>
              <Button 
                type="submit"
                disabled={isSubmitting || loadingPipeline}
                className="bg-[var(--tp-brand)] hover:bg-[var(--tp-brand-light)]"
              >
                <Save className="w-4 h-4 mr-2" />
                {isSubmitting ? 'Creando...' : 'Crear Ticket'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}








