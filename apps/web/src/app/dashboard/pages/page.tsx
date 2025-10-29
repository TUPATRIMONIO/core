/**
 * Página de Gestión de Páginas Marketing
 * Dashboard administrativo para control de estados y SEO
 * 
 * NOTA: Esta página es READ-ONLY para auditoría.
 * La configuración real de páginas se gestiona desde código (page-config.ts)
 */

import { PageManagementDashboard } from '@/components/admin/PageManagement';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Gestión de Páginas - Dashboard TuPatrimonio',
  description: 'Panel de control para auditoría de páginas del sitio marketing',
  robots: {
    index: false,
    follow: false,
  },
};

export default async function PagesManagementPage() {
  // Verificar acceso admin
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Verificar rol de administrador
  const { data: isAdmin, error } = await supabase.rpc('can_access_admin', {
    user_id: user.id
  });

  if (error || !isAdmin) {
    redirect('/dashboard'); // Redirigir al dashboard principal
  }

  return (
    <div className="container mx-auto py-8">
      <PageManagementDashboard />
    </div>
  );
}
