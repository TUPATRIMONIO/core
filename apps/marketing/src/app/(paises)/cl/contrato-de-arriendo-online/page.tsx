import type { Metadata } from "next";
import {
  HeroSection,
  TestimonialsSection,
  ComparisonTableSection,
  FAQSection,
  FinalCTASection,
} from "@/components/landing-sections";
import { GoogleStatsBadge } from "@/components/GoogleStatsDisplay";
import { 
  CheckCircle, Shield, Clock, FileSignature, Users, BadgeCheck,
  Star, Scale, AlertCircle, Lock, Smartphone, Check, Home,
  DollarSign, FileCheck, Building, Timer, ArrowRight, MapPin,
  Calendar, FileText, Handshake, Lightbulb
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import { Icon, IconContainer } from "@tupatrimonio/ui";
import { USERS_COUNT } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Contrato de Arriendo Online: Firma Fácil y con Tranquilidad | TuPatrimonio",
  description: "Haz tu contrato de arriendo online sin estrés. Firma desde casa, con notario y respaldo legal. Simple, seguro y listo en 24 horas. ¡Empieza ya!",
  keywords: "contrato de arriendo online, firmar contrato de arriendo online, contrato arriendo online, contrato de arriendo notarial, cómo hacer un contrato de arriendo, validez legal contrato arriendo online, contrato de arriendo chile",
  openGraph: {
    title: "Contrato de Arriendo Online: Firma Fácil y con Tranquilidad",
    description: "Haz tu contrato de arriendo online sin estrés. Firma desde casa, con notario y respaldo legal. Simple, seguro y listo en 24 horas.",
    url: "https://tupatrimonio.app/cl/contrato-de-arriendo-online",
    locale: "es_CL",
    type: "website",
    siteName: "TuPatrimonio",
    images: [
      {
        url: "https://tupatrimonio.app/images/contrato-arriendo-online-og.jpg",
        width: 1200,
        height: 630,
        alt: "Contrato de Arriendo Online - TuPatrimonio: Firma tus contratos sin estrés"
      }
    ],
  },
  alternates: {
    canonical: "https://tupatrimonio.app/cl/contrato-de-arriendo-online",
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
    title: "Contrato de Arriendo Online: Firma Fácil y con Tranquilidad",
    description: "Haz tu contrato de arriendo online sin estrés. Firma desde casa, con notario y respaldo legal.",
    images: ['https://tupatrimonio.app/images/contrato-arriendo-online-og.jpg'],
  }
};

// Schema.org JSON-LD - Organization
const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "LegalService",
  "name": "TuPatrimonio",
  "legalName": "TuPatrimonio - Contratos de Arriendo Online",
  "description": "Servicio de contratos de arriendo online con firma electrónica y certificación notarial. Tu tranquilidad, nuestra prioridad.",
  "url": "https://tupatrimonio.app",
  "logo": "https://tupatrimonio.app/images/logo-tupatrimonio.png",
  "image": "https://tupatrimonio.app/images/contrato-arriendo-online.jpg",
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
  "serviceType": "Contrato de Arriendo Online",
  "provider": {
    "@type": "Organization",
    "name": "TuPatrimonio",
    "url": "https://tupatrimonio.app"
  },
  "areaServed": {
    "@type": "Country",
    "name": "Chile"
  },
  "description": "Servicio de creación y firma electrónica de contratos de arriendo con certificación notarial. Proceso 100% online, seguro y con validez legal en todo Chile.",
  "hasOfferCatalog": {
    "@type": "OfferCatalog",
    "name": "Contratos de Arriendo Online",
    "itemListElement": [
      {
        "@type": "Offer",
        "itemOffered": {
          "@type": "Service",
          "name": "Contrato de Arriendo Online con Firma Electrónica",
          "description": "Contrato de arriendo con firma electrónica avanzada y certificación notarial. Validez legal completa en Chile."
        },
        "priceSpecification": {
          "@type": "PriceSpecification",
          "priceCurrency": "CLP",
          "price": "Variable según tipo de firma electrónica y servicios notariales adicionales"
        },
        "availability": "https://schema.org/InStock",
        "url": "https://tupatrimon.io/legalizacion-de-documentos-electronicos/"
      }
    ]
  },
  "audience": {
    "@type": "Audience",
    "audienceType": "Arrendadores y arrendatarios en Chile"
  },
  "serviceOutput": "Contrato de arriendo firmado digitalmente con validez legal según Ley 19.799"
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
      "name": "Contrato de Arriendo Online",
      "item": "https://tupatrimonio.app/cl/contrato-de-arriendo-online"
    }
  ]
};

