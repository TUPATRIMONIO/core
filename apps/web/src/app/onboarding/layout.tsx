/**
 * Layout para Onboarding
 * Verifica autenticación antes de mostrar onboarding
 */

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export default async function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Si no está autenticado, redirigir a login
  if (!user) {
    redirect('/login');
  }

  // Verificar si ya completó onboarding
  const { data: hasOrg } = await supabase.rpc('user_has_organization', {
    user_id: user.id
  });

  // Si ya tiene organización, redirigir a dashboard
  if (hasOrg) {
    redirect('/dashboard');
  }

  return <>{children}</>;
}









