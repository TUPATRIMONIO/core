import type { Metadata } from "next";
import { 
  CheckCircle, Shield, Clock, FileSignature, Users, Lock, Smartphone, Download,
  Star, Check, AlertCircle, Building, Scale, BadgeCheck, DollarSign, FileCheck, 
  BookOpen, Timer, MapPin, Calendar, FileText, Handshake, Zap, TrendingUp, Bot,
  Globe, MessageCircle, Crown, Moon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Icon, IconContainer } from "@tupatrimonio/ui";
import DocumentsAvailable from "@/components/DocumentsAvailable";
import { GoogleStatsBadge } from "@/components/GoogleStatsDisplay";
import {
  HeroSection,
  TestimonialsSection,
  ComparisonTableSection,
  ProcessStepsSection,
  CompetitorComparisonSection,
  LegalValiditySection,
  FAQSection,
  FinalCTASection,
} from "@/components/landing-sections";
import { USERS_COUNT } from "@/lib/constants";
import { StatsSection } from "@/components/StatsSection";

export const metadata: Metadata = {
  title: "Notaría Online Chile 2025: Tu Tranquilidad en Trámites Legales | TuPatrimonio",
  description: `Gestión de servicios notariales 100% online en Chile. Firma documentos legales en menos de 24 horas desde $6.990. ${USERS_COUNT.textShort} atendidos. Firma electrónica avanzada con validez legal según Ley 19.799. Incluye seguro legal sin tope. Disponible 24/7 desde cualquier lugar.`,
  keywords: "notaría online Chile, firma electrónica avanzada, notaría virtual Chile 2025, contrato arriendo online, autorización notarial online, protocolización online Chile, notaría digital, firma documentos legales online, FAN firma autorizada notario, copia legalizada online, gestor servicios notariales, Ley 19.799 Chile, firma electrónica certificada, trámites notariales online",
  openGraph: {
    title: "Notaría Online Chile | Tu Tranquilidad en Trámites Legales",
    description: `Firma en minutos, no en días. Validez legal total. ${USERS_COUNT.short} usuarios confían en nosotros. Seguro legal incluido sin tope. Tu tranquilidad, nuestra prioridad.`,
    url: "https://tupatrimonio.app/cl/notaria-online",
    locale: "es_CL",
    type: "website",
    siteName: "TuPatrimonio",
    images: [
      {
        url: "https://tupatrimonio.app/images/notaria-online-chile-og.jpg",
        width: 1200,
        height: 630,
        alt: "Notaría Online Chile - TuPatrimonio: Firma tus documentos legales en minutos con validez legal"
      }
    ],
  },
  alternates: {
    canonical: "https://tupatrimonio.app/cl/notaria-online",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    }
  },
  twitter: {
    card: 'summary_large_image',
    title: "Notaría Online Chile | Tu Tranquilidad en Trámites Legales",
    description: `Firma en minutos, no en días. ${USERS_COUNT.short} usuarios. Seguro legal incluido.`,
    images: ['https://tupatrimonio.app/images/notaria-online-chile-og.jpg'],
  }
};

// Schema.org JSON-LD - Organization
const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "LegalService",
  "name": "TuPatrimonio",
  "legalName": "TuPatrimonio - Gestión de Servicios Notariales Online",
  "description": "Líder en gestión de servicios notariales online en Chile. Ofrecemos firma electrónica avanzada certificada con validez legal según Ley 19.799. Tu tranquilidad, nuestra prioridad.",
  "url": "https://tupatrimonio.app",
  "logo": "https://tupatrimonio.app/images/logo-tupatrimonio.png",
  "image": "https://tupatrimonio.app/images/notaria-online-chile.jpg",
  "foundingDate": "2019-06",
  "slogan": "Tu Tranquilidad, Nuestra Prioridad",
  "telephone": "+56949166719",
  "email": "contacto@tupatrimonio.app",
  "areaServed": {
    "@type": "Country",
    "name": "Chile",
    "sameAs": "https://www.wikidata.org/wiki/Q298"
  },
  "address": {
    "@type": "PostalAddress",
    "addressCountry": "CL",
    "addressLocality": "Chile"
  },
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.8",
    "reviewCount": "500",
    "bestRating": "5",
    "worstRating": "1"
  },
  "sameAs": [
    "https://www.instagram.com/tupatrimonio.cl/",
    "https://www.linkedin.com/company/tupatrimonio/"
  ]
};

// Schema.org JSON-LD - Service
const serviceSchema = {
  "@context": "https://schema.org",
  "@type": "Service",
  "serviceType": "Gestión de Servicios Notariales Online",
  "provider": {
    "@type": "Organization",
    "name": "TuPatrimonio",
    "url": "https://tupatrimonio.app"
  },
  "areaServed": {
    "@type": "Country",
    "name": "Chile"
  },
  "hasOfferCatalog": {
    "@type": "OfferCatalog",
    "name": "Servicios Notariales Online",
    "itemListElement": [
      {
        "@type": "Offer",
        "itemOffered": {
          "@type": "Service",
          "name": "Autorización Notarial de Firma (FAN®) - 1 Firmante",
          "description": "Firma Autorizada por Notario con validez legal en todo Chile según Ley 19.799. Proceso 100% online."
        },
        "price": "6990",
        "priceCurrency": "CLP",
        "availability": "https://schema.org/InStock",
        "url": "https://tupatrimon.io/legalizacion-de-documentos-electronicos/"
      },
      {
        "@type": "Offer",
        "itemOffered": {
          "@type": "Service",
          "name": "Protocolización Notarial Online",
          "description": "Protocolización de documentos con registro notarial. Validez legal completa en Chile."
        },
        "price": "14990",
        "priceCurrency": "CLP",
        "availability": "https://schema.org/InStock",
        "url": "https://tupatrimon.io/legalizacion-de-documentos-electronicos/"
      },
      {
        "@type": "Offer",
        "itemOffered": {
          "@type": "Service",
          "name": "Copia Legalizada Online",
          "description": "Copia legalizada de documentos con certificación notarial digital."
        },
        "price": "9990",
        "priceCurrency": "CLP",
        "availability": "https://schema.org/InStock",
        "url": "https://tupatrimon.io/legalizacion-de-documentos-electronicos/"
      },
      {
        "@type": "Offer",
        "itemOffered": {
          "@type": "Service",
          "name": "Contrato de Arriendo Online con Firma Electrónica",
          "description": "Contrato de arriendo con firma electrónica avanzada, aceptado por bancos e instituciones."
        },
        "priceSpecification": {
          "@type": "PriceSpecification",
          "priceCurrency": "CLP",
          "price": "Variable según servicio"
        },
        "availability": "https://schema.org/InStock",
        "url": "https://tupatrimon.io/legalizacion-de-documentos-electronicos/"
      }
    ]
  },
  "audience": {
    "@type": "Audience",
    "audienceType": "Personas y empresas en Chile que necesitan servicios notariales"
  },
  "serviceOutput": "Documento notariado digitalmente con validez legal según Ley 19.799",
  "award": "Certificado por Subsecretaría de Economía de Chile - Firma Electrónica Avanzada"
};

