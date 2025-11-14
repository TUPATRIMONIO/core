/**
 * EmailComposer Component
 * Compositor de emails para enviar desde el CRM
 */

'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Send, X, Mail } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface EmailComposerProps {
  defaultTo?: string;
  defaultSubject?: string;
  contactId?: string;
  onSent?: () => void;
  onCancel?: () => void;
}

export function EmailComposer({
  defaultTo = '',
  defaultSubject = '',
  contactId,
  onSent,
  onCancel
}: EmailComposerProps) {
  const { toast } = useToast();
  const [isSending, setIsSending] = useState(false);
  const [formData, setFormData] = useState({
    to: defaultTo,
    cc: '',
    subject: defaultSubject,
    body: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSending(true);

    try {
      const response = await fetch('/api/crm/emails/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: formData.to,
          cc: formData.cc ? formData.cc.split(',').map(e => e.trim()) : undefined,
          subject: formData.subject,
          body: formData.body.replace(/\n/g, '<br>'), // Convertir saltos de línea a HTML
          contact_id: contactId
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to send email');
      }

      toast({
        title: 'Email enviado',
        description: `Tu email ha sido enviado exitosamente a ${formData.to}`,
      });

      // Reset form
      setFormData({
        to: '',
        cc: '',
        subject: '',
        body: ''
      });

      if (onSent) onSent();
    } catch (error) {
      console.error('Error sending email:', error);
      toast({
        title: 'Error al enviar email',
        description: error instanceof Error ? error.message : 'Intenta nuevamente o verifica la configuración de Gmail',
        variant: 'destructive',
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center">
            <Mail className="w-5 h-5 mr-2" />
            Enviar Email
          </CardTitle>
          {onCancel && (
            <Button variant="ghost" size="icon" onClick={onCancel}>
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="to">Para *</Label>
            <Input
              id="to"
              type="email"
              value={formData.to}
              onChange={(e) => handleChange('to', e.target.value)}
              placeholder="destinatario@ejemplo.com"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cc">CC (opcional)</Label>
            <Input
              id="cc"
              type="text"
              value={formData.cc}
              onChange={(e) => handleChange('cc', e.target.value)}
              placeholder="email1@ejemplo.com, email2@ejemplo.com"
            />
            <p className="text-xs text-gray-500">
              Separa múltiples emails con comas
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="subject">Asunto *</Label>
            <Input
              id="subject"
              value={formData.subject}
              onChange={(e) => handleChange('subject', e.target.value)}
              placeholder="Asunto del email"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="body">Mensaje *</Label>
            <Textarea
              id="body"
              value={formData.body}
              onChange={(e) => handleChange('body', e.target.value)}
              rows={12}
              placeholder="Escribe tu mensaje aquí..."
              required
            />
          </div>

          <div className="flex gap-3 justify-end pt-2">
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancelar
              </Button>
            )}
            <Button 
              type="submit"
              disabled={isSending}
              className="bg-[var(--tp-brand)] hover:bg-[var(--tp-brand-light)]"
            >
              <Send className="w-4 h-4 mr-2" />
              {isSending ? 'Enviando...' : 'Enviar Email'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}







