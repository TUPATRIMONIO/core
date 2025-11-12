/**
 * Página de Gestión de Usuarios
 * Administración de roles y permisos
 */

import { Metadata } from 'next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Gestión de Usuarios - Dashboard TuPatrimonio',
  description: 'Administración de roles y permisos de usuarios',
};

export default function UsersManagementPage() {
  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Gestión de Usuarios
        </h1>
        <p className="text-gray-600">
          Administra roles y permisos de usuarios del sistema
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Shield className="h-5 w-5 mr-2" />
            Administración de Roles
          </CardTitle>
          <CardDescription>
            Asigna y gestiona roles de usuarios para el sistema de administración
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <Shield className="h-4 w-4" />
            <AlertDescription>
              La interfaz de gestión de usuarios estará disponible próximamente.
              Por ahora, puedes gestionar roles directamente en el SQL Editor de Supabase.
            </AlertDescription>
          </Alert>

          <div className="mt-6 bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-2">Crear Administrador</h3>
            <p className="text-sm text-gray-600 mb-3">
              Para asignar rol de admin a un usuario, ejecuta en Supabase SQL Editor:
            </p>
            <pre className="bg-gray-900 text-gray-100 p-4 rounded text-xs overflow-x-auto">
{`-- Ver usuarios existentes
SELECT id, email FROM auth.users;

-- Obtener IDs necesarios
SELECT id, name FROM core.organizations WHERE org_type = 'platform';
SELECT id, slug FROM core.roles WHERE slug IN ('platform_super_admin', 'marketing_admin', 'sales_manager');

-- Asignar rol de admin a un usuario
INSERT INTO core.organization_users (organization_id, user_id, role_id, status)
VALUES (
  (SELECT id FROM core.organizations WHERE org_type = 'platform' LIMIT 1),
  'user-id-aqui',
  (SELECT id FROM core.roles WHERE slug = 'platform_super_admin' LIMIT 1),
  'active'
)
ON CONFLICT (organization_id, user_id) 
DO UPDATE SET 
  role_id = (SELECT id FROM core.roles WHERE slug = 'platform_super_admin' LIMIT 1),
  status = 'active';`}
            </pre>
          </div>

          <div className="mt-4 bg-blue-50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-2">Roles Disponibles</h3>
            <ul className="text-sm text-gray-600 space-y-2">
              <li><span className="font-medium">platform_super_admin:</span> Acceso total al sistema</li>
              <li><span className="font-medium">marketing_admin:</span> Gestión de contenido marketing (blog, KB)</li>
              <li><span className="font-medium">sales_manager:</span> Gestión de CRM y leads (futuro)</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