// FAQ Schema
const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "¿Es realmente seguro firmar un contrato de arriendo online?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "SÍ, 100%. Desde 2002 en Chile las firmas electrónicas tienen el mismo valor legal que las firmas en papel. Tu contrato tiene la misma validez que si lo hubieras firmado presencialmente en una notaría. Además, un notario real lo revisa y certifica. Usamos los mismos estándares de seguridad que los bancos."
      }
    },
    {
      "@type": "Question",
      "name": "¿Qué pasa si me equivoco en algún dato?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Puedes modificar TODO antes de que todos firmen. El sistema te deja revisar el contrato completo y hacer cambios las veces que necesites. Una vez que todos firman, ahí sí queda sellado. Pero hasta ese momento, tienes control total para corregir lo que sea."
      }
    },
    {
      "@type": "Question",
      "name": "¿Sirve si el arrendatario no paga o no quiere irse?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Sí. Tu contrato de arriendo online certificado por notario tiene TODO el peso legal que necesitas. Si hay problemas de pago o el arrendatario no quiere desocupar, puedes ir a tribunales con este documento. De hecho, es mucho mejor que un contrato hecho a mano sin notario."
      }
    },
    {
      "@type": "Question",
      "name": "¿Cuánto se demora realmente?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "El proceso de llenar los datos y firmar te toma unos 15-20 minutos en total. Luego, el notario tiene hasta 48 horas para certificar el documento, pero generalmente lo hace en menos de 24 horas. Mucho más rápido que coordinar para ir todos a una notaría."
      }
    },
    {
      "@type": "Question",
      "name": "¿Los bancos aceptan contratos de arriendo con firma electrónica online?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "SÍ, todos los bancos chilenos aceptan contratos de arriendo con firma electrónica avanzada certificada según la Ley 19.799. Se presentan como cualquier contrato físico. Algunos bancos solicitan adicionalmente un servicio notarial complementario como copia legalizada, protocolización o Firma Autorizada por Notario (FAN®)."
      }
    },
    {
      "@type": "Question",
      "name": "¿Puedo firmar documentos online desde el extranjero?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "SÍ, puedes firmar documentos online con validez legal en Chile desde cualquier país del mundo. Miles de chilenos expatriados y extranjeros usan nuestro servicio. El documento tiene plena validez legal en Chile independientemente de dónde lo firmes."
      }
    },
    {
      "@type": "Question",
      "name": "¿Necesito algún documento especial?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Necesitas la cédula de identidad de todos los que van a firmar (arrendador, arrendatario, aval si hay), los datos de la propiedad (dirección, si es casa o depto, etc.), y nada más. Algunos competidores te piden un montón de papeles extras, pero nosotros lo hacemos simple."
      }
    },
    {
      "@type": "Question",
      "name": "¿Es más barato que ir a la notaría?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "El trámite en notaría puede costar similar o incluso más. Pero acá lo que estás ahorrando es TIEMPO y ESTRÉS: no pierdes medio día, no gastas en transporte, no tienes que coordinar horarios de 3-4 personas, y no te expones a errores que te obliguen a volver."
      }
    }
  ]
};

// Hero Section Props
const heroProps = {
  title: (
    <>
      Contrato de Arriendo Online:<br />
      <span className="text-[var(--tp-brand)]">Sin Estrés, Sin Notarías,</span><br />
      Con Total Tranquilidad
    </>
  ),
  subtitle: "¿Te estresa pensar en coordinar horarios, hacer filas en notaría y esperar días solo para firmar un contrato de arriendo? Lo entendemos perfectamente. Arrendar puede ser un dolor de cabeza, pero no tiene por qué serlo. Firma desde tu casa, en minutos, con total validez legal y el respaldo de un notario.",
  trustBadges: [
    { icon: BadgeCheck, text: "Ley 19.799" },
    { component: <GoogleStatsBadge /> },
    { icon: Users, text: USERS_COUNT.textShort }
  ],
  valueBullets: [
    {
      icon: Check,
      title: "Duerme Tranquilo",
      description: "Notario real certifica tu contrato"
    },
    {
      icon: Clock,
      title: "Listo en < 24 Horas",
      description: "Sin coordinar agendas ni filas"
    },
    {
      icon: Shield,
      title: "Estás Protegido",
      description: "100% legal y con respaldo"
    }
  ],
  ctaButtons: [
    {
      text: "Crear Mi Contrato Ahora",
      href: "https://tupatrimon.io/legalizacion-de-documentos-electronicos/",
      icon: FileSignature
    }
  ],
  ctaSubtext: "✓ Listo en 24 horas | ✓ Con notario | ✓ 100% legal",
  bottomBadges: [
    { 
      icon: Scale, 
      text: "Distintas notarías<br />en alianza",
      description: "" 
    },
    { 
      icon: BadgeCheck, 
      text: "Cumplimiento de<br />Ley 19.799",
      description: "" 
    },
    { 
      icon: Star, 
      text: "4.8/5 Estrellas<br />+500 Reseñas",
      description: "" 
    }
  ]
};

