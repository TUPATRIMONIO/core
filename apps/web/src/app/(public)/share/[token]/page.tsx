import { PublicDocumentViewer } from './PublicDocumentViewer';

interface SharePageProps {
  params: Promise<{ token: string }>;
}

export default async function SharePage({ params }: SharePageProps) {
  const { token } = await params;

  return (
    <div className="min-h-screen bg-background">
      <PublicDocumentViewer token={token} />
    </div>
  );
}
