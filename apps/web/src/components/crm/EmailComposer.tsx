/**
 * EmailComposer Component
 * Compositor de emails para enviar desde el CRM con soporte multi-cuenta
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Send, X, Mail, Users, User, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { FileUpload } from './FileUpload';
import { uploadAttachment } from '@/lib/storage/attachments';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
  SelectSeparator
} from '@/components/ui/select';

interface EmailComposerProps {
  defaultTo?: string;
  defaultSubject?: string;
  contactId?: string;
  ticketId?: string;
  replyToThreadId?: string; // Thread ID del email al que se está respondiendo
  onSent?: () => void;
  onCancel?: () => void;
}

interface EmailAccountOption {
  account_id: string;
  email_address: string;
  display_name: string;
  account_type: 'shared' | 'personal';
  is_default: boolean;
  can_send: boolean;
}

export function EmailComposer({
  defaultTo = '',
  defaultSubject = '',
  contactId,
  ticketId,
  replyToThreadId,
  onSent,
  onCancel
}: EmailComposerProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isSending, setIsSending] = useState(false);
  const [accounts, setAccounts] = useState<EmailAccountOption[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<string>('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const [formData, setFormData] = useState({
    to: defaultTo,
    cc: '',
    subject: defaultSubject,
    body: ''
  });

  // Cargar cuentas disponibles
  useEffect(() => {
    loadAccounts();
  }, []);

  async function loadAccounts() {
    try {
      const response = await fetch('/api/crm/email-accounts');
      if (!response.ok) return;

      const { data } = await response.json();
      const availableAccounts = (data || []).filter((a: EmailAccountOption) => a.can_send);
      
      setAccounts(availableAccounts);
      
      // Seleccionar cuenta por defecto
      const defaultAccount = availableAccounts.find((a: EmailAccountOption) => a.is_default);
      if (defaultAccount) {
        setSelectedAccount(defaultAccount.account_id);
      } else if (availableAccounts.length > 0) {
        setSelectedAccount(availableAccounts[0].account_id);
      }
    } catch (error) {
      console.error('Error loading email accounts:', error);
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedAccount) {
      toast({
        title: 'Error',
        description: 'Debes seleccionar una cuenta de email para enviar',
        variant: 'destructive',
      });
      return;
    }
    
    setIsSending(true);

    try {
      // Convertir adjuntos a base64 (directamente, sin Supabase Storage)
      const processedAttachments = [];

      if (attachments.length > 0) {
        toast({
          title: 'Procesando adjuntos...',
          description: `Procesando ${attachments.length} archivo(s)`,
        });

        for (const file of attachments) {
          try {
            // Convertir archivo a base64
            const base64 = await fileToBase64(file);
            
            processedAttachments.push({
              filename: file.name,
              content: base64,
              contentType: file.type
            });
          } catch (error) {
            console.error('Error processing file:', error);
            throw new Error(`Error al procesar ${file.name}`);
          }
        }
      }

      // Enviar email con adjuntos
      const response = await fetch('/api/crm/emails/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from_account_id: selectedAccount,
          to: formData.to,
          cc: formData.cc ? formData.cc.split(',').map(e => e.trim()) : undefined,
          subject: formData.subject,
          body: formData.body.replace(/\n/g, '<br>'),
          contact_id: contactId,
          ticket_id: ticketId,
          reply_to_thread_id: replyToThreadId, // Thread ID del email original si es respuesta
          attachments: processedAttachments // Base64 directo
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to send email');
      }

      const selectedAccountData = accounts.find(a => a.account_id === selectedAccount);
      
      toast({
        title: 'Email enviado',
        description: `Tu email ha sido enviado desde ${selectedAccountData?.email_address || 'tu cuenta'}`,
      });

      // Reset form (mantener cuenta seleccionada)
      setFormData({
        to: '',
        cc: '',
        subject: '',
        body: ''
      });
      setAttachments([]);

      if (onSent) {
        onSent();
      } else {
        // Recargar página para mostrar el email enviado en el historial
        router.refresh();
      }
    } catch (error) {
      console.error('Error sending email:', error);
      toast({
        title: 'Error al enviar email',
        description: error instanceof Error ? error.message : 'Intenta nuevamente o verifica la configuración',
        variant: 'destructive',
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const sharedAccounts = accounts.filter(a => a.account_type === 'shared');
  const personalAccounts = accounts.filter(a => a.account_type === 'personal');

  // Helper: Convertir archivo a base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        // Remover el prefijo "data:mime/type;base64,"
        const base64 = (reader.result as string).split(',')[1];
        resolve(base64);
      };
      reader.onerror = error => reject(error);
    });
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
          {/* Selector de Cuenta */}
          {accounts.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="from-account">Enviar desde</Label>
              <Select value={selectedAccount} onValueChange={setSelectedAccount}>
                <SelectTrigger id="from-account">
                  <SelectValue placeholder="Selecciona una cuenta" />
                </SelectTrigger>
                <SelectContent>
                  {sharedAccounts.length > 0 && (
                    <SelectGroup>
                      <SelectLabel className="flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        Cuentas Compartidas
                      </SelectLabel>
                      {sharedAccounts.map(account => (
                        <SelectItem key={account.account_id} value={account.account_id}>
                          <div className="flex flex-col">
                            <span>{account.display_name}</span>
                            <span className="text-xs text-gray-500">{account.email_address}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  )}
                  
                  {sharedAccounts.length > 0 && personalAccounts.length > 0 && (
                    <SelectSeparator />
                  )}
                  
                  {personalAccounts.length > 0 && (
                    <SelectGroup>
                      <SelectLabel className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        Mi Cuenta Personal
                      </SelectLabel>
                      {personalAccounts.map(account => (
                        <SelectItem key={account.account_id} value={account.account_id}>
                          <div className="flex flex-col">
                            <span>{account.display_name}</span>
                            <span className="text-xs text-gray-500">{account.email_address}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  )}
                </SelectContent>
              </Select>
            </div>
          )}

          {accounts.length === 0 && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                No tienes cuentas de email conectadas. 
                <a href="/dashboard/crm/settings/email-accounts" className="underline ml-1">
                  Conecta una cuenta
                </a> para enviar emails.
              </AlertDescription>
            </Alert>
          )}

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

          {/* Adjuntos */}
          <div className="space-y-2">
            <Label>Adjuntos</Label>
            <FileUpload
              files={attachments}
              onFilesChange={setAttachments}
              disabled={isSending}
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
              disabled={isSending || accounts.length === 0}
              className="bg-[var(--tp-buttons)] hover:bg-[var(--tp-buttons-hover)]"
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
