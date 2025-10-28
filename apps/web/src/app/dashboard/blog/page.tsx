/**
 * Página de Administración de Blog
 * Gestión de posts y categorías del blog marketing
 */

import { Metadata } from 'next';
import { BlogPostsList } from '@/components/admin/BlogPostsList';

export const metadata: Metadata = {
  title: 'Gestión de Blog - Dashboard TuPatrimonio',
  description: 'Administración de posts y categorías del blog',
};

export default function BlogManagementPage() {
  return (
    <div className="container mx-auto py-8">
      <BlogPostsList />
    </div>
  );
}