// Comparison Table Props
const comparisonProps = {
  title: "¿Por qué elegir Contrato de Arriendo Online?",
  description: "Descubre las ventajas reales de hacer tu contrato de arriendo 100% online vs. visitar una notaría física tradicional.",
  rows: [
    {
      aspect: "Tiempo de gestión",
      icon: Clock,
      online: {
        value: "Menos de 24 horas",
        description: "Trámite completo desde tu casa",
        highlight: true
      },
      physical: {
        value: "3-7 días hábiles",
        description: "Múltiples visitas presenciales"
      }
    },
    {
      aspect: "Ubicación y desplazamiento",
      icon: MapPin,
      online: {
        value: "0 traslados",
        description: "100% desde donde estés",
        highlight: true
      },
      physical: {
        value: "2-3 visitas mínimo",
        description: "Tráfico, estacionamiento, tiempo perdido"
      }
    },
    {
      aspect: "Horario de atención",
      icon: Calendar,
      online: {
        value: "24/7",
        description: "Envía tu solicitud cuando quieras",
        highlight: true
      },
      physical: {
        value: "Lun-Vie 9:00-17:00",
        description: "Debes pedir permiso en tu trabajo"
      }
    },
    {
      aspect: "Seguimiento del trámite",
      icon: Smartphone,
      online: {
        value: "Tiempo real",
        description: "Notificaciones por WhatsApp y correo",
        highlight: true
      },
      physical: {
        value: "Debes llamar/ir",
        description: "Sin visibilidad del proceso"
      }
    },
    {
      aspect: "Entrega de documentos",
      icon: FileText,
      online: {
        value: "Instantánea digital",
        description: "Descarga inmediata + envío email",
        highlight: true
      },
      physical: {
        value: "Retiro presencial",
        description: "Otra visita para buscar documentos"
      }
    },
    {
      aspect: "Validez legal",
      icon: CheckCircle,
      online: {
        value: "100% legal",
        description: "Autorizada por Ley 19.799",
        highlight: true
      },
      physical: {
        value: "100% legal",
        description: "Firma manuscrita tradicional"
      }
    },
    {
      aspect: "Experiencia del cliente",
      icon: Handshake,
      online: {
        value: "Tranquilidad total",
        description: "Soporte proactivo y acompañamiento",
        highlight: true
      },
      physical: {
        value: "Variable",
        description: "Largas esperas, poca comunicación"
      }
    }
  ],
  ctaText: "¿Listo para hacer tu contrato de forma más inteligente?",
  ctaDescription: "Miles de personas ya eligieron la tranquilidad de lo digital. Únete a ellos y experimenta la diferencia.",
  ctaHref: "https://tupatrimon.io/legalizacion-de-documentos-electronicos/"
};

// Testimonials Section Props
const testimonialsProps = {
  title: "Lo Que Dicen Quienes Ya lo Usaron",
  description: "No nos creas a nosotros. Mejor créele a quienes ya pasaron por esto",
  showGoogleReviews: true,
  metrics: [
    { value: "+6 años", label: "De Trayectoria", description: "Brindando tranquilidad desde 2019" },
    { value: "", label: "", description: "" }, // GoogleStatsMetrics se inserta automáticamente
    { value: USERS_COUNT.shortUpper, label: "Usuarios Atendidos", description: "Confiando en nosotros" },
    { value: "2 hrs", label: "Tiempo Promedio", description: "Entrega de documentos notariados" }
  ]
};

