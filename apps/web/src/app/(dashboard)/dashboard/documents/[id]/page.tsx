import { createClient } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';
import { DocumentEditorWrapper } from './DocumentEditorWrapper';

interface DocumentPageProps {
  params: Promise<{ id: string }>;
}

export default async function DocumentPage({ params }: DocumentPageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Obtener documento
  const { data: document, error } = await supabase
    .from('documents_documents')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !document) {
    notFound();
  }

  // Obtener información del usuario
  const { data: userData } = await supabase
    .from('users')
    .select('first_name, last_name')
    .eq('id', user.id)
    .single();

  const userName = userData 
    ? `${userData.first_name || ''} ${userData.last_name || ''}`.trim() || 'Usuario'
    : 'Usuario';

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col overflow-hidden">
      <DocumentEditorWrapper
        documentId={document.id}
        userId={user.id}
        userName={userName}
        initialContent={document.content}
        initialTitle={document.title}
      />
    </div>
  );
}
