import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export default async function TestInvoicingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Verificar si el usuario es platform admin
  const { data: isPlatformAdmin } = await supabase.rpc('is_platform_admin');

  if (!isPlatformAdmin) {
    redirect('/dashboard');
  }

  return <>{children}</>;
}

