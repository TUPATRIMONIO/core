'use client';

/**
 * TicketContactsManager  
 * Gestiona los contactos asociados a un ticket
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { User, Plus, Mail, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface TicketContact {
  contact_id: string;
  full_name: string;
  email: string;
  phone?: string;
  company_name?: string;
  contact_role: 'reporter' | 'affected' | 'cc' | 'watcher';
  added_at: string;
}

interface Contact {
  id: string;
  full_name: string;
  email: string;
  company_name?: string;
}

interface TicketContactsManagerProps {
  ticketId: string;
  onEmailToContact?: (contactEmail: string, contactName: string) => void;
  className?: string;
}

export function TicketContactsManager({ 
  ticketId, 
  onEmailToContact,
  className = '' 
}: TicketContactsManagerProps) {
  const [contacts, setContacts] = useState<TicketContact[]>([]);
  const [allContacts, setAllContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [selectedContact, setSelectedContact] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('affected');
  const { toast } = useToast();

  useEffect(() => {
    fetchTicketContacts();
    fetchAllContacts();
  }, [ticketId]);

  const fetchTicketContacts = async () => {
    try {
      const response = await fetch(`/api/crm/tickets/${ticketId}/contacts`);
      if (!response.ok) throw new Error('Error fetching contacts');
      
      const data = await response.json();
      setContacts(data);
    } catch (error) {
      console.error('Error fetching ticket contacts:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllContacts = async () => {
    try {
      const response = await fetch('/api/crm/contacts?limit=100');
      if (!response.ok) throw new Error('Error fetching contacts');
      
      const result = await response.json();
      setAllContacts(result.data || []);
    } catch (error) {
      console.error('Error fetching all contacts:', error);
    }
  };

  const handleAddContact = async () => {
    if (!selectedContact) return;

    setAdding(true);
    try {
      const response = await fetch(`/api/crm/tickets/${ticketId}/contacts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contact_id: selectedContact,
          contact_role: selectedRole
        })
      });

      if (!response.ok) throw new Error('Error adding contact');

      toast({
        title: 'Contacto agregado',
        description: 'El contacto fue agregado al ticket exitosamente'
      });

      setSelectedContact('');
      setSelectedRole('affected');
      await fetchTicketContacts();
    } catch (error) {
      console.error('Error adding contact:', error);
      toast({
        title: 'Error',
        description: 'No se pudo agregar el contacto',
        variant: 'destructive'
      });
    } finally {
      setAdding(false);
    }
  };

  const getRoleLabel = (role: string) => {
    const labels = {
      reporter: 'Reportó',
      affected: 'Afectado',
      cc: 'En Copia',
      watcher: 'Observador'
    };
    return labels[role as keyof typeof labels] || role;
  };

  const getRoleColor = (role: string) => {
    const colors = {
      reporter: 'bg-red-100 text-red-800',
      affected: 'bg-yellow-100 text-yellow-800',
      cc: 'bg-blue-100 text-blue-800',
      watcher: 'bg-gray-100 text-gray-800'
    };
    return colors[role as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  // Filtrar contactos que no están ya en el ticket
  const availableContacts = allContacts.filter(
    contact => !contacts.some(tc => tc.contact_id === contact.id)
  );

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-4 h-4" />
            Contactos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-4">Cargando...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="w-4 h-4" />
          Contactos
          {contacts.length > 0 && (
            <Badge variant="secondary">{contacts.length}</Badge>
          )}
        </CardTitle>
        <CardDescription>
          Personas relacionadas con este ticket
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Lista de contactos actuales */}
        {contacts.length > 0 && (
          <div className="space-y-2">
            {contacts.map((contact) => (
              <div
                key={contact.contact_id}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-sm">{contact.full_name}</p>
                    <Badge 
                      variant="secondary" 
                      className={`text-xs ${getRoleColor(contact.contact_role)}`}
                    >
                      {getRoleLabel(contact.contact_role)}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{contact.email}</p>
                  {contact.company_name && (
                    <p className="text-xs text-muted-foreground">{contact.company_name}</p>
                  )}
                </div>
                
                <div className="flex items-center gap-1">
                  {onEmailToContact && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onEmailToContact(contact.email, contact.full_name)}
                    >
                      <Mail className="w-3 h-3" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Agregar nuevo contacto */}
        {availableContacts.length > 0 && (
          <div className="border-t pt-4 space-y-3">
            <h4 className="text-sm font-medium">Agregar Contacto</h4>
            
            <div className="grid grid-cols-2 gap-2">
              <Select value={selectedContact} onValueChange={setSelectedContact}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar contacto" />
                </SelectTrigger>
                <SelectContent>
                  {availableContacts.map((contact) => (
                    <SelectItem key={contact.id} value={contact.id}>
                      <div>
                        <p className="font-medium">{contact.full_name}</p>
                        <p className="text-xs text-muted-foreground">{contact.email}</p>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="affected">Afectado</SelectItem>
                  <SelectItem value="cc">En Copia</SelectItem>
                  <SelectItem value="watcher">Observador</SelectItem>
                  <SelectItem value="reporter">Reportó</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={handleAddContact}
              disabled={!selectedContact || adding}
              size="sm"
              className="w-full"
            >
              <Plus className="w-3 h-3 mr-1" />
              {adding ? 'Agregando...' : 'Agregar Contacto'}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

