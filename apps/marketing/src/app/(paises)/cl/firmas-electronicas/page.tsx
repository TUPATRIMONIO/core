import type { Metadata } from "next";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Icon, IconContainer } from "@tupatrimonio/ui";
import { 
  CheckCircle, 
  Shield, 
  Clock, 
  FileSignature, 
  Home, 
  Smartphone,
  Lock,
  Scale,
  FileCheck,
  Users,
  Building,
  Briefcase,
  FileText,
  CreditCard,
  UserCheck,
  HelpCircle,
  ArrowRight,
  Zap,
  Heart,
  Star,
  CheckCircle2,
  AlertCircle,
  FileSearch
} from "lucide-react";
import Link from "next/link";
import { StatsSection } from "@/components/StatsSection";
import ProcessStepsSection from "@/components/landing-sections/ProcessStepsSection";
import FAQSection from "@/components/landing-sections/FAQSection";
import LegalValiditySection from "@/components/landing-sections/LegalValiditySection";

export const metadata: Metadata = {
  title: "Firma Electrónica en Chile: Firma Tus Documentos con Tranquilidad | Tu Patrimonio",
  description: "Firma tus documentos de forma simple y segura con nosotros. Firma electrónica simple o avanzada por cada documento que necesites. Con validez legal total. Sin papeleos, sin estrés. ¡Empieza hoy!",
  keywords: [
    "firma electrónica",
    "firma electrónica Chile",
    "firma electrónica avanzada",
    "certificado digital",
    "firma digital",
    "firma electrónica online",
    "firma electrónica simple",
    "firma electrónica válida",
    "cómo funciona firma electrónica",
    "firma electrónica contratos",
    "firma electrónica SII",
    "firma electrónica segura",
    "obtener firma electrónica",
    "comprar firma electrónica"
  ],
  openGraph: {
    title: "Firma Electrónica en Chile: Firma Tus Documentos con Tranquilidad",
    description: "Obtén tu firma electrónica de forma simple y segura. Validez legal total, sin complicaciones.",
    url: "https://tupatrimonio.app/firmas-electronicas",
    locale: "es_CL",
  },
  alternates: {
    canonical: "https://tupatrimonio.app/firmas-electronicas",
  },
};

