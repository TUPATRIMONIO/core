import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/admin/page-header'
import { Card, CardContent } from '@/components/ui/card'
import { StatusBadge } from '@/components/admin/status-badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Key, Copy } from 'lucide-react'
import { EmptyState } from '@/components/admin/empty-state'
import { CreateApiKeyButton } from '@/components/admin/create-api-key-button'
import { RevokeApiKeyButton } from '@/components/admin/revoke-api-key-button'
import { Badge } from '@/components/ui/badge'

async function getApiKeys() {
  const supabase = await createClient()

  const { data: apiKeys, error } = await supabase
    .from('api_keys')
    .select(`
      *,
      organizations(name),
      created_by_user:users!api_keys_created_by_fkey(full_name)
    `)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching api keys:', error)
    return []
  }

  return apiKeys || []
}

export default async function ApiKeysPage() {
  const apiKeys = await getApiKeys()

  return (
    <div className="flex flex-1 flex-col">
      <PageHeader
        title="API Keys"
        description="Gestiona todas las API keys del sistema"
        actions={<CreateApiKeyButton />}
      />

      <div className="flex-1 px-4 pb-6">
        {apiKeys.length === 0 ? (
          <Card>
            <CardContent className="p-0">
              <EmptyState
                icon={Key}
                title="No hay API keys"
                description="Aún no se han creado API keys en el sistema"
              />
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Organización</TableHead>
                    <TableHead>Key Prefix</TableHead>
                    <TableHead>Scopes</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Último uso</TableHead>
                    <TableHead>Creada por</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {apiKeys.map((key: any) => (
                    <TableRow key={key.id}>
                      <TableCell className="font-medium">{key.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{key.organizations.name}</Badge>
                      </TableCell>
                      <TableCell>
                        <code className="text-xs bg-muted px-2 py-1 rounded">
                          {key.key_prefix}...
                        </code>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {key.scopes && key.scopes.length > 0 ? (
                            key.scopes.slice(0, 2).map((scope: string, idx: number) => (
                              <Badge key={idx} variant="outline" className="text-xs">
                                {scope}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-xs text-muted-foreground">Sin scopes</span>
                          )}
                          {key.scopes && key.scopes.length > 2 && (
                            <Badge variant="outline" className="text-xs">
                              +{key.scopes.length - 2}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {key.is_active && !key.revoked_at ? (
                          <StatusBadge status="active" />
                        ) : (
                          <StatusBadge status="inactive" />
                        )}
                      </TableCell>
                      <TableCell>
                        {key.last_used_at
                          ? new Date(key.last_used_at).toLocaleDateString('es-CL')
                          : 'Nunca'}
                      </TableCell>
                      <TableCell>
                        {key.created_by_user?.full_name || 'N/A'}
                      </TableCell>
                      <TableCell className="text-right">
                        {key.is_active && !key.revoked_at && (
                          <RevokeApiKeyButton apiKeyId={key.id} apiKeyName={key.name} />
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

