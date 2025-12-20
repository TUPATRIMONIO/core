import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Plus, FileText, Clock, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { getUserActiveOrganization } from '@/lib/organization/utils';

export default async function DocumentsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Obtener organización activa
  const { organization: org } = await getUserActiveOrganization(supabase);
  if (!org) {
    redirect('/onboarding');
  }

  // Obtener documentos de la organización
  const { data: documents } = await supabase
    .from('documents_documents')
    .select('*')
    .eq('organization_id', org.id)
    .order('updated_at', { ascending: false });

  return (
    <div className="container py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Documentos</h1>
          <p className="text-muted-foreground">
            Crea y edita documentos colaborativos
          </p>
        </div>
        <Link href="/dashboard/documents/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Documento
          </Button>
        </Link>
      </div>

      {/* Lista de documentos */}
      {(!documents || documents.length === 0) ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No hay documentos</h3>
            <p className="text-muted-foreground mb-4">
              Crea tu primer documento para comenzar
            </p>
            <Link href="/dashboard/documents/new">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Crear Documento
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {documents.map((doc) => (
            <Link key={doc.id} href={`/dashboard/documents/${doc.id}`}>
              <Card className="hover:border-primary/50 transition-colors cursor-pointer h-full">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg truncate">
                        {doc.title || 'Sin título'}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-1 mt-1">
                        <Clock className="h-3 w-3" />
                        {formatDistanceToNow(new Date(doc.updated_at), {
                          addSuffix: true,
                          locale: es,
                        })}
                      </CardDescription>
                    </div>
                    <StatusBadge status={doc.status} />
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {doc.word_count ? `${doc.word_count} palabras` : 'Documento vacío'}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const statusConfig: Record<string, { label: string; className: string }> = {
    draft: { label: 'Borrador', className: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300' },
    in_review: { label: 'En revisión', className: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' },
    approved: { label: 'Aprobado', className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
    published: { label: 'Publicado', className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
    archived: { label: 'Archivado', className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
  };

  const config = statusConfig[status] || statusConfig.draft;

  return (
    <span className={`text-xs px-2 py-1 rounded-full ${config.className}`}>
      {config.label}
    </span>
  );
}
