/**
 * Lista de Contactos CRM
 * Tabla con filtros y búsqueda
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { StatusBadge } from '@/components/crm/StatusBadge';
import { EmptyState } from '@/components/crm/EmptyState';
import { 
  Users, 
  Plus, 
  Search,
  Building2,
  Mail,
  Phone
} from 'lucide-react';
import type { Contact, ContactStatus } from '@/types/crm';
import { formatRelativeTime } from '@/lib/crm/formatters';

export default function ContactsPage() {
  const router = useRouter();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [total, setTotal] = useState(0);

  useEffect(() => {
    loadContacts();
  }, [statusFilter, search]);

  async function loadContacts() {
    try {
      setIsLoading(true);
      
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (search) params.append('search', search);
      params.append('limit', '50');

      const response = await fetch(`/api/crm/contacts?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch contacts');
      }

      const result = await response.json();
      setContacts(result.data || []);
      setTotal(result.count || 0);
    } catch (error) {
      console.error('Error loading contacts:', error);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Contactos
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {total} {total === 1 ? 'contacto' : 'contactos'} en total
          </p>
        </div>
        <Button 
          onClick={() => router.push('/dashboard/crm/contacts/new')}
          className="bg-[var(--tp-brand)] hover:bg-[var(--tp-brand-light)]"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Contacto
        </Button>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Búsqueda */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Buscar por nombre, email o empresa..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Filtro por status */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Todos los estados" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="lead">Lead</SelectItem>
                <SelectItem value="qualified">Calificado</SelectItem>
                <SelectItem value="customer">Cliente</SelectItem>
                <SelectItem value="inactive">Inactivo</SelectItem>
                <SelectItem value="lost">Perdido</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tabla de Contactos */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-12 text-center text-gray-500">
              Cargando contactos...
            </div>
          ) : contacts.length === 0 ? (
            <EmptyState
              icon={Users}
              title="No hay contactos"
              description="Comienza agregando tu primer contacto al CRM"
              actionLabel="Crear Contacto"
              onAction={() => router.push('/dashboard/crm/contacts/new')}
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Empresa</TableHead>
                  <TableHead>Contacto</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Última Actividad</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contacts.map((contact) => (
                  <TableRow 
                    key={contact.id}
                    className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                    onClick={() => router.push(`/dashboard/crm/contacts/${contact.id}`)}
                  >
                    <TableCell>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-gray-100">
                          {contact.full_name || 'Sin nombre'}
                        </p>
                        {contact.job_title && (
                          <p className="text-sm text-gray-500">
                            {contact.job_title}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {contact.company ? (
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-700 dark:text-gray-300">
                            {contact.company.name}
                          </span>
                        </div>
                      ) : contact.company_name ? (
                        <span className="text-gray-500">{contact.company_name}</span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {contact.email && (
                          <div className="flex items-center gap-2 text-sm">
                            <Mail className="w-3 h-3 text-gray-400" />
                            <span className="text-gray-600 dark:text-gray-400">
                              {contact.email}
                            </span>
                          </div>
                        )}
                        {contact.phone && (
                          <div className="flex items-center gap-2 text-sm">
                            <Phone className="w-3 h-3 text-gray-400" />
                            <span className="text-gray-600 dark:text-gray-400">
                              {contact.phone}
                            </span>
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <StatusBadge 
                        type="contact" 
                        value={contact.status as ContactStatus} 
                      />
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {contact.last_activity_at 
                        ? formatRelativeTime(contact.last_activity_at)
                        : 'Sin actividad'
                      }
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/dashboard/crm/contacts/${contact.id}`);
                        }}
                      >
                        Ver
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}



