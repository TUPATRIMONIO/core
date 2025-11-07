import type { Metadata } from 'next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileText, Download, CheckCircle } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Plantillas de Documentos Legales - TuPatrimonio',
  description: 'Descarga plantillas gratuitas de contratos, acuerdos y documentos legales.',
};

export default function PlantillasPage() {
  const plantillas = [
    {
      title: 'Contrato de Trabajo',
      description: 'Plantilla de contrato laboral con cláusulas estándar',
      category: 'RRHH',
      format: 'DOCX',
      featured: true,
    },
    {
      title: 'Contrato de Servicios',
      description: 'Para prestación de servicios profesionales',
      category: 'Comercial',
      format: 'PDF',
      featured: true,
    },
    {
      title: 'NDA (Acuerdo de Confidencialidad)',
      description: 'Protege tu información confidencial',
      category: 'Legal',
      format: 'DOCX',
      featured: false,
    },
    {
      title: 'Contrato de Arriendo',
      description: 'Para arrendamiento de propiedades',
      category: 'Inmobiliario',
      format: 'PDF',
      featured: false,
    },
    {
      title: 'Acuerdo de Socios',
      description: 'Define las reglas entre socios de empresa',
      category: 'Corporativo',
      format: 'DOCX',
      featured: true,
    },
    {
      title: 'Carta de Renuncia',
      description: 'Formato profesional de renuncia laboral',
      category: 'RRHH',
      format: 'DOCX',
      featured: false,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-[var(--tp-background-light)] to-background py-20">
      <div className="max-w-7xl tp-container">
        <div className="text-center mb-16">
          <FileText className="w-16 h-16 text-[var(--tp-brand)] mx-auto mb-6" />
          <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6">
            Plantillas <span className="text-[var(--tp-brand)]">de Documentos</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Descarga plantillas profesionales listas para usar
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {plantillas.map((plantilla, index) => (
            <Card 
              key={index} 
              className={`
                border-2 transition-all hover:shadow-xl
                ${plantilla.featured 
                  ? 'border-[var(--tp-brand)] bg-gradient-to-b from-white to-[var(--tp-brand-5)]' 
                  : 'hover:border-[var(--tp-brand)]'
                }
              `}
            >
              <CardHeader>
                <div className="flex items-start justify-between mb-4">
                  <Badge variant={plantilla.featured ? "default" : "outline"}>
                    {plantilla.category}
                  </Badge>
                  <Badge variant="secondary">{plantilla.format}</Badge>
                </div>
                <CardTitle className="text-xl">{plantilla.title}</CardTitle>
                <CardDescription className="text-base">
                  {plantilla.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  className="w-full bg-[var(--tp-brand)] hover:bg-[var(--tp-brand-light)]"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Descargar Plantilla
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-16">
          <Card className="bg-[var(--tp-brand-5)] border-[var(--tp-brand-20)]">
            <CardContent className="py-12">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-foreground mb-4">
                  ¿Qué incluyen nuestras plantillas?
                </h2>
              </div>
              <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
                {[
                  'Redactadas por abogados',
                  'Actualizadas con legislación vigente',
                  'Editables y personalizables',
                  'Explicación de cada cláusula',
                  'Casos de uso y ejemplos',
                  'Soporte por email',
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-[var(--tp-brand)] shrink-0 mt-0.5" />
                    <span className="text-gray-700">{item}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

