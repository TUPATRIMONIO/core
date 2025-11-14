/**
 * Página: Inbox del CRM
 * Lista de conversaciones (threads) de todas las cuentas de email
 */

'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Mail, 
  Search, 
  RefreshCw, 
  Circle,
  CheckCircle,
  Archive,
  Trash2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import type { EmailThread } from '@/types/crm';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface EmailAccountOption {
  id: string;
  email_address: string;
  display_name: string;
  account_type: string;
}

export default function InboxPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [threads, setThreads] = useState<EmailThread[]>([]);
  const [accounts, setAccounts] = useState<EmailAccountOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [selectedAccount, setSelectedAccount] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [totalCount, setTotalCount] = useState(0);
  const [offset, setOffset] = useState(0);
  const ITEMS_PER_PAGE = 20;

  useEffect(() => {
    loadAccounts();
  }, []);

  useEffect(() => {
    // Resetear offset cuando cambian los filtros
    setOffset(0);
    loadThreads(true);
  }, [filter, selectedAccount]);

  async function loadAccounts() {
    try {
      const response = await fetch('/api/crm/email-accounts');
      if (!response.ok) return;

      const { data } = await response.json();
      setAccounts(data || []);
    } catch (error) {
      console.error('Error loading accounts:', error);
    }
  }

  async function loadThreads(reset = false) {
    try {
      const loadingOffset = reset ? 0 : offset;
      
      if (reset) {
        setIsLoading(true);
      } else {
        setIsLoadingMore(true);
      }

      const unreadParam = filter === 'unread' ? '&unread_only=true' : '';
      const accountParam = selectedAccount !== 'all' ? `&account_id=${selectedAccount}` : '';
      
      const response = await fetch(
        `/api/crm/inbox?limit=${ITEMS_PER_PAGE}&offset=${loadingOffset}${unreadParam}${accountParam}`
      );
      
      if (!response.ok) {
        throw new Error('Failed to load inbox');
      }

      const { data, count } = await response.json();
      
      if (reset) {
        setThreads(data || []);
        setOffset(ITEMS_PER_PAGE);
      } else {
        setThreads(prev => [...prev, ...(data || [])]);
        setOffset(prev => prev + ITEMS_PER_PAGE);
      }
      
      setTotalCount(count || 0);
    } catch (error) {
      console.error('Error loading inbox:', error);
      toast({
        title: 'Error',
        description: 'No se pudo cargar el inbox',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }

  async function loadMoreThreads() {
    await loadThreads(false);
  }

  async function syncAllAccounts() {
    try {
      setIsSyncing(true);
      const response = await fetch('/api/crm/emails/sync', {
        method: 'POST'
      });

      if (!response.ok) {
        throw new Error('Sync failed');
      }

      const result = await response.json();

      toast({
        title: 'Sincronización completada',
        description: `${result.summary.new_emails} emails nuevos, ${result.summary.updated_threads} threads actualizados`,
      });

      setOffset(0);
      loadThreads(true);
    } catch (error) {
      console.error('Error syncing:', error);
      toast({
        title: 'Error',
        description: 'No se pudo sincronizar las cuentas',
        variant: 'destructive',
      });
    } finally {
      setIsSyncing(false);
    }
  }

  const filteredThreads = threads.filter(thread => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return (
      thread.subject?.toLowerCase().includes(searchLower) ||
      thread.participants?.some(p => p.toLowerCase().includes(searchLower)) ||
      thread.contact?.full_name?.toLowerCase().includes(searchLower)
    );
  });

  const unreadCount = threads.filter(t => !t.is_read).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Inbox
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Mostrando {filteredThreads.length} de {totalCount} conversaciones
            {unreadCount > 0 && ` (${unreadCount} no leídas)`}
          </p>
        </div>

        <Button
          onClick={syncAllAccounts}
          disabled={isSyncing}
          variant="outline"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
          {isSyncing ? 'Sincronizando...' : 'Sincronizar'}
        </Button>
      </div>

      {/* Filtros */}
      <div className="flex gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            type="text"
            placeholder="Buscar en conversaciones..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Filtro por cuenta */}
        <Select value={selectedAccount} onValueChange={setSelectedAccount}>
          <SelectTrigger className="w-64">
            <Mail className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Todas las cuentas" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Todas las cuentas
              </div>
            </SelectItem>
            {accounts.map(account => (
              <SelectItem key={account.id} value={account.id}>
                <div className="flex flex-col">
                  <span className="font-medium">{account.display_name}</span>
                  <span className="text-xs text-gray-500">{account.email_address}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Filtro de estado */}
        <Select value={filter} onValueChange={(v) => setFilter(v as any)}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            <SelectItem value="unread">No leídas ({unreadCount})</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Lista de Threads */}
      {isLoading ? (
        <p className="text-gray-500 py-8 text-center">Cargando conversaciones...</p>
      ) : filteredThreads.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Mail className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
              {search ? 'No se encontraron conversaciones' : 'Inbox vacío'}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {search 
                ? 'Intenta con otros términos de búsqueda'
                : 'Sincroniza tus cuentas o envía tu primer email'
              }
            </p>
            {!search && (
              <Button onClick={syncAllAccounts} disabled={isSyncing}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Sincronizar Ahora
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filteredThreads.map(thread => (
            <Card
              key={thread.id}
              className={`cursor-pointer transition-all hover:shadow-md ${
                !thread.is_read ? 'bg-blue-50/50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800' : ''
              }`}
              onClick={() => router.push(`/dashboard/crm/inbox/${thread.id}`)}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  {/* Indicador de no leído */}
                  <div className="pt-1">
                    {!thread.is_read ? (
                      <Circle className="w-3 h-3 fill-blue-600 text-blue-600" />
                    ) : (
                      <CheckCircle className="w-3 h-3 text-gray-400" />
                    )}
                  </div>

                  {/* Contenido */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <div className="flex-1 min-w-0">
                        <h3 className={`font-semibold mb-1 truncate ${
                          !thread.is_read ? 'text-gray-900 dark:text-gray-100' : 'text-gray-700 dark:text-gray-300'
                        }`}>
                          {thread.subject || '(Sin asunto)'}
                        </h3>
                        
                        {thread.contact && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                            {thread.contact.full_name} ({thread.contact.email})
                          </p>
                        )}

                        <p className="text-sm text-gray-500 line-clamp-2">
                          {thread.snippet}
                        </p>
                      </div>

                      <div className="text-right shrink-0">
                        <p className="text-xs text-gray-500 mb-1">
                          {thread.last_email_at 
                            ? new Date(thread.last_email_at).toLocaleDateString('es-CL', {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })
                            : 'N/A'
                          }
                        </p>
                        <p className="text-xs text-gray-500">
                          {thread.email_count} {thread.email_count === 1 ? 'mensaje' : 'mensajes'}
                        </p>
                      </div>
                    </div>

                    {/* Metadata */}
                    <div className="flex items-center gap-2 text-xs">
                      {thread.has_attachments && (
                        <span className="px-2 py-0.5 bg-gray-200 dark:bg-gray-700 rounded">
                          📎 Adjuntos
                        </span>
                      )}
                      
                      {thread.participants && thread.participants.length > 2 && (
                        <span className="px-2 py-0.5 bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 rounded">
                          {thread.participants.length} participantes
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {/* Botón Cargar Más */}
          {!search && threads.length < totalCount && (
            <Card className="bg-gray-50 dark:bg-gray-900 border-dashed">
              <CardContent className="py-8 text-center">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Mostrando {threads.length} de {totalCount} conversaciones
                  <br />
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    {totalCount - threads.length} conversaciones más disponibles
                  </span>
                </p>
                <Button
                  onClick={loadMoreThreads}
                  disabled={isLoadingMore}
                  variant="outline"
                  className="min-w-[200px]"
                >
                  {isLoadingMore ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Cargando...
                    </>
                  ) : (
                    <>
                      Cargar {Math.min(ITEMS_PER_PAGE, totalCount - threads.length)} más
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}

