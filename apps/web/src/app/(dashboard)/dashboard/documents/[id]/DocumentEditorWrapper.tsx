'use client';

import { DocumentEditor } from '@/components/documents/editor';
import { useCallback } from 'react';

interface DocumentEditorWrapperProps {
  documentId: string;
  userId: string;
  userName: string;
  initialContent: any;
  initialTitle: string;
}

export function DocumentEditorWrapper({
  documentId,
  userId,
  userName,
  initialContent,
  initialTitle,
}: DocumentEditorWrapperProps) {
  // Handler para guardar
  const handleSave = useCallback(async (content: any, title: string) => {
    const response = await fetch(`/api/documents/${documentId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content, title }),
    });

    if (!response.ok) {
      throw new Error('Error saving document');
    }
  }, [documentId]);

  return (
    <DocumentEditor
      documentId={documentId}
      userId={userId}
      userName={userName}
      initialContent={initialContent}
      initialTitle={initialTitle}
      onSave={handleSave}
    />
  );
}
