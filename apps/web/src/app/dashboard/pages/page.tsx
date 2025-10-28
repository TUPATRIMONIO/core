/**
 * Página de Gestión de Páginas Marketing
 * Dashboard administrativo para control de estados y SEO
 */

import { PageManagementDashboard } from '@/components/admin/PageManagement';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Gestión de Páginas - Dashboard TuPatrimonio',
  description: 'Panel de control para gestión de páginas del sitio marketing',
};

export default function PagesManagementPage() {
  return (
    <div className="container mx-auto py-8">
      <PageManagementDashboard />
    </div>
  );
}
