import type { Metadata } from "next";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { 
  FileSignature, 
  Shield, 
  Clock, 
  CheckCircle, 
  Users, 
  TrendingUp,
  FileCheck,
  Lock,
  Zap,
  Globe,
  BadgeCheck,
  Bot,
  Smartphone,
  Building2,
  Landmark,
  TrendingDown,
  Moon,
  Crown,
  MessageCircle,
  Briefcase,
  Home,
  UserCheck,
  Rocket,
  HelpCircle,
  LifeBuoy,
  Scale
} from "lucide-react";
import Link from "next/link";
import { StructuredData, generateOrganizationSchema, generateWebSiteSchema } from "@/components/StructuredData";
import { getPageConfig } from "@/lib/page-config";
import { GoogleStatsBadge } from "@/components/GoogleStatsDisplay";
import { USERS_COUNT } from "@/lib/constants";

// Componentes modulares
import {
  HeroSection,
  TestimonialsSection,
  FAQSection,
  FinalCTASection,
  type ValueBullet,
  type CTAButton,
  type BottomBadge,
  type FAQCategory,
  type CTACard,
  type TrustBarItem,
  type Metric
} from "@/components/landing-sections";

// Metadata optimizado con configuración desde page-config
const pageConfig = getPageConfig('/');

export const metadata: Metadata = {
  title: "TuPatrimonio | Protege y Haz Crecer lo que más te Importa",
  description: "Gestiona todo tu patrimonio desde un solo lugar: trámites legales, documentos y más, sin complicaciones. Simple, rápido y con la tranquilidad que mereces.",
  keywords: ["patrimonio", "trámites legales", "firma electrónica", "notaría digital", "Chile", "tranquilidad"],
  robots: {
    index: pageConfig.seoIndex,
    follow: pageConfig.seoIndex,
    googleBot: {
      index: pageConfig.seoIndex,
      follow: pageConfig.seoIndex,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    title: 'TuPatrimonio | Protege y Haz Crecer lo que más te Importa',
    description: 'Gestiona todo tu patrimonio desde un solo lugar: trámites legales, documentos y más, sin complicaciones.',
    url: 'https://tupatrimonio.app',
    locale: 'es_CL',
    siteName: 'TuPatrimonio',
  },
};

export default function HomePage() {
  // Configuración Hero Section
  const valueBullets: ValueBullet[] = [
    {
      icon: Zap,
      title: "Rápido y Sin Filas",
      description: "La mayoría de documentos listos en menos de 24 horas",
      color: "blue"
    },
    {
      icon: Shield,
      title: "100% Seguro y Legal",
      description: "Validez legal garantizada en cada documento",
      color: "green"
    },
    {
      icon: Smartphone,
      title: "Desde Cualquier Lugar",
      description: "Gestiona todo desde tu celular o computador",
      color: "purple"
    }
  ];

  const heroCtaButtons: CTAButton[] = [
    {
      text: "Empieza ahora, es gratis",
      href: "/cl",
      variant: "default",
      icon: Zap
    }
  ];

  const heroBottomBadges: BottomBadge[] = [
    {
      icon: CheckCircle,
      text: "Validez Legal<br/>Garantizada",
      description: ""
    },
    {
      icon: Lock,
      text: "100% Seguro",
      description: ""
    },
    {
      icon: Globe,
      text: "Disponible en<br/>Chile 🇨🇱",
      description: ""
    }
  ];

  // Configuración Testimonios
  const testimonialsMetrics: Metric[] = [
    {
      value: "+160K",
      label: "Usuarios Confían en Nosotros",
      description: "Desde personas hasta grandes empresas"
    },
    {
      value: "4.9/5",
      label: "Calificación en Google",
      description: "Reseñas verificadas"
    },
    {
      value: "100%",
      label: "Validez Legal",
      description: "Garantizada en cada documento"
    },
    {
      value: "24hrs",
      label: "Tiempo Promedio",
      description: "La mayoría de trámites resueltos en menos de un día"
    }
  ];

  // Configuración FAQ
  const faqCategories: FAQCategory[] = [
    {
      name: "Proceso y Tiempo",
      icon: Clock,
      color: "blue",
      questions: [
        {
          question: "¿Cuánto demora el proceso?",
          answer: "La mayoría de documentos están listos en menos de 24 horas hábiles. Casos urgentes pueden resolverse en 1 hora. Tú eliges el tiempo según tu necesidad."
        },
        {
          question: "¿Cómo funciona exactamente?",
          answer: "Es muy simple: seleccionas el servicio que necesitas, subes tus documentos, nuestra plataforma los revisa y coordina con notarías certificadas. Te notificamos por WhatsApp en cada paso y cuando esté listo lo descargas."
        },
        {
          question: "¿Puedo gestionar documentos de otras personas?",
          answer: "Sí, es muy común. Abogados, corredores y asesores gestionan documentos de sus clientes todo el tiempo. Solo necesitas los datos y autorización de los firmantes."
        }
      ]
    },
    {
      name: "Legal y Seguridad",
      icon: Scale,
      color: "green",
      questions: [
        {
          question: "¿Realmente tiene validez legal?",
          answer: "Sí, 100%. Trabajamos con notarías oficiales de Chile y todo cumple con la Ley 19.799 de Firma Electrónica. Cada documento tiene el respaldo legal completo."
        },
        {
          question: "¿Necesito ser chileno para usar TuPatrimonio?",
          answer: "No. Aceptamos cédulas de identidad y pasaportes de múltiples países. Si tienes internet, puedes usar TuPatrimonio desde cualquier parte del mundo."
        },
        {
          question: "¿Qué diferencia hay con una notaría tradicional?",
          answer: "Nosotros trabajamos CON notarías, no las reemplazamos. La diferencia es que tú no tienes que ir físicamente, hacer filas ni ajustarte a horarios. Todo es remoto, rápido y guiado paso a paso."
        },
        {
          question: "¿Es seguro?",
          answer: "Totalmente. Usamos verificación biométrica facial, encriptación de datos, y cada documento queda respaldado de forma segura."
        }
      ]
    },
    {
      name: "Soporte y Ayuda",
      icon: LifeBuoy,
      color: "purple",
      questions: [
        {
          question: "¿Qué pasa si no entiendo algo?",
          answer: "Esa es precisamente la idea: que NO tengas que entender de leyes. Te explicamos todo en lenguaje simple y si tienes dudas, nuestro equipo te atiende por WhatsApp, mail o videollamada."
        },
        {
          question: "¿Tienen planes mensuales?",
          answer: "No, y eso es bueno para ti. No pagas suscripciones que no usas. Pagas solo cuando necesitas un servicio. Sin ataduras, sin costos fijos."
        }
      ]
    }
  ];

  // Configuración CTA Final
  const finalCtaCards: CTACard[] = [
    {
      type: "personas",
      icon: Users,
      title: "Para Ti",
      description: "Resuelve tus trámites personales en minutos",
      benefits: [
        "Sin filas ni esperas",
        "Pagas solo lo que usas",
        "Soporte humano cuando lo necesites",
        "Desde tu casa, en cualquier momento"
      ],
      ctaText: "Empieza Ahora - Es Gratis",
      ctaHref: "/cl",
      ctaIcon: Zap,
      variant: "default"
    },
    {
      type: "empresas",
      icon: Building2,
      title: "Para Tu Empresa",
      description: "Agiliza los procesos legales de tu equipo",
      benefits: [
        "Gestión centralizada de documentos",
        "Múltiples usuarios y permisos",
        "Descuentos por volumen automáticos",
        "Asesoría personalizada"
      ],
      ctaText: "Habla con Nuestro Equipo",
      ctaHref: "https://wa.me/56123456789",
      ctaIcon: MessageCircle,
      variant: "default",
      badge: "Más Popular"
    }
  ];

  const finalTrustBar: TrustBarItem[] = [
    {
      icon: CheckCircle,
      text: "Sin tarjeta de crédito para empezar"
    },
    {
      icon: Zap,
      text: "Pagas solo cuando uses un servicio"
    },
    {
      icon: Users,
      text: "Soporte humano real cuando lo necesites"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-[var(--tp-background-light)] to-white">
      {/* Structured Data para SEO */}
      <StructuredData data={generateOrganizationSchema()} />
      <StructuredData data={generateWebSiteSchema()} />

      {/* Hero Section con componente modular */}
      <HeroSection
        title={
          <>
            TuPatrimonio: La Tranquilidad de Tener{" "}
            <span className="text-[var(--tp-brand)]">Todo en Orden</span>,{" "}
            Sin Complicaciones
          </>
        }
        subtitle="¿Cansado de trámites confusos, papeleos interminables y el estrés de no saber si todo está bien? TuPatrimonio es la plataforma que resuelve todo lo relacionado con tus documentos legales y la protección de lo que más te importa. Desde cualquier lugar, en minutos, y con la tranquilidad de que está todo bajo control."
        trustBadges={[
          { icon: BadgeCheck, text: "Ley 19.799 - Chile" },
          { component: <GoogleStatsBadge /> },
          { icon: Users, text: USERS_COUNT.textShort }
        ]}
        valueBullets={valueBullets}
        ctaButtons={heroCtaButtons}
        ctaSubtext="Sin planes ni suscripciones. Pagas solo lo que usas."
        bottomBadges={heroBottomBadges}
        showImageotype={true}
      />

      


      {/* Sección 2: La Solución - Features */}
      <section className="py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
              Una Plataforma, Todo TuPatrimonio Protegido
            </h2>
            <p className="text-xl text-muted-foreground max-w-4xl mx-auto leading-relaxed">
              TuPatrimonio no es otra app más de trámites. Es tu copiloto para todo lo que necesitas 
              en el mundo legal, inmobiliario y de documentos. Imagina tener un asistente personal que 
              conoce las leyes, entiende tus necesidades y te guía paso a paso.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Feature 1: IA */}
            <Card className="border-2 border-border hover:border-[var(--tp-brand)] hover:shadow-xl transition-all group">
              <CardHeader>
                <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-purple-200 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Bot className="w-8 h-8 text-purple-600" />
                </div>
                <CardTitle className="text-xl mb-2">Potenciado por IA</CardTitle>
                <CardDescription className="text-base leading-relaxed">
                  Nuestra inteligencia artificial entiende lo que necesitas y te sugiere el camino 
                  más rápido. Como tener un abogado amigo que habla tu idioma.
                </CardDescription>
              </CardHeader>
            </Card>

            {/* Feature 2: Remoto */}
            <Card className="border-2 border-border hover:border-[var(--tp-brand)] hover:shadow-xl transition-all group">
              <CardHeader>
                <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-blue-200 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Smartphone className="w-8 h-8 text-blue-600" />
                </div>
                <CardTitle className="text-xl mb-2">Desde Cualquier Lugar</CardTitle>
                <CardDescription className="text-base leading-relaxed">
                  Tu casa, tu oficina, la cafetería. Solo necesitas internet. Nada de esperar turnos 
                  ni perder mañanas enteras en oficinas.
                </CardDescription>
              </CardHeader>
            </Card>

            {/* Feature 3: Rápido */}
            <Card className="border-2 border-border hover:border-[var(--tp-brand)] hover:shadow-xl transition-all group">
              <CardHeader>
                <div className="w-16 h-16 bg-gradient-to-br from-green-100 to-green-200 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Zap className="w-8 h-8 text-green-600" />
                </div>
                <CardTitle className="text-xl mb-2">En Minutos, No en Días</CardTitle>
                <CardDescription className="text-base leading-relaxed">
                  Lo que antes te tomaba semanas, ahora lo resuelves antes de que se enfríe tu café. 
                  La mayoría de documentos listos en menos de 24 horas.
                </CardDescription>
              </CardHeader>
            </Card>

            {/* Feature 4: Transparente */}
            <Card className="border-2 border-border hover:border-[var(--tp-brand)] hover:shadow-xl transition-all group">
              <CardHeader>
                <div className="w-16 h-16 bg-gradient-to-br from-orange-100 to-orange-200 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <CheckCircle className="w-8 h-8 text-orange-600" />
                </div>
                <CardTitle className="text-xl mb-2">Sin Letra Chica</CardTitle>
                <CardDescription className="text-base leading-relaxed">
                  Cero tecnicismos, cero sorpresas. Todo explicado como si se lo contaras a un amigo. 
                  Transparencia total en cada paso.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Sección 4: Qué Puedes Hacer - Servicios */}
      <section className="py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
              Todo lo que Necesitas para Proteger TuPatrimonio, en Un Solo Lugar
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Hoy empezamos con servicios legales en Chile, pero nuestra visión es acompañarte 
              en todo Latinoamérica con soluciones para cada área de tu vida patrimonial.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Servicio Activo: Legal */}
            <Card className="border-2 border-[var(--tp-brand)] shadow-xl relative">
              <div className="absolute -top-4 right-4 bg-[var(--tp-brand)] text-white px-4 py-1 rounded-full text-sm font-bold">
                Activo en Chile 🇨🇱
              </div>
              <CardHeader>
                <div className="w-16 h-16 bg-gradient-to-br from-[var(--tp-brand)] to-[var(--tp-brand-light)] rounded-2xl flex items-center justify-center mb-4">
                  <Scale className="w-8 h-8 text-white" />
                </div>
                <CardTitle className="text-2xl mb-2">Legal</CardTitle>
                <CardDescription className="text-base">
                  Servicios notariales y legales 100% digitales con validez legal completa
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 mb-6">
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-[var(--tp-success)] shrink-0 mt-0.5" />
                    <span className="text-foreground/80"><strong>Firma Electrónica Simple y Avanzada</strong> - Para tus contratos y documentos</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-[var(--tp-success)] shrink-0 mt-0.5" />
                    <span className="text-foreground/80"><strong>Autorización Notarial de Firmas</strong> - Validez legal en minutos</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-[var(--tp-success)] shrink-0 mt-0.5" />
                    <span className="text-foreground/80"><strong>Copias Legalizadas</strong> - Certifica documentos sin ir a la notaría</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-[var(--tp-success)] shrink-0 mt-0.5" />
                    <span className="text-foreground/80"><strong>Protocolización de Documentos</strong> - Respaldo oficial para tus acuerdos</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-[var(--tp-success)] shrink-0 mt-0.5" />
                    <span className="text-foreground/80"><strong>Contratos de Arriendo y Compraventa</strong> - Listos para firmar</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-[var(--tp-success)] shrink-0 mt-0.5" />
                    <span className="text-foreground/80"><strong>Documentos Laborales</strong> - Contratos, finiquitos, todo cubierto</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-[var(--tp-success)] shrink-0 mt-0.5" />
                    <span className="text-foreground/80"><strong>Poderes y Mandatos</strong> - Delega con seguridad</span>
                  </li>
                </ul>
                <p className="text-sm text-muted-foreground bg-[var(--tp-bg-light-20)] p-4 rounded-lg">
                  <strong>🎯 Ideal para:</strong> Corredores de propiedades, abogados, empresas y cualquier persona 
                  que necesite documentos legales sin complicarse la vida.
                </p>
                <Link href="/cl" className="block mt-4">
                  <Button className="w-full bg-[var(--tp-brand)] hover:bg-[var(--tp-brand-light)] text-white">
                    Explorar Servicios Legales
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Próximamente: PropTech, FinTech, Business Hub */}
            <div className="space-y-8">
              {/* PropTech */}
              <Card className="relative border-2 border-border hover:border-[var(--tp-brand)] hover:shadow-xl transition-all opacity-75 hover:opacity-100">
                <div className="absolute top-4 right-4 bg-gray-400 text-white px-3 py-1 rounded-full text-xs font-bold">
                  Próximamente
                </div>
                <CardHeader>
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl flex items-center justify-center mb-3">
                    <Home className="w-6 h-6 text-blue-600" />
                  </div>
                  <CardTitle className="text-xl">PropTech</CardTitle>
                  <CardDescription>
                    Gestión completa de propiedades, contratos de arriendo, compraventas y todo lo 
                    relacionado con tu patrimonio inmobiliario.
                  </CardDescription>
                </CardHeader>
              </Card>

              {/* FinTech */}
              <Card className="relative border-2 border-border hover:border-[var(--tp-brand)] hover:shadow-xl transition-all opacity-75 hover:opacity-100">
                <div className="absolute top-4 right-4 bg-gray-400 text-white px-3 py-1 rounded-full text-xs font-bold">
                  Próximamente
                </div>
                <CardHeader>
                  <div className="w-12 h-12 bg-gradient-to-br from-green-100 to-green-200 rounded-xl flex items-center justify-center mb-3">
                    <TrendingUp className="w-6 h-6 text-green-600" />
                  </div>
                  <CardTitle className="text-xl">FinTech</CardTitle>
                  <CardDescription>
                    Organiza y protege tu patrimonio financiero, inversiones y planificación para 
                    el futuro de lo que más te importa.
                  </CardDescription>
                </CardHeader>
              </Card>

              {/* Business Hub */}
              <Card className="relative border-2 border-border hover:border-[var(--tp-brand)] hover:shadow-xl transition-all opacity-75 hover:opacity-100">
                <div className="absolute top-4 right-4 bg-gray-400 text-white px-3 py-1 rounded-full text-xs font-bold">
                  Próximamente
                </div>
                <CardHeader>
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-purple-200 rounded-xl flex items-center justify-center mb-3">
                    <Briefcase className="w-6 h-6 text-purple-600" />
                  </div>
                  <CardTitle className="text-xl">Business Hub</CardTitle>
                  <CardDescription>
                    Herramientas y servicios especializados para hacer crecer tu negocio con toda 
                    la estructura legal y administrativa que necesitas.
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Sección 5: Beneficios Emocionales */}
      <section className="py-20 bg-gradient-to-br from-[var(--tp-background-light)] to-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
              Más Allá de los Trámites: Recupera Tu Tiempo y Tu Tranquilidad
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Los beneficios reales que experimentarás al usar TuPatrimonio
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Beneficio 1 */}
            <Card className="border-2 border-border hover:border-[var(--tp-brand)] hover:shadow-xl transition-all">
              <CardHeader>
                <div className="w-14 h-14 bg-gradient-to-br from-blue-100 to-blue-200 rounded-2xl flex items-center justify-center mb-4">
                  <Moon className="w-7 h-7 text-blue-600" />
                </div>
                <CardTitle className="text-xl mb-2">Duerme Tranquilo</CardTitle>
                <CardDescription className="text-base leading-relaxed">
                  Saber que tus documentos tienen validez legal y están bien hechos es un alivio 
                  enorme. Ya no más "¿y si algo está mal?" Por fin, paz mental.
                </CardDescription>
              </CardHeader>
            </Card>

            {/* Beneficio 2 */}
            <Card className="border-2 border-border hover:border-[var(--tp-brand)] hover:shadow-xl transition-all">
              <CardHeader>
                <div className="w-14 h-14 bg-gradient-to-br from-orange-100 to-orange-200 rounded-2xl flex items-center justify-center mb-4">
                  <Clock className="w-7 h-7 text-orange-600" />
                </div>
                <CardTitle className="text-xl mb-2">Recupera Tu Tiempo</CardTitle>
                <CardDescription className="text-base leading-relaxed">
                  Esas horas (o días) que perdías yendo a notarías, haciendo filas, buscando 
                  información... ahora son tuyos. Para tu familia, tu negocio, o simplemente para descansar.
                </CardDescription>
              </CardHeader>
            </Card>

            {/* Beneficio 3 */}
            <Card className="border-2 border-border hover:border-[var(--tp-brand)] hover:shadow-xl transition-all">
              <CardHeader>
                <div className="w-14 h-14 bg-gradient-to-br from-purple-100 to-purple-200 rounded-2xl flex items-center justify-center mb-4">
                  <Crown className="w-7 h-7 text-purple-600" />
                </div>
                <CardTitle className="text-xl mb-2">Toma el Control</CardTitle>
                <CardDescription className="text-base leading-relaxed">
                  Tu patrimonio, tus decisiones, tu ritmo. Sin depender de horarios de oficina 
                  ni de intermediarios. Tú mandas, nosotros te facilitamos el camino.
                </CardDescription>
              </CardHeader>
            </Card>

            {/* Beneficio 4 */}
            <Card className="border-2 border-border hover:border-[var(--tp-brand)] hover:shadow-xl transition-all">
              <CardHeader>
                <div className="w-14 h-14 bg-gradient-to-br from-green-100 to-green-200 rounded-2xl flex items-center justify-center mb-4">
                  <TrendingUp className="w-7 h-7 text-green-600" />
                </div>
                <CardTitle className="text-xl mb-2">Haz Crecer lo que Construiste</CardTitle>
                <CardDescription className="text-base leading-relaxed">
                  Cuando tus bases legales están sólidas, puedes enfocarte en lo que importa: 
                  hacer crecer tu negocio, invertir mejor, proteger a tu familia.
                </CardDescription>
              </CardHeader>
            </Card>

            {/* Beneficio 5 */}
            <Card className="border-2 border-border hover:border-[var(--tp-brand)] hover:shadow-xl transition-all">
              <CardHeader>
                <div className="w-14 h-14 bg-gradient-to-br from-cyan-100 to-cyan-200 rounded-2xl flex items-center justify-center mb-4">
                  <Globe className="w-7 h-7 text-cyan-600" />
                </div>
                <CardTitle className="text-xl mb-2">Sin Fronteras</CardTitle>
                <CardDescription className="text-base leading-relaxed">
                  Estés donde estés en Latinoamérica (o el mundo), tu patrimonio está protegido 
                  y accesible. Aceptamos pasaportes y cédulas de múltiples países.
                </CardDescription>
              </CardHeader>
            </Card>

            {/* Beneficio 6 */}
            <Card className="border-2 border-border hover:border-[var(--tp-brand)] hover:shadow-xl transition-all">
              <CardHeader>
                <div className="w-14 h-14 bg-gradient-to-br from-pink-100 to-pink-200 rounded-2xl flex items-center justify-center mb-4">
                  <MessageCircle className="w-7 h-7 text-pink-600" />
                </div>
                <CardTitle className="text-xl mb-2">Apoyo Humano Real</CardTitle>
                <CardDescription className="text-base leading-relaxed">
                  Aunque la tecnología hace la magia, siempre hay personas reales detrás listas 
                  para ayudarte. Por WhatsApp, mail o videollamada. Como debe ser.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Sección 6: Stats (Actualizada) */}
      <section className="py-20 bg-gradient-to-br from-[var(--tp-brand)] to-[var(--tp-brand-light)] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Números que Hablan por Nosotros
            </h2>
            <p className="text-xl text-white/90 max-w-3xl mx-auto">
              Miles de personas y empresas ya confían en TuPatrimonio para lo que más les importa
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-12">
            <div className="text-center">
              <div className="w-20 h-20 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Users className="w-10 h-10 text-white" />
              </div>
              <div className="text-5xl md:text-6xl font-bold mb-3">+160K</div>
              <div className="text-xl text-white/90">Usuarios Confían en Nosotros</div>
              <p className="text-white/70 mt-2">
                Desde personas hasta grandes empresas
              </p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-6">
                <FileCheck className="w-10 h-10 text-white" />
              </div>
              <div className="text-5xl md:text-6xl font-bold mb-3">+10K</div>
              <div className="text-xl text-white/90">Documentos Firmados</div>
              <p className="text-white/70 mt-2">
                Con validez legal garantizada
              </p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-6">
                <TrendingDown className="w-10 h-10 text-white" />
              </div>
              <div className="text-5xl md:text-6xl font-bold mb-3">90%</div>
              <div className="text-xl text-white/90">Reducción de Tiempos</div>
              <p className="text-white/70 mt-2">
                Comparado con trámites tradicionales
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Sección 7: Para Quién Es */}
      <section className="py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
              Diseñado para Personas Reales con Problemas Reales
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Sea cual sea tu situación, TuPatrimonio tiene la solución que necesitas
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Perfil 1 */}
            <Card className="border-2 border-border hover:border-[var(--tp-brand)] hover:shadow-xl transition-all">
              <CardHeader>
                <div className="w-14 h-14 bg-gradient-to-br from-blue-100 to-blue-200 rounded-2xl flex items-center justify-center mb-4">
                  <Briefcase className="w-7 h-7 text-blue-600" />
                </div>
                <CardTitle className="text-xl mb-2">Profesionales Ocupados</CardTitle>
                <CardDescription className="text-base leading-relaxed">
                  No tienes tiempo para hacer filas. Necesitas resolver trámites entre reuniones 
                  y quieres que todo fluya sin complicaciones.
                </CardDescription>
              </CardHeader>
            </Card>

            {/* Perfil 2 */}
            <Card className="border-2 border-border hover:border-[var(--tp-brand)] hover:shadow-xl transition-all">
              <CardHeader>
                <div className="w-14 h-14 bg-gradient-to-br from-purple-100 to-purple-200 rounded-2xl flex items-center justify-center mb-4">
                  <Building2 className="w-7 h-7 text-purple-600" />
                </div>
                <CardTitle className="text-xl mb-2">Empresas y Emprendedores</CardTitle>
                <CardDescription className="text-base leading-relaxed">
                  Manejas varios contratos, necesitas agilidad y no puedes darte el lujo de que 
                  un documento mal hecho te traiga problemas legales después.
                </CardDescription>
              </CardHeader>
            </Card>

            {/* Perfil 3 */}
            <Card className="border-2 border-border hover:border-[var(--tp-brand)] hover:shadow-xl transition-all">
              <CardHeader>
                <div className="w-14 h-14 bg-gradient-to-br from-green-100 to-green-200 rounded-2xl flex items-center justify-center mb-4">
                  <Home className="w-7 h-7 text-green-600" />
                </div>
                <CardTitle className="text-xl mb-2">Corredores de Propiedades</CardTitle>
                <CardDescription className="text-base leading-relaxed">
                  Cierras arriendos y ventas constantemente. Necesitas que los contratos estén 
                  listos YA, sin depender de horarios de notarías.
                </CardDescription>
              </CardHeader>
            </Card>

            {/* Perfil 4 */}
            <Card className="border-2 border-border hover:border-[var(--tp-brand)] hover:shadow-xl transition-all">
              <CardHeader>
                <div className="w-14 h-14 bg-gradient-to-br from-orange-100 to-orange-200 rounded-2xl flex items-center justify-center mb-4">
                  <Users className="w-7 h-7 text-orange-600" />
                </div>
                <CardTitle className="text-xl mb-2">Familias que Planifican</CardTitle>
                <CardDescription className="text-base leading-relaxed">
                  Quieres proteger a los tuyos, organizar tu patrimonio y tener todo en orden 
                  sin gastar fortunas en abogados para cosas simples.
                </CardDescription>
              </CardHeader>
            </Card>

            {/* Perfil 5 */}
            <Card className="border-2 border-border hover:border-[var(--tp-brand)] hover:shadow-xl transition-all">
              <CardHeader>
                <div className="w-14 h-14 bg-gradient-to-br from-cyan-100 to-cyan-200 rounded-2xl flex items-center justify-center mb-4">
                  <Globe className="w-7 h-7 text-cyan-600" />
                </div>
                <CardTitle className="text-xl mb-2">Expatriados y Latinoamericanos</CardTitle>
                <CardDescription className="text-base leading-relaxed">
                  Vives fuera o gestionas propiedades en otro país. Necesitas resolver desde 
                  la distancia con la misma validez legal.
                </CardDescription>
              </CardHeader>
            </Card>

            {/* Perfil 6 */}
            <Card className="border-2 border-border hover:border-[var(--tp-brand)] hover:shadow-xl transition-all">
              <CardHeader>
                <div className="w-14 h-14 bg-gradient-to-br from-pink-100 to-pink-200 rounded-2xl flex items-center justify-center mb-4">
                  <Rocket className="w-7 h-7 text-pink-600" />
                </div>
                <CardTitle className="text-xl mb-2">Personas que Valoran su Tiempo</CardTitle>
                <CardDescription className="text-base leading-relaxed">
                  Simplemente no quieres perder tu vida en trámites burocráticos. Prefieres 
                  que la tecnología trabaje para ti.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Sección 8: Testimonios - Componente Modular */}
      <TestimonialsSection
        title="+160,000 Personas Confían en TuPatrimonio para lo que más les Importa"
        description="Lee lo que dicen nuestros usuarios sobre su experiencia con TuPatrimonio"
        showGoogleReviews={true}
        metrics={testimonialsMetrics}
      />

      {/* Certificación Notarial */}
      <section className="py-12 bg-background">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-3 bg-card px-6 py-4 rounded-2xl shadow-lg border-2 border-[var(--tp-brand-20)]">
            <Landmark className="w-8 h-8 text-[var(--tp-brand)]" />
            <div className="text-left">
              <p className="font-bold text-foreground">Trabajamos con Excelentes Notarías</p>
              <p className="text-sm text-muted-foreground">
                Cada documento tiene el respaldo legal completo y cumple con todas las normativas vigentes
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Sección 9: Newsletter */}
      <section className="py-20 bg-background">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card className="border-2 border-[var(--tp-brand-20)] shadow-2xl overflow-hidden">
            <div className="bg-gradient-to-br from-[var(--tp-brand-5)] to-transparent p-8 md:p-12">
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-[var(--tp-brand)] rounded-full mb-6">
                  <Clock className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                  Suscríbete a TuPatrimonio News 📬
                </h2>
                <p className="text-lg text-muted-foreground mb-2">
                  Recibe contenido exclusivo sobre transformación digital legal y tips para proteger tu patrimonio
                </p>
                <p className="text-2xl font-bold text-[var(--tp-brand)]">
                  ¡Y gana un 15% de descuento en tu primer servicio! 🎉
                </p>
              </div>

              <div className="max-w-md mx-auto">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="email" className="text-base font-medium mb-2 block">
                      Correo electrónico
                    </Label>
                    <Input 
                      id="email" 
                      type="email" 
                      placeholder="tu@email.com"
                      className="h-12 text-base border-2 focus:border-[var(--tp-brand)]"
                    />
                  </div>
                  <Button 
                    size="lg" 
                    className="w-full bg-[var(--tp-brand)] hover:bg-[var(--tp-brand-light)] text-white h-12 text-base shadow-lg"
                  >
                    Suscribirme Ahora
                  </Button>
                </div>

                <p className="text-sm text-muted-foreground/80 text-center mt-4">
                  Al suscribirte aceptas recibir emails con novedades, tips y ofertas especiales.
                  Puedes cancelar en cualquier momento.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* Sección 10: FAQ - Componente Modular */}
      <FAQSection
        title="Preguntas que Nos Hacen Todo el Tiempo"
        description="Todo lo que necesitas saber antes de empezar"
        categories={faqCategories}
        contactCta={{
          text: "Contáctanos por WhatsApp",
          href: "https://wa.me/56123456789"
        }}
      />

      {/* Sección 11: CTA Final - Componente Modular */}
      <FinalCTASection
        title="Es Hora de Dejar Atrás el Estrés de los Trámites"
        description="Miles de personas ya protegen su patrimonio con la tranquilidad que TuPatrimonio les da. Sin complicaciones, sin perder tiempo, sin dolores de cabeza. La pregunta no es '¿funcionará?' (ya lo probaron más de 160,000 personas). La pregunta es: ¿cuánto tiempo más vas a perder haciendo las cosas a la antigua?"
        cards={finalCtaCards}
        trustBar={finalTrustBar}
      />

      {/* Footer */}
      <footer className="bg-[var(--tp-background-dark)] text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8 mb-8">
            {/* Columna 1: Marca */}
            <div>
              <h3 className="text-2xl font-bold mb-4">TuPatrimonio®</h3>
              <p className="text-white/80 mb-4">
                Tu copiloto para proteger y hacer crecer lo que más te importa. Transformando la gestión legal con tecnología de vanguardia.
              </p>
              <div className="space-y-2 text-sm text-white/70">
                <p>🇨🇱 TuPatrimonio SpA (Chile)</p>
                <p>🇺🇸 TuPatrimonio LLC (USA)</p>
              </div>
            </div>

            {/* Columna 2: Enlaces */}
            <div>
              <h4 className="font-semibold mb-4">Recursos</h4>
              <ul className="space-y-2 text-white/80">
                <li>
                  <Link href="/blog" className="hover:text-white transition-colors">
                    Blog y Guías
                  </Link>
                </li>
                <li>
                  <Link href="/ayuda" className="hover:text-white transition-colors">
                    Centro de Ayuda
                  </Link>
                </li>
                <li>
                  <Link href="/cl/contacto" className="hover:text-white transition-colors">
                    Contacto
                  </Link>
                </li>
                <li>
                  <Link href="/alianzas" className="hover:text-white transition-colors">
                    Programa de Alianzas
                  </Link>
                </li>
              </ul>
            </div>

            {/* Columna 3: Legal */}
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-white/80">
                <li>
                  <Link href="/cl/legal/terminos" className="hover:text-white transition-colors">
                    Términos y Condiciones
                  </Link>
                </li>
                <li>
                  <Link href="/cl/legal/privacidad" className="hover:text-white transition-colors">
                    Política de Privacidad
                  </Link>
                </li>
                <li>
                  <Link href="/cl/legal/cookies" className="hover:text-white transition-colors">
                    Política de Cookies
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <Separator className="bg-white/20 my-8" />

          <div className="text-center text-white/60 text-sm">
            <p>Copyright © 2025 TuPatrimonio. Todos los derechos reservados.</p>
            <p className="mt-2">
              Plataforma de servicios legales digitales. Operativo en Chile 🇨🇱 · Próximamente en más países de Latinoamérica
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
