'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TicketStatus, TicketPriority, TicketCategory } from '@/types/crm';
import { Link2, X, Plus, Mail } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { resolveTicketRecipients, TicketRecipient } from '@/app/actions/crm/ticket-recipients';

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
  onSuccess?: () => void;
  onCancel?: () => void;
  isInDialog?: boolean;
}

export function CreateTicketForm({ 
  initialAssociations, 
  redirectUrl = '/admin/communications/tickets',
  onSuccess,
  onCancel,
  isInDialog = false
}: CreateTicketFormProps) {
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

  const [recipients, setRecipients] = useState<TicketRecipient[]>([]);
  const [suggestedRecipients, setSuggestedRecipients] = useState<TicketRecipient[]>([]);
  const [newEmail, setNewEmail] = useState('');

  const hasAssociation = initialAssociations && (
    initialAssociations.orderId || 
    initialAssociations.userId || 
    initialAssociations.organizationId || 
    initialAssociations.contactId || 
    initialAssociations.companyId
  );

  useEffect(() => {
    if (initialAssociations) {
      resolveTicketRecipients(initialAssociations).then(({ primary, secondary }) => {
        setRecipients(primary);
        setSuggestedRecipients(secondary);
      });
    }
  }, [initialAssociations]);

  const handleAddRecipient = (recipient: TicketRecipient) => {
    if (!recipients.some(r => r.email === recipient.email)) {
      setRecipients([...recipients, recipient]);
    }
    setSuggestedRecipients(prev => prev.filter(r => r.email !== recipient.email));
  };

  const handleAddNewEmail = () => {
    if (newEmail && newEmail.includes('@') && !recipients.some(r => r.email === newEmail)) {
      setRecipients([...recipients, { email: newEmail, type: 'other' }]);
      setNewEmail('');
    }
  };

  const handleRemoveRecipient = (email: string) => {
    const removed = recipients.find(r => r.email === email);
    setRecipients(prev => prev.filter(r => r.email !== email));
    
    // Si era uno de los sugeridos (tiene ID y tipo conocido), lo devolvemos a sugeridos
    if (removed && removed.type !== 'other') {
      setSuggestedRecipients(prev => [...prev, removed]);
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
          associations: initialAssociations,
          sendEmailNotification: sendEmail && hasAssociation,
          recipients: sendEmail ? recipients : [], // Enviamos la lista de destinatarios
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al crear ticket');
      }

      if (onSuccess) {
        onSuccess();
      } else {
        router.push(redirectUrl);
      }
      router.refresh();
    } catch (error: any) {
      alert(error.message || 'Error al crear ticket');
      setLoading(false);
    }
  };

  const Container = isInDialog ? 'div' : Card;
  const Content = isInDialog ? 'div' : CardContent;
  const Header = isInDialog ? 'div' : CardHeader;
  // If in dialog, we might skip the header if the dialog already has one
  const showHeader = !isInDialog;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Container className={isInDialog ? "space-y-4 border-0 shadow-none p-0" : ""}>
        {showHeader && (
            <Header>
            <CardTitle>Información del Ticket</CardTitle>
            <CardDescription>Datos principales del ticket</CardDescription>
            </Header>
        )}
        <Content className={isInDialog ? "space-y-4 p-0" : "space-y-4"}>
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
            <div className="space-y-4 pt-4 border-t mt-4">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="sendEmail" 
                  checked={sendEmail} 
                  onCheckedChange={(checked) => setSendEmail(checked as boolean)}
                />
                <Label htmlFor="sendEmail" className="font-normal cursor-pointer">
                  Enviar notificación por correo
                </Label>
              </div>

              {sendEmail && (
                <div className="bg-muted/30 p-4 rounded-md space-y-3">
                    <Label className="text-xs font-semibold uppercase text-muted-foreground">Destinatarios</Label>
                    
                    <div className="flex flex-wrap gap-2 mb-2">
                        {recipients.map((recipient) => (
                            <Badge key={recipient.email} variant="outline" className="pl-2 pr-1 py-1 h-7 bg-background flex items-center gap-1 border-primary/20">
                                <span className="text-xs truncate max-w-[200px]" title={recipient.email}>
                                    {recipient.name ? `${recipient.name} <${recipient.email}>` : recipient.email}
                                </span>
                                <button
                                    type="button"
                                    onClick={() => handleRemoveRecipient(recipient.email)}
                                    className="ml-1 hover:bg-muted rounded-full p-0.5"
                                >
                                    <X className="h-3 w-3 text-muted-foreground" />
                                </button>
                            </Badge>
                        ))}
                    </div>

                    <div className="flex gap-2">
                        <div className="relative flex-1">
                            <Mail className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input 
                                placeholder="Agregar correo adicional..." 
                                className="pl-9 h-9 text-sm"
                                value={newEmail}
                                onChange={(e) => setNewEmail(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        handleAddNewEmail();
                                    }
                                }}
                            />
                        </div>
                        <Button type="button" size="sm" variant="secondary" onClick={handleAddNewEmail}>
                            Agregar
                        </Button>
                    </div>

                    {suggestedRecipients.length > 0 && (
                        <div className="pt-2">
                            <Label className="text-xs text-muted-foreground mb-2 block">Sugeridos:</Label>
                            <div className="flex flex-wrap gap-2">
                                {suggestedRecipients.map((recipient) => (
                                    <Button
                                        key={recipient.email}
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        className="h-7 text-xs border border-dashed"
                                        onClick={() => handleAddRecipient(recipient)}
                                    >
                                        <Plus className="h-3 w-3 mr-1" />
                                        {recipient.name || recipient.email}
                                    </Button>
                                ))}
                            </div>
                        </div>
                    )}
                    
                    <p className="text-xs text-muted-foreground mt-2">
                        El ticket se asociará automáticamente a todos los usuarios y organizaciones destinatarios.
                    </p>
                </div>
              )}
            </div>
          )}
        </Content>
      </Container>

      <div className="flex justify-end gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => onCancel ? onCancel() : router.back()}
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
