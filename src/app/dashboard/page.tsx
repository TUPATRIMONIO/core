import Sidebar from '@/components/ui/custom/sidebar'
import { createClient } from '@/lib/supabase/server'
import { signOut } from '@/app/login/actions'
import { Button } from '@/components/ui/button'
import { User, LogOut } from 'lucide-react'

export default async function DashboardPage() {
  const supabase = await createClient()
  
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Preparar datos del usuario para el sidebar
  const userData = {
    user_name: user?.user_metadata?.user_name || user?.email?.split('@')[0] || 'Usuario',
    full_name: user?.user_metadata?.full_name || user?.email || ''
  }

  return (
    <div className="flex">
      {/* Renderizar el Sidebar */}
      <Sidebar userData={userData} />
      
      {/* Contenido principal con margen izquierdo para el sidebar */}
      <main className="ml-64 flex-1 min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200 p-8">
        <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-lg border border-white/60 p-6 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-[#800039] to-[#a50049] rounded-full flex items-center justify-center">
                <User className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold text-gray-900">
                  ¡Bienvenido a TuPatrimonio!
                </h1>
                <p className="text-gray-600 text-sm">
                  {user?.email}
                </p>
              </div>
            </div>
            
            <form action={signOut}>
              <Button 
                type="submit"
                variant="outline" 
                size="sm"
                className="border-gray-300 hover:bg-[#800039] hover:text-white transition-colors"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Cerrar Sesión
              </Button>
            </form>
          </div>
        </div>

        {/* Content */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <div className="bg-white/70 backdrop-blur-sm rounded-xl shadow-md border border-white/50 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Dashboard Principal
            </h3>
            <p className="text-gray-600 text-sm">
              Aquí podrás gestionar tu patrimonio personal de manera eficiente.
            </p>
          </div>

          <div className="bg-white/70 backdrop-blur-sm rounded-xl shadow-md border border-white/50 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Autenticación Configurada
            </h3>
            <p className="text-gray-600 text-sm">
              ✅ Login y registro funcionando con Supabase
            </p>
          </div>

          <div className="bg-white/70 backdrop-blur-sm rounded-xl shadow-md border border-white/50 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Próximos Pasos
            </h3>
            <p className="text-gray-600 text-sm">
              Configura tus credenciales de Supabase en .env.local
            </p>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-blue-50/80 backdrop-blur-sm rounded-xl border border-blue-200/50 p-6 mt-8">
          <h3 className="text-lg font-medium text-blue-900 mb-3">
            Configuración de Supabase
          </h3>
          <div className="text-blue-800 text-sm space-y-2">
            <p>Para activar la autenticación, configura estas variables en tu archivo <code className="bg-blue-100 px-1 rounded">.env.local</code>:</p>
            <pre className="bg-blue-100 p-3 rounded-lg text-xs overflow-x-auto mt-3">
{`NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key`}
            </pre>
            <p className="mt-2">
              Encuentra estas credenciales en tu dashboard de Supabase: 
              <a 
                href="https://app.supabase.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-[#800039] hover:underline ml-1"
              >
                app.supabase.com
              </a>
            </p>
          </div>
        </div>
        </div>
      </main>
    </div>
  )
}

