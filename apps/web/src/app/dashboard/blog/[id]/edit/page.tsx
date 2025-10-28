/**
 * Página para editar post existente
 */

import { Metadata } from 'next';
import { BlogPostEditor } from '@/components/admin/BlogPostEditor';

export const metadata: Metadata = {
  title: 'Editar Post - Dashboard TuPatrimonio',
  description: 'Editar post del blog',
};

export default function EditPostPage({ params }: { params: { id: string } }) {
  return (
    <div className="container mx-auto py-8">
      <BlogPostEditor postId={params.id} mode="edit" />
    </div>
  );
}

