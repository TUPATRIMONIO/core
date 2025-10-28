/**
 * Página para crear nuevo post
 */

import { Metadata } from 'next';
import { BlogPostEditor } from '@/components/admin/BlogPostEditor';

export const metadata: Metadata = {
  title: 'Nuevo Post - Dashboard TuPatrimonio',
  description: 'Crear nuevo post para el blog',
};

export default function NewPostPage() {
  return (
    <div className="container mx-auto py-8">
      <BlogPostEditor mode="create" />
    </div>
  );
}

