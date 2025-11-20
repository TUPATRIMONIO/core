import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/admin/page-header'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Shield } from 'lucide-react'

async function getRoles() {
  const supabase = await createClient()

  const { data: roles, error } = await supabase
    .from('roles')
    .select('*')
    .order('level', { ascending: false })

  if (error) {
    console.error('Error fetching roles:', error)
    return []
  }

  return roles || []
}

export default async function RolesPage() {
  const roles = await getRoles()

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="Roles y Permisos"
        description="Gestiona los roles del sistema y sus permisos"
      />

      <div className="flex-1 p-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {roles.map((role: any) => (
            <Card key={role.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      {role.name}
                    </CardTitle>
                    <CardDescription className="mt-1">{role.slug}</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Badge variant="outline">Nivel {role.level}</Badge>
                    {role.is_system && (
                      <Badge variant="secondary">Sistema</Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  {role.description}
                </p>
                
                {role.permissions && Object.keys(role.permissions).length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground">Permisos:</p>
                    <div className="flex flex-wrap gap-1">
                      {Object.keys(role.permissions).slice(0, 5).map((key) => (
                        <Badge key={key} variant="outline" className="text-xs">
                          {key}
                        </Badge>
                      ))}
                      {Object.keys(role.permissions).length > 5 && (
                        <Badge variant="outline" className="text-xs">
                          +{Object.keys(role.permissions).length - 5} más
                        </Badge>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}

