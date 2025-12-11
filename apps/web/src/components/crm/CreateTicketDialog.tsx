'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TicketStatus, TicketPriority, TicketCategory } from '@/types/crm';
import { Ticket, Package, Building2, User } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export type AssociationType = 'order' | 'organization' | 'user';

interface AssociationInfo {
  type: AssociationType;
  id: string;
  label: string;
  sublabel?: string;
}

interface CreateTicketDialogProps {
  association: AssociationInfo;
  trigger?: React.ReactNode;
}

export function CreateTicketDialog({ association, trigger }: CreateTicketDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
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

  const getAssociationIcon = () => {
    switch (association.type) {
      case 'order':
        return <Package className="h-5 w-5 text-blue-500" />;
      case 'organization':
        return <Building2 className="h-5 w-5 text-purple-500" />;
      case 'user':
        return <User className="h-5 w-5 text-green-500" />;
    }
  };

  const getAssociationLabel = () => {
    switch (association.type) {
      case 'order':
        return 'Pedido';
      case 'organization':
        return 'Organización';
      case 'user':
        return 'Usuario';
    }
  };

  const getAssociationParam = () => {
    switch (association.type) {
      case 'order':
        return { orderId: association.id };
      case 'organization':
        return { organizationId: association.id };
      case 'user':
        return { userId: association.id };
    }
  };

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
          associations: getAssociationParam(),
          sendEmailNotification: sendEmail,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al crear ticket');
      }

      setOpen(false);
      // Reset form
      setFormData({
        subject: '',
        description: '',
        status: 'new',
        priority: 'medium',
        category: 'general',
        due_date: '',
      });
      router.refresh();
    } catch (error: any) {
      alert(error.message || 'Error al crear ticket');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <Ticket className="h-4 w-4 mr-2" />
            Crear Ticket
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Ticket className="h-5 w-5" />
            Crear Ticket
          </DialogTitle>
          <DialogDescription>
            <div className="flex items-center gap-2 mt-2 p-3 rounded-lg bg-muted/50 border border-dashed">
              {getAssociationIcon()}
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">
                    {getAssociationLabel()}
                  </Badge>
                  <span className="font-medium text-foreground">{association.label}</span>
                </div>
                {association.sublabel && (
                  <p className="text-xs text-muted-foreground mt-0.5">{association.sublabel}</p>
                )}
              </div>
            </div>
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="subject">Asunto *</Label>
            <Input
              id="subject"
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              placeholder="Describe brevemente el problema"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descripción *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Detalla el problema o solicitud..."
              rows={4}
              required
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label htmlFor="status">Estado</Label>
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
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">Prioridad</Label>
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
              <Label htmlFor="category">Categoría</Label>
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
                  <SelectItem value="sales">Ventas</SelectItem>
                  <SelectItem value="general">General</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center space-x-2 pt-2 border-t">
            <Checkbox 
              id="sendEmail" 
              checked={sendEmail} 
              onCheckedChange={(checked) => setSendEmail(checked as boolean)}
            />
            <Label htmlFor="sendEmail" className="font-normal cursor-pointer text-sm">
              Enviar notificación por correo
            </Label>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
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
      </DialogContent>
    </Dialog>
  );
}