// FAQ Section Props
const faqProps = {
  title: "Preguntas Que Todos se Hacen (Y Que Está Bien Hacer)",
  description: "Mira, es normal tener dudas. Nadie quiere meter la pata con algo tan importante. Así que aquí están las preguntas que TODOS nos hacen:",
  categories: [
    {
      name: "Preguntas sobre el Proceso",
      icon: Clock,
      color: "blue",
      questions: [
        {
          question: "¿Es realmente seguro firmar un contrato de arriendo online?",
          answer: "SÍ, 100%. Mira, desde 2002 en Chile las firmas electrónicas tienen el mismo valor legal que las firmas en papel. Es decir, tu contrato tiene la misma validez que si lo hubieras firmado presencialmente en una notaría. Además, un notario real lo revisa y certifica. No es un robot, es una persona. Y sobre la seguridad digital, usamos los mismos estándares que los bancos. Tu información está protegida."
        },
        {
          question: "¿Qué pasa si me equivoco en algún dato?",
          answer: "Respira tranquilo: puedes modificar TODO antes de que todos firmen. El sistema te deja revisar el contrato completo y hacer cambios las veces que necesites. Una vez que todos firman, ahí sí queda 'sellado'. Pero hasta ese momento, tienes control total para corregir lo que sea."
        },
        {
          question: "¿Cuánto se demora realmente?",
          answer: "El proceso de llenar los datos y firmar te toma unos 15-20 minutos en total. Luego, el notario tiene hasta 48 horas para certificar el documento, pero generalmente lo hace en menos de 24 horas. Entonces, desde que empiezas hasta que lo recibes certificado, es aproximadamente 1 día hábil. Mucho más rápido que coordinar para ir todos a una notaría."
        }
      ]
    },
    {
      name: "Preguntas sobre Validez Legal",
      icon: Scale,
      color: "purple",
      questions: [
        {
          question: "¿Sirve si el arrendatario no paga o no quiere irse?",
          answer: "Sí. Tu contrato de arriendo online certificado por notario tiene TODO el peso legal que necesitas. Si hay problemas de pago o el arrendatario no quiere desocupar, puedes ir a tribunales con este documento. De hecho, es mucho mejor que un contrato 'hecho a mano' sin notario, porque ante un juez, esto es evidencia sólida de los acuerdos que hicieron."
        },
        {
          question: "¿Los bancos aceptan contratos de arriendo con firma electrónica?",
          answer: "SÍ, todos los bancos chilenos aceptan contratos de arriendo con firma electrónica avanzada certificada. Lo presentas como cualquier contrato físico (PDF con certificados digitales). Algunos bancos solicitan también firma notarial, por lo tanto es siempre recomendable agregar algún servicio notarial, como copia legalizada, protocolización o firma autorizada por notario (FAN®)."
        },
        {
          question: "¿Tiene el mismo valor legal que ir presencialmente?",
          answer: "SÍ, exactamente el mismo valor legal. La Ley 19.799 establece equivalencia total. La única diferencia técnica: firma manuscrita deja rastro físico en papel, firma electrónica avanzada deja rastro digital cifrado. Ambos producen los mismos efectos jurídicos. De hecho, la firma electrónica tiene ventajas adicionales: trazabilidad, imposible perder el documento, verificación instantánea de autenticidad, copias ilimitadas, y no se deteriora con el tiempo."
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
          answer: "NO necesitas instalar nada. Todo funciona desde tu navegador web desde cualquier dispositivo. Solo necesitas: conexión a internet estable, cámara para verificación de identidad (puede ser de computador o celular). Funciona en: Windows, Mac, Linux, Android, iOS. No requiere extensiones, plugins ni lectores de tarjeta."
        },
        {
          question: "¿Funciona desde el celular?",
          answer: "SÍ, 100% optimizado para móviles. De hecho, la gran parte de nuestros usuarios firma desde celular. La interfaz es responsive y táctil. Pasos desde móvil: 1) Entra desde navegador de tu celular (no necesitas app), 2) Verifica tu identidad y firma el documento, 3) Recibe documento por email."
        },
        {
          question: "¿Puedo firmar desde el extranjero?",
          answer: "SÍ, desde cualquier país del mundo. Miles de expatriados chilenos y extranjeros usan nuestro servicio desde Europa (España, Alemania, UK, Francia), América (USA, Canadá, Argentina, Brasil), Asia (China, Japón, Singapur), Oceanía (Australia, Nueva Zelanda). El documento tiene validez legal en Chile independiente de dónde lo firmes."
        },
        {
          question: "¿Necesito algún documento especial?",
          answer: "Necesitas: la cédula de identidad de todos los que van a firmar (arrendador, arrendatario, aval si hay), los datos de la propiedad (dirección, si es casa o depto, etc.), y nada más, en serio. Algunos competidores te piden un montón de papeles extras (como el Certificado de Dominio Vigente), pero nosotros lo hacemos simple."
        }
      ]
    }
  ],
  contactCta: {
    text: "Contactar Soporte 24/7",
    href: "/contacto"
  }
};

// Final CTA Section Props
const finalCtaProps = {
  title: "Comienza a Firmar tu Contrato de Arriendo Hoy Mismo",
  description: `Únete a ${USERS_COUNT.text} que ya confían en el servicio más confiable, intuitivo y seguro de Chile. Duerme tranquilo sabiendo que tu contrato está bien hecho.`,
  cards: [
    {
      type: "personas" as const,
      icon: Users,
      title: "Para Personas",
      description: "Firma tu contrato de arriendo en minutos",
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
      type: "empresas" as const,
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
      badge: "EMPRESAS",
      variant: "outline" as const
    }
  ],
  trustBar: [
    { icon: Lock, text: "Certificado SSL" },
    { icon: Scale, text: "Respaldado por Ley 19.799" },
    { icon: Shield, text: "Seguro legal incluido" }
  ]
};

