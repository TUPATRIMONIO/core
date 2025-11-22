import { redirect } from 'next/navigation';

export default async function AdminBlogPage() {
  // Redirigir al dashboard de blog que ya existe
  redirect('/dashboard/blog');
}

