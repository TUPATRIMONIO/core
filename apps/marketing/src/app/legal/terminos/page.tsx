import type { Metadata } from "next";
import { Button } from "@/components/ui/button";
import { ChevronLeft, FileText, Shield, Calendar } from "lucide-react";
import Link from "next/link";
import { LegalNavigation } from "@/components/LegalNavigation";
import { IconContainer } from "@tupatrimonio/ui";

export const metadata: Metadata = {
  title: "Términos de Servicio - TuPatrimonio",
  description: "Términos y condiciones de uso de la plataforma TuPatrimonio. Servicios de firma electrónica, verificación de identidad y notaría digital.",
  robots: {
    index: true,
    follow: true,
  },
};

export default function TerminosPage() {
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
                icon={FileText} 
                variant="solid-brand" 
                shape="rounded" 
                size="lg" 
                className="mx-auto mb-6"
              />
              <h1 className="mb-6">
                Contrato de Términos y Condiciones de Uso de TuPatrimon.io
              </h1>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>Última actualización: 01 de mayo de 2025</span>
                </div>
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  <span>Vigente desde: 01 de mayo de 2025</span>
                </div>
              </div>
            </div>

            <div className="prose prose-lg max-w-none dark:prose-invert">
              
              <p className="lead">
                Al registrarse y/o utilizar la Plataforma Web de TU PATRIMONIO ASESORÍAS SPA., Rol Único Tributario No. 77.028.682-4, 
                en adelante &quot;TuPatrimon.io®&quot;, la persona natural o jurídica, en adelante &quot;Usuario&quot;, acepta las condiciones 
                que se establecen a continuación y manifiesta su total conformidad con éstas.
              </p>

              <p>
                Por lo cual solicitamos leer con atención los siguientes términos y condiciones de uso del sitio web de TuPatrimon.io® 
                (<a href="https://tupatrimon.io" target="_blank" rel="noopener noreferrer nofollow">https://tupatrimon.io</a>), junto con los alcances de los servicios que provee.
              </p>

              <p>
                Los presentes términos y condiciones regulan el uso del sitio web de TU PATRIMONIO ASESORÍAS SPA., Rol Único Tributario 
                No. 77.028.682-4, domiciliado en Av. Providencia, 1208 OF 207, Providencia, Santiago.
              </p>

              <h3>1. DEFINICIONES</h3>
              <p>Para los efectos del presente Contrato de Uso del Sitio y de los demás Acuerdos Específicos, se entenderá que las palabras listadas a continuación tendrán el significado que para cada una se indica:</p>
              
              <ul>
                <li><strong>&quot;TuPatrimon.io®&quot;</strong>: significa la empresa TU PATRIMONIO ASESORÍAS SPA., Rol Único Tributario No. 77.028.682-4, y el sitio web <a href="https://tupatrimon.io" target="_blank" rel="noopener noreferrer nofollow">https://tupatrimon.io</a>, utilizados indistintamente;</li>
                <li><strong>&quot;Sitio&quot;</strong>: significa la plataforma web de propiedad y bajo operación de TuPatrimon.io®, disponible en <a href="https://tupatrimon.io" target="_blank" rel="noopener noreferrer nofollow">https://tupatrimon.io</a>;</li>
                <li><strong>&quot;Contrato de Uso del Sitio&quot;</strong>: significa el presente contrato aceptado por el Usuario en la instancia de Registro de Usuario en el Sitio;</li>
                <li><strong>&quot;Usuario&quot; y/o &quot;Usuarios&quot;</strong>: significa la persona natural o jurídica que ingresa al Sitio, navega en el mismo y/o utiliza los servicios y/o la información contenida en el Sitio;</li>
                <li><strong>&quot;Usuario No Registrado&quot;</strong>: significa aquel Usuario que no ha completado con éxito el proceso de Registro del Usuario;</li>
                <li><strong>&quot;Usuario Registrado&quot; o &quot;Miembro&quot;</strong>: significan, indistintamente, cualquier Usuario que ha completado exitosamente el proceso de Registro del Usuario en tupatrimon.io;</li>
                <li><strong>&quot;Registro de Usuario&quot;</strong>: significa el proceso por el cual un Usuario No Registrado procede a completar satisfactoriamente el procedimiento de inscripción en el Sitio;</li>
                <li><strong>&quot;Autentificación&quot;</strong>: significa la acción de acceder al Sitio como Usuario Registrado mediante el ingreso de su &quot;Nombre de Usuario&quot; y &quot;Contraseña&quot;;</li>
                <li><strong>&quot;Nombre de Usuario&quot;</strong>: significa el nombre que identifica al Usuario Registrado, designado por éste, y que se encuentra registrado en las bases de datos de TuPatrimon.io®;</li>
                <li><strong>&quot;Contraseña&quot; o &quot;Clave de Acceso&quot;</strong>: significan, indistintamente, la combinación alfanumérica designada por el Usuario Registrado;</li>
                <li><strong>&quot;Acuerdos Específicos&quot;</strong>: significa el conjunto de términos y condiciones específicas presentadas a los Usuarios en tupatrimon.io;</li>
                <li><strong>&quot;Políticas de Privacidad&quot;</strong>: tendrá el significado señalado en la sección 4 de este Contrato de Uso del Sitio;</li>
                <li><strong>&quot;Cuenta&quot;</strong>: significa la instancia del Sitio a la que el Usuario accede al autentificarse;</li>
                <li><strong>&quot;Perfil de Usuario&quot;</strong>: significa la instancia en que el Usuario maneja y publica el conjunto de información personal del Usuario;</li>
                <li><strong>&quot;Contenidos&quot;</strong>: significa todo el material del Sitio, incluyendo a modo de ejemplo y no limitativo los textos, datos, artículos, diseños, logotipos, marcas registradas, formularios, documentos, gráficos, fotos, imágenes, contenidos en general;</li>
                <li><strong>&quot;Monedero Digital&quot;</strong>: significa la funcionalidad de la plataforma donde el usuario puede mantener dinero virtual para ser utilizado en la contratación de servicios o compra de productos.</li>
              </ul>

              <h3>2. ASPECTOS GENERALES DEL CONTRATO DE USO DEL SITIO</h3>
              
              <h3>2.1. OBJETO DEL CONTRATO DE USO DEL SITIO</h3>
              <p>El presente Contrato de Uso del Sitio tiene por objeto regular la relación entre TuPatrimon.io® y el Usuario, definiendo los términos y condiciones de uso del Sitio.</p>

              <h3>2.2. ACEPTACIÓN DEL CONTRATO DE USO DEL SITIO</h3>
              <p>Al marcar la casilla de verificación &quot;Acepto los Términos y Condiciones&quot; ubicado al final del formulario de registro o de pago en la contratación de algún servicio, el Usuario reconoce y declara haber leído, comprendido y aceptado íntegramente el texto del Contrato de Uso del Sitio en todas sus partes.</p>

              <h3>2.3. FACULTADES DE TuPatrimon.io® EN RELACIÓN CON LOS CONTENIDOS DEL SITIO</h3>
              <p>TuPatrimon.io® podrá hacer cambios en los Contenidos y en el Sitio, en cualquier momento y sin previa notificación a los Usuarios.</p>

              <h3>2.4. ACUERDOS ESPECÍFICOS</h3>
              <p>Para acceder y hacer uso de ciertas secciones específicas del Sitio y de las páginas web que lo conforman, TuPatrimon.io® podrá requerir de la aceptación por parte del Usuario, de ciertos términos y condiciones específicas adicionales a las contenidas en el presente Contrato de Uso del Sitio.</p>

              <h3>2.5. AUTONOMÍA DE LAS CLÁUSULAS DEL CONTRATO DE USO DEL SITIO</h3>
              <p>Si cualquier cláusula de este Contrato de Uso del Sitio fuese declarada como inexistente, inválida, inoponible y/o de cualquier modo ineficaz por tribunal competente, las demás cláusulas de este Contrato de Uso del Sitio y los derechos y obligaciones que de ellas emanan, mantendrán su plena vigencia y validez.</p>

              <h3>3. MODIFICACIONES Y TÉRMINO DEL CONTRATO DE USO DEL SITIO</h3>
              
              <h3>3.1. MODIFICACIONES</h3>
              <p>TuPatrimon.io® podrá en cualquier momento y de tiempo en tiempo, corregir, modificar, agregar, eliminar y actualizar los términos y condiciones de este Contrato de Uso del Sitio. Para dichos efectos, TuPatrimon.io® notificará oportunamente al Usuario de las modificaciones.</p>

              <h3>3.2. TÉRMINO DEL CONTRATO DE USO DEL SITIO</h3>
              <p>Este Contrato de Uso del Sitio se encontrará vigente y será efectivo mientras TuPatrimon.io® mantenga en operación el Sitio TuPatrimon.io®. TuPatrimon.io® se reserva el derecho de terminar de ofrecer el Sitio, sus Contenidos y los servicios que se proveen a través del Sitio en cualquier momento previa notificación a los Usuarios y Miembros de TuPatrimon.io®.</p>

              <p>Sin perjuicio de lo anterior, TuPatrimon.io® podrá poner término inmediato al Contrato de Uso del Sitio en caso de decidir, a su sola discreción, desactivar la cuenta de un Miembro en cualquiera de los siguientes casos:</p>
              <ol>
                <li>En caso de comprobar que alguna de las informaciones suministradas por el Usuario fuese falsa, incompleta, inexacta, errónea, y/o de cualquier forma poco fidedigna;</li>
                <li>En el evento de incurrir el Usuario en un uso no autorizado del Contenido del Sitio;</li>
                <li>En el evento de incurrir el Usuario en alguna conducta u omisión que vulnere las disposiciones antispam;</li>
                <li>En el evento de incurrir el Usuario en alguna infracción grave de sus obligaciones bajo el Contrato de Uso del Sitio y/o los Acuerdos Específicos.</li>
              </ol>

              <p>Se deja expresa constancia de que el Usuario no podrá retractarse del presente Contrato de Uso del Sitio y sus anexos, salvo que la legislación aplicable en su jurisdicción reconozca un derecho de retracto o desistimiento en contratos de esta naturaleza.</p>

              <h3>4. POLÍTICAS DE PRIVACIDAD, CONFIDENCIALIDAD Y RESGUARDO DE LA INFORMACIÓN</h3>
              
              <ol>
                <li>El Usuario se obliga a guardar reserva sobre los datos proporcionados por otros Usuarios.</li>
                <li>El Usuario se obliga a custodiar su Nombre de Usuario y Contraseña. En caso de detectar mal uso, el Usuario se obliga a dar aviso inmediato a TuPatrimon.io® mediante correo electrónico dirigido a <a href="mailto:contacto@tupatrimon.io">contacto@tupatrimon.io</a>.</li>
                <li>El Usuario acepta que TuPatrimon.io® pueda almacenar, usar, reproducir, modificar y transferir a sus filiales, proveedores y subcontratistas sus datos, incluidos los datos personales.</li>
                <li>TuPatrimon.io® trata los datos personales en conformidad con la normativa aplicable en materia de protección de datos.</li>
                <li>El Usuario podrá eliminar su cuenta y todos los datos asociados a ella de forma inmediata ingresando al submenú &quot;Borrar mi cuenta&quot; en la plataforma de TuPatrimon.io®.</li>
              </ol>

              <h3>5. ESTRUCTURA EMPRESARIAL Y FACTURACIÓN</h3>
              
              <h3>5.1. EMPRESAS PRESTADORAS DE SERVICIOS</h3>
              <p>La plataforma tupatrimon.io es propiedad de TU PATRIMONIO ASESORÍAS SPA. Los servicios ofrecidos a través de la plataforma podrán ser prestados y facturados por cualquiera de las empresas del grupo TU PATRIMONIO:</p>
              <ul>
                <li><strong>TU PATRIMONIO ASESORÍAS SPA.</strong>, sociedad constituida bajo las leyes de Chile, RUT 77.028.682-4, o</li>
                <li><strong>TU PATRIMONIO LLC.</strong>, sociedad constituida bajo las leyes de Estados Unidos, EIN 32-0771120.</li>
              </ul>
              <p>La empresa que facturará los servicios se determinará automáticamente según el medio de pago utilizado por el Usuario: los pagos procesados a través de Stripe serán facturados por TU PATRIMONIO LLC, mientras que los pagos realizados a través de otros medios serán facturados por TU PATRIMONIO ASESORÍAS SPA.</p>

              <h3>6. VERACIDAD DE LA INFORMACIÓN DEL USUARIO</h3>
              
              <h3>6.1. RESPONSABILIDAD DEL USUARIO</h3>
              <p>El Usuario se obliga a que toda la información que proporcione a TuPatrimon.io® debe ser veraz, fidedigna y comprobable. El Usuario es responsable exclusivo de mantener su información personal siempre actualizada.</p>

              <h3>6.2. PROHIBICIONES</h3>
              <p>El Usuario comprende que no podrá crear cuentas o utilizar el Sitio proporcionando datos falsos.</p>

              <h3>6.3. VERIFICACIONES</h3>
              <p>TuPatrimon.io® se reserva el derecho de verificar la información proporcionada por el Usuario. En caso de comprobar que la información no es veraz, TuPatrimon.io® podrá desactivar la Cuenta y Registro del Usuario.</p>

              <h3>7. PROPIEDAD INTELECTUAL</h3>
              
              <h3>7.1. CONTENIDOS PROTEGIDOS</h3>
              <p>Todo el material del Sitio y sus Contenidos, incluyendo textos, datos, artículos, diseños, logotipos, marcas registradas, formularios, documentos, gráficos, fotos, imágenes, códigos fuente, software, entre otros, son propiedad de TuPatrimon.io®.</p>

              <h3>7.2. MARCAS REGISTRADAS</h3>
              <p>TuPatrimon.io® (incluyendo sus logos), su marca, nombres comerciales o signos distintivos que aparecen en el Sitio, es marca registrada de propiedad TU PATRIMONIO ASESORÍAS SPA.</p>

              <h3>7.3. PROHIBICIONES</h3>
              <p>El Contenido no podrá ser copiado, modificado, reproducido, reutilizado, redistribuido, republicado, expuesto o posteado por el Usuario en ninguna forma y bajo ningún medio sin la previa autorización escrita por parte de TuPatrimon.io®.</p>

              <h3>7.4. CONSECUENCIAS DEL USO NO AUTORIZADO</h3>
              <p>Cualquier uso no autorizado de cualquier Contenido del Sitio constituirá una violación de las leyes de derechos de autor y de propiedad intelectual.</p>

              <h3>8. USO DEL SITIO Y DE SU CONTENIDO</h3>
              
              <h3>8.1. ASPECTOS GENERALES</h3>
              <p>El Usuario acepta usar el Contenido y el Sitio sólo con propósitos que caen dentro del marco legal y regulatorio, de acuerdo a la moral y buenas costumbres.</p>

              <h3>8.2. PROHIBICIONES EN EL USO DEL SITIO Y DE LOS CONTENIDOS</h3>
              <p>El Usuario comprende y acepta que no podrá:</p>
              <ol>
                <li>Usar el Sitio para fines que violen las leyes vigentes;</li>
                <li>Distribuir información fraudulenta, engañosa, discriminatoria, violenta, amenazante, difamatoria o denigrante;</li>
                <li>Distribuir contenidos protegidos por leyes de propiedad intelectual sin autorización;</li>
                <li>Usar o hackear el Sitio de cualquier forma que pudiere dañar su normal funcionamiento;</li>
                <li>Transmitir virus o programas maliciosos;</li>
                <li>Impedir o interrumpir el uso del Sitio a terceros;</li>
                <li>Efectuar un mal uso de contraseñas;</li>
                <li>Monitorear, copiar o extraer información del Sitio;</li>
                <li>Publicar información privada o de identificación personal de cualquier Miembro;</li>
                <li>Efectuar un mal uso de cualquier información y contenido accesibles desde el Sitio.</li>
              </ol>

              <h3>9. REQUISITOS PARA SER USUARIO REGISTRADO DEL SITIO</h3>
              <p>Para poder acceder a ser Usuario Registrado de TuPatrimon.io®, el Usuario debe contar con correo electrónico y ser mayor de 18 años de edad.</p>

              <h3>10. POLÍTICAS ANTI SPAM DEL USUARIO</h3>
              <p>El Usuario se obliga a abstenerse de:</p>
              <ol>
                <li>Recopilar desde el Sitio datos con finalidad publicitaria;</li>
                <li>Transmitir material promocional no solicitado;</li>
                <li>Transmitir SPAM, cadenas de mensajes o correo basura;</li>
                <li>Hackear los sistemas del Sitio para acceder a bases de datos.</li>
              </ol>

              <h3>11. VÍNCULOS A SITIOS WEB DE TERCEROS</h3>
              <p>El Sitio podrá contener vínculos a otros sitios web de propiedad, operados y/o controlados por terceros. TuPatrimon.io® no es responsable de la veracidad y autenticidad de la información proporcionada en estos sitios de terceros.</p>

              <h3>12. SERVICIOS DE FIRMA ELECTRÓNICA Y LEGALIZACIÓN NOTARIAL</h3>
              
              <h3>12.1. PROCEDIMIENTO PARA LOS SERVICIOS DE FIRMA ELECTRÓNICA Y LEGALIZACIÓN NOTARIAL</h3>
              <p>El procedimiento para la contratación y ejecución de los servicios se regirá por las disposiciones siguientes:</p>
              
              <ol>
                <li><strong>Carga o Creación de Documentos:</strong> El Usuario deberá cargar el documento a firmar en formato PDF legible o crear un documento utilizando las plantillas proporcionadas.</li>
                <li><strong>Análisis Preliminar Automatizado:</strong> TuPatrimon.io® realizará un análisis preliminar mediante inteligencia artificial, que es meramente orientativo y no constituye asesoría legal.</li>
                <li><strong>Selección de Servicios:</strong> El Usuario deberá seleccionar los servicios deseados (Básico o Premium).</li>
                <li><strong>Revisión Final Automatizada:</strong> Se realizará una revisión final antes de proceder con las firmas.</li>
                <li><strong>Proceso de Firmas:</strong> Se notificará a los firmantes designados para realizar la firma electrónica.</li>
                <li><strong>Trámite Notarial:</strong> Una vez completadas las firmas, el documento será remitido a la notaría correspondiente.</li>
              </ol>

              <h3>12.2. TIPOS DE FIRMAS ELECTRÓNICAS</h3>
              <ol>
                <li><strong>Firma Electrónica Simple con Verificación por Código:</strong> Autenticación mediante código único enviado por SMS y/o correo electrónico.</li>
                <li><strong>Firma Electrónica Simple con Verificación por Biometría y OCR:</strong> Utiliza reconocimiento biométrico y lectura óptica de caracteres.</li>
                <li><strong>Firma Electrónica Avanzada (FEA):</strong> Sistema que cumple con los estándares establecidos por la normativa aplicable.</li>
              </ol>

              <h3>12.3. SERVICIOS NOTARIALES</h3>
              <p>Los servicios notariales ofrecidos por TuPatrimon.io® consistirán en:</p>
              <ul>
                <li><strong>Copia Legalizada:</strong> Obtención de una copia certificada del documento firmado.</li>
                <li><strong>Protocolización:</strong> Incorporación del documento al protocolo notarial.</li>
                <li><strong>Firma Autorizada por Notario (FAN):</strong> Validación del documento por un notario.</li>
              </ul>

              <h3>12.4. ROL DE TuPatrimon.io®</h3>
              <p>TuPatrimon.io® actúa únicamente como intermediario que facilita el acceso a los servicios notariales y a las validaciones para firmas electrónicas. No proporciona asesoría legal por defecto. El usuario es responsable de cómo se emite el documento y quiénes lo firman.</p>

              <h3>12.5. PROVEEDORES DE SERVICIOS</h3>
              <p>Los servicios relacionados con firma electrónica son provistos por IDOK S.A., Veriff OÜ y Twilio Inc. Para la verificación de identidad, solo se aceptarán documentos de identidad vigentes.</p>

              <h3>13. SERVICIOS DE FORMATOS TIPO (PLANTILLAS)</h3>
              <p>TuPatrimon.io® podrá disponer y comercializar formatos tipo, o plantillas, de diversos documentos. TuPatrimon.io® no se responsabiliza por el uso que el usuario dé a estos documentos ni de la redacción de los mismos.</p>

              <h3>14. AUTORIZACIÓN NOTARIAL PARA MODIFICACIONES DE EMPRESAS</h3>
              <p>TuPatrimon.io® podrá facilitar el contacto con notarías para autorizaciones notariales de modificaciones de empresas efectuadas por la plataforma &quot;Tu empresa en un día&quot;. TuPatrimon.io® sólo actúa como intermediario.</p>

              <h3>15. SERVICIOS NOTARIALES: RESPONSABILIDAD Y PLAZOS</h3>
              <p>La plataforma de TuPatrimon.io® facilita la comunicación entre el usuario final y distintas notarías. TuPatrimon.io® no será responsable por las autorizaciones o rechazos realizados a los documentos. Los tiempos de ejecución son de exclusiva responsabilidad de la notaría.</p>

              <h3>16. SERVICIO DE SEGURO LEGAL</h3>
              <p>TuPatrimon.io® contratará los servicios de un tercero abogado para resolver conflictos legales. Este servicio estará disponible para documentos con dos o más firmantes, con duración de un (1) año desde la entrega del documento finalizado.</p>

              <h3>17. ANUNCIANTES</h3>
              <p>Este Sitio puede contener publicidad. Los anunciantes son responsables de asegurarse que el material remitido cumple con las leyes aplicables. TuPatrimon.io® no será responsable de la ilegalidad de los anuncios.</p>

              <h3>18. EXCLUSIÓN DE RESPONSABILIDAD</h3>
              <p>El Usuario reconoce y declara que su acceso al Sitio lo efectúa por su propia cuenta y riesgo. TuPatrimon.io® no se responsabiliza por:</p>
              <ol>
                <li>Cualquier pérdida, lesión, demanda o daño que resulte del uso del Sitio;</li>
                <li>Errores, omisiones, inexactitudes en contenidos publicados por Usuarios;</li>
                <li>Cualquier daño causado por fallas en el Sitio o sus sistemas;</li>
                <li>Cualquier virus que pudiera infectar el equipo del Usuario;</li>
                <li>No disponibilidad y continuidad del Sitio;</li>
                <li>Conductas fraudulentas, denigratorias o discriminatorias de Usuarios;</li>
                <li>Infracciones a leyes de propiedad intelectual incurridas por usuarios;</li>
                <li>Suplantación de identidad;</li>
                <li>El contenido de las plantillas ni de los documentos generados;</li>
                <li>Los tiempos en la ejecución de los servicios solicitados a notaría.</li>
              </ol>

              <h3>19. LEY APLICABLE Y TRIBUNAL COMPETENTE</h3>
              <p>El presente Contrato se encuentra sujeto y regido por la legislación aplicable en la jurisdicción correspondiente al Usuario. Cualquier conflicto será resuelto conforme a la legislación y jurisdicción aplicable.</p>

              <h3>20. CONTACTO</h3>
              <p>Las comunicaciones que el Usuario deba dirigir a TuPatrimon.io®, se efectuarán por correo electrónico dirigido a <a href="mailto:contacto@tupatrimon.io">contacto@tupatrimon.io</a>, WhatsApp o bien a través de la sección Contacto del Sitio.</p>

              <h3>21. PAGOS, ANULACIONES, DESCUENTOS Y REEMBOLSOS</h3>
              
              <h3>21.1. ASPECTOS GENERALES</h3>
              <ol>
                <li>La utilización de la plataforma tendrá un valor dependiendo de los servicios a utilizar.</li>
                <li>Los pagos son canalizados a través de procesadores de pago provistos por terceros.</li>
                <li>Todos los usuarios tendrán derecho a solicitar reembolsos totales o parciales mientras los servicios no hayan sido entregados y dentro de los 30 días siguientes de su compra.</li>
                <li>Los reembolsos se realizarán a la cuenta bancaria indicada o por el sistema de pago habilitado.</li>
                <li>Los reembolsos procesados a través de Stripe pueden demorar entre 5 y 10 días hábiles.</li>
              </ol>

              <h3>21.2. SERVICIOS DE FIRMA ELECTRÓNICA Y NOTARIALES</h3>
              <ol>
                <li>Los reembolsos serán efectuados en caso de anulación del pedido o rechazo por parte de la notaría.</li>
                <li>En caso de cancelación durante el proceso de firmas, se reembolsará el monto total menos el valor de las firmas ya realizadas.</li>
                <li>Para documentos con observaciones notariales, el Cliente podrá realizar correcciones sin costo adicional.</li>
              </ol>

              <h3>21.3. SERVICIOS DE FORMATOS TIPO (PLANTILLAS)</h3>
              <p>No existe posibilidad de reembolsos para plantillas, ya que son entregadas inmediatamente después del pago.</p>

              <h3>21.4. SERVICIO DE SEGURO LEGAL</h3>
              <p>No aplican reembolsos para el servicio de seguro legal.</p>

              <h3>22. PREMIOS Y DESCUENTOS</h3>
              <p>Los Usuarios tendrán la posibilidad de acceder a descuentos:</p>
              <ul>
                <li><strong>Acumulación de Puntos:</strong> Se acumula 1 punto por cada $200 gastados en la plataforma.</li>
                <li><strong>Compra de Puntos:</strong> La compra de puntos podrá tener descuentos variables.</li>
                <li><strong>Descuentos por Tramos:</strong> Según el número de pedidos finalizados en los últimos 6 meses.</li>
                <li><strong>Descuentos por Convenios:</strong> A través de convenios con corredores, abogados, oficinas virtuales, etc.</li>
              </ul>

              <h3>23. CONFIDENCIALIDAD</h3>
              <p>Los trabajadores, representantes y asociados de TuPatrimon.io® estarán obligados a mantener confidencialidad y a no divulgar información de Usuarios sin autorización previa. El tratamiento de datos personales se rige por el RGPD, CCPA, y otras normativas aplicables según jurisdicción.</p>

              <h3>25. SEGURIDAD</h3>
              <p>TuPatrimon.io® utiliza la tecnología más avanzada para la protección de la información proporcionada por los Usuarios. Se han implementado todas las medidas de seguridad para proteger los datos personales.</p>

              <h3>26. HORARIOS DE ATENCIÓN Y SERVICIO AL CLIENTE</h3>
              <p>El equipo de TuPatrimon.io® opera en horario laboral de lunes a viernes, desde las 9:00 hasta las 17:00 horas; sábados desde las 14:00 a las 16:00 hrs.</p>

              <h3>DECLARACIÓN</h3>
              <p>
                El Usuario reconoce haber leído y comprendido el contenido íntegro del Contrato de Uso del Sitio. Al marcar la casilla 
                &quot;Acepto los Términos y Condiciones&quot;, el Usuario manifiesta su aceptación expresa, inequívoca e irrevocable del 
                Contrato de Uso del Sitio, en cumplimiento con los requisitos de consentimiento establecidos en las normativas aplicables.
              </p>

            </div>

            {/* CTA */}
            <div className="mt-16 text-center pt-8 border-t-2">
              <p className="text-lg text-muted-foreground mb-6">
                ¿Listo para comenzar con TuPatrimonio?
              </p>
              <Button size="lg" className="bg-[var(--tp-buttons)] hover:bg-[var(--tp-buttons-hover)] px-8">
                Crear Cuenta Gratis
              </Button>
            </div>
          </div>
        </div>
      </div>
      </section>
    </div>
  );
}
