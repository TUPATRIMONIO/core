import { Card } from '@/components/ui/card'
import { Settings, Database, Shield, Bell } from 'lucide-react'

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Configuración</h1>
        <p className="text-gray-600 mt-2">
          Ajustes generales del panel de administración
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6">
          <div className="flex items-start gap-4">
            <div className="bg-blue-50 p-3 rounded-lg">
              <Database className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="font-bold text-lg mb-2">Base de Datos</h3>
              <p className="text-sm text-gray-600 mb-4">
                Información sobre el schema de marketing y estadísticas
              </p>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Schema:</span>
                  <span className="font-medium">marketing</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Tablas:</span>
                  <span className="font-medium">8 tablas</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Storage:</span>
                  <span className="font-medium">4 buckets</span>
                </div>
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-start gap-4">
            <div className="bg-green-50 p-3 rounded-lg">
              <Shield className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h3 className="font-bold text-lg mb-2">Seguridad</h3>
              <p className="text-sm text-gray-600 mb-4">
                Roles y permisos de plataforma
              </p>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Tu rol:</span>
                  <span className="font-medium">Platform Super Admin</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">RLS:</span>
                  <span className="font-medium text-green-600">Activo</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Permisos:</span>
                  <span className="font-medium">Completos</span>
                </div>
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-start gap-4">
            <div className="bg-purple-50 p-3 rounded-lg">
              <Bell className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h3 className="font-bold text-lg mb-2">Notificaciones</h3>
              <p className="text-sm text-gray-600 mb-4">
                Configura las notificaciones del sistema
              </p>
              <p className="text-sm text-gray-500 italic">
                Próximamente disponible
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-start gap-4">
            <div className="bg-orange-50 p-3 rounded-lg">
              <Settings className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <h3 className="font-bold text-lg mb-2">General</h3>
              <p className="text-sm text-gray-600 mb-4">
                Configuración general del blog
              </p>
              <p className="text-sm text-gray-500 italic">
                Próximamente disponible
              </p>
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-6 bg-blue-50 border-blue-200">
        <h3 className="font-bold mb-2">Información del Sistema</h3>
        <div className="text-sm text-gray-700 space-y-1">
          <p>Panel de administración de TuPatrimonio</p>
          <p>Versión: 1.0.0</p>
          <p>Framework: Next.js 15 + Supabase + Shadcn/UI</p>
        </div>
      </Card>
    </div>
  )
}

