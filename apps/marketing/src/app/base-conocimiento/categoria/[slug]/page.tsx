import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronLeft, Clock, Eye } from 'lucide-react';

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  
  return {
    title: `${slug.replace(/-/g, ' ')} - Base de Conocimiento | TuPatrimonio`,
    description: `Artículos sobre ${slug.replace(/-/g, ' ')} en nuestra base de conocimiento.`,
  };
}

export default async function KBCategoryPage({ params }: PageProps) {
  const { slug } = await params;
  
  const supabase = await createClient();
  
  const { data: category } = await supabase
    .schema('marketing')
    .from('kb_categories')
    .select('*')
    .eq('slug', slug)
    .eq('is_active', true)
    .single();

  if (!category) notFound();

  const { data: articles } = await supabase
    .schema('marketing')
    .from('kb_articles')
    .select('*')
    .eq('category_id', category.id)
    .eq('published', true)
    .order('view_count', { ascending: false });

  return (
    <div className="min-h-screen bg-background">
      <section className="bg-card border-b">
        <div className="max-w-7xl tp-container py-6">
          <Link href="/base-conocimiento">
            <Button variant="ghost" size="sm">
              <ChevronLeft className="w-4 h-4 mr-2" />
              Volver a Base de Conocimiento
            </Button>
          </Link>
        </div>
      </section>

      <section className="py-12">
        <div className="max-w-7xl tp-container">
          <div className="mb-12">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
              style={{ backgroundColor: `${category.color}15` }}
            >
              <span className="text-3xl">{category.icon || '📚'}</span>
            </div>
            <h1 className="text-4xl font-bold text-foreground mb-4">
              {category.name}
            </h1>
            <p className="text-xl text-gray-600">
              {category.description}
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {articles && articles.length > 0 ? (
              articles.map((article) => (
                <Link
                  key={article.id}
                  href={`/base-conocimiento/${category.slug}/${article.slug}`}
                >
                  <Card className="h-full hover:shadow-xl transition-all hover:border-[var(--tp-brand)] cursor-pointer">
                    <CardHeader>
                      <CardTitle className="text-lg line-clamp-2">
                        {article.title}
                      </CardTitle>
                      <CardDescription className="line-clamp-3">
                        {article.excerpt || 'Lee este artículo para obtener más información.'}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {article.reading_time} min
                        </span>
                        <span className="flex items-center gap-1">
                          <Eye className="w-4 h-4" />
                          {article.view_count}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))
            ) : (
              <div className="col-span-full text-center py-12 text-gray-500">
                <p>No hay artículos disponibles en esta categoría aún.</p>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

