'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TicketStatus, TicketPriority, TicketCategory } from '@/types/crm';
import { Link2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface CreateTicketFormProps {
  initialAssociations?: {
    orderId?: string;
    userId?: string;
    organizationId?: string;
    contactId?: string;
    companyId?: string;
    [key: string]: string | undefined;
  };
  redirectUrl?: string;
}

export function CreateTicketForm({ initialAssociations, redirectUrl = '/admin/communications/tickets' }: CreateTicketFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [sendEmail, setSendEmail] = useState(true);
  const [formData, setFormData] = useState({
    subject: '',
    description: '',
    status: 'new' as TicketStatus,
    priority: 'medium' as TicketPriority,
    category: 'general' as TicketCategory,
    due_date: '',
  });

  const hasAssociation = initialAssociations && (
    initialAssociations.orderId || 
    initialAssociations.userId || 
    initialAssociations.organizationId || 
    initialAssociations.contactId || 
    initialAssociations.companyId
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/crm/tickets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          due_date: formData.due_date ? new Date(formData.due_date).toISOString() : null,
          associations: initialAssociations,
          sendEmailNotification: sendEmail && hasAssociation,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al crear ticket');
      }

      router.push(redirectUrl);
      router.refresh();
    } catch (error: any) {
      alert(error.message || 'Error al crear ticket');
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {hasAssociation && (
        <Card className="bg-muted/50 border-dashed">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Link2 className="h-4 w-4" />
              Asociación Automática detectada
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {initialAssociations.orderId && <Badge variant="secondary">Pedido Linked</Badge>}
              {initialAssociations.userId && <Badge variant="secondary">Usuario Linked</Badge>}
              {initialAssociations.organizationId && <Badge variant="secondary">Organización Linked</Badge>}
              {initialAssociations.contactId && <Badge variant="secondary">Contacto CRM Linked</Badge>}
              {initialAssociations.companyId && <Badge variant="secondary">Empresa CRM Linked</Badge>}
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Este ticket se vinculará automáticamente a los registros seleccionados.
            </p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Información del Ticket</CardTitle>
          <CardDescription>Datos principales del ticket</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="subject">Asunto *</Label>
            <Input
              id="subject"
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Descripción *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={6}
              required
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="status">Estado *</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value as TicketStatus })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="new">Nuevo</SelectItem>
                  <SelectItem value="open">Abierto</SelectItem>
                  <SelectItem value="in_progress">En Progreso</SelectItem>
                  <SelectItem value="waiting">Esperando</SelectItem>
                  <SelectItem value="resolved">Resuelto</SelectItem>
                  <SelectItem value="closed">Cerrado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="priority">Prioridad *</Label>
              <Select
                value={formData.priority}
                onValueChange={(value) => setFormData({ ...formData, priority: value as TicketPriority })}
              >
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
              <Label htmlFor="category">Categoría *</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value as TicketCategory })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="technical">Soporte Técnico</SelectItem>
                  <SelectItem value="billing">Facturación</SelectItem>
                  <SelectItem value="sales">Ventas/Comercial</SelectItem>
                  <SelectItem value="general">General</SelectItem>
                  <SelectItem value="feature_request">Solicitud de Feature</SelectItem>
                  <SelectItem value="bug_report">Reporte de Bug</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="due_date">Fecha Límite</Label>
            <Input
              id="due_date"
              type="datetime-local"
              value={formData.due_date}
              onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
            />
          </div>

          {hasAssociation && (
            <div className="flex items-center space-x-2 pt-2 border-t mt-4">
              <Checkbox 
                id="sendEmail" 
                checked={sendEmail} 
                onCheckedChange={(checked) => setSendEmail(checked as boolean)}
              />
              <Label htmlFor="sendEmail" className="font-normal cursor-pointer">
                Enviar notificación por correo al contacto/organización asociado
              </Label>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={loading}
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          className="bg-[var(--tp-buttons)] hover:bg-[var(--tp-buttons-hover)]"
          disabled={loading}
        >
          {loading ? 'Creando...' : 'Crear Ticket'}
        </Button>
      </div>
    </form>
  );
}



