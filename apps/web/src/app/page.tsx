import { Icon } from '@tupatrimonio/ui';
import { ImagotipoImage } from '@tupatrimonio/assets';
import { Button } from '@/components/ui/button';
import { LogIn, UserPlus, Shield, Zap, Lock, LogOut } from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { signOut } from '@/lib/auth/actions';

export default async function Home() {
  // Verificar si el usuario está autenticado
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <div className="min-h-screen bg-gradient-to-br from-[var(--tp-background-light)] to-background">
      {/* Header con botón de logout si está autenticado */}
      {user && (
        <header className="tp-container py-4 border-b border-border">
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">
              Hola, <span className="font-semibold text-foreground">{user.email}</span>
            </p>
            <form action={signOut}>
              <Button
                type="submit"
                variant="outline"
                size="sm"
                className="border-red-200 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Cerrar Sesión
              </Button>
            </form>
          </div>
        </header>
      )}

      {/* Hero Section */}
      <section className="tp-container py-20">
        <div className="max-w-4xl mx-auto text-center">
          {/* Imagotipo TuPatrimonio */}
          <div className="flex justify-center mb-8">
            <ImagotipoImage width={120} height={150} priority />
          </div>

          {/* Título principal con tipografía correcta */}
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            Tu Plataforma de <span className="text-[var(--tp-brand)]">Servicios Legales Digitales</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-muted-foreground mb-10 max-w-2xl mx-auto">
            Tu plataforma de servicios legales digitales. Firma documentos, verifica identidad y gestiona trámites desde cualquier lugar.
          </p>

          {/* CTA Buttons - Mostrar diferentes botones según si está autenticado */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            {user ? (
              // Usuario autenticado: botón para ir al dashboard
              <Link href="/dashboard">
                <Button 
                  size="lg" 
                  className="bg-[var(--tp-brand)] hover:bg-[var(--tp-brand-light)] text-white px-10 py-6 text-lg font-semibold shadow-lg hover:shadow-xl transition-all"
                >
                  <Icon icon={Shield} size="md" variant="inherit" className="mr-2" />
                  Ir al Dashboard
                </Button>
              </Link>
            ) : (
              // Usuario no autenticado: botones de login y registro
              <>
                <Link href="/login">
                  <Button 
                    size="lg" 
                    className="bg-[var(--tp-brand)] hover:bg-[var(--tp-brand-light)] text-white px-10 py-6 text-lg font-semibold shadow-lg hover:shadow-xl transition-all"
                  >
                    <Icon icon={LogIn} size="md" variant="inherit" className="mr-2" />
                    Iniciar Sesión
                  </Button>
                </Link>
                <Link href="/register">
                  <Button 
                    size="lg" 
                    variant="outline"
                    className="border-2 border-[var(--tp-brand)] text-[var(--tp-brand)] hover:bg-[var(--tp-brand-5)] px-10 py-6 text-lg font-semibold shadow-lg hover:shadow-xl transition-all"
                  >
                    <Icon icon={UserPlus} size="md" variant="inherit" className="mr-2" />
                    Crear Cuenta
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Trust indicators */}
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm">
            <div className="flex items-center gap-2 px-3 py-2 bg-green-50 dark:bg-green-950 rounded-full">
              <Icon icon={Shield} size="sm" className="text-green-600 dark:text-green-400" />
              <span className="text-green-700 dark:text-green-300">100% Seguro</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 dark:bg-blue-950 rounded-full">
              <Icon icon={Lock} size="sm" className="text-blue-600 dark:text-blue-400" />
              <span className="text-blue-700 dark:text-blue-300">Validez Legal</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 bg-purple-50 dark:bg-purple-950 rounded-full">
              <Icon icon={Zap} size="sm" className="text-purple-600 dark:text-purple-400" />
              <span className="text-purple-700 dark:text-purple-300">Rápido y Fácil</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="tp-container py-8 border-t border-border">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground text-center md:text-left">
              © {new Date().getFullYear()} TuPatrimonio. Tu tranquilidad, nuestra prioridad.
            </p>
            <div className="flex gap-6">
              <a href="/legal/terminos" rel="noopener noreferrer nofollow" className="text-sm text-muted-foreground hover:text-[var(--tp-brand)] transition-colors">
                Términos
              </a>
              <a href="/legal/privacidad" rel="noopener noreferrer nofollow" className="text-sm text-muted-foreground hover:text-[var(--tp-brand)] transition-colors">
                Privacidad
              </a>
              <a href="/ayuda" rel="noopener noreferrer nofollow" className="text-sm text-muted-foreground hover:text-[var(--tp-brand)] transition-colors">
                Ayuda
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
