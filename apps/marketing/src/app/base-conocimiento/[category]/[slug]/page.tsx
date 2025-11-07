import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ChevronLeft, Clock, Eye, ThumbsUp } from 'lucide-react';

type PageProps = {
  params: Promise<{ category: string; slug: string }>;
};

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  
  return {
    title: `Artículo - Base de Conocimiento | TuPatrimonio`,
    description: `Aprende más sobre ${slug.replace(/-/g, ' ')} en nuestra base de conocimiento.`,
  };
}

export default async function KBArticlePage({ params }: PageProps) {
  const { category, slug } = await params;
  
  const supabase = await createClient();
  const { data: article } = await supabase
    .schema('marketing')
    .from('kb_articles')
    .select(`
      *,
      kb_categories (name, slug, color)
    `)
    .eq('slug', slug)
    .eq('published', true)
    .single();

  if (!article) notFound();

  return (
    <div className="min-h-screen bg-gray-50">
      <section className="bg-card border-b">
        <div className="max-w-4xl tp-container py-6">
          <Link href="/base-conocimiento">
            <Button variant="ghost" size="sm">
              <ChevronLeft className="w-4 h-4 mr-2" />
              Volver a Base de Conocimiento
            </Button>
          </Link>
        </div>
      </section>

      <section className="py-12">
        <article className="max-w-4xl tp-container">
          <div className="bg-card rounded-xl shadow-sm p-8">
            <div className="mb-8">
              <Link
                href={`/base-conocimiento/categoria/${(article.kb_categories as any)?.slug || 'general'}`}
                className="inline-block mb-4"
              >
                <span
                  className="text-sm font-semibold px-3 py-1 rounded-full"
                  style={{
                    backgroundColor: `${(article.kb_categories as any)?.color || '#800039'}15`,
                    color: (article.kb_categories as any)?.color || '#800039'
                  }}
                >
                  {(article.kb_categories as any)?.name || 'General'}
                </span>
              </Link>
              
              <h1 className="text-4xl font-bold text-foreground mb-4">
                {article.title}
              </h1>
              
              <div className="flex items-center gap-6 text-sm text-muted-foreground">
                <span className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  {article.reading_time} min lectura
                </span>
                <span className="flex items-center gap-2">
                  <Eye className="w-4 h-4" />
                  {article.view_count} vistas
                </span>
                {article.helpful_count > 0 && (
                  <span className="flex items-center gap-2">
                    <ThumbsUp className="w-4 h-4" />
                    {article.helpful_count} útil
                  </span>
                )}
              </div>
            </div>

            <div 
              className="prose prose-lg max-w-none"
              dangerouslySetInnerHTML={{ __html: article.content }}
            />

            <div className="mt-12 pt-8 border-t">
              <p className="text-center text-muted-foreground mb-4">
                ¿Te resultó útil este artículo?
              </p>
              <div className="flex gap-4 justify-center">
                <Button variant="outline">
                  <ThumbsUp className="w-4 h-4 mr-2" />
                  Sí, fue útil
                </Button>
                <Button variant="outline">
                  Necesito más ayuda
                </Button>
              </div>
            </div>
          </div>
        </article>
      </section>
    </div>
  );
}