export default function FirmasElectronicasPage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-[var(--tp-background-light)] to-background py-16 md:py-24">
        <div className="max-w-7xl tp-container">
          <div className="text-center">
            <div className="mb-6">
              <IconContainer 
                icon={FileSignature} 
                variant="brand" 
                shape="rounded" 
                size="lg"
                className="mx-auto"
              />
            </div>
            
            <h1 className="mb-6 max-w-5xl mx-auto">
              Firma Tus Documentos Desde Casa:
              <span className="text-[var(--tp-brand)]"> Simple, Rápido y con Total Tranquilidad</span>
            </h1>
            
            <p className="text-xl md:text-2xl text-muted-foreground mb-6 max-w-4xl mx-auto">
              ¿Te imaginas poder <strong>firmar ese contrato importante desde tu casa</strong>, en pijama, sin tener que imprimir nada ni ir a una notaría? 
              Eso es exactamente lo que hacemos. <strong>Facilitamos la firma electrónica</strong> de cada documento que necesites. 
              Y no, no es complicado ni requiere que seas un experto en tecnología.
            </p>
            
            <p className="text-lg text-muted-foreground mb-8 max-w-3xl mx-auto">
              Con Tu Patrimonio, <strong>firmas cada documento cuando lo necesitas</strong>, con validez legal total. 
              Ya sea firma simple (con alta seguridad en verificación de identidad) o avanzada (con no repudio y máxima certeza jurídica), 
              nosotros te ayudamos con el proceso completo. Te olvidas del papel, de las filas, de los horarios de oficina. 
              Firmas cuando quieres, donde quieres, <strong>documento por documento</strong>.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <a href="https://tupatrimon.io" target="_blank" rel="noopener noreferrer nofollow">
                <Button 
                  size="lg" 
                  className="bg-[var(--tp-brand)] hover:bg-[var(--tp-brand-light)] text-white px-10 py-6 text-lg font-semibold shadow-lg hover:shadow-xl transition-all"
                >
                  Firmar Mi Primer Documento Ahora
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </a>
              <Link href="#como-funciona">
                <Button 
                  variant="outline" 
                  size="lg" 
                  className="border-2 border-[var(--tp-brand)] text-[var(--tp-brand)] hover:bg-[var(--tp-brand-5)] px-10 py-6 text-lg font-semibold"
                >
                  Ver Cómo Funciona
                </Button>
              </Link>
            </div>

            {/* Trust indicators */}
            <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Icon icon={CheckCircle} size="md" className="text-green-600" />
                <span>Validez Legal Garantizada (Ley 19.799)</span>
              </div>
              <div className="flex items-center gap-2">
                <Icon icon={Clock} size="md" className="text-green-600" />
                <span>Listo en 5 Minutos</span>
              </div>
              <div className="flex items-center gap-2">
                <Icon icon={Lock} size="md" className="text-green-600" />
                <span>100% Seguro</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Por Qué Necesitas Firma Electrónica */}
      <section className="py-20 bg-background">
        <div className="max-w-7xl tp-container">
          <div className="text-center mb-16">
            <h2 className="mb-4">
              ¿Por Qué Necesitas una Firma Electrónica?
              <span className="text-[var(--tp-brand)]"> (Spoiler: Te Va a Facilitar la Vida)</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Si alguna vez te ha tocado imprimir un contrato, firmarlo, escanearlo y enviarlo de vuelta, 
              sabes lo tedioso que puede ser. O peor aún, tener que coordinar con otras personas para firmar un mismo documento. 
              <strong> Es un dolor de cabeza.</strong>
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <Card className="border-2 border-border hover:border-[var(--tp-brand)] hover:shadow-xl transition-all text-center">
              <CardHeader>
                <IconContainer 
                  icon={Home} 
                  variant="brand" 
                  shape="rounded" 
                  size="lg"
                  className="mx-auto mb-4"
                />
                <CardTitle>Sin Salir de Casa</CardTitle>
                <CardDescription>
                  Olvídate de ir a notarías o de buscar dónde imprimir. Todo lo haces desde tu computador o celular.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-2 border-border hover:border-[var(--tp-brand)] hover:shadow-xl transition-all text-center">
              <CardHeader>
                <IconContainer 
                  icon={FileText} 
                  variant="brand" 
                  shape="rounded" 
                  size="lg"
                  className="mx-auto mb-4"
                />
                <CardTitle>Sin Papeles</CardTitle>
                <CardDescription>
                  Cero impresiones, cero hojas perdidas, cero archivadores gigantes. Todo queda guardado digitalmente.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-2 border-border hover:border-[var(--tp-brand)] hover:shadow-xl transition-all text-center">
              <CardHeader>
                <IconContainer 
                  icon={Clock} 
                  variant="brand" 
                  shape="rounded" 
                  size="lg"
                  className="mx-auto mb-4"
                />
                <CardTitle>En Cualquier Momento</CardTitle>
                <CardDescription>
                  ¿Necesitas firmar algo urgente un domingo a las 11 de la noche? Adelante, tu firma electrónica está disponible 24/7.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-2 border-border hover:border-[var(--tp-brand)] hover:shadow-xl transition-all text-center">
              <CardHeader>
                <IconContainer 
                  icon={Scale} 
                  variant="brand" 
                  shape="rounded" 
                  size="lg"
                  className="mx-auto mb-4"
                />
                <CardTitle>Validez Legal</CardTitle>
                <CardDescription>
                  Una firma electrónica vale exactamente lo mismo que tu firma en papel. Está respaldada por la ley chilena (Ley N° 19.799).
                </CardDescription>
              </CardHeader>
            </Card>
          </div>

          <div className="mt-12 text-center">
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              En resumen: <strong className="text-foreground">más rapidez, menos estrés, y la tranquilidad de saber que todo está en orden.</strong>
            </p>
          </div>
        </div>
      </section>

      {/* Qué Es la Firma Electrónica */}
      <section className="py-20 bg-gradient-to-br from-[var(--tp-background-light)] to-background">
        <div className="max-w-7xl tp-container">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="mb-6">
                ¿Qué Es una Firma Electrónica?
                <span className="text-[var(--tp-brand)]"> (Te lo Explicamos Como a un Amigo)</span>
              </h2>
              
              <p className="text-lg text-muted-foreground mb-6">
                Es como tu firma manuscrita, pero digital. <strong>Cada vez que necesitas firmar un documento</strong>, nosotros facilitamos 
                que lo hagas de forma electrónica, con total validez legal. Listo. Así de simple.
              </p>
              
              <p className="text-lg text-muted-foreground mb-6">
                Pero claro, no es solo "poner tu nombre en un PDF". Una firma electrónica real tiene tecnología detrás 
                que garantiza tres cosas clave en <strong>cada documento que firmas</strong>:
              </p>

              <div className="space-y-4">
                <div className="flex gap-4 items-start">
                  <div className="flex-shrink-0">
                    <Icon icon={UserCheck} size="lg" className="text-[var(--tp-brand)]" />
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Que realmente eres tú quien firma</h4>
                    <p className="text-muted-foreground">
                      Nadie más puede usar tu firma (se llama "autenticación", pero no te preocupes por el término).
                    </p>
                  </div>
                </div>

                <div className="flex gap-4 items-start">
                  <div className="flex-shrink-0">
                    <Icon icon={Lock} size="lg" className="text-[var(--tp-brand)]" />
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Que el documento no se puede alterar</h4>
                    <p className="text-muted-foreground">
                      Una vez firmado, si alguien intenta cambiar algo, se nota al instante.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4 items-start">
                  <div className="flex-shrink-0">
                    <Icon icon={FileCheck} size="lg" className="text-[var(--tp-brand)]" />
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Que no puedes negar que firmaste (No Repudio)</h4>
                    <p className="text-muted-foreground">
                      Si firmaste, firmaste. Queda registrado que fuiste tú. Esto es especialmente importante en la firma avanzada, 
                      donde el no repudio está garantizado por ley.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="bg-card rounded-2xl p-8 shadow-xl border-2 border-border">
                <div className="text-center mb-6">
                  <Icon icon={FileSignature} size="xl" className="text-[var(--tp-brand)] mx-auto mb-4" />
                  <h3 className="font-bold text-xl mb-2">Es Tan Simple Como...</h3>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-4 bg-[var(--tp-background-light)] rounded-lg">
                    <div className="w-8 h-8 rounded-full bg-[var(--tp-brand)] text-white flex items-center justify-center font-bold">1</div>
                    <span>Abres el documento</span>
                  </div>
                  <div className="flex items-center gap-3 p-4 bg-[var(--tp-background-light)] rounded-lg">
                    <div className="w-8 h-8 rounded-full bg-[var(--tp-brand)] text-white flex items-center justify-center font-bold">2</div>
                    <span>Haces clic en "Firmar"</span>
                  </div>
                  <div className="flex items-center gap-3 p-4 bg-[var(--tp-background-light)] rounded-lg">
                    <div className="w-8 h-8 rounded-full bg-[var(--tp-brand)] text-white flex items-center justify-center font-bold">3</div>
                    <span>¡Listo! Ya está firmado</span>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mt-6 text-center">
                  La tecnología trabaja en segundo plano para darte seguridad y tranquilidad.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Tipos de Firma */}
      <section className="py-20 bg-background">
        <div className="max-w-7xl tp-container">
          <div className="text-center mb-16">
            <h2 className="mb-4">
              ¿Sabías Que Hay Diferentes Tipos de 
              <span className="text-[var(--tp-brand)]"> Firma Electrónica en Chile?</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              En Chile existen principalmente dos tipos de firma electrónica, <strong>ambas totalmente legales y válidas</strong>. 
              La diferencia principal está en que la firma avanzada tiene <strong>no repudio</strong> (según la Ley 19.799), 
              lo que significa que no puedes negar que firmaste. Te ayudamos a elegir cuál necesitas según tu documento.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* Firma Simple */}
            <Card className="border-2 border-border hover:border-blue-500 hover:shadow-xl transition-all">
              <CardHeader className="text-center">
                <div className="mb-4">
                  <IconContainer 
                    icon={CheckCircle2} 
                    variant="neutral" 
                    shape="rounded" 
                    size="lg"
                    className="mx-auto bg-blue-100 text-blue-600"
                  />
                </div>
                <CardTitle className="text-2xl">Firma Electrónica Simple</CardTitle>
                <CardDescription className="text-base mt-4">
                  <strong>Totalmente legal y válida</strong> en Chile. Ideal para documentos internos, acuerdos comerciales 
                  no críticos y contratos menos formales. <strong>Nuestra firma simple incluye verificación de identidad robusta</strong>, 
                  lo que la hace mucho más segura que simplemente escribir tu nombre en un email.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <span className="text-sm"><strong>Verificación de identidad segura</strong> en cada firma</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">Proceso rápido y sin complicaciones</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">Mayor seguridad que firmas manuales básicas</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Firma Avanzada */}
            <Card className="border-2 border-border hover:border-[var(--tp-brand)] hover:shadow-xl transition-all">
              <CardHeader className="text-center">
                <div className="mb-4">
                  <IconContainer 
                    icon={Shield} 
                    variant="brand" 
                    shape="rounded" 
                    size="lg"
                    className="mx-auto"
                  />
                </div>
                <CardTitle className="text-2xl">Firma Electrónica Avanzada (FEA)</CardTitle>
                <CardDescription className="text-base mt-4">
                  <strong>Totalmente legal y válida</strong> en Chile con <strong>no repudio</strong> según Ley 19.799. 
                  Esto significa que no puedes negar que firmaste el documento. Ideal para contratos críticos, 
                  trámites del SII, documentos bancarios y notariales donde se requiere máxima certeza jurídica.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-[var(--tp-brand)] flex-shrink-0 mt-0.5" />
                    <span className="text-sm"><strong>Con no repudio</strong> - Mayor seguridad legal</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-[var(--tp-brand)] flex-shrink-0 mt-0.5" />
                    <span className="text-sm">Para contratos críticos, SII, bancos, etc.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-[var(--tp-brand)] flex-shrink-0 mt-0.5" />
                    <span className="text-sm">Certificación digital con máximo nivel de validez</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Casos de Uso */}
      <section className="py-20 bg-gradient-to-br from-[var(--tp-background-light)] to-background">
        <div className="max-w-7xl tp-container">
          <div className="text-center mb-16">
            <h2 className="mb-4">
              ¿Para Qué Puedes Usar Tu Firma Electrónica?
              <span className="text-[var(--tp-brand)]"> (Más de lo Que Imaginas)</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Una vez que tengas tu firma electrónica, se te va a abrir un mundo de posibilidades. 
              Aquí algunos ejemplos de lo que puedes hacer:
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: Building, title: "Contratos de Arriendo", desc: "Ya sea que arriendas o que eres propietario, firma contratos sin tener que juntarte físicamente." },
              { icon: FileText, title: "Trámites en el SII", desc: "Facturas, boletas, declaraciones de impuestos... todo más fácil con tu firma electrónica." },
              { icon: Briefcase, title: "Documentos Laborales", desc: "Contratos de trabajo, finiquitos, convenios a honorarios." },
              { icon: CreditCard, title: "Documentos Bancarios", desc: "Apertura de cuentas, solicitudes de crédito, contratos de inversión." },
              { icon: Scale, title: "Poderes y Mandatos", desc: "Otorgar poderes sin tener que ir al notario." },
              { icon: FileCheck, title: "Documentos Notariales", desc: "Escrituras, certificados, cualquier documento que requiera fe pública." },
              { icon: Users, title: "Acuerdos Comerciales", desc: "Si tienes un negocio, firma acuerdos con proveedores o clientes sin demoras." },
              { icon: FileSearch, title: "Documentos Legales", desc: "Contratos de compraventa, acuerdos de confidencialidad, convenios." },
              { icon: Heart, title: "Y Mucho Más", desc: "Cualquier documento que antes firmarías con bolígrafo, ahora lo puedes firmar digitalmente." }
            ].map((item, index) => (
              <Card key={index} className="border border-border hover:border-[var(--tp-brand)] hover:shadow-lg transition-all">
                <CardHeader>
                  <Icon icon={item.icon} size="lg" className="text-[var(--tp-brand)] mb-3" />
                  <CardTitle className="text-lg">{item.title}</CardTitle>
                  <CardDescription>{item.desc}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>

          <div className="mt-12 text-center">
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              <strong className="text-foreground">Básicamente, cualquier documento que antes firmarías con bolígrafo, ahora lo puedes firmar digitalmente.</strong> 
              {" "}Y créenos, una vez que empiezas, no vas a querer volver atrás.
            </p>
          </div>
        </div>
      </section>

      {/* Proceso - Cómo Firmar Tu Documento */}
      <ProcessStepsSection
        title="Cómo Firmar Tus Documentos con Tu Patrimonio"
        description="Sabemos que cuando escuchas 'firma electrónica' puede sonar complicado. Pero te prometemos que es más fácil de lo que piensas. Cada documento que firmas con nosotros, lo hacemos juntos."
        totalTime="Cada documento listo en menos de 5 minutos"
        steps={[
          {
            icon: FileText,
            title: "Envías Tu Documento",
            description: "Nos envías el documento que necesitas firmar. Puede ser un contrato, un acuerdo, un documento tributario, lo que sea. Nosotros nos encargamos del resto."
          },
          {
            icon: CheckCircle2,
            title: "Elegimos la Firma Adecuada",
            description: "Según el tipo de documento y el nivel de certeza jurídica que necesitas, te recomendamos firma simple o avanzada. Si necesitas no repudio (que no puedas negar que firmaste), usamos firma avanzada para máxima seguridad legal."
          },
          {
            icon: UserCheck,
            title: "Validamos Tu Identidad",
            description: "Para garantizar que eres tú quien firma, validamos tu identidad (con ClaveÚnica u otro método seguro). Es rápido, seguro y lo haces 100% online."
          },
          {
            icon: Zap,
            title: "¡Documento Firmado!",
            description: "Listo. Tu documento queda firmado con validez legal total. Lo recibes en tu email, listo para usar. Sin impresoras, sin escaneos, sin complicaciones. Y la próxima vez que necesites firmar otro documento, repetimos el proceso."
          }
        ]}
        ctaText="Firmar Mi Primer Documento"
        ctaSubtext="Pagas solo por lo que firmas • Proceso simple • Soporte incluido"
        ctaHref="https://tupatrimon.io"
      />

      {/* Seguridad y Confianza */}
      <LegalValiditySection
        title="¿Es Segura la Firma Electrónica?"
        description="Entendemos que confiar en lo digital puede dar un poco de miedo al principio. '¿Y si alguien la roba?', '¿Y si falsifican mi firma?', '¿Y si el documento no es válido?'. Aquí está la verdad: una firma electrónica avanzada es incluso MÁS segura que tu firma en papel."
        icon={Shield}
        faqs={[
          {
            icon: Lock,
            question: "Está protegida con criptografía",
            answer: (
              <p className="text-muted-foreground">
                Suena complicado, pero básicamente significa que está blindada con tecnología de punta. 
                <strong> Nadie puede copiarla o falsificarla.</strong> La información se encripta de tal manera 
                que es virtualmente imposible de hackear.
              </p>
            )
          },
          {
            icon: UserCheck,
            question: "Solo tú puedes usarla",
            answer: (
              <p className="text-muted-foreground">
                Tu firma está protegida con una clave que solo tú conoces. Es como la contraseña de tu banco, 
                pero aún más segura. Cada vez que firmas, el sistema verifica que realmente seas tú.
              </p>
            )
          },
          {
            icon: FileCheck,
            question: "Deja un rastro digital",
            answer: (
              <p className="text-muted-foreground">
                Cada vez que firmas algo, queda registrado cuándo, dónde y quién firmó. 
                <strong> Esto es incluso mejor que el papel,</strong> donde una firma se puede falsificar más fácilmente. 
                Hay un registro completo e inmutable de cada acción.
              </p>
            )
          },
          {
            icon: Scale,
            question: "Respaldada por la ley",
            answer: (
              <p className="text-muted-foreground">
                La <strong>Ley N° 19.799 de Chile</strong> establece que una firma electrónica avanzada tiene la 
                misma validez que una firma manuscrita. Punto. No hay diferencia legal entre ambas. 
                Tu firma electrónica tiene el mismo peso jurídico que tu firma en papel.
              </p>
            )
          }
        ]}
      />

      {/* Por Qué Tu Patrimonio */}
      <section className="py-20 bg-gradient-to-br from-[var(--tp-brand)] to-[var(--tp-brand-light)] text-white">
        <div className="max-w-7xl tp-container">
          <div className="text-center mb-16">
            <h2 className="text-white mb-6">
              ¿Por Qué Firmar Tus Documentos con Tu Patrimonio?
            </h2>
            <p className="text-xl text-white/90 max-w-3xl mx-auto">
              Hay muchas empresas que venden certificados de firma electrónica por años. Nosotros somos diferentes: 
              <br /><strong>te ayudamos a firmar cada documento que necesites, cuando lo necesites.</strong> No te vendemos tecnología, te facilitamos la vida.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <div className="text-center">
              <div className="w-20 h-20 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Icon icon={Users} size="xl" variant="white" />
              </div>
              <h3 className="text-white font-bold text-xl mb-3">Hablamos en Tu Idioma</h3>
              <p className="text-white/80">
                Nada de jerga técnica. Te explicamos todo de forma clara y sencilla, como si estuviéramos tomando un café.
              </p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Icon icon={Heart} size="xl" variant="white" />
              </div>
              <h3 className="text-white font-bold text-xl mb-3">Te Acompañamos</h3>
              <p className="text-white/80">
                Si tienes dudas, estamos aquí. No te dejamos solo con un manual de 50 páginas. Somos tu aliado en cada paso.
              </p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Icon icon={Shield} size="xl" variant="white" />
              </div>
              <h3 className="text-white font-bold text-xl mb-3">Transparencia Total</h3>
              <p className="text-white/80">
                Sin costos ocultos, sin letra chica, sin sorpresas. Todo es claro desde el principio.
              </p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Icon icon={CheckCircle} size="xl" variant="white" />
              </div>
              <h3 className="text-white font-bold text-xl mb-3">Enfoque en Tu Tranquilidad</h3>
              <p className="text-white/80">
                No solo te vendemos un producto, te damos paz mental. Queremos que te sientas seguro con cada firma que hagas.
              </p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Icon icon={Users} size="xl" variant="white" />
              </div>
              <h3 className="text-white font-bold text-xl mb-3">Somos Humanos</h3>
              <p className="text-white/80">
                Podemos cometer errores, pero siempre vamos a buscar la mejor solución para ti. Porque al final del día, estamos aquí para ayudarte.
              </p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Icon icon={Zap} size="xl" variant="white" />
              </div>
              <h3 className="text-white font-bold text-xl mb-3">Soluciones Reales</h3>
              <p className="text-white/80">
                No buscamos la perfección técnica, buscamos que funcione y resuelva tu problema real. Tu éxito es nuestro éxito.
              </p>
            </div>
          </div>

          <div className="mt-16 text-center">
            <p className="text-xl text-white/90 max-w-3xl mx-auto mb-8">
              Cuando firmas tus documentos con nosotros, no solo estás pagando por una firma. 
              <strong className="text-white"> Estás ganando un aliado</strong> que va a estar contigo cada vez que necesites firmar algo importante. 
              Documento por documento, con total tranquilidad.
            </p>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <StatsSection variant="firmas" />

      {/* FAQ Section */}
      <FAQSection
        title="Preguntas Frecuentes Sobre la Firma Electrónica"
        description="Estas son las dudas más comunes que recibimos. Si no encuentras tu respuesta, escríbenos y te ayudamos."
        categories={[
          {
            name: "Sobre Costos y Cómo Funciona",
            icon: CreditCard,
            color: "text-green-600",
            questions: [
              {
                question: "¿Cuánto cuesta firmar un documento?",
                answer: "El costo varía según el tipo de firma que necesites (simple o avanzada) y el tipo de documento. Pagas solo por cada documento que firmas, no hay suscripciones anuales ni pagos recurrentes. En Tu Patrimonio te ofrecemos precios transparentes y competitivos. Contáctanos para conocer el costo específico de tu documento."
              },
              {
                question: "¿Tengo que pagar algo mensual o anual?",
                answer: "No, nosotros cobramos solo por documento firmado. Necesitas firmar un contrato hoy, pagas solo por ese documento. Necesitas firmar otro documento en 6 meses, pagas solo por ese. Simple y transparente."
              },
              {
                question: "¿Qué incluye el servicio?",
                answer: "Cada vez que firmas un documento con nosotros, incluye: validación de identidad con altos estándares de seguridad (incluso en firma simple), aplicación de la firma electrónica (simple o avanzada según lo necesites), certificación notarial del documento (opcional), y entrega del documento firmado con validez legal total. Todo el proceso guiado y con soporte humano potenciado por IA."
              }
            ]
          },
          {
            name: "Sobre el Proceso",
            icon: Smartphone,
            color: "text-blue-600",
            questions: [
              {
                question: "¿Cómo funciona el proceso?",
                answer: "Es muy simple: 1) Nos envías el documento que necesitas firmar. 2) Te ayudamos a elegir el tipo de firma adecuada (simple o avanzada). 3) Validamos tu identidad de forma segura. 4) Firmas el documento. 5) Te lo enviamos listo para usar. Todo el proceso toma menos de 5 minutos."
              },
              {
                question: "¿Puedo firmar desde mi celular?",
                answer: "Sí, el proceso completo lo puedes hacer desde tu celular, tablet o computador. Donde estés, cuando lo necesites."
              },
              {
                question: "¿Qué documentos puedo firmar?",
                answer: "Casi cualquier documento: contratos de arriendo, laborales, comerciales, documentos bancarios, trámites del SII, poderes, escrituras, acuerdos comerciales, y más. Si tienes dudas sobre un documento específico, consúltanos."
              }
            ]
          },
          {
            name: "Sobre Seguridad y Validez",
            icon: Shield,
            color: "text-purple-600",
            questions: [
              {
                question: "¿Los documentos que firmo tienen validez legal?",
                answer: "Absolutamente. Cada documento que firmas con nosotros tiene plena validez legal en Chile, respaldado por la Ley N° 19.799. Tanto la firma simple como la avanzada son legales y válidas. La firma simple es perfecta para documentos internos, acuerdos comerciales y contratos de confianza mutua, con verificación de identidad robusta. La firma avanzada añade la característica de NO REPUDIO, que da máxima certeza jurídica porque legalmente no puedes negar que firmaste. Esto es crucial para contratos críticos, trámites del SII, documentos bancarios o notariales donde se requiere esa seguridad adicional."
              },
              {
                question: "¿Es seguro firmar mis documentos con ustedes?",
                answer: "Sí, completamente. Usamos los mismos estándares de seguridad que los bancos. Tu identidad se valida de forma segura, cada firma queda registrada con un rastro digital inmutable, y toda la información está encriptada. Tu seguridad es nuestra prioridad número uno."
              },
              {
                question: "¿Qué diferencia hay entre firma simple y avanzada?",
                answer: "Ambas son totalmente legales y válidas en Chile. La diferencia principal es el NO REPUDIO. La firma avanzada (FEA) tiene la característica de no repudio según la Ley 19.799, lo que significa que no puedes negar legalmente que firmaste ese documento. Es como la diferencia entre firmar algo ante testigos versus ante un notario. Firma simple es ideal para documentos internos, acuerdos comerciales y contratos de confianza mutua. Firma avanzada es para cuando necesitas que el documento tenga máxima certeza jurídica: contratos críticos, trámites del SII, documentos bancarios o notariales. Te ayudamos a elegir según tu documento específico."
              },
              {
                question: "¿Puedo usar los documentos firmados fuera de Chile?",
                answer: "Dentro de Chile tienen plena validez legal. Para uso internacional depende del país y del tipo de documento. Si necesitas firmar documentos para el extranjero, consúltanos y te orientamos sobre las opciones disponibles."
              }
            ]
          }
        ]}
        contactCta={{
          text: "Contáctanos por WhatsApp",
          href: "https://wa.me/56912345678?text=Hola,%20tengo%20dudas%20sobre%20la%20firma%20electrónica"
        }}
      />

      {/* CTA Final */}
      <section className="py-20 bg-gradient-to-br from-[var(--tp-background-light)] to-background">
        <div className="max-w-4xl tp-container text-center">
          <h2 className="mb-6">
            Empieza a Firmar Tus Documentos
            <span className="text-[var(--tp-brand)]"> Sin Complicaciones</span>
          </h2>
          
          <p className="text-xl text-muted-foreground mb-6">
            Firmar tus documentos con nosotros es uno de esos pequeños cambios que terminan teniendo un impacto enorme en tu día a día. 
            De repente, trámites que antes te tomaban días ahora los resuelves en minutos. Documentos que requerían coordinar 
            agendas con otras personas ahora se firman desde tu casa.
          </p>
          
          <p className="text-lg text-muted-foreground mb-10">
            Y lo mejor de todo: <strong className="text-foreground">pagas solo por lo que usas</strong>. No hay mensualidades, no hay certificados caros que duran años. 
            Necesitas firmar un documento, lo firmas con nosotros, y listo. <strong>Simple, transparente y con total tranquilidad.</strong>
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-10">
            <a href="https://tupatrimon.io" target="_blank" rel="noopener noreferrer nofollow">
              <Button 
                size="lg" 
                className="bg-[var(--tp-brand)] hover:bg-[var(--tp-brand-light)] text-white px-10 py-6 text-lg font-semibold shadow-lg hover:shadow-xl transition-all"
              >
                Firmar Mi Primer Documento
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </a>
            <Link href="/cl">
              <Button 
                variant="outline" 
                size="lg" 
                className="border-2 border-[var(--tp-brand)] text-[var(--tp-brand)] hover:bg-[var(--tp-brand-5)] px-10 py-6 text-lg font-semibold"
              >
                Ver Todos los Servicios
              </Button>
            </Link>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Icon icon={CheckCircle} size="md" className="text-green-600" />
              <span>Pagas solo por documento</span>
            </div>
            <div className="flex items-center gap-2">
              <Icon icon={Zap} size="md" className="text-green-600" />
              <span>Listo en 5 minutos</span>
            </div>
            <div className="flex items-center gap-2">
              <Icon icon={Users} size="md" className="text-green-600" />
              <span>Soporte humano incluido</span>
            </div>
            <div className="flex items-center gap-2">
              <Icon icon={Lock} size="md" className="text-green-600" />
              <span>100% seguro y legal</span>
            </div>
          </div>

          <p className="text-muted-foreground mt-10 text-lg">
            <strong className="text-foreground">¿Tienes un documento para firmar?</strong> Contáctanos y te ayudamos. 
            No esperes más para simplificar tus trámites. Estamos a un mensaje de distancia.
          </p>
        </div>
      </section>
    </div>
  );
}