export default function ContratoArriendoOnlinePage() {
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
        <HeroSection {...heroProps} />

        {/* SECCIÓN 2: BENEFICIOS EMOCIONALES (CUSTOM) */}
        <section className="py-20 bg-background">
          <div className="max-w-7xl tp-container">
            <div className="text-center mb-12">
              <h2 className="mb-6">
                ¿Por Qué Un Contrato de Arriendo Online Te Cambia la Vida?
              </h2>
              
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
                Mira, sabemos que arrendar puede dar nervios. Ya sea que estés arrendando tu casa por primera vez o que seas arrendatario buscando un lugar donde vivir, las preocupaciones son reales:
              </p>
              
              <ul className="max-w-3xl mx-auto text-left space-y-4 mb-12">
                <li className="flex items-start gap-3 text-lg text-foreground/80">
                  <AlertCircle className="w-6 h-6 text-[var(--tp-error)] flex-shrink-0 mt-1" />
                  <div>
                    <strong>"¿Y si el arrendatario no me paga?"</strong> - El miedo número uno de todo arrendador
                  </div>
                </li>
                <li className="flex items-start gap-3 text-lg text-foreground/80">
                  <AlertCircle className="w-6 h-6 text-[var(--tp-error)] flex-shrink-0 mt-1" />
                  <div>
                    <strong>"¿Y si me están estafando?"</strong> - La inseguridad que todos sentimos
                  </div>
                </li>
                <li className="flex items-start gap-3 text-lg text-foreground/80">
                  <AlertCircle className="w-6 h-6 text-[var(--tp-error)] flex-shrink-0 mt-1" />
                  <div>
                    <strong>"¿Cómo coordino para que todos vayamos a la notaría?"</strong> - La pesadilla logística
                  </div>
                </li>
                <li className="flex items-start gap-3 text-lg text-foreground/80">
                  <AlertCircle className="w-6 h-6 text-[var(--tp-error)] flex-shrink-0 mt-1" />
                  <div>
                    <strong>"¿Estará bien hecho este contrato?"</strong> - La duda que no te deja dormir
                  </div>
                </li>
              </ul>

              <p className="text-xl text-foreground/80 max-w-3xl mx-auto mb-12">
                Por eso creamos algo diferente. Un <strong>contrato de arriendo online</strong> que no solo es rápido, sino que te da la tranquilidad de saber que estás protegido. Sin salir de tu casa. Sin perder tiempo. <strong>Sin estrés.</strong>
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              <Card className="border-2 border-border hover:border-[var(--tp-brand)] hover:shadow-xl transition-all">
                <CardHeader>
                  <IconContainer 
                    icon={Shield} 
                    variant="brand" 
                    shape="rounded" 
                    size="lg" 
                    className="mb-4"
                  />
                  <CardTitle>Duerme Tranquilo</CardTitle>
                  <CardDescription>
                    Tu contrato está revisado y certificado por un notario real. Tiene TODO el peso legal que necesitas si algo sale mal.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="border-2 border-border hover:border-[var(--tp-brand)] hover:shadow-xl transition-all">
                <CardHeader>
                  <IconContainer 
                    icon={Clock} 
                    variant="brand" 
                    shape="rounded" 
                    size="lg" 
                    className="mb-4"
                  />
                  <CardTitle>Ahorra Tiempo (Y Estrés)</CardTitle>
                  <CardDescription>
                    Olvídate de coordinar agendas, hacer filas o tomar medio día libre. Firma desde tu celular mientras tomas café en tu casa.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="border-2 border-border hover:border-[var(--tp-brand)] hover:shadow-xl transition-all">
                <CardHeader>
                  <IconContainer 
                    icon={CheckCircle} 
                    variant="brand" 
                    shape="rounded" 
                    size="lg" 
                    className="mb-4"
                  />
                  <CardTitle>Estás Protegido</CardTitle>
                  <CardDescription>
                    No más contratos hechos "a mano" que no sirven. Esto es un documento legal con todas las de la ley. Si hay problemas, estás respaldado.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="border-2 border-border hover:border-[var(--tp-brand)] hover:shadow-xl transition-all">
                <CardHeader>
                  <IconContainer 
                    icon={Handshake} 
                    variant="brand" 
                    shape="rounded" 
                    size="lg" 
                    className="mb-4"
                  />
                  <CardTitle>Para Todos</CardTitle>
                  <CardDescription>
                    Ya seas arrendador o arrendatario, esto te protege. Porque cuando todos están tranquilos, todo fluye mejor.
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>
          </div>
        </section>

        {/* SECCIÓN 3: EDUCACIÓN (CUSTOM) */}
        <section className="py-20 bg-gradient-to-br from-background to-[var(--tp-background-light)] dark:to-background">
          <div className="max-w-7xl tp-container">
            <div className="max-w-4xl mx-auto">
              <h2 className="mb-6 text-center">
                ¿Qué Es Un Contrato de Arriendo Online y Por Qué Lo Necesitas?
              </h2>
              
              <p className="text-xl text-foreground/80 mb-6">
                Ok, vamos a lo simple: un <strong>contrato de arriendo</strong> es ese papel (bueno, ahora documento digital) donde tú y la otra persona acuerdan las "reglas del juego" cuando alguien va a vivir en una casa que no es suya.
              </p>
              
              <p className="text-xl text-foreground/80 mb-8">
                Piénsalo como las reglas de un juego de mesa: todos necesitan saber cuánto se paga, cuándo se paga, qué pasa si se rompe algo, cuánto tiempo dura el acuerdo, etc. Sin reglas claras, empiezan los problemas.
              </p>

              <h3 className="mb-4">¿Y el "online" qué significa?</h3>
              <p className="text-lg text-foreground/80 mb-4">
                Simple: que no tienes que moverte de tu casa. Todo el proceso lo haces por internet:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-lg text-foreground/80 mb-8">
                <li>Llenas los datos desde tu computador o celular</li>
                <li>Las firmas se hacen digitalmente (sí, son 100% válidas)</li>
                <li>Un notario lo revisa y le pone su sello</li>
                <li>Y listo, lo recibes en tu email</li>
              </ul>

              <Card className="bg-muted border-muted-foreground/20 mb-8">
                <CardHeader>
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-[var(--tp-brand-10)] flex items-center justify-center flex-shrink-0">
                      <Lightbulb className="w-5 h-5 text-[var(--tp-brand)]" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">¿Pero es legal firmar por internet?</CardTitle>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground leading-relaxed">
                    ¡Totalmente! Desde el 2002 en Chile existe una ley (la 19.799, pero no te preocupes del nombre) que dice que <strong>firmar digitalmente tiene el mismo valor que firmar con lápiz en papel</strong>. Es decir, tu <strong>contrato de arriendo online</strong> vale IGUAL que uno firmado en notaría presencialmente.
                  </p>
                </CardContent>
              </Card>

              <h3 className="mb-4">¿Por qué es mejor que ir a la notaría?</h3>
              <p className="text-lg text-foreground/80 mb-6">
                No vamos a decirte que ir a la notaría es "malo". Pero seamos honestos:
              </p>

              <div className="grid md:grid-cols-2 gap-6">
                <Card className="bg-[var(--tp-error-light)] border-[var(--tp-error-border)]">
                  <CardHeader>
                    <CardTitle className="text-[var(--tp-error)] flex items-center gap-2">
                      <AlertCircle className="w-5 h-5" />
                      Ir a Notaría (la forma tradicional)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-muted-foreground">
                      <li>• Tienes que coordinar horarios de TODAS las personas</li>
                      <li>• Perder medio día (o día completo) para el trámite</li>
                      <li>• Hacer fila y esperar tu turno</li>
                      <li>• Pagar el trámite ALLÁ (y a veces sale más caro)</li>
                      <li>• Rezar para que todo salga bien a la primera</li>
                      <li>• Si hay un error, volver a empezar</li>
                    </ul>
                  </CardContent>
                </Card>

                <Card className="bg-[var(--tp-success-light)] border-[var(--tp-success-border)]">
                  <CardHeader>
                    <CardTitle className="text-[var(--tp-success)] flex items-center gap-2">
                      <CheckCircle className="w-5 h-5" />
                      Contrato Online (la forma inteligente)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-muted-foreground">
                      <li>• Cada uno firma cuando puede, desde donde esté</li>
                      <li>• Todo en 15-20 minutos (en serio)</li>
                      <li>• Sin filas, sin esperas</li>
                      <li>• Precio fijo y transparente</li>
                      <li>• Puedes revisar todo antes de confirmar</li>
                      <li>• Si hay error, lo corriges en segundos</li>
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* SECCIÓN 4: COMPARISON TABLE */}
        <ComparisonTableSection {...comparisonProps} />

        {/* SECCIÓN 5: PROCESO (CUSTOM - 6 PASOS) */}
        <section id="como-funciona" className="py-20 bg-gradient-to-br from-[var(--tp-background-light)] to-background">
          <div className="max-w-7xl tp-container">
            <div className="text-center mb-16">
              <h2 className="mb-4">
                Cómo Funciona (Más Simple Imposible)
              </h2>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                No te vamos a complicar la vida. Este es el proceso, paso a paso, en lenguaje humano:
              </p>
              <div className="inline-flex items-center gap-2 mt-4 px-6 py-3 bg-card rounded-full shadow-md border border-border">
                <Timer className="w-5 h-5 text-[var(--tp-brand)]" />
                <span className="font-bold text-foreground">Tiempo total: 15 minutos a 24 horas</span>
              </div>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {/* Paso 1 */}
              <Card className="hover:shadow-xl transition-shadow relative pt-8">
                <div className="absolute -top-6 left-1/2 transform -translate-x-1/2">
                  <div className="w-12 h-12 rounded-full bg-[var(--tp-brand)] text-white flex items-center justify-center text-2xl font-bold shadow-lg">
                    1
                  </div>
                </div>
                <CardHeader>
                  <CardTitle>Llenas los Datos (5 minutos)</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-muted-foreground leading-relaxed">
                    Te preguntamos lo básico: dirección de la propiedad, cuánto es la renta, quién arrienda, quién es el dueño, etc. Como cuando llenas un formulario cualquiera. <strong>Sin letra chica, sin trampa.</strong>
                  </p>
                  <Card className="bg-muted border-muted-foreground/20">
                    <CardContent className="p-3 flex gap-2">
                      <Lightbulb className="w-4 h-4 text-[var(--tp-brand)] flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-muted-foreground">
                        <strong>Tip:</strong> Ten a mano la cédula de identidad de todos los que van a firmar. La vas a necesitar.
                      </p>
                    </CardContent>
                  </Card>
                </CardContent>
              </Card>

              {/* Paso 2 */}
              <Card className="hover:shadow-xl transition-shadow relative pt-8">
                <div className="absolute -top-6 left-1/2 transform -translate-x-1/2">
                  <div className="w-12 h-12 rounded-full bg-[var(--tp-brand)] text-white flex items-center justify-center text-2xl font-bold shadow-lg">
                    2
                  </div>
                </div>
                <CardHeader>
                  <CardTitle>Revisas Que Todo Esté Bien (3 minutos)</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-muted-foreground leading-relaxed">
                    Antes de seguir, te mostramos el contrato completo. Lo puedes leer con calma. <strong>Si algo no te gusta o ves un error, lo cambias ahí mismo.</strong> Nadie te apura.
                  </p>
                  <Card className="bg-muted border-muted-foreground/20">
                    <CardContent className="p-3 flex gap-2">
                      <Lightbulb className="w-4 h-4 text-[var(--tp-brand)] flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-muted-foreground">
                        <strong>Tip:</strong> Lee especialmente la parte de "cuánto se paga" y "cuándo se paga". Son las dos cosas que más problemas causan si no están claras.
                      </p>
                    </CardContent>
                  </Card>
                </CardContent>
              </Card>

              {/* Paso 3 */}
              <Card className="hover:shadow-xl transition-shadow relative pt-8">
                <div className="absolute -top-6 left-1/2 transform -translate-x-1/2">
                  <div className="w-12 h-12 rounded-full bg-[var(--tp-brand)] text-white flex items-center justify-center text-2xl font-bold shadow-lg">
                    3
                  </div>
                </div>
                <CardHeader>
                  <CardTitle>Pagas (1 minuto)</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground leading-relaxed">
                    Con tarjeta de crédito o débito. Nada del otro mundo. Y tranquilo: <strong>si algo sale mal después, te devolvemos tu dinero</strong>. Así de simple.
                  </p>
                </CardContent>
              </Card>

              {/* Paso 4 */}
              <Card className="hover:shadow-xl transition-shadow relative pt-8">
                <div className="absolute -top-6 left-1/2 transform -translate-x-1/2">
                  <div className="w-12 h-12 rounded-full bg-[var(--tp-brand)] text-white flex items-center justify-center text-2xl font-bold shadow-lg">
                    4
                  </div>
                </div>
                <CardHeader>
                  <CardTitle>Todos Firman Digitalmente (5-10 min)</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-muted-foreground leading-relaxed">
                    Le llega un correo a cada persona que tiene que firmar. Entran desde su celular (o computador), dibujan su firma con el dedo, y listo. <strong>Cada uno firma cuando puede, no tienen que estar juntos.</strong>
                  </p>
                  <Card className="bg-[var(--tp-success-light)] border-[var(--tp-success-border)]">
                    <CardContent className="p-3 flex gap-2">
                      <Lock className="w-4 h-4 text-[var(--tp-success)] flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-muted-foreground">
                        <strong>Sobre la seguridad:</strong> Sí, es seguro. Usamos el mismo sistema que los bancos usan para sus apps. Tu identidad queda verificada y nadie puede firmar por ti.
                      </p>
                    </CardContent>
                  </Card>
                </CardContent>
              </Card>

              {/* Paso 5 */}
              <Card className="hover:shadow-xl transition-shadow relative pt-8">
                <div className="absolute -top-6 left-1/2 transform -translate-x-1/2">
                  <div className="w-12 h-12 rounded-full bg-[var(--tp-brand)] text-white flex items-center justify-center text-2xl font-bold shadow-lg">
                    5
                  </div>
                </div>
                <CardHeader>
                  <CardTitle>El Notario Lo Certifica (24 horas)</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground leading-relaxed">
                    Un notario real (sí, de verdad) revisa tu contrato y le pone su sello digital. Esto pasa automáticamente. Tú no tienes que hacer nada más.
                  </p>
                </CardContent>
              </Card>

              {/* Paso 6 */}
              <Card className="hover:shadow-xl transition-shadow relative pt-8">
                <div className="absolute -top-6 left-1/2 transform -translate-x-1/2">
                  <div className="w-12 h-12 rounded-full bg-[var(--tp-brand)] text-white flex items-center justify-center text-2xl font-bold shadow-lg">
                    6
                  </div>
                </div>
                <CardHeader>
                  <CardTitle>Lo Recibes en Tu Email (¡Listo!)</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-muted-foreground leading-relaxed">
                    Te llega el PDF con tu <strong>contrato de arriendo online</strong> firmado y notariado. Lo puedes imprimir, guardar, mandar por WhatsApp. Lo que necesites.
                  </p>
                  <Card className="bg-[var(--tp-brand-5)] border-[var(--tp-brand-20)]">
                    <CardContent className="p-3 flex gap-2">
                      <CheckCircle className="w-4 h-4 text-[var(--tp-brand)] flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-muted-foreground">
                        <strong>Ya está. Puedes respirar tranquilo.</strong> Tienes tu contrato 100% legal y estás protegido.
                      </p>
                    </CardContent>
                  </Card>
                </CardContent>
              </Card>
            </div>

            <div className="mt-12 text-center">
              <a href="https://tupatrimon.io/legalizacion-de-documentos-electronicos/" rel="noopener noreferrer nofollow">
                <Button 
                  size="lg" 
                  className="bg-[var(--tp-brand)] hover:bg-[var(--tp-brand-light)] text-white px-10 py-6 text-lg"
                >
                  Empezar Mi Contrato Ahora
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </a>
              <p className="text-sm text-muted-foreground/80 mt-3">✓ Si algo falla, te devolvemos tu dinero | ✓ Soporte por WhatsApp</p>
            </div>
          </div>
        </section>

        {/* SECCIÓN 6: QUÉ INCLUYE (CUSTOM) */}
        <section className="py-20 bg-background">
          <div className="max-w-7xl tp-container">
            <div className="text-center mb-12">
              <h2 className="mb-4">
                ¿Qué Incluye Tu Contrato de Arriendo Online?
              </h2>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                Porque queremos que estés tranquilo sabiendo <strong>exactamente</strong> qué estás pagando:
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
              <Card className="border-2 border-border hover:border-[var(--tp-brand)] hover:shadow-xl transition-all">
                <CardContent className="flex items-start gap-4 pt-6">
                  <Icon icon={Check} size="lg" variant="brand" className="flex-shrink-0 mt-0.5" />
                  <div>
                    <CardTitle className="mb-2 text-base">Contrato Personalizado</CardTitle>
                    <p className="text-muted-foreground text-sm">Adaptado a tu situación específica. No es una plantilla genérica de internet.</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-2 border-border hover:border-[var(--tp-brand)] hover:shadow-xl transition-all">
                <CardContent className="flex items-start gap-4 pt-6">
                  <Icon icon={Check} size="lg" variant="brand" className="flex-shrink-0 mt-0.5" />
                  <div>
                    <CardTitle className="mb-2 text-base">Certificación Notarial</CardTitle>
                    <p className="text-muted-foreground text-sm">Un notario real lo revisa y certifica. Tiene todo el peso legal que necesitas.</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-2 border-border hover:border-[var(--tp-brand)] hover:shadow-xl transition-all">
                <CardContent className="flex items-start gap-4 pt-6">
                  <Icon icon={Check} size="lg" variant="brand" className="flex-shrink-0 mt-0.5" />
                  <div>
                    <CardTitle className="mb-2 text-base">Firmas Electrónicas Ilimitadas</CardTitle>
                    <p className="text-muted-foreground text-sm">Para todos los que necesiten firmar: arrendador, arrendatario, aval. Sin costos extra.</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-2 border-border hover:border-[var(--tp-brand)] hover:shadow-xl transition-all">
                <CardContent className="flex items-start gap-4 pt-6">
                  <Icon icon={Check} size="lg" variant="brand" className="flex-shrink-0 mt-0.5" />
                  <div>
                    <CardTitle className="mb-2 text-base">Modificaciones Antes de Firmar</CardTitle>
                    <p className="text-muted-foreground text-sm">¿Te equivocaste en algo? Lo cambias las veces que necesites antes de confirmar.</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-2 border-border hover:border-[var(--tp-brand)] hover:shadow-xl transition-all">
                <CardContent className="flex items-start gap-4 pt-6">
                  <Icon icon={Check} size="lg" variant="brand" className="flex-shrink-0 mt-0.5" />
                  <div>
                    <CardTitle className="mb-2 text-base">Soporte por WhatsApp</CardTitle>
                    <p className="text-muted-foreground text-sm">Si te trabas o tienes dudas, nos escribes y te ayudamos. Somos humanos reales.</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-2 border-border hover:border-[var(--tp-brand)] hover:shadow-xl transition-all">
                <CardContent className="flex items-start gap-4 pt-6">
                  <Icon icon={Check} size="lg" variant="brand" className="flex-shrink-0 mt-0.5" />
                  <div>
                    <CardTitle className="mb-2 text-base">Entrega en 24 Horas</CardTitle>
                    <p className="text-muted-foreground text-sm">Desde que la última persona firma hasta que lo recibes certificado.</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="bg-[var(--tp-brand-5)] border-[var(--tp-brand-20)] max-w-3xl mx-auto">
              <CardHeader>
                <CardTitle className="text-center">Precio Variable Según Tus Necesidades</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-center">
                <p className="text-muted-foreground leading-relaxed">
                  El precio varía según el tipo de firma electrónica que elijas y si agregas servicios notariales adicionales (como copia legalizada, protocolización o FAN®).
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  <strong>Sin sorpresas, sin letra chica.</strong> Es menos de lo que gastarías en transporte y tiempo perdido yendo a la notaría. Y con esto, <strong>duermes tranquilo</strong>.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* SECCIÓN 7: TESTIMONIOS */}
        <TestimonialsSection {...testimonialsProps} />

        {/* SECCIÓN 8: FAQ */}
        <FAQSection {...faqProps} />

        {/* SECCIÓN 9: CTA FINAL */}
        <FinalCTASection {...finalCtaProps} />

      </div>
    </>
  );
}