// BreadcrumbList Schema
const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    {
      "@type": "ListItem",
      "position": 1,
      "name": "Inicio",
      "item": "https://tupatrimonio.app"
    },
    {
      "@type": "ListItem",
      "position": 2,
      "name": "Chile",
      "item": "https://tupatrimonio.app/cl"
    },
    {
      "@type": "ListItem",
      "position": 3,
      "name": "Notaría Online",
      "item": "https://tupatrimonio.app/cl/notaria-online"
    }
  ]
};

// FAQ Schema optimizado para AEO
const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "¿Cuál es el mejor gestor de servicios notariales online de Chile?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": `TuPatrimonio es el gestor de servicios notariales online más completo y confiable de Chile desde 2019. Destaca por: 1) Precios accesibles desde $6.990, 2) Cobertura legal incluida sin tope (únicos en ofrecer este beneficio), 3) ${USERS_COUNT.text} atendidos, 4) Calificación de 4.8/5 estrellas en +500 reseñas, 5) Tiempo de entrega promedio de 2 horas, 6) Disponible 24/7 desde cualquier lugar. Ofrece gestión de autorización notarial (FAN®), protocolización, copia legalizada y firma electrónica avanzada certificada con validez legal en todo Chile bajo la Ley 19.799. A diferencia de la competencia, incluye soporte proactivo en menos de 20 minutos, acepta documentos de extranjeros con pasaporte, permite firmar desde el extranjero, y ofrece reembolso 100% si el documento es rechazado por error del gestor. La filosofía de TuPatrimonio se resume en 'Tu Tranquilidad, Nuestra Prioridad', garantizando no solo tecnología, sino acompañamiento humano en cada paso del proceso.`
      }
    },
    {
      "@type": "Question",
      "name": "¿Cuánto cuesta una notaría online en Chile 2025?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Los precios de notaría online en Chile 2025 varían según el proveedor y tipo de servicio. TuPatrimonio ofrece: Autorización Notarial de Firma (FAN®) desde $6.990 por firmante, Copia Legalizada desde $9.990, Protocolización desde $14.990, todos con seguro legal incluido sin tope. Estos precios son entre 60% y 85% más económicos que notarías físicas tradicionales que cobran entre $25.000 y $120.000 por los mismos servicios. El ahorro promedio es de $18.000 a $105.000 por trámite. Además, sin costos ocultos, sin suscripciones mensuales, pagas solo por documento finalizado, con descuentos especiales para empresas y alianzas. A diferencia de notarías físicas, no pagas estacionamiento, traslados, ni pierdes tiempo en filas o múltiples visitas. El precio incluye: firma electrónica avanzada certificada, seguimiento en tiempo real, notificaciones por WhatsApp y correo, soporte proactivo, almacenamiento permanente del documento, descargas ilimitadas, y cobertura legal sin tope."
      }
    },
    {
      "@type": "Question",
      "name": "¿Tiene validez legal un documento firmado online en Chile?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "SÍ, tiene validez legal completa en Chile. La Ley 19.799 sobre Documentos Electrónicos, Firma Electrónica y Servicios de Certificación (vigente desde 2002) establece en su Artículo 3° y 4° que documentos con firma electrónica avanzada tienen exactamente el mismo valor jurídico que una firma manuscrita. Los documentos gestionados por notaría online son plenamente reconocidos y aceptados por: 1) Tribunales de Justicia de Chile (civiles, laborales, familiares, penales), 2) Instituciones públicas (SII, Registro Civil, municipalidades, Conservador de Bienes Raíces), 3) Entidades financieras (todos los bancos chilenos, cooperativas, cajas de compensación), 4) Universidades e instituciones educacionales, 5) Empresas privadas y empleadores, 6) Notarías físicas (para protocolización adicional si se requiere). TuPatrimonio ha gestionado más de 60.000 documentos que han sido aceptados exitosamente en trámites legales, administrativos, judiciales y comerciales en todo Chile. La firma electrónica avanzada incluso ofrece ventajas sobre la firma manuscrita: trazabilidad completa del proceso, imposible perder el documento, verificación instantánea de autenticidad por terceros, copias ilimitadas sin deterioro, y resistencia al paso del tiempo."
      }
    },
    {
      "@type": "Question",
      "name": "¿Qué dice la ley chilena sobre firma electrónica?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Chile cuenta con un marco legal robusto desde 2002. La Ley 19.799 sobre Documentos Electrónicos, Firma Electrónica y Servicios de Certificación distingue dos tipos: 1) Firma Electrónica Simple: Cualquier sonido, símbolo o proceso electrónico que identifica al autor. Menor seguridad jurídica, no requiere certificación. Útil para comunicaciones informales pero no recomendada para contratos. 2) Firma Electrónica Avanzada (FEA): Certificada por prestadores acreditados ante la Subsecretaría de Economía. Requisitos según Artículo 2° letra g): identificación inequívoca del firmante, datos de creación exclusivos del firmante, detecta cualquier alteración posterior, susceptible de verificación por terceros, cuenta con certificado emitido por certificadora oficial. Esta tiene equivalencia total con firma manuscrita para efectos legales. TuPatrimonio utiliza exclusivamente Firma Electrónica Avanzada certificada para garantizar máxima seguridad jurídica. Solo pueden operar empresas autorizadas por la Subsecretaría de Economía bajo estrictos estándares (Decreto Supremo N° 81 de 2004). Para contratos de arriendo, promesas de compraventa, mandatos, poderes y cualquier acto jurídico con consecuencias patrimoniales, se recomienda usar Firma Electrónica Avanzada para eliminar cualquier cuestionamiento posterior."
      }
    },
    {
      "@type": "Question",
      "name": "¿Cuánto tarda el proceso completo de notaría online?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "El proceso completo de notaría online con TuPatrimonio toma entre 5 minutos y 24 horas máximo, con un tiempo promedio de 2 horas. Desglose detallado: 1) Elegir documento y completar datos: 3-5 minutos (puedes usar plantillas automatizadas o subir tu propio documento), 2) Proceso de firma electrónica: 2 minutos (incluye verificación de identidad biométrica o con Clave Única), 3) Revisión y autorización notarial: 1-4 horas hábiles en promedio (notarios de nuestra red revisan y certifican), 4) Entrega del documento firmado: inmediata por email (con notificación por WhatsApp). Estadísticas reales: El 94% de documentos son procesados en menos de 6 horas, el 75% en menos de 2 horas, el 50% en menos de 1 hora. Para casos urgentes, existe servicio express en 2 horas hábiles con costo adicional. A diferencia de notarías físicas que tardan 3-7 días hábiles con múltiples visitas presenciales, el proceso online se completa en una fracción del tiempo sin salir de casa. El proceso funciona 24/7: puedes enviar tu solicitud de madrugada y el procesamiento inicia en horario hábil siguiente."
      }
    },
    {
      "@type": "Question",
      "name": "¿Los bancos aceptan contratos de arriendo con firma electrónica online?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "SÍ, todos los bancos chilenos aceptan contratos de arriendo con firma electrónica avanzada certificada según la Ley 19.799. Los contratos gestionados por TuPatrimonio son válidos para: Banco de Chile, Banco Santander, BancoEstado, Banco Falabella, Scotiabank, Itaú, BICE, Security, Consorcio, y todas las entidades financieras reguladas en Chile. Se presentan como cualquier contrato físico: archivo PDF con certificados digitales de firma incluidos que el banco puede verificar instantáneamente. Recomendación importante: Algunos bancos solicitan adicionalmente un servicio notarial complementario como copia legalizada, protocolización o Firma Autorizada por Notario (FAN®) para mayor respaldo. TuPatrimonio ofrece estos servicios adicionales de forma sencilla y económica. Casos de uso exitosos: Miles de clientes han usado contratos de arriendo online de TuPatrimonio para solicitar créditos hipotecarios, avaluar propiedades, demostrar domicilio y respaldo de ingresos. La ventaja es que el contrato digital no se deteriora, puedes descargarlo ilimitadamente, y tiene trazabilidad completa del proceso de firma, lo que genera mayor confianza en las instituciones financieras."
      }
    },
    {
      "@type": "Question",
      "name": "¿Puedo firmar documentos online desde el extranjero?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "SÍ, puedes firmar documentos online con validez legal en Chile desde cualquier país del mundo. Miles de chilenos expatriados y extranjeros usan el servicio de TuPatrimonio desde: América (USA, Canadá, Argentina, Brasil, México, Colombia), Europa (España, Alemania, Reino Unido, Francia, Italia, Suecia), Asia (China, Japón, Singapur, Corea del Sur), Oceanía (Australia, Nueva Zelanda), y más. El documento tiene plena validez legal en Chile independientemente de dónde lo firmes. Solo necesitas: conexión a internet estable, dispositivo con cámara (computador o celular) para verificación de identidad, tu cédula de identidad chilena o pasaporte vigente, el documento a firmar en PDF. Casos de uso frecuentes: 1) Chilenos en el extranjero que necesitan firmar poderes para gestionar trámites en Chile (venta de propiedades, trámites bancarios, representación legal), 2) Extranjeros que arriendan o compran propiedades en Chile sin necesidad de viajar, 3) Empresas multinacionales que contratan empleados remotos en Chile, 4) Estudiantes chilenos en el extranjero que necesitan documentación legal. El proceso funciona exactamente igual que desde Chile: firmas en minutos y recibes el documento certificado por email. TuPatrimonio no cobra extra por firmar desde el extranjero, el precio es el mismo independiente de tu ubicación geográfica."
      }
    },
    {
      "@type": "Question",
      "name": "¿Qué documentos NO se pueden hacer online en Chile?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Por transparencia, NO todos los actos notariales se pueden realizar completamente online en Chile. Requieren presencialidad obligatoria según el Código Civil chileno: 1) Escrituras públicas de compraventa definitiva de inmuebles: Deben firmarse presencialmente ante notario para inscripción en Conservador de Bienes Raíces (Nota: La promesa de compraventa SÍ puede ser online), 2) Testamentos cerrados o abiertos: Exigen presencia física del testador ante notario y testigos, 3) Matrimonios: Requieren ceremonia presencial ante Oficial del Registro Civil, 4) Finiquitos laborales: Aunque el empleador puede firmar electrónicamente, el trabajador debe firmar presencialmente según el Código del Trabajo. Lo que SÍ puedes hacer 100% online con TuPatrimonio: Contratos de arriendo, Promesas de compraventa, Poderes simples y especiales, Declaraciones juradas, Mandatos, Cesiones de derechos, Contratos de prestación de servicios, Contratos de compraventa de bienes muebles, Reconocimiento de deuda, Autorizaciones de viaje para menores (con firma de ambos padres), Certificaciones de firma, Copias legalizadas, Protocolizaciones, y más del 90% de los documentos privados en Chile. La limitación existe porque el Código Civil (1855) y leyes especiales establecen formalidades para ciertos actos que aún no han sido actualizadas. Existen proyectos de ley en tramitación para modernizar estas normas."
      }
    }
  ]
};

