import type { Metadata } from "next";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Shield, Lock, Eye, Database, Calendar } from "lucide-react";
import Link from "next/link";
import { LegalNavigation } from "@/components/LegalNavigation";
import { IconContainer } from "@tupatrimonio/ui";

export const metadata: Metadata = {
  title: "Políticas de Privacidad - TuPatrimonio",
  description: "Políticas de privacidad y protección de datos de TuPatrimonio. Conoce cómo recopilamos, usamos y protegemos tu información personal.",
  robots: {
    index: true,
    follow: true,
  },
};

export default function PrivacidadPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-[var(--tp-background-light)] to-white dark:from-background dark:via-[var(--tp-background-dark)] dark:to-background">
      {/* Header */}
      <section className="bg-card border-b">
        <div className="max-w-4xl tp-container py-8">
          <Link href="/">
            <Button variant="ghost" size="sm" className="hover:bg-[var(--tp-bg-light-20)]">
              <ChevronLeft className="w-4 h-4 mr-2" />
              Volver al Inicio
            </Button>
          </Link>
        </div>
      </section>

      {/* Content */}
      <section className="py-16">
        <div className="max-w-7xl tp-container">
          <div className="grid lg:grid-cols-4 gap-8">
            {/* Sidebar Navigation */}
            <aside className="lg:col-span-1">
              <LegalNavigation />
            </aside>

            {/* Main Content */}
            <div className="lg:col-span-3 bg-white dark:bg-card rounded-xl shadow-xl border-2 border-border p-12">
            <div className="text-center mb-16">
              <IconContainer 
                icon={Shield} 
                variant="solid-brand" 
                shape="rounded" 
                size="lg" 
                className="mx-auto mb-6"
              />
              <h1 className="mb-6">
                Políticas de Privacidad
              </h1>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>Última actualización: 31 de agosto de 2024</span>
                </div>
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4" />
                  <span>Cumple Ley 19.628</span>
                </div>
              </div>
            </div>

            <div className="prose prose-lg max-w-none dark:prose-invert">
              
              <p className="lead">
                Las presentes Políticas de Privacidad establecen las políticas de TU PATRIMONIO en cuanto al uso de información del Usuario, las recomendaciones de privacidad y seguridad sugeridas al Usuario, entre otros aspectos de uso del Sitio que a continuación se indican. Para los efectos del presente instrumento, las palabras con mayúsculas tendrán el mismo significado con el que se las ha definido en el Contrato de Uso del Sitio.
              </p>

              <div className="bg-blue-50 dark:bg-blue-950 border-2 border-blue-200 dark:border-blue-800 rounded-xl p-6 md:p-8 my-8 shadow-lg hover:shadow-xl transition-all">
                <div className="flex flex-col sm:flex-row items-start gap-4">
                  <IconContainer 
                    icon={Lock} 
                    variant="brand" 
                    shape="rounded" 
                    size="lg" 
                    className="shrink-0"
                  />
                  <div>
                    <h3 className="text-lg font-bold text-blue-900 dark:text-blue-100 mb-2">
                      Compromiso con tu Privacidad
                    </h3>
                    <p className="text-blue-800 dark:text-blue-200 text-sm md:text-base">
                      Cumplimos estrictamente con la Ley 19.628 de Protección de Datos Personales de Chile 
                      y estándares internacionales de seguridad.
                    </p>
                  </div>
                </div>
              </div>

              <h3>1. Información del Usuario</h3>
              
              <h3>1.1. Aspectos Generales</h3>
              
              <p><strong>a)</strong> TU PATRIMONIO solicitará información al Usuario al momento de registrarse en el Sitio. La información mínima solicitada y de carácter obligatorio para ser Usuario Registrado del Sitio incluye correo electrónico y la creación de una contraseña, en caso que se trate de una persona natural. En caso de que se trate de una persona jurídica, será necesario registrarse con el nombre o razón social de la empresa, su domicilio, y el nombre, apellido, correo electrónico, cédula de identidad (RUT) y fecha de nacimiento de su apoderado legal.</p>

              <p><strong>b)</strong> Al ser tan solo Usuario Registrado o Miembro del Sitio, el Usuario no estará facultado para vender en TU PATRIMONIO.</p>

              <p><strong>c)</strong> El Perfil del Usuario se crea a partir de información obligatoria y de información opcional.</p>

              <p><strong>d)</strong> TU PATRIMONIO solicitará al Usuario cierta información obligatoria como mínima al momento de realizar compras por la plataforma: nombre completo, RUT, fecha de nacimiento, correo electrónico, contraseña, nombre de usuario, nombre del Almacén, dirección del Almacén, Rut de la Empresa.</p>

              <p><strong>e)</strong> Respecto de la información adicional no obligatoria, el Usuario decidirá cuánta información suministrar a TU PATRIMONIO, a su vez, el Usuario decidirá si ésta se hace pública en la Plataforma o si mantiene como privada. El Usuario comprende que la acción de publicar su información es realizada a su propio riesgo y bajo su propia responsabilidad.</p>

              <p><strong>f)</strong> TU PATRIMONIO se reserva el derecho de eliminar cualquier información publicada por el Usuario que TU PATRIMONIO considere como ofensiva, discriminatoria, de acoso, denigratoria, difamatoria, amenazante, obscena, pornográfica o cualquier información que abiertamente atente contra la moral, las buenas costumbres o el orden público; o que TU PATRIMONIO estime a su solo arbitrio como innecesaria para los fines del Sitio.</p>

              <p><strong>g)</strong> Si el Usuario desea obtener ayuda de TU PATRIMONIO previo a su registro como Usuario del Sitio, puede contactarse al correo electrónico <a href="mailto:contacto@tupatrimonio.app" className="text-[var(--tp-buttons)] hover:text-[var(--tp-buttons-hover)]">contacto@tupatrimonio.app</a>, WhatsApp o las opciones indicadas en la sección Contacto del sitio web.</p>

              <h3>1.2. Obtención de Información del Usuario</h3>
              <p>
                TU PATRIMONIO podrá obtener información del Usuario de manera directa de éste al momento del registro en el Sitio y/o cuando éste realiza consultas a través de la Sección Contacto del Sitio, a través del correo electrónico contacto@tupatrimonio.app u otros correos electrónicos definidos por TU PATRIMONIO y WhatsApp. TU PATRIMONIO recolectará información del Usuario periódicamente, cada vez que el Usuario actualice su información personal en su Perfil de Usuario y cada vez que éste se contacte con TU PATRIMONIO. TU PATRIMONIO, a su vez, podrá obtener información del Usuario a través de fuentes externas, para poder ofrecer al Usuario los servicios que éste solicita en el Sitio. El Usuario comprende que TU PATRIMONIO podrá establecer en el futuro nuevos mecanismos para obtener información del Usuario, de manera que los Usuarios del Sitio cuenten con la mayor cantidad de información posible, lo que contribuye a una mejor experiencia para el Usuario.
              </p>

              <h3>1.3. Acceso a Información Disponible en el Sitio</h3>
              <p>
                TU PATRIMONIO entregará al Usuario Registrado acceso a los documentos legales relativos a los servicios utilizados en TU PATRIMONIO e información relativa a las transacciones realizadas en la Plataforma. El Usuario Registrado podrá revisar su información personal en cualquier momento, disponible en la sección &quot;Perfil de Usuario&quot; del Sitio. El Usuario podrá actualizar su información personal en su Perfil cuantas veces lo desee.
              </p>

              <h3>2. Uso de la Información del Usuario</h3>
              <p>
                TU PATRIMONIO utilizará la información del Usuario para facilitar las transacciones que ocurren en el Sitio y mejorar su experiencia. Esto incluye, entre otras acciones:
              </p>
              <ul>
                <li><strong>a)</strong> Comunicarse y coordinarse con proveedores de TU PATRIMONIO para llevar a cabo los servicios ofrecidos.</li>
                <li><strong>b)</strong> Asistir a los miembros de TU PATRIMONIO para concretar las compras de manera exitosa.</li>
                <li><strong>c)</strong> Cualquier otra acción que vaya en dirección de mejorar los servicios o la experiencia del Usuario.</li>
              </ul>

              <h3>3. Recomendaciones de Seguridad al Usuario</h3>

              <div className="bg-amber-50 dark:bg-amber-950 border-2 border-amber-200 dark:border-amber-800 rounded-xl p-6 md:p-8 my-8 shadow-lg hover:shadow-xl transition-all">
                <div className="flex flex-col sm:flex-row items-start gap-4 mb-4">
                  <IconContainer 
                    icon={Shield} 
                    variant="brand" 
                    shape="rounded" 
                    size="lg" 
                    className="shrink-0"
                  />
                  <h3 className="text-lg font-bold text-amber-900 dark:text-amber-100">
                    Recomendaciones de Seguridad
                  </h3>
                </div>
                <ul className="text-amber-800 dark:text-amber-200 space-y-2 text-sm md:text-base">
                  <li>• Protege tu contraseña y mantenla siempre en privado</li>
                  <li>• Cambia tu contraseña con frecuencia</li>
                  <li>• Nunca compartas tus credenciales con terceros</li>
                  <li>• Ingresa solo a través de <strong>https://tupatrimonio.app</strong></li>
                </ul>
              </div>

              <h3>3.1. Nombre de Usuario</h3>
              <p>
                El Nombre de Usuario en TU PATRIMONIO es elegido por el Usuario al momento de registrarse en el Sitio. El Nombre de Usuario podrá ser el nombre real del Usuario o un &quot;nickname&quot; o nombre imaginario.
              </p>

              <h3>3.2. Información de Identificación Personal</h3>
              <p>
                En el Perfil de Usuario nunca aparecerá en forma visible el RUT del Usuario ni información de contacto del mismo, a menos que el Usuario lo autorice. Si el Usuario publicara dicha información en los campos de texto libre con que cuenta su Perfil de Usuario, el Usuario comprende que realiza dicha acción a su propio riesgo y bajo su propia responsabilidad. Sin perjuicio de lo anterior, TU PATRIMONIO podrá desactivar la Cuenta del Usuario en tupatrimonio.app si identifica que un Usuario se encuentra realizando acciones que podrían atentar contra su seguridad. A su vez, TU PATRIMONIO recomienda al Usuario proteger su Nombre de Usuario y Contraseña, manteniéndolas siempre en privado y no compartiendo dicha información, la cual siempre debe ser manejada en forma personal y privada. El Nombre de Usuario y Contraseña, requeridos para autentificarse en tupatrimonio.app, siempre deberán ser de uso exclusivo del titular de la Cuenta de Usuario.
              </p>

              <h3>3.3. Contraseña</h3>
              <p>
                Por seguridad, se recomienda al Usuario cambiar su Contraseña con frecuencia. El Usuario no deberá compartir su Contraseña con terceros, pues ésta es de uso exclusivo del titular de la Cuenta de Usuario. Si el Usuario comparte su Nombre de Usuario y Contraseña con terceros, el Usuario comprende que esta acción es realizada a su propio riesgo y bajo su propia responsabilidad. TU PATRIMONIO proveerá mecanismos para que el Usuario recupere su Contraseña en caso que la haya olvidado. TU PATRIMONIO nunca solicitará al Usuario su Contraseña a través de ningún medio que no sea al momento de su autentificación en el Sitio.
              </p>

              <h3>3.4. Sitio</h3>
              <p>
                Se recomienda al usuario ingresar a TU PATRIMONIO únicamente a través de la url: <a href="https://tupatrimonio.app" target="_blank" rel="noopener noreferrer nofollow" className="text-[var(--tp-buttons)] hover:text-[var(--tp-buttons-hover)]">https://tupatrimonio.app</a>
              </p>

              <h3>4. Cuenta de Usuario y Resguardo de Información</h3>

              <h3>4.1. Cuenta de Usuario y Privacidad de la Información</h3>
              <p>
                Cada Usuario Registrado en TU PATRIMONIO tendrá su propia Cuenta de Usuario, a la que accede una vez que se autentifica en el Sitio, ingresando su Nombre de Usuario y Contraseña. El Usuario tendrá un Perfil de Usuario, donde podrá publicar información sobre sí mismo. En el Perfil de Usuario, cada Usuario decidirá qué información hacer visible para otros Usuarios y qué información mantener de forma privada. TU PATRIMONIO se reserva el derecho de restringir ciertos campos que nunca podrán ser visibles para otros Usuarios.
              </p>

              <h3>5. Información Pública de los Usuarios</h3>

              <h3>5.1. Aspectos Generales</h3>
              <p>
                Dado que el Sitio está orientado a entregar servicios digitales para ofrecer soluciones a trámites de diversos ámbitos, es importante que los Usuarios cuenten con la mejor información posible. El Usuario podrá entregar a TU PATRIMONIO tanta información como éste estime necesario, conveniente y apropiado entregar.
              </p>

              <h3>5.2. Compartir Información</h3>
              <p>
                El compartir la información suministrada por el Usuario a TU PATRIMONIO con otros Usuarios del Sitio, es una elección personal del Usuario y es una acción realizada a su propio riesgo y bajo su propia responsabilidad. TU PATRIMONIO compartirá la información de los Usuarios en los siguientes casos:
              </p>
              <ul>
                <li><strong>a)</strong> Los Usuarios Registrados podrán acceder a la información de otros Usuarios sólo cuando estos hayan elegido que se haga pública su información para otros Usuarios.</li>
                <li><strong>b)</strong> TU PATRIMONIO compartirá cierta información del Usuario con terceros que están relacionados con el servicio que el Usuario ha utilizado, así como con terceros que son proveedores de TU PATRIMONIO – e.g. empresas enviadoras de correos electrónicos masivos u otras – con el fin de proveer un mejor servicio al Usuario.</li>
                <li><strong>c)</strong> TU PATRIMONIO entregará la información del Usuario de acuerdo a lo permitido y/o requerido por ley o por entidades judiciales y/o fiscalizadoras que requieran dicha información de TU PATRIMONIO.</li>
                <li><strong>d)</strong> TU PATRIMONIO no venderá ni arrendará la información suministrada por el Usuario a TU PATRIMONIO a terceros con fines publicitarios y/o comerciales.</li>
              </ul>

              <h3>6. Información de Procesamiento de Pagos</h3>

              <h3>6.1. Aspectos Generales</h3>
              <p>
                TU PATRIMONIO procesa los pagos de los Usuarios a través de plataformas como Khipu, Mercadopago o Transbank, con la finalidad de ofrecer una mayor cantidad de alternativas de pago a sus usuarios. Esto, además, ofrece la ventaja que los pagos son procesados sin errores y custodiados por empresas con el desarrollo tecnológico adecuado para llevar a cabo esta función de la forma más segura posible.
              </p>

              <h3>6.2. Otras Restricciones</h3>
              <p>
                El RUT, información de contacto, información de cuentas corrientes y de tarjetas de créditos de los Usuarios -que han sido suministradas a TU PATRIMONIO- nunca estará disponible ni será visible para ningún Usuario a través del Sitio.
              </p>

              <h3>7. Protección de la Información del Usuario</h3>

              <div className="bg-green-50 dark:bg-green-950 border-2 border-green-200 dark:border-green-800 rounded-xl p-6 md:p-8 my-8 shadow-lg hover:shadow-xl transition-all">
                <div className="flex flex-col sm:flex-row items-start gap-4 mb-4">
                  <IconContainer 
                    icon={Database} 
                    variant="brand" 
                    shape="rounded" 
                    size="lg" 
                    className="shrink-0"
                  />
                  <h3 className="text-lg font-bold text-green-900 dark:text-green-100">
                    Medidas de Protección
                  </h3>
                </div>
                <ul className="text-green-800 dark:text-green-200 space-y-2 text-sm md:text-base">
                  <li>• <strong>Encriptación de datos</strong> para proteger tu información</li>
                  <li>• <strong>Firewalls</strong> y tecnologías de seguridad avanzadas</li>
                  <li>• <strong>Pruebas de seguridad</strong> realizadas con frecuencia</li>
                  <li>• <strong>Almacenamiento seguro</strong> en bases de datos protegidas</li>
              </ul>
              </div>

              <h3>7.1. Aspectos Tecnológicos</h3>
              <p>
                TU PATRIMONIO utiliza mecanismos físicos y electrónicos, además de procedimientos y prácticas, que buscan salvaguardar la información de los Usuarios. Dentro de estos mecanismos, TU PATRIMONIO utiliza tecnología de encriptación de datos u otras tecnologías para proteger la información que el Usuario suministra en el Sitio y que es guardada en las bases de datos de TU PATRIMONIO. TU PATRIMONIO utiliza firewalls y otras tecnologías con fines de seguridad para proteger los servidores de ataques y/o hackeos de terceros. TU PATRIMONIO realiza pruebas de seguridad con frecuencia de manera de asegurar un ambiente lo más seguro posible para sus Usuarios.
              </p>

              <h3>7.2. Almacenamiento de la Información</h3>
              <p>
                TU PATRIMONIO guarda la información obtenida a través del Sitio y a través de otros mecanismos de recolección de datos de sus Usuarios en sus bases de datos, con el fin de proveer un adecuado servicio a los Usuarios Registrados, con el fin de asegurar la integridad de los datos y con el fin de prevenir los fraudes de terceros.
              </p>

              <p className="bg-yellow-50 dark:bg-yellow-950 border-l-4 border-yellow-400 p-4 my-6 text-sm md:text-base">
                <strong>Nota importante:</strong> Sin perjuicio de lo señalado en los puntos anteriores, el Usuario comprende que las medidas de seguridad en Internet no son inexpugnables.
              </p>

              <h3>8. Opciones Respecto a las Comunicaciones Generadas en el Sitio</h3>
              <p>
                TU PATRIMONIO enviará notificaciones al Usuario a su email, mensajería interna de la Plataforma y WhatsApp, notificaciones que se encuentran relacionadas con el uso de los servicios ofrecidos en TU PATRIMONIO. TU PATRIMONIO se reserva el derecho a no enviar todas las comunicaciones y/o notificaciones al Usuario por email o WhatsApp. TU PATRIMONIO podrá comunicar cierta información únicamente a través de mensajería interna del Sitio, de acuerdo a su propio criterio.
              </p>

              <h3>9. Uso de Cookies y &quot;Web Beacons&quot;</h3>

              <h3>9.1. Definición</h3>
              <p>
                Las cookies son pequeños archivos de texto que los sitios web almacenan en tu dispositivo para recordar información sobre tu visita.
              </p>

              <h3>9.2. Uso de Cookies en TU PATRIMONIO</h3>
              <p>
                TU PATRIMONIO usa cookies cuando el Usuario ingresa al Sitio, al momento de generar una sesión. La cookie permite mantener el seguimiento, la navegación y la seguridad por el tiempo de uso de esta sesión. En esta cookie se incluyen algunos identificadores de sesión para asegurar que sólo el Usuario es quien realice cambios en su cuenta. También se utilizan cookies para realizar seguimiento de la actividad de la Cuenta como un Usuario Único. Toda esta información es almacenada en forma encriptada por motivos de seguridad, no almacenando ninguna información personal del Usuario en la cookie.
              </p>

              <p>
                TU PATRIMONIO usa una cookie como ID de sesión para hacer más fácil la navegación por la Plataforma. La cookie de sesión expira cuando se cierra el navegador. TU PATRIMONIO usa una cookie persistente que se mantiene en tu disco duro por más tiempo, de esta manera TU PATRIMONIO puede reconocer cuando el Usuario regresa a navegar al Sitio. Todo usuario puede remover esta cookie persistente siguiendo las instrucciones provistas por su respectivo navegador de Internet en la sección &quot;Ayuda&quot;; sin embargo, dado que TU PATRIMONIO usa las cookies para la funcionalidad de Autentificación, si el Usuario escoge la opción de &quot;deshabilitar las cookies&quot;, no será posible que el Usuario ingrese al sitio web de TU PATRIMONIO.
              </p>

              <h3>9.3. Google Analytics</h3>
              <p>
                Utilizamos Google Analytics para analizar el uso de nuestro sitio web. Para más información sobre cómo Google Analytics recopila y procesa datos, visita: <a href="https://developers.google.com/analytics/devguides/collection/analyticsjs/cookie-usage?hl=es" target="_blank" rel="noopener noreferrer nofollow" className="text-[var(--tp-buttons)] hover:text-[var(--tp-buttons-hover)]">Google Analytics Cookie Usage</a>
              </p>

              <h3>10. Contacto</h3>
              <p>
                Las comunicaciones que el Usuario deba o quiera dirigir a TU PATRIMONIO, se efectuarán por correo electrónico dirigido a <a href="mailto:contacto@tupatrimonio.app" className="text-[var(--tp-buttons)] hover:text-[var(--tp-buttons-hover)]">contacto@tupatrimonio.app</a>, WhatsApp, o bien a través de la sección Contacto de <a href="https://tupatrimonio.app" className="text-[var(--tp-buttons)] hover:text-[var(--tp-buttons-hover)]">https://tupatrimonio.app</a>.
              </p>

              <p>
                Las comunicaciones que TU PATRIMONIO deba o quiera dirigir al Usuario, se efectuarán por correo electrónico dirigido a la dirección electrónica o WhatsApp designados por el Usuario en el Proceso de Registro en la Plataforma.
              </p>

              <h3>11. Declaración</h3>
              <p>
                En este acto y por el presente, el Usuario reconoce haber leído por vía electrónica, y comprendido, el contenido íntegro de las Políticas de Seguridad del Sitio, y que al marcar la casilla de verificación &quot;Acepto los Términos y Condiciones&quot; incluido en el formulario de registro de vendedor, acepta expresa, inequívoca e irrevocablemente las Políticas de Seguridad del Sitio. El documento electrónico de las Políticas de Privacidad será archivado en la base de datos de TU PATRIMONIO, y será accesible al Usuario en su Perfil de Usuario. En caso que el Usuario necesite identificar y corregir errores en el envío o en sus datos, podrá contactar a TU PATRIMONIO por los medios indicados en la sección anterior del presente instrumento.
              </p>

            </div>

            {/* CTA */}
            <div className="mt-12 md:mt-16 text-center pt-8 border-t-2">
              <p className="text-base md:text-lg text-muted-foreground mb-6 px-4">
                ¿Tienes preguntas sobre nuestra política de privacidad o el manejo de tus datos?
              </p>
              <Link href="mailto:contacto@tupatrimonio.app">
                <Button size="lg" className="bg-[var(--tp-buttons)] hover:bg-[var(--tp-buttons-hover)] px-6 md:px-8">
                Contactar Equipo de Privacidad
              </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
      </section>
    </div>
  );
}
