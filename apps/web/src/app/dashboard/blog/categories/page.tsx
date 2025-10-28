/**
 * Página de Gestión de Categorías
 */

import { Metadata } from 'next';
import { CategoryManagement } from '@/components/admin/CategoryManagement';

export const metadata: Metadata = {
  title: 'Categorías - Dashboard TuPatrimonio',
  description: 'Gestión de categorías del blog',
};

export default function CategoriesPage() {
  return (
    <div className="container mx-auto py-8">
      <CategoryManagement />
    </div>
  );
}