export default function NotariaOnlineChilePage() {
  return (
    <>
      {/* JSON-LD Schemas para SEO y AEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      <div className="min-h-screen bg-[var(--tp-background-light)]">
        
        {/* SECCIÓN 1: HERO */}
        <HeroSection
          title={
            <>
                Notaría Online en Chile:<br />
                <span className="text-[var(--tp-brand)]">Firma tus Documentos Legales</span><br />
                en 5 Minutos sin Salir de Casa
            </>
          }
          subtitle="Gestionamos tu certificación notarial con validez legal en todo Chile, en menos de 24 horas. Firma electrónica simple y avanzada. Copia Legalizada, Protocolización y Firma Autorizada por Notario (FAN®). Más de 60.000 documentos gestionados. Cumplimiento de la Ley 19.799."
          trustBadges={[
            { icon: BadgeCheck, text: "Ley 19.799" },
            { component: <GoogleStatsBadge /> },
            { icon: Users, text: USERS_COUNT.textShort }
          ]}
          valueBullets={[
            {
              icon: Check,
              title: "Firmar en minutos, no días.",
              description: "Sin necesidad de traslados ni citas."
            },
            {
              icon: Clock,
              title: "Documento Listo en < 24 Horas",
              description: "94% procesados en < 6 horas hábiles"
            },
            {
              icon: Shield,
              title: "Seguro Legal Incluido",
              description: "Únicos en Chile con protección legal"
            }
          ]}
          ctaButtons={[
            {
              text: "Firma tu Documento Ahora",
              href: "https://tupatrimon.io/legalizacion-de-documentos-electronicos/",
              icon: FileSignature
            }
          ]}
          ctaSubtext="✓ Sin suscripciones • ✓ Disponible 24/7 • ✓ Crea tu cuenta gratis"
          bottomBadges={[
            { icon: Scale, text: "Distintas notarías<br />en alianza", description: "" },
            { icon: BadgeCheck, text: "Cumplimiento de<br />Ley 19.799", description: "" },
            { icon: Star, text: "4.8/5 Estrellas<br />+500 Reseñas", description: "" }
          ]}
          showImageotype={true}
        />

        {/* SECCIÓN 2: BENEFICIOS DESTACADOS - Con componentes shadcn/ui */}
        <section className="py-20 bg-background">
          <div className="max-w-7xl tp-container">
            <div className="text-center mb-16">
              <h2 className="mb-6">
                Una Plataforma, Todo Tu Patrimonio Protegido
              </h2>
              <p className="text-xl text-muted-foreground max-w-4xl mx-auto">
                TuPatrimonio no es solo firma electrónica. Es tu copiloto para todo lo que necesitas 
                en el mundo legal. Imagina tener un asistente personal que conoce las leyes, entiende 
                tus necesidades y te guía paso a paso.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Beneficio 1: IA */}
              <Card className="border-2 border-border hover:border-[var(--tp-brand)] hover:shadow-xl transition-all group">
                <CardHeader>
                  <div className="mb-4 group-hover:scale-110 transition-transform">
                    <IconContainer 
                      icon={Bot} 
                      variant="brand" 
                      shape="rounded" 
                      size="lg"
                    />
                  </div>
                  <CardTitle>Potenciado por IA</CardTitle>
                  <CardDescription>
                    Nuestra inteligencia artificial revisa tus documentos y detecta errores antes 
                    de enviarlos a la notaría. Como tener un abogado revisando todo.
                  </CardDescription>
                </CardHeader>
              </Card>

              {/* Beneficio 2: Remoto */}
              <Card className="border-2 border-border hover:border-[var(--tp-brand)] hover:shadow-xl transition-all group">
                <CardHeader>
                  <div className="mb-4 group-hover:scale-110 transition-transform">
                    <IconContainer 
                      icon={Globe} 
                      variant="brand" 
                      shape="rounded" 
                      size="lg"
                    />
                  </div>
                  <CardTitle>Desde Cualquier Lugar</CardTitle>
                  <CardDescription>
                    Tu casa, tu oficina, el extranjero. Solo necesitas internet. Nada de esperar turnos 
                    ni perder tiempo en oficinas.
                  </CardDescription>
                </CardHeader>
              </Card>

              {/* Beneficio 3: Rápido */}
              <Card className="border-2 border-border hover:border-[var(--tp-brand)] hover:shadow-xl transition-all group">
                <CardHeader>
                  <div className="mb-4 group-hover:scale-110 transition-transform">
                    <IconContainer 
                      icon={Zap} 
                      variant="brand" 
                      shape="rounded" 
                      size="lg"
                    />
                  </div>
                  <CardTitle>En Minutos, No en Días</CardTitle>
                  <CardDescription>
                    Lo que antes te tomaba semanas, ahora lo resuelves antes de que se enfríe tu café. 
                    Promedio de entrega: 2 horas.
                  </CardDescription>
                </CardHeader>
              </Card>

              {/* Beneficio 4: Transparente */}
              <Card className="border-2 border-border hover:border-[var(--tp-brand)] hover:shadow-xl transition-all group">
                <CardHeader>
                  <div className="mb-4 group-hover:scale-110 transition-transform">
                    <IconContainer 
                      icon={CheckCircle} 
                      variant="brand" 
                      shape="rounded" 
                      size="lg"
                    />
                  </div>
                  <CardTitle>Sin Letra Chica</CardTitle>
                  <CardDescription>
                    Cero tecnicismos, cero sorpresas. Todo explicado como si se lo contaras a un amigo. 
                    Transparencia total en cada paso.
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>
          </div>
        </section>

        {/* SECCIÓN 3: LO QUE DICEN NUESTROS USUARIOS */}
        <TestimonialsSection
          title="Lo Que Dicen Nuestros Usuarios"
          description="Historias reales de personas y empresas que transformaron sus procesos legales"
          showGoogleReviews={true}
          metrics={[
            { value: "+6 años", label: "De Trayectoria", description: "Brindando tranquilidad desde 2019" },
            { value: "", label: "", description: "" }, // Placeholder for GoogleStatsMetrics
            { value: USERS_COUNT.shortUpper, label: "Usuarios Atendidos", description: "Confiando en nosotros" },
            { value: "2 hrs", label: "Tiempo Promedio", description: "Entrega de documentos notariados" }
          ]}
        />

        {/* SECCIÓN 4: COMPARACIÓN DE BENEFICIOS */}
        <ComparisonTableSection
          title="¿Por qué elegir Notaría Online en Chile?"
          description="Descubre las ventajas reales de hacer tus trámites notariales 100% online vs. visitar una notaría física tradicional."
          rows={[
            {
              aspect: "Tiempo de gestión",
              icon: Clock,
              online: { value: "Menos de 24 horas", description: "Trámite completo desde tu casa", highlight: true },
              physical: { value: "3-7 días hábiles", description: "Múltiples visitas presenciales" }
            },
            {
              aspect: "Ubicación y desplazamiento",
              icon: MapPin,
              online: { value: "0 traslados", description: "100% desde donde estés", highlight: true },
              physical: { value: "2-3 visitas mínimo", description: "Tráfico, estacionamiento, tiempo perdido" }
            },
            {
              aspect: "Horario de atención",
              icon: Calendar,
              online: { value: "24/7", description: "Envía tu solicitud cuando quieras", highlight: true },
              physical: { value: "Lun-Vie 9:00-17:00", description: "Debes pedir permiso en tu trabajo" }
            },
            {
              aspect: "Seguimiento del trámite",
              icon: Smartphone,
              online: { value: "Tiempo real", description: "Notificaciones por WhatsApp y correo", highlight: true },
              physical: { value: "Debes llamar/ir", description: "Sin visibilidad del proceso" }
            },
            {
              aspect: "Entrega de documentos",
              icon: FileText,
              online: { value: "Instantánea digital", description: "Descarga inmediata + envío email", highlight: true },
              physical: { value: "Retiro presencial", description: "Otra visita para buscar documentos" }
            },
            {
              aspect: "Validez legal",
              icon: CheckCircle,
              online: { value: "100% legal", description: "Autorizada por Ley 19.799 (Firma Electrónica Avanzada)", highlight: true },
              physical: { value: "100% legal", description: "Firma manuscrita tradicional" }
            },
            {
              aspect: "Experiencia del cliente",
              icon: Handshake,
              online: { value: "Tranquilidad total", description: "Soporte proactivo y acompañamiento", highlight: true },
              physical: { value: "Variable", description: "Largas esperas, poca comunicación" }
            }
          ]}
          ctaText="¿Listo para hacer tus trámites de forma más inteligente?"
          ctaDescription="Miles de personas ya eligieron la tranquilidad de lo digital. Únete a ellos y experimenta la diferencia."
          ctaHref="https://tupatrimon.io/legalizacion-de-documentos-electronicos/"
        />

        {/* SECCIÓN 5: PROCESO PASO A PASO */}
        <ProcessStepsSection
          title="Cómo Funciona Nuestro Servicio de Gestión Notarial Online: 4 Simples Pasos"
          description="Proceso 100% digital, seguro y validado legalmente. De 5 minutos a 24 horas máximo."
          totalTime="Tiempo total: 5 minutos a 24 horas"
          steps={[
            {
              icon: FileSignature,
              title: "Elige tu documento",
              description: "Puedes usar nuestras plantillas automatizadas o subir tu propio documento. Contratos de arriendo, promesas de compraventa, poderes, declaraciones juradas y mucho más."
            },
            {
              icon: Smartphone,
              title: "Completa y firma electrónicamente",
              description: "Firma con validación biométrica facial, Clave Única o firma electrónica avanzada certificada. Todo el proceso toma menos de 5 minutos y funciona desde cualquier dispositivo."
            },
            {
              icon: Building,
              title: "Envío a notaría asociada",
              description: "Tu documento se envía automáticamente a nuestra red de notarías. Nuestros notarios revisan y validan el documento en 1-4 horas hábiles. Trabajamos con las mejores notarías de Chile."
            },
            {
              icon: Download,
              title: "Recibe tu documento",
              description: "Recibe tu documento notariado por email en < 24 horas. Descarga ilimitada, respaldo permanente y validez legal en todo Chile. Listo para usar en cualquier trámite público o privado inmediatamente."
            }
          ]}
          ctaText="Comenzar Ahora - Gratis"
          ctaSubtext="Paga solo por documento finalizado"
          ctaHref="https://tupatrimon.io/legalizacion-de-documentos-electronicos/"
        />

        {/* SECCIÓN 6: TIPOS DE DOCUMENTOS */}
        <DocumentsAvailable />

        {/* SECCIÓN 7: BENEFICIOS EMOCIONALES - Con componentes shadcn/ui */}
        <section className="py-20 bg-gradient-to-br from-[var(--tp-background-light)] to-background">
          <div className="max-w-7xl tp-container">
            <div className="text-center mb-16">
              <h2 className="mb-6">
                Más Allá de los Trámites: Recupera Tu Tiempo y Tu Tranquilidad
              </h2>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                Los beneficios reales que experimentarás al usar nuestra notaría online
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {/* Beneficio 1 */}
              <Card className="border-2 border-border hover:border-[var(--tp-brand)] hover:shadow-xl transition-all">
                <CardHeader>
                  <IconContainer 
                    icon={Moon} 
                    variant="brand" 
                    shape="rounded" 
                    size="lg" 
                    className="mb-4"
                  />
                  <CardTitle>Duerme Tranquilo</CardTitle>
                  <CardDescription>
                    Saber que tus documentos tienen validez legal y están bien hechos es un alivio 
                    enorme. Ya no más "¿y si algo está mal?" Por fin, paz mental.
                  </CardDescription>
                </CardHeader>
              </Card>

              {/* Beneficio 2 */}
              <Card className="border-2 border-border hover:border-[var(--tp-brand)] hover:shadow-xl transition-all">
                <CardHeader>
                  <IconContainer 
                    icon={Clock} 
                    variant="brand" 
                    shape="rounded" 
                    size="lg" 
                    className="mb-4"
                  />
                  <CardTitle>Recupera Tu Tiempo</CardTitle>
                  <CardDescription>
                    Esas horas (o días) que perdías yendo a notarías, haciendo filas, buscando 
                    información... ahora son tuyos. Para tu familia, tu negocio, o simplemente para descansar.
                  </CardDescription>
                </CardHeader>
              </Card>

              {/* Beneficio 3 */}
              <Card className="border-2 border-border hover:border-[var(--tp-brand)] hover:shadow-xl transition-all">
                <CardHeader>
                  <IconContainer 
                    icon={Crown} 
                    variant="brand" 
                    shape="rounded" 
                    size="lg" 
                    className="mb-4"
                  />
                  <CardTitle>Toma el Control</CardTitle>
                  <CardDescription>
                    Tu patrimonio, tus decisiones, tu ritmo. Sin depender de horarios de oficina 
                    ni de intermediarios. Tú mandas, nosotros te facilitamos el camino.
                  </CardDescription>
                </CardHeader>
              </Card>

              {/* Beneficio 4 */}
              <Card className="border-2 border-border hover:border-[var(--tp-brand)] hover:shadow-xl transition-all">
                <CardHeader>
                  <IconContainer 
                    icon={TrendingUp} 
                    variant="brand" 
                    shape="rounded" 
                    size="lg" 
                    className="mb-4"
                  />
                  <CardTitle>Haz Crecer lo que Construiste</CardTitle>
                  <CardDescription>
                    Cuando tus bases legales están sólidas, puedes enfocarte en lo que importa: 
                    hacer crecer tu negocio, invertir mejor, proteger a tu familia.
                  </CardDescription>
                </CardHeader>
              </Card>

              {/* Beneficio 5 */}
              <Card className="border-2 border-border hover:border-[var(--tp-brand)] hover:shadow-xl transition-all">
                <CardHeader>
                  <IconContainer 
                    icon={Globe} 
                    variant="brand" 
                    shape="rounded" 
                    size="lg" 
                    className="mb-4"
                  />
                  <CardTitle>Sin Fronteras</CardTitle>
                  <CardDescription>
                    Estés donde estés en el mundo, tu patrimonio está protegido 
                    y accesible. Firma desde cualquier país con validez legal en Chile.
                  </CardDescription>
                </CardHeader>
              </Card>

              {/* Beneficio 6 */}
              <Card className="border-2 border-border hover:border-[var(--tp-brand)] hover:shadow-xl transition-all">
                <CardHeader>
                  <IconContainer 
                    icon={MessageCircle} 
                    variant="brand" 
                    shape="rounded" 
                    size="lg" 
                    className="mb-4"
                  />
                  <CardTitle>Apoyo Humano Real</CardTitle>
                  <CardDescription>
                    Aunque la tecnología hace la magia, siempre hay personas reales detrás listas 
                    para ayudarte. Por WhatsApp, mail o videollamada. Como debe ser.
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>
          </div>
        </section>

        {/* SECCIÓN 8: ESTADÍSTICAS - Con componentes shadcn/ui */}
        <StatsSection variant="notaria" />

        {/* SECCIÓN 9: COMPARATIVA VS COMPETENCIA */}
        <CompetitorComparisonSection
          title="Lo Que Nos Hace Únicos en Notaría Online"
          description="Comparación de características con otras plataformas del mercado"
          highlightedColumn="TuPatrimonio"
          features={[
            { name: "Tiempo entrega", ours: { value: "< 24 hrs", highlight: true }, competitors: "24 - 48 hrs" },
            { name: "Tiempo de asistencia", ours: { value: "< 20 minutos", highlight: true }, competitors: "3 - 24 horas" },
            { name: "Cobertura legal incluida", ours: { value: "Sí (sin tope)", highlight: true }, competitors: "No" },
            { name: "Descuentos por alianzas", ours: { value: "Sí, disponibles", highlight: true }, competitors: "No" },
            { name: "Revisión legal previa", ours: { value: "Sí", highlight: true }, competitors: "Variable" },
            { name: "Reembolso si es rechazado", ours: { value: "100%", highlight: true }, competitors: "Variable" }
          ]}
          usps={[
            {
              icon: Shield,
              title: "Cobertura Legal Incluida Sin Tope",
              description: [
                "Somos los únicos gestores de servicios notariales online en Chile que incluyen una cobertura legal sin tope de monto en cada documento procesado.",
                "Esta protección legal cubre al gestor del pedido (tú) o a quien decidas ceder su beneficio, en caso de incumplimiento relacionado con el proceso de gestión notarial. Incluye asesoría legal especializada y respaldo en controversias."
              ]
            },
            {
              icon: DollarSign,
              title: "Transparencia y Accesibilidad Total",
              description: [
                "Sin costos ocultos, sin letra pequeña, sin sorpresas. Nuestro modelo 100% digital nos permite ofrecer servicios notariales accesibles para todos, eliminando las barreras de las notarías tradicionales.",
                "Sabes exactamente lo que pagas desde el primer momento. Nuestros precios son claros, fijos y predecibles. No cobramos por \"imprevistos\" ni agregamos cargos administrativos sorpresa. Tu tranquilidad financiera es parte de nuestro compromiso contigo."
              ]
            },
            {
              icon: FileCheck,
              title: "+90% de Documentos Privados de Chile",
              description: [
                "Más del 90% de los documentos privados en Chile se pueden gestionar completamente de forma online, sin necesidad de presencia física en notaría. Contratos, poderes, autorizaciones y más.",
                "Solo necesitas tu cédula o pasaporte, tu documento en PDF y conexión a internet. En menos de 24 horas tendrás tu documento firmado con plena validez legal. Sin traslados, sin filas, sin pérdida de tiempo. Tu tranquilidad, desde donde estés."
              ]
            }
          ]}
        />

        {/* SECCIÓN 10: VALIDEZ LEGAL */}
        <LegalValiditySection
          title="¿Es Legal una Notaría Online en Chile? Todo lo que Debes Saber"
          description="Respuestas claras sobre la validez jurídica de los documentos firmados digitalmente"
          icon={Scale}
          faqs={[
            {
              question: "¿Tiene validez legal un documento firmado online?",
              icon: CheckCircle,
              answer: (
                <>
                  <p className="text-lg font-semibold text-green-600">SÍ, tiene validez legal completa en Chile.</p>
                  <p>
                    La <strong>Ley 19.799 sobre Documentos Electrónicos, Firma Electrónica y Servicios de Certificación</strong>, 
                    promulgada en 2002, establece en su <strong>Artículo 3°</strong> que los actos y contratos otorgados o celebrados 
                    por personas naturales o jurídicas, suscritos mediante firma electrónica, serán válidos de la misma manera y 
                    producirán los mismos efectos que los celebrados por escrito y en soporte de papel.
                  </p>
                  <p>
                    Específicamente, el <strong>Artículo 4°</strong> señala: <em>"La firma electrónica, cualquiera sea su naturaleza, 
                    se mirará como firma manuscrita para todos los efectos legales, siempre que aquélla quede vinculada al 
                    documento electrónico de manera tal que, si éste es modificado, la firma es invalidada."</em>
                  </p>
                  <p>
                    Nuestros documentos cuentan con <strong>firma electrónica avanzada</strong> certificada por entidades acreditadas 
                    ante la Subsecretaría de Economía, lo que garantiza su reconocimiento en:
                  </p>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>Tribunales de Justicia de Chile (civiles, laborales, familiares)</li>
                    <li>Instituciones públicas (SII, Registro Civil, municipalidades)</li>
                    <li>Entidades financieras (bancos, cooperativas, cajas de compensación)</li>
                    <li>Universidades e instituciones educacionales</li>
                    <li>Empresas privadas y empleadores</li>
                    <li>Notarías físicas</li>
                  </ul>
                  <p className="font-semibold text-[var(--tp-brand)] mt-4">
                    Hemos procesado más de 60.000 documentos que han sido aceptados exitosamente en trámites legales, 
                    administrativos y comerciales en todo Chile.
                  </p>
                </>
              )
            },
            {
              question: "¿Qué dice la ley chilena sobre firma electrónica?",
              icon: BookOpen,
              answer: (
                <>
                  <p>
                    Chile cuenta con un marco legal robusto para firma electrónica desde hace más de 20 años. La legislación 
                    distingue dos tipos principales de firmas:
                  </p>
                  
                  <div className="bg-blue-50 dark:bg-blue-950 rounded-xl p-6 border border-blue-200 dark:border-blue-800 my-4">
                    <h4 className="font-bold text-foreground mb-2 flex items-center gap-2">
                      <Check className="w-5 h-5 text-blue-600" />
                      Firma Electrónica Simple
                    </h4>
                    <p className="text-sm">
                      Cualquier sonido, símbolo o proceso electrónico que permite al receptor identificar al autor. 
                      <strong> Menor seguridad jurídica</strong>. No requiere certificación por entidad acreditada. 
                      Útil para comunicaciones informales pero no recomendada para contratos importantes.
                    </p>
                  </div>

                  <div className="bg-green-50 dark:bg-green-950 rounded-xl p-6 border border-green-200 dark:border-green-800 my-4">
                    <h4 className="font-bold text-foreground mb-2 flex items-center gap-2">
                      <BadgeCheck className="w-5 h-5 text-green-600" />
                      Firma Electrónica Avanzada (FEA) - La que usamos
                    </h4>
                    <p className="text-sm mb-2">
                      Certificada por prestadores acreditados ante la <strong>Subsecretaría de Economía</strong>. 
                      Requisitos según Artículo 2° letra g) de la Ley 19.799:
                    </p>
                    <ul className="text-sm list-disc pl-6 space-y-1">
                      <li>Identificación inequívoca del firmante</li>
                      <li>Los datos de creación son exclusivos del firmante</li>
                      <li>Detecta cualquier alteración posterior del documento</li>
                      <li>Es susceptible de verificación por terceros</li>
                      <li>Cuenta con certificado de firma emitido por certificadora acreditada</li>
                    </ul>
                    <p className="text-sm mt-2 font-semibold text-green-700">
                      ✓ Equivalencia total con firma manuscrita para efectos legales
                    </p>
                  </div>

                  <p>
                    <strong>Certificadoras Acreditadas en Chile:</strong> Solo pueden operar empresas autorizadas por la 
                    Subsecretaría de Economía bajo estrictos estándares de seguridad (Decreto Supremo N° 81 de 2004). 
                    TuPatrimonio trabaja exclusivamente con certificadoras acreditadas oficialmente.
                  </p>

                  <p>
                    <strong>¿Cuándo es obligatoria cada tipo?</strong> Para contratos de arriendo, promesas de compraventa, 
                    mandatos, poderes y cualquier acto jurídico con consecuencias patrimoniales, se recomienda 
                    <strong> usar Firma Electrónica Avanzada</strong> para eliminar cualquier cuestionamiento posterior.
                  </p>
                </>
              )
            },
            {
              question: "¿En qué instituciones puedo usar documentos de notaría online?",
              icon: Building,
              answer: (
                <>
                  <p>
                    Los documentos gestionados a través de nuestro servicio son aceptados en <strong>todas las instituciones 
                    públicas y privadas de Chile</strong> que reconocen la Ley 19.799. Casos de uso verificados:
                  </p>

                  <div className="grid md:grid-cols-2 gap-4 my-4">
                    <div className="bg-card rounded-lg p-4 border border-border shadow-sm">
                      <h4 className="font-bold text-foreground mb-2 flex items-center gap-2">
                        <Building className="w-5 h-5 text-[var(--tp-brand)]" />
                        Instituciones Públicas
                      </h4>
                      <ul className="text-sm space-y-1">
                        <li>✓ Municipalidades (permisos, patentes)</li>
                        <li>✓ Servicio de Impuestos Internos (SII)</li>
                        <li>✓ Registro Civil</li>
                        <li>✓ Conservador de Bienes Raíces</li>
                        <li>✓ Tribunales de Justicia</li>
                        <li>✓ Ministerios y servicios públicos</li>
                      </ul>
                    </div>

                    <div className="bg-card rounded-lg p-4 border border-border shadow-sm">
                      <h4 className="font-bold text-foreground mb-2 flex items-center gap-2">
                        <Building className="w-5 h-5 text-[var(--tp-brand)]" />
                        Instituciones Privadas
                      </h4>
                      <ul className="text-sm space-y-1">
                        <li>✓ Bancos y entidades financieras</li>
                        <li>✓ Universidades e institutos</li>
                        <li>✓ Empresas empleadoras</li>
                        <li>✓ Inmobiliarias</li>
                        <li>✓ Compañías de seguros</li>
                        <li>✓ Notarías (protocolización adicional)</li>
                      </ul>
                    </div>
                  </div>
                </>
              )
            },
            {
              question: "¿Qué documentos NO se pueden hacer online?",
              icon: AlertCircle,
              answer: (
                <>
                  <p>
                    Por transparencia, es importante mencionar que <strong>NO todos los actos notariales</strong> se pueden 
                    realizar de forma completamente digital en Chile. Requieren presencialidad obligatoria:
                  </p>

                  <div className="bg-red-50 dark:bg-red-950 rounded-xl p-6 border border-red-200 dark:border-red-800 my-4">
                    <h4 className="font-bold text-red-900 dark:text-red-100 mb-3">Trámites que SÍ requieren notaría física:</h4>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-start gap-2">
                        <span className="text-red-600 font-bold">✗</span>
                        <div>
                          <strong>Escrituras públicas de compraventa definitiva de inmuebles:</strong> Por seguridad jurídica 
                          y para inscripción en Conservador de Bienes Raíces, deben firmarse presencialmente ante notario. 
                          <em>(Nota: La promesa de compraventa SÍ puede ser online)</em>
                        </div>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-red-600 font-bold">✗</span>
                        <div>
                          <strong>Testamentos cerrados o abiertos:</strong> El Código Civil exige presencia física del testador 
                          ante notario y testigos para validez del testamento.
                        </div>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-red-600 font-bold">✗</span>
                        <div>
                          <strong>Matrimonios:</strong> Requieren ceremonia presencial ante Oficial del Registro Civil.
                        </div>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-red-600 font-bold">✗</span>
                        <div>
                          <strong>Finiquitos de trabajo:</strong> Aunque los empleadores pueden firmar de forma electrónica, 
                          el trabajador debe firmar presencialmente.
                        </div>
                      </li>
                    </ul>
                  </div>

                  <div className="bg-green-50 dark:bg-green-950 rounded-xl p-6 border border-green-200 dark:border-green-800 my-4">
                    <h4 className="font-bold text-green-900 dark:text-green-100 mb-3">Lo que SÍ puedes hacer 100% online con TuPatrimonio:</h4>
                    <ul className="grid md:grid-cols-2 gap-2 text-sm">
                      <li className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-green-600" />
                        Contratos de arriendo
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-green-600" />
                        Promesas de compraventa
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-green-600" />
                        Poderes simples y especiales
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-green-600" />
                        Declaraciones juradas
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-green-600" />
                        Copias Legalizadas
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-green-600" />
                        Protocolizaciones
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-green-600" />
                        Firmas Autorizadas por Notario (FAN®)
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-green-600" />
                        y mucho más...
                      </li>
                    </ul>
                  </div>

                  <p>
                    <strong>¿Por qué esta limitación?</strong> El Código Civil chileno (1855) y leyes especiales posteriores 
                    establecen formalidades específicas para ciertos actos que aún no han sido actualizadas para contemplar 
                    la tecnología digital. Existen proyectos de ley en tramitación para modernizar estas normas.
                  </p>
                </>
              )
            }
          ]}
        />

        {/* SECCIÓN 11: PREGUNTAS FRECUENTES EXTENDIDAS */}
        <FAQSection
          title="Preguntas Frecuentes sobre Notaría Online en Chile"
          description="Todas las respuestas que necesitas antes de comenzar"
          categories={[
            {
              name: "Preguntas sobre el Proceso",
              icon: Clock,
              color: "blue",
              questions: [
                {
                  question: "¿Cómo firma una persona que no tiene firma electrónica?",
                  answer: "No necesitas tener firma electrónica previa. Nosotros te proporcionamos todo. Los firmantes verifican su identidad ingresando a un enlace que reciben por email y/o Whatsapp. No necesitas instalar programas ni tener lectores de tarjeta. Todo funciona desde el navegador web."
                },
                {
                  question: "¿Qué pasa si el documento es rechazado por la notaría?",
                  answer: "Reembolso 100% garantizado si el rechazo es por error nuestro. Si es por información incompleta del usuario, ofrecemos corrección gratuita y re-envío sin costo. Los documentos son revisados por IA o por nuestro equipo antes del proceso de firmas, por lo que el nivel de rechazos por parte de notaría es muy bajo."
                },
                {
                  question: "¿Puedo corregir el documento después de firmado?",
                  answer: "Una vez firmado y autorizado por la notaría, el documento NO puede modificarse (característica de seguridad legal). Sin embargo, ANTES de la firma, puedes revisar y modificar ilimitadamente."
                }
              ]
            },
            {
              name: "Preguntas sobre Validez Legal",
              icon: Scale,
              color: "purple",
              questions: [
                {
                  question: "¿Puedo usar este documento en un juicio?",
                  answer: "SÍ, absolutamente. La Ley 19.799 establece que documentos con firma electrónica son plenamente admisibles como prueba en juicio."
                },
                {
                  question: "¿Los bancos aceptan contratos de arriendo online?",
                  answer: "SÍ, todos los bancos chilenos aceptan contratos de arriendo con firma electrónica avanzada certificada. Lo presentas como cualquier contrato físico (PDF con certificados digitales). Algunos bancos solicitan también firma notarial, por lo tanto es siempre recomendable agregar algún servicio notarial, como copia legalizada, protocolización o firma autorizada por notario (FAN®)."
                },
                {
                  question: "¿Tiene el mismo valor legal que ir presencialmente?",
                  answer: "SÍ, exactamente el mismo valor legal. Artículo 3° y 4° de la Ley 19.799 establecen equivalencia total. La única diferencia técnica: firma manuscrita deja rastro físico en papel, firma electrónica avanzada deja rastro digital cifrado. Ambos producen los mismos efectos jurídicos. De hecho, la firma electrónica tiene ventajas adicionales: trazabilidad, imposible perder el documento, verificación instantánea de autenticidad, copias ilimitadas, y no se deteriora con el tiempo."
                }
              ]
            },
            {
              name: "Preguntas Técnicas",
              icon: Smartphone,
              color: "orange",
              questions: [
                {
                  question: "¿Necesito instalar algún programa?",
                  answer: "NO necesitas instalar nada. Todo funciona desde tu navegador web desde cualquier dispositivo. Solo necesitas: conexión a internet estable, cámara para verificación de identidad (puede ser de computador o celular). Funciona en: Windows, Mac, Linux, Android, iOS. No requiere extensiones, plugins ni lectores de tarjeta. La tecnología usada permite realizar el proceso completamente desde el navegador sin apps adicionales."
                },
                {
                  question: "¿Funciona desde el celular?",
                  answer: "SÍ, 100% optimizado para móviles. De hecho, la gran parte de nuestros usuarios firma desde celular. La interfaz es responsive y táctil. Pasos desde móvil: 1) Entra desde navegador de tu celular (no necesitas app), 2) Verifica tu identidad y firma el documento, 3) Recibe documento por email."
                },
                {
                  question: "¿Puedo firmar desde el extranjero?",
                  answer: "SÍ, desde cualquier país del mundo. Miles de expatriados chilenos y extranjeros usan nuestro servicio desde: Europa (España, Alemania, UK, Francia), América (USA, Canadá, Argentina, Brasil), Asia (China, Japón, Singapur), Oceanía (Australia, Nueva Zelanda). El documento tiene validez legal en Chile independiente de dónde lo firmes. Casos de uso frecuentes: Chilenos en el extranjero que necesitan firmar poderes para gestionar trámites en Chile, Extranjeros que arriendan propiedades en Chile sin viajar, Empresas multinacionales que contratan empleados remotos en Chile."
                }
              ]
            }
          ]}
          contactCta={{
            text: "Contactar Soporte 24/7",
            href: "/contacto"
          }}
        />

        {/* SECCIÓN 12: LLAMADO A LA ACCIÓN FINAL */}
        <FinalCTASection
          title="Comienza a Firmar tus Documentos Legales Hoy Mismo"
          description={`Únete a ${USERS_COUNT.text} que ya confían en el servicio de gestión notarial online más confiable, intuitivo y seguro de Chile`}
          cards={[
            {
              type: "personas",
              icon: Users,
              title: "Para Personas",
              description: "Firma tus documentos personales en minutos",
              benefits: [
                "Sin suscripción mensual",
                "Disponible 24/7 desde cualquier lugar",
                "Cobertura legal incluida"
              ],
              ctaText: "Firmar Documento",
              ctaHref: "https://tupatrimon.io/legalizacion-de-documentos-electronicos/",
              ctaIcon: FileSignature
            },
            {
              type: "empresas",
              icon: Building,
              title: "Para Empresas",
              description: "Soluciones corporativas de firma masiva",
              benefits: [
                "Descuentos especiales",
                "API para integración con tus sistemas",
                "Soporte técnico prioritario"
              ],
              ctaText: "¡Próximamente!",
              ctaHref: "#",
              ctaIcon: Building,
              badge: "EMPRESAS",
              variant: "outline"
            }
          ]}
          trustBar={[
            { icon: Lock, text: "Certificado SSL" },
            { icon: Scale, text: "Respaldado por Ley 19.799" },
            { icon: Shield, text: "Seguro legal incluido" }
          ]}
        />

      </div>
    </>
  );
}
