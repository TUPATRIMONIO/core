import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, FileText, Eye } from 'lucide-react';
import Link from 'next/link';

export default async function TemplatesPage() {
  const supabase = await createClient();

  // Obtener organización del usuario (incluye platform org para platform admins)
  const { getUserActiveOrganization } = await import('@/lib/organization/utils');
  const orgResult = await getUserActiveOrganization(supabase);

  if (!orgResult.organization) {
    return (
      <div className="container mx-auto py-8">
        <p>No se encontró organización</p>
      </div>
    );
  }

  // Obtener templates directamente desde la BD
  const { data: templates, error } = await supabase
    .from('message_templates')
    .select('*')
    .eq('organization_id', orgResult.organization.id)
    .order('created_at', { ascending: false });

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Templates de Email</h1>
          <p className="text-muted-foreground mt-2">
            Crea y gestiona templates reutilizables para tus campañas
          </p>
        </div>
        <Button asChild className="bg-[var(--tp-buttons)] hover:bg-[var(--tp-buttons-hover)]">
          <Link href="/dashboard/communications/email/templates/new">
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Template
          </Link>
        </Button>
      </div>

      {templates && templates.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {templates.map((template: any) => (
            <Card key={template.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                    <CardTitle className="text-lg">{template.name}</CardTitle>
                  </div>
                  <Badge variant={template.is_active ? 'default' : 'secondary'}>
                    {template.is_active ? 'Activo' : 'Inactivo'}
                  </Badge>
                </div>
                {template.description && (
                  <CardDescription className="mt-2">{template.description}</CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    <strong>Asunto:</strong> {template.subject}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    <strong>Tipo:</strong> {template.type}
                  </p>
                  {template.variables && Object.keys(template.variables).length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-2">
                      {Object.keys(template.variables).slice(0, 3).map((key) => (
                        <Badge key={key} variant="outline" className="text-xs">
                          {`{{${key}}}`}
                        </Badge>
                      ))}
                      {Object.keys(template.variables).length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{Object.keys(template.variables).length - 3} más
                        </Badge>
                      )}
                    </div>
                  )}
                  <div className="flex gap-2 pt-2">
                    <Button variant="outline" size="sm" asChild className="flex-1">
                      <Link href={`/dashboard/communications/email/templates/${template.id}`}>
                        <Eye className="mr-2 h-4 w-4" />
                        Ver
                      </Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No hay templates</h3>
              <p className="text-muted-foreground mb-4">
                Comienza creando tu primer template de email
              </p>
              <Button asChild className="bg-[var(--tp-buttons)] hover:bg-[var(--tp-buttons-hover)]">
                <Link href="/dashboard/communications/email/templates/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Crear Template
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}





