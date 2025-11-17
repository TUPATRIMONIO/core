/**
 * Página: Vista de Carpeta Específica
 * Muestra threads de una carpeta (Archived, Sent, Spam, Custom)
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
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
  ArrowLeft
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { EmailThread } from '@/types/crm';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface PageProps {
  params: Promise<{ folderName: string }>;
}

export default function FolderViewPage({ params }: PageProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [folderName, setFolderName] = useState('');
  const [threads, setThreads] = useState<EmailThread[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    params.then(p => {
      const name = p.folderName.charAt(0).toUpperCase() + p.folderName.slice(1);
      setFolderName(name);
      loadThreads(name);
    });
  }, [params]);

  async function loadThreads(folder: string) {
    try {
      setIsLoading(true);
      
      // Usar función RPC para obtener threads de la carpeta
      const response = await fetch(`/api/crm/inbox?folder=${folder}&limit=50`);
      
      if (!response.ok) {
        throw new Error('Failed to load folder');
      }

      const { data } = await response.json();
      setThreads(data || []);
    } catch (error) {
      console.error('Error loading folder:', error);
      toast({
        title: 'Error',
        description: 'No se pudo cargar la carpeta',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }

  const filteredThreads = threads.filter(thread => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return (
      thread.subject?.toLowerCase().includes(searchLower) ||
      thread.participants?.some(p => p.toLowerCase().includes(searchLower))
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => router.push('/dashboard/crm/inbox')}
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              {folderName}
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              {threads.length} conversaciones
            </p>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            type="text"
            placeholder="Buscar en esta carpeta..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Lista de Threads */}
      {isLoading ? (
        <p className="text-gray-500 py-8 text-center">Cargando conversaciones...</p>
      ) : filteredThreads.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Archive className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
              {search ? 'No se encontraron conversaciones' : 'Carpeta vacía'}
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {search 
                ? 'Intenta con otros términos de búsqueda'
                : `No hay conversaciones en ${folderName}`
              }
            </p>
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
                  <div className="pt-1">
                    {!thread.is_read ? (
                      <Circle className="w-3 h-3 fill-blue-600 text-blue-600" />
                    ) : (
                      <CheckCircle className="w-3 h-3 text-gray-400" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <div className="flex-1 min-w-0">
                        <h3 className={`font-semibold mb-1 truncate ${
                          !thread.is_read ? 'text-gray-900 dark:text-gray-100' : 'text-gray-700 dark:text-gray-300'
                        }`}>
                          {thread.subject || '(Sin asunto)'}
                        </h3>
                        
                        <p className="text-sm text-gray-500 line-clamp-2">
                          {thread.snippet}
                        </p>
                      </div>

                      <div className="text-right shrink-0">
                        <p className="text-xs text-gray-500">
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
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

