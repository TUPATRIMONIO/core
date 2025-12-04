'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertCircle, Plus, Trash2, Users } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function ListDetailPage() {
  const params = useParams();
  const router = useRouter();
  const listId = params.id as string;

  const [list, setList] = useState<any>(null);
  const [contacts, setContacts] = useState<any[]>([]);
  const [availableContacts, setAvailableContacts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedContactId, setSelectedContactId] = useState('');

  useEffect(() => {
    loadList();
    loadAvailableContacts();
  }, [listId]);

  const loadList = async () => {
    try {
      const response = await fetch(`/api/communications/lists/${listId}`);
      const data = await response.json();

      if (data.error) {
        setError(data.error);
      } else {
        setList(data.data);
        setContacts(data.data.members || []);
      }
    } catch (err: any) {
      setError('Error al cargar lista');
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableContacts = async () => {
    try {
      // Usar API de communications/contacts que funciona con Email Marketing habilitado
      const response = await fetch('/api/communications/contacts');
      const data = await response.json();
      setAvailableContacts(data.data || []);
    } catch (err: any) {
      // Ignorar error, no crítico
    }
  };

  const handleAddContact = async () => {
    if (!selectedContactId) {
      setError('Selecciona un contacto');
      return;
    }

    setAdding(true);
    setError(null);

    try {
      const response = await fetch(`/api/communications/lists/${listId}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contact_ids: [selectedContactId] }),
      });

      const data = await response.json();

      if (data.error) {
        setError(data.error);
      } else {
        await loadList();
        setSelectedContactId('');
      }
    } catch (err: any) {
      setError('Error al agregar contacto');
    } finally {
      setAdding(false);
    }
  };

  const handleRemoveContact = async (memberId: string) => {
    if (!confirm('¿Estás seguro de que quieres remover este contacto de la lista?')) {
      return;
    }

    try {
      const response = await fetch(`/api/communications/lists/${listId}/members?member_id=${memberId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.error) {
        setError(data.error);
      } else {
        await loadList();
      }
    } catch (err: any) {
      setError('Error al remover contacto');
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (error && !list) {
    return (
      <div className="container mx-auto py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!list) {
    return (
      <div className="container mx-auto py-8">
        <p>Lista no encontrada</p>
      </div>
    );
  }

  // Filtrar contactos que ya están en la lista
  const contactsNotInList = availableContacts.filter(
    (contact) => !contacts.some((m: any) => m.contact?.id === contact.id)
  );

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{list.name}</h1>
          <p className="text-muted-foreground mt-2">{list.description || 'Sin descripción'}</p>
        </div>
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-muted-foreground" />
          <span className="text-lg font-semibold">{list.contact_count || 0} contactos</span>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Agregar Contacto</CardTitle>
          <CardDescription>Agrega contactos de tu CRM a esta lista</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Select value={selectedContactId} onValueChange={setSelectedContactId}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Selecciona un contacto" />
              </SelectTrigger>
              <SelectContent>
                {contactsNotInList.map((contact) => (
                  <SelectItem key={contact.id} value={contact.id}>
                    {contact.full_name || contact.email} ({contact.email})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              onClick={handleAddContact}
              disabled={adding || !selectedContactId}
              className="bg-[var(--tp-buttons)] hover:bg-[var(--tp-buttons-hover)]"
            >
              {adding ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Agregando...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Agregar
                </>
              )}
            </Button>
          </div>
          {contactsNotInList.length === 0 && (
            <p className="text-sm text-muted-foreground mt-2">
              Todos tus contactos ya están en esta lista
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Contactos en la Lista</CardTitle>
          <CardDescription>{list.contact_count || 0} contactos</CardDescription>
        </CardHeader>
        <CardContent>
          {contacts && contacts.length > 0 ? (
            <div className="space-y-2">
              {contacts.map((member: any) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between border-b pb-2 last:border-0"
                >
                  <div>
                    <p className="font-medium">
                      {member.contact?.full_name || member.contact?.email || 'N/A'}
                    </p>
                    <p className="text-sm text-muted-foreground">{member.contact?.email}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveContact(member.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No hay contactos en esta lista</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}





