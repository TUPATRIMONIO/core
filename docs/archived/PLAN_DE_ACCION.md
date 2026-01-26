# 🗺️ Hoja de Ruta - Ecosistema TuPatrimonio

> **📅 Última actualización:** Enero 22, 2026 (Creación de Organización Empresarial Separada + Validación RUT en Vivo + Limpieza Sistema Conversión + Precios Multi-Moneda Paquetes Créditos + Sistema de Precios Multi-Moneda Centralizado + FESB Disponible Globalmente + Corrección Flujo Retorno Pagos + Firmantes Frecuentes + Checkout Unificado v2 + Flow + DLocal Go)\
> **📊 Estado:** Fase 0 COMPLETA ✅ + **ADMIN PANEL CORE 100% FUNCIONAL** ✅ +
> **FASE 2: CRÉDITOS Y BILLING 100% COMPLETA** ✅ + **SIDEBARS COMPLETOS PARA
> ADMIN Y USUARIOS** ✅ + **MEJORAS ADMIN PANEL: VISIBILIDAD COMPLETA** ✅ +
> **PLATFORM ADMINS: ACCESO COMPLETADO AL DASHBOARD** ✅ + **FASE 3:
> COMUNICACIONES COMPLETA** ✅ + **AUTENTICACIÓN COMPLETA (Correo, OTP, Google,
> Facebook, GitHub)** ✅ + **MEJORAS dLocal Go: CHECKOUT Y URLS ROBUSTAS** ✅ +
> **CORRECCIÓN SISTEMA NUMERACIÓN FACTURAS** ✅ + **SISTEMA DE PAGOS COMPLETO Y
> FUNCIONANDO (Stripe, Transbank, Flow, dLocal Go)** ✅ +
> **SIMPLIFICACIÓN HISTORIAL DE PEDIDOS** ✅ + **SISTEMA DE FACTURACIÓN
> INDEPENDIENTE COMPLETO (Haulmer + Stripe)** ✅ + **CREACIÓN DE ORGANIZACIÓN EMPRESARIAL SEPARADA (B2C → B2B) COMPLETA** ✅ + **SISTEMA DE OPERACIONES Y REEMBOLSOS
> COMPLETO (Panel, Pipelines, Reembolsos, Comunicaciones, Retiros)** ✅ + **🆕
> SISTEMA DE FIRMA ELECTRÓNICA: WIZARD + CHECKOUT + INTEGRACIÓN CDS COMPLETA +
> PORTAL DE FIRMA `/sign/[token]` FUNCIONANDO** ✅ + **🆕 FLUJO PÚBLICO DE FIRMA SIN LOGIN `/signing/new` CON PERSISTENCIA INDEXEDDB** ✅ + **🆕 SISTEMA DE BETA SIGNUP
> & WAITLIST COMPLETADO** ✅ + **🆕 SELECTOR GLOBAL DE PAÍS EN DASHBOARD** ✅ +
> **🆕 VISIBILIDAD POR ORGANIZACIÓN ACTIVA** ✅ + **🆕 MEJORAS GESTIÓN
> DOCUMENTOS: SERVICIOS Y PEDIDOS EN LISTADO** ✅ + **🆕 CORRECCIONES CRÍTICAS
> CHECKOUT: LÓGICA EXPIRACIÓN Y TIMEOUT INVOICING** ✅ + **🆕 CORRECCIÓN CRÍTICA
> WEBHOOKS STRIPE: ERROR net.http_post RESUELTO** ✅ + **🆕 CORRECCIÓN FLUJO
> FIRMA CDS: ACTUALIZACIÓN ESTADO FIRMANTE** ✅ + **🆕 REVISIÓN IA: FLUJO INTERNO
> Y VISIBILIDAD ADMIN PANEL COMPLETOS** ✅ + **🆕 AUTOMATIZACIÓN POST-APROBACIÓN: FIRMA INMEDIATA (IA Y MANUAL)** ✅ + **🆕 VISTA PREVIA DOCUMENTO: INTEGRADA EN ADMIN PANEL** ✅ + **🆕 CRONJOB DE RECUPERACIÓN IA: REINTENTOS AUTOMÁTICOS COMPLETADOS** ✅ + **🆕 CHECKOUT UNIFICADO V2: FLOW + DLOCAL GO + CARGA OPTIMIZADA** ✅ + **🆕 BILLING SETTINGS: FIX RLS + FORMULARIO CONDICIONAL POR PAÍS** ✅ + **🆕 FIRMANTES FRECUENTES: GUARDADO PERSONAL Y POR ORGANIZACIÓN COMPLETADO** ✅ + **🆕 CORRECCIÓN FLUJO RETORNO PAGOS: SISTEMA GENÉRICO CON cancelUrl PARA TODOS LOS PROVEEDORES** ✅ + **🆕 SISTEMA DE PRECIOS MULTI-MONEDA CENTRALIZADO: PAÍS → MONEDA FIJA** ✅ + **🆕 CREACIÓN DE EMPRESA SEPARADA: FORMULARIO COMPLETO + VALIDACIÓN RUT EN VIVO** ✅\
> **🎯 Próximo milestone:** Testing flujo múltiples firmantes + Verificación pública + Panel de Notarías 📋

## 📊 Resumen Ejecutivo (Dic 2025)

**Estado General:** ✅ **FASE 0 COMPLETA AL 100%** ✅ + **ADMIN PANEL CORE
FUNCIONAL** ✅ + **FASE 2: CRÉDITOS Y BILLING COMPLETA** ✅ + **MEJORAS ADMIN
PANEL: VISIBILIDAD COMPLETA** ✅ + **PLATFORM ADMINS: ACCESO COMPLETO AL
DASHBOARD** ✅ + **FASE 3: COMUNICACIONES COMPLETA** ✅ + **AUTENTICACIÓN
COMPLETA (Correo, OTP, Google, Facebook, GitHub)** ✅ + **CORRECCIÓN SISTEMA
NUMERACIÓN FACTURAS** ✅ + **SISTEMA DE PAGOS COMPLETO Y FUNCIONANDO (Stripe,
Transbank Webpay Plus, Transbank OneClick, Flow, DLocal Go)** ✅ + **SISTEMA DE FACTURACIÓN
INDEPENDIENTE COMPLETO (Haulmer + Stripe)** ✅ + **CREACIÓN DE ORGANIZACIÓN EMPRESARIAL SEPARADA (B2C → B2B) COMPLETA** ✅ + **SISTEMA DE OPERACIONES Y REEMBOLSOS COMPLETO
(Panel, Pipelines, Reembolsos, Comunicaciones, Retiros)** ✅ + **🆕 SISTEMA DE
FIRMA ELECTRÓNICA: WIZARD + CHECKOUT + INTEGRACIÓN CDS (SIMPLE & MULTIPLE)
COMPLETOS** ✅ + **🆕 FLUJO PÚBLICO DE FIRMA SIN LOGIN CON PERSISTENCIA** ✅ + **🆕 AUTOMATIZACIÓN DE FIRMA Y VISTA PREVIA INTEGRADA** ✅ + **🆕 CORRECCIÓN FLUJO RETORNO PAGOS: SISTEMA GENÉRICO CON cancelUrl** ✅ + **PRÓXIMO: Políticas RLS públicas + Testing flujo completo, portal de firma
/sign/[token], panel de notarías** 📋

Toda la infraestructura técnica, páginas, sistemas de contenido, integraciones y
optimizaciones están implementadas y funcionando. El sitio marketing está
completamente operacional con contenido real. **NUEVO:** Sistema de
administración completo para gestionar el schema core multi-tenant implementado
y probado exitosamente. **NUEVO:** Sistema completo de créditos y facturación
con integraciones Stripe y dLocal funcionando al 100%. **NUEVO (Dic 2025):**
Correcciones críticas en admin panel - Platform admin ahora tiene visibilidad
completa de todos los usuarios (incluye usuarios sin organizaciones) y todas las
páginas de admin usan ServiceRoleClient para acceso sin restricciones de RLS.
**NUEVO (Dic 2025):** Platform admins ahora pueden acceder al dashboard regular
(B2C/B2B) sin restricciones, usando la organización platform cuando no tienen
organización personal. Helper `getUserActiveOrganization()` implementado para
manejo automático de organizaciones. **NUEVO (Ene 2026):** Sistema de creación de
organización empresarial separada (B2C → B2B) completamente implementado - Los
usuarios pueden crear una nueva empresa manteniendo su cuenta personal separada,
con formulario completo de facturación y validación de RUT en vivo. El sistema
anterior de "conversión" fue eliminado para evitar mezcla de datos personales y
empresariales.

- **NUEVO (Ene 12, 2026):** Sistema de Precios Multi-Moneda Centralizado. **Problema:** Moneda mostrada (ARS) no correspondía al país del usuario (Chile). La organización se creaba sin país y existía un selector de moneda independiente del país. **Solución:** Implementación de tabla centralizada `core.supported_countries` que define la relación fija País → Moneda. Migración de `signing.products` a estructura multi-moneda (7 columnas: `price_usd`, `price_clp`, `price_ars`, `price_cop`, `price_mxn`, `price_pen`, `price_brl`). Creación de librería centralizada `lib/pricing/countries.ts` para funciones de país/moneda. **Cambios principales:** Eliminación de selectores de moneda independientes del país. CountrySelector ahora muestra la moneda asociada (readonly). Todos los servicios tienen precios definidos en todas las monedas, incluso si solo funcionan en un país específico. **Archivos:** `supabase/migrations/20260112000001_create_supported_countries.sql`, `supabase/migrations/20260112000002_migrate_signing_products_multi_currency.sql`, `supabase/migrations/20260112000003_seed_signing_products_all_currencies.sql`, `apps/web/src/lib/pricing/countries.ts`, `apps/web/src/lib/pricing/countries-sync.ts`. **Beneficios:** Escalable, consistente, elimina confusión usuario, facilita expansión a nuevos países.

- **NUEVO (Ene 12, 2026):** Precios Multi-Moneda para Paquetes de Créditos. **Problema:** Los paquetes de créditos en `/billing/purchase-credits` solo mostraban precios en USD, sin importar el país de facturación del usuario. La tabla `credits.credit_packages` tenía columnas para 6 monedas (USD, CLP, ARS, COP, MXN, PEN) pero faltaba BRL (Brasil). Además, el código tenía un bug al obtener la organización activa usando `.single()` cuando el usuario tenía múltiples organizaciones, causando que siempre mostrara USD como fallback. **Solución:** Implementación completa de precios localizados para créditos. Creación de migración `20260112000005_credit_packages_add_brl.sql` que agrega columna `price_brl` y actualiza precios para Brasil en todos los paquetes (Básico: R$58, Estándar: R$203, Profesional: R$464, Empresarial: R$1.160, Premium: R$3.480). Refactorización de la página `/billing/purchase-credits` para usar la función RPC `get_user_active_organization` (maneja múltiples organizaciones correctamente) en lugar de `.single()`. Migración adicional `20260112000006_set_default_country_for_existing_orgs.sql` que establece 'CL' (Chile) como país default para organizaciones sin país configurado. **Flujo Correcto:** Usuario configura país en `/billing/settings` → Se actualiza `organizations.country` → `/billing/purchase-credits` lee ese país → `getAvailablePackages(countryCode)` aplica `getLocalizedProductPrice()` que busca la columna correcta (ej: `price_clp` para Chile) → La página muestra precios en la moneda del país de facturación. **Beneficios:** Experiencia consistente con el sistema de precios de productos de firma, escalable a nuevos países, elimina confusión sobre monedas, usa el mismo sistema centralizado `lib/pricing/countries.ts`. **Archivos:** `supabase/migrations/20260112000005_credit_packages_add_brl.sql`, `supabase/migrations/20260112000006_set_default_country_for_existing_orgs.sql`, `apps/web/src/app/(dashboard)/billing/purchase-credits/page.tsx` (fix manejo múltiples organizaciones).

- **NUEVO (Ene 12, 2026):** FESB Disponible para Todos los Países. **Contexto:** Siguiendo el modelo de "un registro por país", se implementó la disponibilidad de FESB (Firma Electrónica Simple Biométrica) para todos los países soportados. **Implementación:** Creación de migración `20260112000004_fesb_all_countries.sql` que inserta registros de FESB para Argentina (`fesb_ar`), Colombia (`fesb_co`), México (`fesb_mx`), Perú (`fesb_pe`), Brasil (`fesb_br`) y Estados Unidos (`fesb_us`). Cada registro incluye precios en las 7 monedas soportadas (mismos valores que `fesb_cl`). **Características:** `identifier_type: 'any'` (no requiere RUT), `billing_unit: 'per_signer'`, `category: 'signature_type'`. **Beneficios:** Mayor alcance geográfico del servicio FESB, flexibilidad para ajustar precios por país en el futuro, posibilidad de activar/desactivar por país individualmente. El frontend filtra automáticamente por `country_code`, mostrando solo los productos disponibles para cada país sin cambios adicionales requeridos.

- **NUEVO (Ene 6, 2026):** Reorganización técnica de Storage Buckets. **Objetivo:** Eliminar redundancia y asegurar un flujo de archivos limpio. **Cambios:** Consolidación de buckets (`documents` y `signing-covers` eliminados/consolidados). Flujo establecido: `docs-originals` (subida usuario) → `docs-signed` (portada+QR y firmas) → `docs-notarized` (final). Actualización de la Edge Function `pdf-merge-with-cover` para gestionar estos cambios automáticamente.

- **NUEVO (Ene 6, 2026):** Robustez en el flujo de Revisión IA. **Problema:** Fallos silenciosos en la invocación de la IA. **Solución:** Migración del disparador de base de datos a la extensión `http` (síncrona) en lugar de `pg_net`. Implementación de logs de error detallados y actualización de estados en `signing.ai_reviews` para evitar documentos estancados.

- **NUEVO (Ene 6, 2026):** Automatización del flujo de firmas post-aprobación. **Problema:** Tras aprobar un documento (manual o IA), el usuario debía presionar "Enviar a Firma" manualmente. **Solución:** Refactorización del inicio de firma en una librería compartida (`apps/web/src/lib/signing/initiate-signing.ts`) y activación automática en los endpoints de acción administrativa y triggers de IA.

- **NUEVO (Ene 6, 2026):** Vista previa de documentos integrada. **Funcionalidad:** Implementación de visor PDF (`PDFViewer`) en el listado de documentos (vía modal) y en el detalle del documento (vía pestaña), facilitando la revisión sin descargas manuales.

- **NUEVO (Ene 6, 2026):** Optimización lógica de aprobación IA. **Cambio:** Si la IA aprueba el documento, este pasa directamente a proceso de firmas, ignorando el flag `requires_approval`, agilizando el flujo B2B.

- **NUEVO (Ene 6, 2026):** Mejora en el Panel de Revisión. **Funcionalidad:** Implementación de pestañas "Pendientes" e "Historial", con trazabilidad mejorada de mensajes y tipos de revisión realizados.

- **NUEVO (Ene 6, 2026):** Corrección del flujo de revisión automática por IA (Revisión Interna). **Problema:** El documento quedaba atascado en "Pending AI review". **Causa:** Faltaba el prompt `internal_document_review` en la base de datos para Chile. **Solución:** Creación del prompt específico con esquema de salida compatible con Claude 3.5 Sonnet y corrección de la migración para asegurar idempotencia y manejo de restricciones de llave foránea. **Archivos:** `supabase/migrations/20260106000010_internal_review_prompt_chile.sql`.

- **NUEVO (Ene 6, 2026):** Corrección de visibilidad en el Panel de Revisión de Documentos. **Problema:** Los documentos en `manual_review` no eran visibles para los administradores. **Causa:** Políticas RLS restrictivas en `signing.documents` y fallos en joins complejos con agregaciones. **Solución:** Actualización de políticas RLS para permitir acceso a `document_reviewer` y `platform_admin` a todos los documentos, y migración de la consulta a la vista `signing_documents_full` para mayor robustez. **Archivos:** `supabase/migrations/20260106000011_fix_document_review_rls.sql`, `apps/web/src/app/(admin)/admin/document-review/page.tsx`.

- **NUEVO (Ene 6, 2026):** Corrección crítica del flujo de firma CDS donde el estado del firmante no se actualizaba después de firmar. **Problema:** El firmante completaba su firma exitosamente pero el sistema mostraba "listo para firmar" y contaba 0/1 firmantes. **Causa:** Las operaciones UPDATE en `/api/signing/execute` usaban el cliente Supabase normal (anon key) que no tenía permisos RLS para actualizar tablas de firmantes externos. **Solución:** Cambio a `adminClient` (service_role) para todas las operaciones de escritura, con verificación de errores. **Archivos:** `apps/web/src/app/api/signing/execute/route.ts`, `apps/web/src/app/sign/[token]/SigningPageClient.tsx`. **Migración adicional:** `20260106000004_fix_all_http_post_functions.sql` para corregir error `net.http_post` en múltiples funciones de signing (`send_completed_document_notification`, `invoke_signing_notification`, `invoke_ai_review_function`, `invoke_internal_review_after_ai`).

- **NUEVO (Ene 6, 2026):** Corrección crítica del error `function net.http_post(...) does not exist` en webhooks de Stripe - La función `signing.invoke_internal_review_function()` ahora usa la extensión `http` (síncrona) en lugar de `pg_net`, siguiendo el patrón establecido. Esto resuelve el problema donde las órdenes quedaban en estado `pending_payment` después de un pago exitoso con Stripe. Migración: `20260106000001_fix_internal_review_http.sql`. **NUEVO (Dic 30, 2025):** Correcciones críticas en el listado de órdenes - Lógica de expiración corregida (ahora muestra "Expiró el" para fechas pasadas en lugar de "Expira pronto") y solucionado el bucle infinito del spinner "Generando invoice" mediante un timeout de 3 minutos y la exclusión de órdenes gratuitas ($0), que no emiten facturas. **NUEVO (Nov 24, 2025):** Corrección crítica del sistema de numeración de facturas - Cambio a formato por organización `{ORG_SLUG}-{NÚMERO}` para evitar colisiones entre múltiples organizaciones creando facturas simultáneamente. Sistema ahora escalable y sin errores de duplicados.

- **NUEVO (Ene 9, 2026):** Funcionalidad de Firmantes Frecuentes. **Objetivo:** Evitar la escritura repetitiva de datos de firmantes comunes. **Cambios:** Implementación de tabla `signing.saved_signers` con RLS para privacidad personal o compartida por organización. Integración de selector tipo combobox (`SavedSignersSelector`) en el wizard de firma y panel de edición. Opción de guardado automático al agregar nuevos firmantes. Seguimiento de frecuencia de uso para priorizar sugerencias.

- **NUEVO (Ene 12, 2026):** Corrección del Flujo de Retorno de Pagos para Todos los Proveedores. **Problema:** Cuando el usuario presionaba "Volver" o cancelaba un pago en algunos proveedores (especialmente DLocal Go), era redirigido incorrectamente a la página de success en lugar de volver al checkout. Además, la página de success tenía código específico por proveedor que no era escalable. **Solución:** Implementación de sistema genérico con `cancelUrl` en la interfaz base de pagos. Refactorización completa de la página de success para usar el método unificado `verifyPayment()` en lugar de código específico por proveedor. Actualización de todos los adaptadores (DLocal, Stripe, Flow, Transbank) para usar `cancelUrl` cuando el usuario cancela. **Beneficios:** Escalable (cualquier proveedor nuevo funcionará automáticamente), mantenible (un solo lugar para la lógica de verificación), consistente (comportamiento uniforme), menos código (eliminada duplicación). **Archivos Modificados:** `apps/web/src/lib/payments/adapters/base.ts` (agregado `cancelUrl`), `apps/web/src/components/checkout/OrderCheckoutForm.tsx` (envío de `cancelUrl`), `apps/web/src/app/api/payments/checkout/route.ts` (construcción de `cancelUrl`), `apps/web/src/lib/payments/adapters/dlocal.ts` (uso de `cancelUrl` como `backUrl`), `apps/web/src/lib/payments/adapters/stripe.ts` y `apps/web/src/lib/stripe/checkout.ts` (integración de `cancelUrl`), `apps/web/src/app/(dashboard)/checkout/[orderId]/success/page.tsx` (refactorización completa a sistema unificado).

- **NUEVO (Ene 9, 2026):** Refactorización del Checkout Unificado v2. **Objetivo:** Optimizar performance y expandir medios de pago globales. **Cambios:** Migración de carga de datos de facturación al servidor (eliminación de parpadeos y fetch duplicados). Implementación de **Flow.cl** (para Chile Business) y **DLocal Go** (para LATAM y Chile Personal). Nueva lógica de disponibilidad dinámica basada en el par `(País, Tipo de Organización)`.

- **NUEVO (Ene 9, 2026):** Corrección crítica y mejoras en Billing Settings. **Problema:** Errores "No organization found" por bloqueos de RLS y fallos de `.single()` con múltiples organizaciones. **Solución:** Uso de RPC `get_user_active_organization` y `service_role` para actualizaciones seguras. El formulario de facturación ahora es 100% condicional: muestra DTE (Boleta/Factura) solo para empresas en Chile, e Invoice internacional para el resto.

- **NUEVO (Ene 7, 2026):** Sistema de recuperación automática para Revisión IA. **Problema:** Documentos quedaban "pegados" en `pending_ai_review` si la API fallaba post-pago o la Edge Function no respondía. **Solución:** Implementación de cronjob `/api/cron/retry-ai-reviews` (Vercel Cron cada 10 min) que detecta documentos estancados por más de 15 minutos y reintenta la revisión automáticamente hasta 3 veces.

- **NUEVO (Ene 8, 2026):** Flujo de Firma Electrónica Accesible Sin Login. **Problema:** El wizard de firma requería login desde el inicio, generando fricción para nuevos usuarios y mostrando error de organización incluso con usuarios logueados. **Solución:** Implementación de flujo público en `/firmar` que permite completar pasos 1-3 sin autenticación, requiriendo login/registro solo en el checkout (paso 4), con preservación del progreso mediante sessionStorage. **Beneficios:** Reduce fricción inicial, captura más leads, convierte visitantes en usuarios al final del embudo. **Archivos Modificados:** `CountryAndUploadStep.tsx` (espera a que `OrganizationProvider` termine de cargar, funciona sin org), `ServiceSelectionStep.tsx` y `SignerManagementStep.tsx` (modo dual: con/sin documentId en BD), `CheckoutStep.tsx` (login/registro inline para no autenticados, creación automática de org/documento post-auth), `WizardContext.tsx` (persistencia en sessionStorage). **Archivos Nuevos:** `app/(public)/firmar/page.tsx` (ruta pública con wizard accesible), `app/(public)/layout.tsx` (actualizado con providers necesarios). **Compatibilidad:** Ruta privada `/dashboard/signing/documents/new` sigue funcionando para usuarios logueados.

- **NUEVO (Ene 8, 2026):** Optimización Flujo Checkout Invitado. **Objetivo:** Mejorar la conversión permitiendo completar el wizard sin login y unificar el proceso de pago. **Cambios:** Eliminación del Paso 4 del wizard. Redirección directa desde el Paso 3 a `/checkout/signing`. Implementación de persistencia de archivos PDF en **IndexedDB** para evitar pérdida de datos tras login/recarga. Rediseño completo de la página de checkout con resumen detallado e integración con el flujo de órdenes existente (`/checkout/[orderId]`). Corrección de sincronización de organizaciones post-auth.

**✅ COMPLETADO en Fase 0:**

- ✅ Infraestructura completa (monorepo, Next.js 15, Tailwind v4, Supabase)
- ✅ 60+ páginas implementadas (landing pages, blog, KB, ayuda, etc.)
- ✅ Sistema de blog dinámico con admin panel
- ✅ Base de conocimiento completa con categorías
- ✅ Integración Google Business Reviews
- ✅ Sistema de gestión de páginas dinámicas
- ✅ SEO avanzado (sitemap multicapa, structured data)
- ✅ Deploy completo en Vercel (2 apps funcionando)
- ✅ Dark mode, PWA, Analytics, colores dual
- ✅ **Contenido del sitio actual migrado** (Nov 2025)
- ✅ **Blog poblado con 10-15 posts reales** (Nov 2025)
- ✅ **Base de conocimiento con 15-20 artículos** (Nov 2025)
- ✅ **Optimización final y testing completados** (Nov 12, 2025)
- ✅ **Sistema de autenticación completo con mejores prácticas** (Nov 14, 2025)
- ✅ **Autenticación completa: Correo, OTP, Google, Facebook, GitHub funcionando
  perfectamente** (Dic 2025)
- ✅ **Admin Panel Core - Schema Core 100% funcional** (Nov 21, 2025)
- ✅ **Sistema de Créditos y Billing 100% completo** (Nov 22, 2025)
- ✅ **Sistema de Pagos Completo - Stripe, Transbank Webpay Plus y OneClick
  funcionando correctamente** (Enero 2025)
- ✅ **Sistema de Operaciones y Reembolsos Completo** (Dic 8, 2025)
  - Panel de operaciones con gestión de pedidos
  - Pipelines configurables con etapas globales
  - Sistema de reembolsos (Stripe, Transbank, Créditos)
  - Sistema de comunicaciones (Gmail, SendGrid)
  - Sistema de retiros de monedero digital
  - Vista de créditos y movimientos en detalle de organización
  - Integraciones probadas y funcionando en producción
  - Webhooks configurados y procesando correctamente
  - Páginas de success verificando estado inmediatamente
  - Soporte para todos los tipos de productos (no solo créditos)
  - Directrices documentadas para agregar nuevos medios de pago
  - Schemas credits y billing completos
  - Integraciones Stripe y dLocal funcionando
  - Webhooks configurados y operativos
  - ✅ **Corrección crítica webhooks Stripe** (Ene 6, 2026)
    - Error `function net.http_post(...) does not exist` resuelto
    - Función `signing.invoke_internal_review_function()` migrada a extensión `http`
    - Las órdenes ahora se actualizan correctamente de `pending_payment` a `paid` automáticamente
    - Migración: `20260106000001_fix_internal_review_http.sql`
  - ✅ **Recuperación Automática de Revisión IA** (Ene 7, 2026)
    - Implementación de cronjob para reintentar revisiones estancadas (>15 min)
    - Lógica de reintento inteligente con límite de 3 intentos
    - Nueva columna `ai_review_retry_count` e índice optimizado
    - Migración: `20260107100000_add_ai_review_retry_count.sql`
  - ✅ **Flujo de Firma Electrónica Sin Login** (Ene 8, 2026)
    - Acceso público al wizard en `/firmar` (pasos 1-3)
    - Persistencia del progreso en `sessionStorage`
    - Login/Registro obligatorio solo al final (paso 4 Checkout)
    - Creación automática de organización personal y documento post-auth
  - ✅ UI completa de facturación
  - Auto-recarga con verificación automática
  - Sistema de notificaciones integrado
  - Generación de PDFs funcionando
  - Gestión completa de organizaciones, usuarios, teams, invitaciones, API keys
  - 15+ páginas admin, 20+ componentes UI, 12+ server actions
  - Solución a recursión infinita en RLS implementada
  - Sistema de bypass para platform admins
  - Testing exitoso en navegador
  - ✅ **Corrección sistema numeración facturas** (Nov 24, 2025)
    - Formato por organización: `{ORG_SLUG}-{NÚMERO}` (ej:
      `TU-PATRIMONIO-000001`)
    - Eliminadas colisiones entre organizaciones
    - Lock por organización para paralelismo mejorado
    - Sistema escalable y sin errores de duplicados
- ✅ **Sistema de Facturación Independiente - Haulmer + Stripe 100% COMPLETO**
  (Dic 2025)
  - Schema `invoicing` independiente del billing
  - API RESTful para emisión de documentos
  - Factura Electrónica (TipoDTE 33) con Haulmer
  - Boleta Electrónica (TipoDTE 39) con Haulmer
  - Invoice Internacional con Stripe
  - Almacenamiento de PDF/XML en Supabase Storage
  - Página de testing protegida (`/test-invoicing`)
  - Documentación completa: `docs/INVOICING-SYSTEM.md`
- ✅ **Sidebars completos para Admin y Usuarios Regulares** (Nov 22, 2025)
  - Sidebar Admin con acceso a todas las secciones (Billing, CRM, Blog)
  - Sidebar Dashboard para usuarios regulares con navegación completa
  - Layouts separados pero consistentes
  - Páginas de admin para gestión global (créditos, facturas, pagos)
  - Detección automática de tipo de usuario
  - Página principal del dashboard con estadísticas y accesos rápidos
- ✅ **Platform Admins: Acceso Completo al Dashboard** (Dic 2025)
  - Platform admins pueden acceder a todas las áreas B2C/B2B sin restricciones
  - Helper `getUserActiveOrganization()` implementado para manejo automático de
    organizaciones
  - Si es platform admin sin organización personal, usa organización platform
    automáticamente
  - Middleware actualizado para permitir acceso sin redirección
  - Todas las páginas del dashboard funcionan correctamente para platform admins
  - Páginas del CRM creadas y funcionando (contacts, deals, tickets, products)
  - Página principal del CRM (`/dashboard/crm`) creada con estadísticas y
    accesos rápidos

**🚀 SISTEMA CRM MULTI-TENANT B2B - 100% COMPLETO:**

- ✅ **Decisión arquitectónica**: CRM como servicio vendible multi-tenant
- ✅ **Migración de roles** completada y corregida
  - Eliminada tabla redundante `marketing.user_roles`
  - Unificado en `core.roles` + `core.organization_users`
  - Función `can_access_admin()` actualizada
  - Función `can_access_crm()` creada
- ✅ **Schema CRM completo** creado y funcionando
  - 10 tablas multi-tenant: contacts, companies, deals, tickets, products,
    quotes, activities, emails, settings, notes
  - RLS completo por organization_id
  - Roles específicos: crm_manager, sales_rep, org_owner
  - Aplicación registrada en ecosistema
  - Función de importación de leads de marketing
- ✅ **UI del CRM 100% COMPLETA** - PRODUCTION READY
  - Dashboard con KPIs en tiempo real
  - CRUD completo de todas las entidades
  - 28 páginas de UI implementadas
  - 18 API endpoints funcionando
  - Integración Gmail completa
  - Sistema de cotizaciones con line items
  - Auto-numeración de tickets y cotizaciones
- ✅ **Formatters y utilidades completos**
  - 21 funciones de formateo (currency, dates, phone, RUT)
  - Funciones de estados y colores para badges
  - Sin errores, 100% funcional
- 📄 **Documentación completa**:
  - `docs/CRM-FINAL.md` - Documento final completo
  - `docs/CRM-MULTITENANT-GUIDE.md` - Guía multi-tenant
  - Migraciones: `20251112185905` (roles) + `20251112190000` (schema CRM) +
    `20251112202031` (expansión HubSpot)

**🚀 ESTADO ACTUAL - CRM 100% COMPLETO Y PRODUCCIÓN:**

✅ **Migraciones Aplicadas** (12-14 Nov 2025):

- ✅ `20251112185905_limpiar-user-roles.sql` (unificación de roles)
- ✅ `20251112190000_schema-crm-multitenant.sql` (schema CRM base)
- ✅ `20251112202031_crm-base.sql` (expansión HubSpot completa)
- ✅ `20251113002149_creacion-org.sql` (funciones de onboarding)

✅ **Leads Importados**: Ejecutado `import_marketing_leads_to_crm()`

✅ **UI del CRM - 100% COMPLETADO Y PROBADO** (12-14 Nov 2025) ✨ PRODUCTION
READY:

**✅ MÓDULOS 100% COMPLETOS**:

- ✅ Dashboard principal con KPIs en tiempo real - **100%**
- ✅ Módulo de Contactos (lista, detalle, crear, editar, emails) - **100%**
- ✅ Módulo de Empresas (lista, detalle, crear, editar, stats) - **100%** ⭐
- ✅ Módulo de Deals (lista, detalle, crear, editar, probabilidad) - **100%** ⭐
- ✅ Módulo de Tickets (lista, detalle, crear, editar, SLA) - **100%** ⭐
- ✅ Módulo de Productos (lista, crear, editar, billing) - **100%** ⭐
- ✅ Módulo de Cotizaciones (lista, crear, detalle, line items, totales) -
  **100%**

**✅ INFRAESTRUCTURA COMPLETA**:

- ✅ **18 API Routes funcionando** (contacts, companies, deals, tickets,
  products, quotes, emails, stats, gmail)
- ✅ Componentes reutilizables (StatusBadge, EmptyState, StatsCard,
  EmailComposer)
- ✅ Types TypeScript completos (400+ líneas)
- ✅ Helpers y utilidades (formateo, colores, permisos)
- ✅ **Gmail OAuth y service completo** (oauth.ts, service.ts, types.ts)
- ✅ Context multi-tenant
- ✅ Navegación y badges funcionando
- ✅ **50+ archivos nuevos creados**

**📊 FUNCIONALIDADES 100% COMPLETAS**:

- ✅ **Gestionar contactos COMPLETO** (CRUD 100% + enviar emails desde detalle)
- ✅ **Gestionar empresas COMPLETO** (CRUD 100% + stats por empresa +
  relaciones)
- ✅ **Gestionar deals COMPLETO** (CRUD 100% + probabilidad + pipeline +
  cotizaciones)
- ✅ **Gestionar tickets COMPLETO** (CRUD 100% + SLA + auto-numeración +
  prioridades)
- ✅ **Catálogo de productos COMPLETO** (CRUD 100% + billing recurrente +
  inventario)
- ✅ **Sistema de cotizaciones COMPLETO** (crear con line items + cálculos
  automáticos + detalle)
- ✅ **Integración Gmail COMPLETA** (OAuth + envío + EmailComposer + guardar en
  BD + actividades)
- ✅ Relaciones HubSpot-style 100% funcionando
- ✅ Timeline de actividades en todas las entidades
- ✅ Auto-numeración de tickets y cotizaciones (TICK-00001, QUO-00001)
- ✅ Filtros y búsqueda en todas las listas
- ✅ **28 páginas de UI implementadas**
- ✅ **18 API endpoints funcionando**

**📄 DOCUMENTACIÓN COMPLETA**:

- `docs/CRM-FINAL.md` - Documento final 100% completo ⭐ NUEVO
- `docs/CRM-COMPLETO.md` - Resumen ejecutivo
- `docs/CRM-QUICKSTART.md` - Guía de inicio rápido
- `docs/CRM-GMAIL-SETUP.md` - Setup de Gmail paso a paso
- `docs/schemas/crm-hubspot-style.md` - Arquitectura HubSpot completa
- `docs/schemas/crm-implementation-status.md` - Estado técnico actualizado
- `docs/CRM-PROGRESO-SESION.md` - Log de implementación

✨ **CRM PRODUCTION READY - Features Nice-to-Have opcionales**:

- Inbox de emails (leer recibidos) - funcionalidad adicional
- Reportes avanzados - analytics extendidos
- Kanban drag & drop - UX mejorada
- Búsqueda global (Cmd+K) - navegación rápida
- Templates de email - productividad
- Webhooks - integraciones

**📅 CRM AL 100% Y LISTO PARA PRODUCCIÓN** ✨

🎉 **SISTEMA DE ONBOARDING B2C + B2B - 100% COMPLETO Y PROBADO** (13-14 Nov
2025):

**✅ FUNCIONALIDADES COMPLETAS:**

- ✅ Pantalla de selección de tipo de organización (Personal vs Empresarial)
- ✅ Función `create_personal_organization()` - Org personal automática
- ✅ Función `create_business_organization()` - Org empresarial con datos
- ✅ Página `/onboarding` con UI completa y moderna
- ✅ API routes `/api/onboarding/*` (status, personal, business)
- ✅ RLS policies actualizadas para super admin
- ✅ `can_access_crm()` permite `org_owner`
- ✅ **Super admin puede ver TODOS los datos de TODAS las orgs** ⭐
- ✅ Usuarios normales solo ven datos de SU org
- ✅ CRM habilitado automáticamente con límites por plan
- ✅ Flujo de registro modificado (signUp → /onboarding)
- ✅ **Bug de size_category CORREGIDO** (valores del select ahora correctos)
- ✅ **Redirect inteligente post-onboarding con refresh de estado**
- ✅ **PROBADO EXITOSAMENTE** en navegador con 2 usuarios (Personal + Empresa)

**📄 DOCUMENTACIÓN**:

- `docs/ONBOARDING-SYSTEM.md` - Sistema completo documentado

**📦 ARCHIVOS**:

- Migración: `20251113002149_creacion-org.sql`
- 7 archivos creados (onboarding page, APIs, layout, docs)

**🎯 RESULTADO**:

- ✅ CRM multi-tenant 100% funcional y probado
- ✅ Onboarding automático B2C + B2B funcionando perfectamente
- ✅ Sistema de autenticación completo con todas las mejores prácticas
- ✅ Super admin con vista global
- ✅ Formatters completos sin errores
- ✅ Testing completo realizado en navegador
- ✅ **LISTO PARA PRODUCCIÓN** 🚀
- ✅ Listo para escalar a cientos de organizaciones

**🔄 CREACIÓN DE ORGANIZACIÓN EMPRESARIAL SEPARADA (B2C → B2B) - 100% COMPLETO** (Enero 2026):

**✅ FUNCIONALIDADES COMPLETAS:**

- ✅ Endpoint API `/api/organizations/create-business` - Crea una nueva empresa
  separada de la cuenta personal
- ✅ Componente UI `ConvertToBusinessCard` - Refactorizado como modal de creación
  con formulario completo
- ✅ Formulario de Facturación Integrado - Captura RUT, Razón Social, Giro, etc.
- ✅ **Validación RUT en Vivo** - Formateo automático y validación de dígito
  verificador en tiempo real
- ✅ Bloqueo de creación si los datos de facturación o RUT son inválidos
- ✅ Actualización automática de límites del CRM para la nueva empresa
- ✅ Redirección inteligente - Establece la nueva empresa como activa y recarga
  la app
- ✅ **Aislamiento Total** - Los datos personales se mantienen separados de los
  empresariales

**📄 ARCHIVOS CREADOS/MODIFICADOS:**

- API Route: `apps/web/src/app/api/organizations/create-business/route.ts`
- Componente: `apps/web/src/components/organization/ConvertToBusinessCard.tsx`
- Página: `apps/web/src/app/(dashboard)/settings/organization/page.tsx`
- Documentación: `docs/ONBOARDING-SYSTEM.md`

**🔒 SEGURIDAD:**

- ✅ Solo usuarios autenticados pueden crear empresas
- ✅ Solo `org_owner` de cuenta personal ve la opción de crear empresa
- ✅ Validaciones robustas en backend y frontend
- ✅ Sistema de "conversión" antigua ELIMINADO para evitar pérdida de espacio
  personal

**🎯 BENEFICIOS DEL NUEVO MODELO:**

- ✅ Usuario mantiene su espacio personal intacto
- ✅ Flexibilidad para tener múltiples empresas bajo el mismo usuario
- ✅ Datos de facturación configurados desde el inicio
- ✅ Experiencia de usuario profesional y guiada

**⚠️ SISTEMA DE CONVERSIÓN B2B → B2C (ELIMINADO):**

- ❌ El sistema de conversión bidireccional fue removido en favor del modelo de
  organizaciones separadas.
- ❌ Eliminada API `/api/organizations/convert-to-personal`
- ❌ Eliminado componente `ConvertToPersonalCard`
- ❌ Razón: Evitar la mezcla de datos personales y empresariales que causaba
  confusión legal y operativa.

---

## 🆕 SISTEMA DE FIRMA ELECTRÓNICA 🚧 (Diciembre 2025)

> **📅 Inicio:** Diciembre 11, 2025\
> **📊 Estado:** EN DESARROLLO ACTIVO 🚧\
> **🎯 Objetivo:** Sistema completo de firma electrónica con servicios
> notariales

### ✅ COMPLETADO - Base de Datos (Schema `signing`)

**Tablas Principales Creadas:**

- ✅ `signing.documents` - Documento principal con estados, metadata, archivos
- ✅ `signing.signers` - Firmantes con first_name/last_name separados,
  validación RUT
- ✅ `signing.document_versions` - Historial de versiones (original, firmado,
  notariado)
- ✅ `signing.reviewers` - Revisores internos del documento
- ✅ `signing.ai_reviews` - Revisiones automáticas por IA (Claude)
- ✅ `signing.notary_requests` - Solicitudes a notaría
- ✅ `signing.notary_offices` - Oficinas notariales con pesos para distribución
- ✅ `signing.notary_services` - Servicios ofrecidos por cada notaría
- ✅ `signing.notary_assignments` - Asignaciones de documentos a notarías
- ✅ `signing.products` - Catálogo de productos (FES, FEA, FESB, FES+ClaveÚnica,
  servicios notariales)
- ✅ `signing.signer_history` - Historial de cambios en firmantes
- ✅ `signing.providers` - Proveedores de firma (CDS, etc.)
- ✅ `signing.provider_configs` - Configuración por organización

**Enums Creados:**

- ✅ `document_status` - 16 estados (draft → completed)
- ✅ `signer_status` - 10 estados (pending → signed/rejected)
- ✅ `notary_service_type` - none, legalized_copy, protocolization,
  notary_authorized (FAN®)
- ✅ `signing_order_type` - simultaneous, sequential
- ✅ `version_type` - original, pre_signature, fully_signed, notarized

**RLS y Seguridad:**

- ✅ Políticas RLS completas para multi-tenancy
- ✅ Función `signing.user_belongs_to_org()` para validación
- ✅ Vistas públicas con `security_invoker = true`
- ✅ Grants para authenticated y service_role

**RPCs Creados:**

- ✅ `create_signing_document` - Crear documento inicial
- ✅ `add_document_signer` / `remove_document_signer` - Gestión de firmantes
- ✅ `submit_document_for_review` / `approve_document_review` - Flujo de
  aprobación
- ✅ `send_document_to_sign` - Enviar a firma (con validación de pago)
- ✅ `record_signature` / `reject_signature` - Registrar firma/rechazo
- ✅ `begin_document_resend` - Iniciar modo re-envío (invalida firmas)
- ✅ `calculate_resend_cost` - Calcular costo de firmas invalidadas
- ✅ `assign_document_to_notary` - Asignación ponderada tipo "tómbola"

**Triggers Automáticos:**

- ✅ `sync_signer_counts` - Actualiza contadores de firmantes
- ✅ `check_all_signed` - Cambia status cuando todos firman
- ✅ `log_signer_changes` - Historial de cambios en firmantes
- ✅ `trigger_resend_order_completed` - Limpia metadata al pagar re-envío

### ✅ COMPLETADO - Frontend (Wizard de Solicitud)

**Ubicación:** `/dashboard/signing/documents/new`

**Pasos del Wizard:**

1. ✅ **Paso 1 - Documento** (antes "País y Documento")
   - **✅ Selector de país eliminado** - ahora usa el selector global del header
   - Upload de PDF con drag & drop
   - **✅ Previsualización del documento PDF** (visor embebido con opciones de
     abrir en nueva pestaña, descargar y ocultar)
   - Revisión opcional por IA (consume créditos, disponible según país global)
   - Polling de estado de revisión IA

2. ✅ **Paso 2 - Selección de Servicios**
   - Primero: Servicio Notarial (Ninguno, Copia Legalizada, Protocolización,
     FAN®)
   - Segundo: Tipo de Firma Electrónica (filtrado según servicio notarial)
   - Orden de firmas: FES → FESB → FES+ClaveÚnica → FEA
   - Precios dinámicos desde `signing.products`

3. ✅ **Paso 3 - Firmantes**
   - Campos separados: Nombres y Apellidos
   - Validación dinámica de identificador según tipo de firma
   - Auto-formateo de RUT chileno (12.345.678-9)
   - Validación de dígito verificador en tiempo real
   - Agregar/eliminar firmantes

4. ✅ **Paso 4 - Checkout**
   - Resumen del pedido
   - Cálculo de costos
   - Integración con `/api/checkout/create`
   - Soporte para Stripe, Transbank y Créditos

**Componentes Creados:**

- ✅ `DocumentRequestWizard.tsx` - Orquestador principal
- ✅ `WizardContext.tsx` - Estado global del wizard
- ✅ `WizardProgress.tsx` - Indicador de progreso
- ✅ `CountryAndUploadStep.tsx` - Paso 1
- ✅ `ServiceSelectionStep.tsx` - Paso 2
- ✅ `SignerManagementStep.tsx` - Paso 3
- ✅ `CheckoutStep.tsx` - Paso 4

**Utilidades:**

- ✅ `lib/utils/rut.ts` - Validación y formateo de RUT chileno
  - `formatRutOnInput()` - Auto-formateo mientras escribe
  - `getRutError()` - Mensajes de error específicos
  - `isValidRut()` - Validación completa con dígito verificador
  - `cleanRut()` / `calculateDv()` - Utilidades internas

### ✅ COMPLETADO - Gestión y Listado de Documentos (Dic 2025)

- ✅ **Mejoras en tabla `/dashboard/signing/documents`**:
  - Columna **Servicios**: Muestra el tipo de firma (FES/FEA) y servicio
    notarial de forma compacta.
  - Estado **Sin notaría**: Visualización explícita cuando el documento no
    requiere intervención notarial.
  - Columna **Pedido**: Integración con el sistema de billing para mostrar el
    número de pedido (`order_number`) asociado.

### ✅ COMPLETADO - Migraciones

```
20251211000001_schema_signing.sql          - Schema base completo
20251211000002_signing_rls.sql             - Políticas RLS
20251211000003_signing_rpc_functions.sql   - Funciones RPC
20251211000004_signing_storage.sql         - Buckets de storage
20251211000005_signing_ai_review_trigger.sql - Trigger para IA
20251211000006_signing_public_views.sql    - Vistas públicas
20251212000004_signing_products.sql        - Catálogo de productos
20251212000007_signing_signers_names.sql   - first_name/last_name
20251212000008_docs_storage_buckets.sql    - Buckets docs-originals/signed/notarized
20251212000009_signing_notary_system.sql   - Sistema de notarías
20251212000010_notary_assignment_rpc.sql   - Asignación ponderada
20251212000011_expose_notary_views.sql     - Vistas públicas notaría
20251212000012_signing_resend_payment_flow.sql - Flujo de re-envío
20251212000013_resend_order_callback.sql   - Callback post-pago
20251212000014_add_fan_service.sql         - Enum FAN®
20251212000015_insert_fan_product.sql      - Producto FAN®
20251212000016_fix_signature_order.sql     - Orden de firmas
20251212000017_refresh_signing_signers_view.sql - Refresh vistas
20251212000019_fix_signing_notification_columns.sql - Fix s.name → s.full_name
20251212000020_enable_pg_net.sql           - Habilita pg_net y corrige search_path
20251212200000_signing_products_prices.sql - Precios de productos firma
20251212200001_fix_fan_billing_unit.sql    - Corrige unidad de cobro FAN
20251212200004_enable_pg_net.sql           - Versión actualizada pg_net
20251229000001_add_order_number_to_view.sql - Vista documents_full con pedido
20260106000001_fix_internal_review_http.sql - Fix error net.http_post en webhooks Stripe
20260106000004_fix_all_http_post_functions.sql - Fix net.http_post en todas las funciones signing
20260107100000_add_ai_review_retry_count.sql   - Contador de reintentos IA y optimización de búsqueda
20260109000001_signing_saved_signers.sql       - Sistema de firmantes frecuentes (personales y org)
```

### ✅ COMPLETADO - Checkout y Pagos (Dic 12, 2025)

**Sistema de Checkout para Firma Electrónica:**

- ✅ Integración con `/api/checkout/create` para productos de firma
- ✅ Soporte para Stripe, Transbank WebPay Plus, Transbank OneClick y Créditos
- ✅ **Órdenes gratuitas ($0):**
  - ✅ Detección automática de monto $0
  - ✅ Formulario simplificado "Datos de Registro" (sin mencionar facturas)
  - ✅ Botón "Confirmar Pedido" en lugar de métodos de pago
  - ✅ Procesamiento directo sin pasarelas de pago (`provider: 'free'`)
  - ✅ Estado de orden: `paid` (permite continuar flujo normal)
  - ✅ No se emiten facturas/boletas para $0
- ✅ **Autenticación en checkout:**
  - ✅ Login/Registro in-place si usuario no autenticado
  - ✅ Redirección de vuelta al checkout post-autenticación
  - ✅ Tabs con LoginForm y SignupForm reutilizados
- ✅ **Página de éxito adaptada:**
  - ✅ Detecta órdenes gratuitas y muestra "¡Pedido Confirmado!"
  - ✅ Muestra monto $0 correctamente (no "N/A")
  - ✅ Oculta botón de factura para órdenes $0
  - ✅ Badge "Confirmado" para órdenes gratuitas
- ✅ **Mejoras y Correcciones Críticas (Dic 30, 2025):**
  - ✅ **Lógica de expiración corregida:** Diferenciación entre "Expira pronto"
    (< 1h) y "Expiró el" (fecha pasada). Se bloquea el botón de pago si la fecha
    ya pasó.
  - ✅ **Solución spinner infinito "Generando invoice":**
    - Exclusión de órdenes gratuitas ($0) del proceso de espera de factura.
    - Implementación de timeout de 3 minutos para el spinner de carga.
    - Mensaje de fallback: "Documento en proceso o requiere revisión manual" si
      el documento no aparece tras el tiempo límite.
    - Optimización del polling en el cliente para detenerse cuando no hay
      documentos pendientes válidos.

**Correcciones de Base de Datos:**

- ✅ `20251212000019_fix_signing_notification_columns.sql` - Corrige
  `s.name → s.full_name` en triggers
- ✅ `20251212000020_enable_pg_net.sql` - Habilita extensión pg_net y corrige
  search_path en funciones
- ✅ Trigger `invoicing.on_order_completed` - No emite facturas para monto $0
- ✅ `20260106000001_fix_internal_review_http.sql` - Corrección crítica error
  `net.http_post()` en webhooks Stripe
  - Problema: Las órdenes quedaban en `pending_payment` después de pago exitoso
  - Causa: Función `signing.invoke_internal_review_function()` usaba `pg_net` no disponible
  - Solución: Migrada a extensión `http` (síncrona) siguiendo patrón establecido
  - Impacto: Webhooks de Stripe ahora procesan correctamente y actualizan órdenes automáticamente
- ✅ `20260106000004_fix_all_http_post_functions.sql` - Corrección error `net.http_post()` en
  múltiples funciones de signing
  - Problema: Estado del firmante no se actualizaba después de firma CDS exitosa
  - Causa: Triggers en cascada (`check_all_signed` → `on_document_completed`) usaban funciones
    con `net.http_post` de sintaxis incorrecta
  - Funciones corregidas: `send_completed_document_notification`, `invoke_signing_notification`,
    `invoke_ai_review_function`, `invoke_internal_review_after_ai`
  - Solución: Todas migradas a extensión `http` (síncrona) con manejo de excepciones

**Corrección Flujo de Firma CDS (Ene 6, 2026):**

- ✅ `apps/web/src/app/api/signing/execute/route.ts` - Cambio a `adminClient` para operaciones UPDATE
  - Problema: Firmante completaba firma pero estado seguía en "listo para firmar" (0/1 firmantes)
  - Causa: Cliente Supabase normal (anon key) sin permisos RLS para firmantes externos
  - Solución: Usar `adminClient` (service_role) para bypass de RLS en todas las escrituras
  - Operaciones corregidas: actualización de `provider_transaction_code`, `current_signed_file_path`,
    estado del firmante a `signed`/`signing`, y estados de error (`certificate_blocked`, `sf_blocked`)
  - Agregada verificación de errores en cada operación con logging apropiado
- ✅ `apps/web/src/app/sign/[token]/SigningPageClient.tsx` - Mejora botón "Ver Documento Firmado"
  - Ahora actualiza `cacheBuster` antes de recargar para mostrar documento firmado actualizado

**Archivos Modificados:**

- ✅ `apps/web/src/app/(dashboard)/checkout/[orderId]/page.tsx` - Auth
  in-place + órdenes $0
- ✅ `apps/web/src/app/(dashboard)/checkout/[orderId]/success/page.tsx` -
  Soporte $0
- ✅ `apps/web/src/components/checkout/ZeroAmountCheckoutForm.tsx` - Nuevo
  componente
- ✅ `apps/web/src/components/checkout/BillingDataForm.tsx` - Props para
  personalizar texto
- ✅ `apps/web/src/app/api/payments/checkout/route.ts` - Manejo de
  `provider: 'free'`
- ✅ `apps/web/src/lib/checkout/core.ts` - No llama facturación para $0
- ✅ `apps/web/src/lib/auth/actions.ts` - Parámetro `redirectTo` en auth

---

### 🚧 PENDIENTE - Testing y Verificación del Flujo

> **Estado actual:** El wizard de creación y checkout funcionan. Ahora hay que
> verificar que el flujo post-pago esté correctamente conectado.

#### **TESTING PRIORITARIO** (Antes de continuar con nuevas features)

**T.1 - Verificar flujo completo post-pago:**

- [ ] Confirmar que al pagar, el documento cambia de estado correctamente
- [ ] Verificar que los firmantes reciben notificación por email
- [ ] Probar que el link `/sign/[token]` funciona para firmantes externos
- [ ] Verificar que la revisión IA se ejecuta si está habilitada

**T.2 - Revisar estado actual de Edge Functions:**

```
analyze-document-risks  → ¿Se invoca correctamente tras subir PDF?
send-signing-notification → ¿Se envían emails a firmantes?
pdf-merge-with-cover → ¿Se genera QR en el documento?
```

**T.3 - Verificar guardado de firmantes: ✅ COMPLETADO (Ene 9, 2026)**

- [x] Confirmar que first_name/last_name se guardan correctamente
- [x] Verificar validación de RUT chileno funciona en producción
- [x] Probar agregar/eliminar firmantes pre-envío
- [x] Implementación de sistema de firmantes frecuentes (guardado/reutilización)

---

### 🚧 PENDIENTE - Plan Detallado de Próximos Pasos

---

#### **FASE A: Completar Edge Functions** (Prioridad Alta)

Las Edge Functions ya existen pero necesitan ajustes y testing:

**A.1 - `analyze-document-risks` ✅ COMPLETADO (Dic 15, 2025)**

```
Ubicación: supabase/functions/analyze-document-risks/index.ts
Estado: ✅ FUNCIONANDO CON SISTEMA DE PROMPTS DINÁMICOS
```

Tareas Completadas:

- [x] Configurar variable de entorno `ANTHROPIC_API_KEY` en Supabase
- [x] Agregar entrada en `credit_prices` para `ai_document_review_full`
- [x] Probar invocación manual con documento PDF real
- [x] Verificar que el resultado se guarde en `signing.ai_reviews`
- [x] Sistema de prompts dinámicos desde base de datos
- [x] Output schema configurable por prompt
- [x] Fallback para schema cache de Edge Functions

### ✅ COMPLETADO - Sistema de Gestión de Prompts IA (Dic 15, 2025)

**Base de Datos:**

- ✅ Tabla `public.ai_prompts` - Configuración de prompts por país y feature
- ✅ Columnas: `feature_type`, `country_code`, `version`, `name`,
  `system_prompt`, `user_prompt_template`, `ai_model`, `temperature`,
  `max_tokens`, `output_schema`, `is_active`
- ✅ Versionado de prompts con historial
- ✅ Activación/desactivación por prompt

**Edge Function `analyze-document-risks`:**

- ✅ Fetch dinámico de prompt activo por país (`getActivePrompt`)
- ✅ Fallback a prompt global (`country_code = 'ALL'`) si no hay específico
- ✅ Procesamiento de variables dinámicas (`{{current_date}}`,
  `{{country_code}}`, etc.)
- ✅ Output schema opcional - si el prompt no define schema, Claude responde
  libremente
- ✅ Fallback para errores de schema cache en Edge Functions

**Frontend Admin `/admin/ai-prompts`:**

- ✅ Lista de prompts con filtros por país y estado
- ✅ Editor de prompts con:
  - Configuración básica (nombre, funcionalidad, país, modelo IA)
  - System Prompt con variables disponibles
  - User Prompt Template
  - **Output Schema JSON** con botón para cargar ejemplo
  - Switch de activación en producción
- ✅ Versionado: "Guardar como nueva versión"
- ✅ Instrucciones de campos requeridos para UI de revisión

**Archivos Creados/Modificados:**

```
Migraciones:
  - 20251216000005_add_observed_status.sql
  - 20251216000006_ai_prompts_system.sql

Frontend:
  - apps/web/src/app/(admin)/admin/ai-prompts/page.tsx
  - apps/web/src/app/(admin)/admin/ai-prompts/[id]/page.tsx
  - apps/web/src/app/(admin)/admin/ai-prompts/[id]/prompt-editor.tsx

Edge Function:
  - supabase/functions/analyze-document-risks/index.ts (actualizado)
  - supabase/functions/_shared/prompt-variables.ts (nuevo)

Wizard:
  - apps/web/src/components/signing/wizard/steps/CountryAndUploadStep.tsx
    (sección IA solo visible si hay prompt activo para el país)
```

---

### ✅ COMPLETADO - Selector Global de País (Dic 16, 2025)

**Objetivo:** Sistema de selección de país global que filtra servicios y precios
según el país seleccionado. Los usuarios pueden acceder desde cualquier
ubicación del mundo, el país determina qué servicios ver.

**Componentes Creados:**

- ✅ `providers/GlobalCountryProvider.tsx` - Contexto React para país global
  - Auto-detección usando `@tupatrimonio/location`
  - Prioridad: localStorage → país de organización → auto-detección → Chile
  - Persistencia en localStorage
  - Hook `useGlobalCountry()` para consumir estado

- ✅ `components/shared/CountrySelectorDropdown.tsx` - Selector dropdown
  - Muestra bandera + código de país
  - Lista todos los países soportados
  - Badge "Próximamente" para países no disponibles
  - Opción "Detectar automáticamente"
  - Mensaje: "El país determina servicios, puedes acceder desde cualquier
    ubicación"

**Integración:**

- ✅ Header del dashboard: Selector visible junto a órdenes pendientes
- ✅ Wizard de firma: Pre-selecciona país del contexto global
- ✅ Layout dashboard envuelto con `GlobalCountryProvider`

**Países Soportados:**

| País      | Código | Estado                    |
| --------- | ------ | ------------------------- |
| Chile     | CL     | ✅ Disponible             |
| México    | MX     | 🚀 Próximamente (Q2 2025) |
| Colombia  | CO     | 🚀 Próximamente (Q2 2025) |
| Perú      | PE     | 🚀 Próximamente (Q3 2025) |
| Argentina | AR     | 🚀 Próximamente (Q3 2025) |

**Mejoras adicionales:**

- ✅ **Eliminado selector de país del Paso 1 del Wizard** (Dic 16, 2025)
  - El selector local de país fue removido de `CountryAndUploadStep.tsx`
  - El país ahora se toma del contexto global (`GlobalCountryProvider`)
  - Título del paso actualizado de "País y Documento" a "Documento"
  - La funcionalidad de IA sigue condicionada al país global seleccionado
  - Simplifica el flujo eliminando redundancia con el header

---

### ✅ COMPLETADO - Sistema de Revisión IA Chile (Dic 16, 2025)

**Prompt de Chile Configurado y Funcionando:**

- ✅ Prompt de producción para Chile (`country_code = 'CL'`)
- ✅ System prompt con instrucciones de análisis legal chileno según Ley 19.799
- ✅ User prompt template con variables dinámicas (`{{current_date}}`,
  `{{has_blank_pages}}`)
- ✅ Output schema específico de Chile con campos:
  - `resultado_revision` (aprobado/observado/rechazado)
  - `tipo_documento` (identificación automática del tipo)
  - `resumen` (máximo 50 palabras)
  - `puntos_importantes` (lista de puntos clave)
  - `cantidad_firmantes` (número requerido)
  - `observaciones` (con tipo: error/advertencia/sugerencia)
  - `razones_rechazo` (solo para rechazados)
  - `sugerencias_modificacion` (solo para observados)
  - `servicio_notarial_sugerido`
    (ninguno/protocolizacion/firma_autorizada_notario/copia_legalizada)
  - `confianza` (nivel de confianza 0-1)
- ✅ Soporte para `additionalProperties: false` requerido por Claude API

**UI de Revisión Inline (sin Modal):**

- ✅ Visualización completa de resultados directamente en el formulario
- ✅ Eliminado modal "Ver revisión completa" - todo visible inline
- ✅ Campos Chile mostrados: tipo documento, firmantes, puntos importantes
- ✅ Observaciones con indicadores de color por severidad
- ✅ Servicio notarial sugerido con alerta informativa

**Sistema de Aceptación de Riesgos (Auditoría):**

- ✅ Columnas `risk_accepted_at`, `risk_accepted_by`, `risk_acceptance_note` en
  `signing.ai_reviews`
- ✅ API endpoint `/api/signing/accept-risk` para registrar aceptación
- ✅ Checkbox de aceptación para documentos "observados"
- ✅ Advertencia clara: "Esta decisión quedará registrada para auditoría"
- ✅ Botón Continuar deshabilitado hasta aceptar riesgos
- ✅ Registro completo para trazabilidad legal

**Admin Panel:**

- ✅ Acceso a AI Prompts agregado en sidebar de admin (Sección Sistema)
- ✅ Editor de prompts actualizado con ejemplo de schema Chile
- ✅ Mensaje informativo actualizado sobre campos requeridos

**Migraciones:**

```
20251216000010_ai_review_risk_acceptance.sql   - Columnas de aceptación de riesgos
20251216000011_chile_legal_review_prompt.sql   - Prompt completo de Chile
20251216000012_fix_chile_prompt_schema.sql     - Fix additionalProperties
20251216000013_fix_ai_reviews_view.sql         - Fix vista con raw_response
```

### ✅ COMPLETADO - Sistema Multi-Remitente SendGrid (Dic 17, 2025)

**Objetivo:** Permitir a cada organización configurar múltiples identidades de
remitente (transaccional y marketing) para personalizar sus comunicaciones por
email.

**Base de Datos (`communications` schema):**

- ✅ Tabla `sender_identities` - Remitentes por organización y propósito
  - Columnas: `organization_id`, `sendgrid_account_id`, `purpose` (enum),
    `from_email`, `from_name`, `reply_to_email`, `is_default`, `is_active`
  - Enum `sender_purpose`: `transactional` | `marketing`
  - Constraint UNIQUE por organización y propósito
- ✅ Vistas públicas con INSTEAD OF triggers para acceso via API
- ✅ RLS policies para multi-tenancy
- ✅ Migración de datos legacy (from_email → sender_identities)

**Backend (`src/lib/sendgrid/`):**

- ✅ `types.ts` - Tipos `SenderPurpose`, `SenderIdentity`, `SenderIdentityInput`
- ✅ `accounts.ts` - CRUD: `getSenderIdentities()`, `getSenderByPurpose()`,
  `upsertSenderIdentity()`, `deleteSenderIdentity()`
- ✅ `client.ts` - `sendEmail()` y `sendBatchEmails()` aceptan parámetro
  `purpose`

**API Routes (`/api/communications/sendgrid/`):**

- ✅ `/senders` - GET, POST, DELETE para gestión de sender identities
- ✅ `/test` - POST para enviar email de prueba con propósito seleccionado

**Frontend (`/dashboard/crm/settings/sendgrid`):**

- ✅ Formulario simplificado de Cuenta (solo API Key)
- ✅ Tabla de Identidades de Remitente con CRUD
- ✅ Selector de propósito (Transaccional/Marketing)
- ✅ Sección "Probar Remitentes" con envío de email de prueba

**Uso en Código:**

```typescript
// Notificaciones, pedidos, alertas del sistema
await sendEmail(orgId, message, { purpose: "transactional" });

// Campañas, newsletters, promociones
await sendEmail(orgId, message, { purpose: "marketing" });
```

**Migraciones:**

```
20251217000004_add_sender_identities.sql         - Schema, tabla, RLS, helpers
20251217000005_create_public_views_sendgrid.sql  - Vistas públicas (RULES)
20251217000006_fix_sendgrid_views_triggers.sql   - INSTEAD OF triggers
```

---

### ✅ COMPLETADO - Integración CDS Firma Electrónica (Dic 17-19, 2025)

**Objetivo:** Integración completa con CDS (Certificadora del Sur) para firma
electrónica avanzada (FEA) según Ley 19.799 de Chile.

**Edge Function `cds-signature`:**

Ubicación: `supabase/functions/cds-signature/index.ts`

Operaciones soportadas:

- ✅ `check-vigencia` - Verificar estado de certificado FEA
- ✅ `enroll` - Iniciar enrolamiento de firmante
- ✅ `request-second-factor` - Solicitar código SMS
- ✅ `sign-multiple` - Firmar documento(s)
- ✅ `get-document` - Obtener documento firmado por código transacción
- ✅ `unblock-certificate` - Desbloquear certificado bloqueado
- ✅ `unblock-second-factor` - Desbloquear 2FA bloqueado
- ✅ `simple-flow` - Flujo simple FEA (REST integration)

**APIs de Firma (`/api/signing/`):**

- ✅ `/check-fea` - Verifica vigencia del certificado del firmante
  - Retorna: `vigente`, `certificadoBloqueado`, `vigencia`, `comentarios`
  - Actualiza estado del firmante en BD (`enrolled`, `needs_enrollment`,
    `certificate_blocked`)
- ✅ `/request-2fa` - Solicita código SMS para segundo factor
  - Actualiza estado a `enrolled` cuando tiene éxito (limpiar estado bloqueado)
  - Retorna mensajes directos de CDS para transparencia
- ✅ `/execute` - Ejecuta la firma electrónica
  - Usa `documentoFirmado` (string base64) de respuesta CDS
  - Guarda documento en `docs-signed` bucket
  - Actualiza estado del firmante a `signed`
  - Notifica siguiente firmante si es secuencial
- ✅ `/enroll-cds` - Inicia proceso de enrolamiento
- ✅ `/unblock` - Desbloquea certificado o 2FA
- ✅ `/preview/[id]` - Sirve preview del documento para visor PDF

**Página de Firma `/sign/[token]`:**

- ✅ Layout público sin autenticación requerida
- ✅ Visor PDF embebido siempre visible
- ✅ Flujo de pasos:
  1. `verifying` - Verificando vigencia certificado
  2. `needs_enrollment` - Requiere enrolamiento (link externo)
  3. `certificate_blocked` - Certificado bloqueado (link desbloqueo)
  4. `ready_for_2fa` - Listo para ingresar clave certificado
  5. `waiting_code` - Esperando código SMS
  6. `success` - Firma exitosa (con preview)
  7. `signed` - Ya firmó (recarga de página)
  8. `error` - Error en el proceso

**UI/UX Implementado:**

- ✅ Modales estilizados para errores con botones contextuales:
  - Certificado bloqueado → Botón "Desbloquear Certificado"
  - 2FA bloqueado → Botón "Desbloquear Segundo Factor"
  - Código SMS usado/expirado → Botón "Solicitar Nuevo Código SMS"
- ✅ Toggle mostrar/ocultar contraseña y código SMS
- ✅ Preview del documento visible en todos los estados (excepto verifying)
- ✅ Estado `signed` con layout consistente mostrando:
  - Fecha/hora de firma
  - Ley 19.799 de referencia
  - Documento firmado visible
- ✅ Dark mode completo con CSS variables

**Códigos de Error CDS Manejados:**

| Código | Significado           | Acción                      |
| ------ | --------------------- | --------------------------- |
| 122    | Máximo intentos FEA   | `certificate_blocked`       |
| 124    | Clave incorrecta      | Error modal                 |
| 125    | Certificado bloqueado | `certificate_blocked`       |
| 127    | SMS incorrecto        | Error modal                 |
| 128    | SMS expirado          | Modal con "Solicitar nuevo" |
| 129    | SMS ya utilizado      | Modal con "Solicitar nuevo" |
| 133    | Debe solicitar SMS    | `ready_for_2fa`             |
| 134    | 2FA bloqueado         | `sf_blocked`                |

**Correcciones Críticas:**

- ✅ Campo `documentoFirmado` (singular) vs `documentosFirmados` (array)
- ✅ Estado bloqueado NO bloquea intento de firma (CDS determina estado real)
- ✅ Request 2FA exitoso actualiza estado de `blocked` a `enrolled`
- ✅ Transparencia de mensajes CDS (`comentarios`) en todas las respuestas

**Archivos Principales:**

```
Frontend:
  - apps/web/src/app/sign/[token]/page.tsx (server)
  - apps/web/src/app/sign/[token]/SigningPageClient.tsx (client)

API Routes:
  - apps/web/src/app/api/signing/check-fea/route.ts
  - apps/web/src/app/api/signing/request-2fa/route.ts
  - apps/web/src/app/api/signing/execute/route.ts
  - apps/web/src/app/api/signing/enroll-cds/route.ts
  - apps/web/src/app/api/signing/unblock/route.ts
  - apps/web/src/app/api/signing/preview/[id]/route.ts

Edge Function:
  - supabase/functions/cds-signature/index.ts
```

---

### ✅ COMPLETADO - Visibilidad por Organización Activa (Dic 19, 2025)

**Problema Resuelto:** Los usuarios con múltiples organizaciones podían ver
documentos de firma electrónica y pedidos de todas sus organizaciones, en lugar
de solo los de la organización actualmente seleccionada.

**Solución Implementada:**

Todas las páginas ahora filtran datos por la **organización activa** del usuario
usando `getUserActiveOrganization()` o `useOrganization()`.

**Archivos Modificados - Documentos de Firma:**

| Archivo                                                    | Cambio                                   |
| ---------------------------------------------------------- | ---------------------------------------- |
| `dashboard/signing/documents/page.tsx`                     | Agregado filtro `.eq('organization_id')` |
| `dashboard/signing/documents/[id]/page.tsx`                | Verificación contra org activa           |
| `components/signing/wizard/steps/CountryAndUploadStep.tsx` | Usa `useOrganization()` del contexto     |

**Archivos Modificados - Pedidos:**

| Archivo                               | Cambio                                            |
| ------------------------------------- | ------------------------------------------------- |
| `checkout/[orderId]/page.tsx`         | Usa `getUserActiveOrganization()` en verificación |
| `checkout/[orderId]/success/page.tsx` | Usa `getUserActiveOrganization()` en verificación |

**Componentes Ya Correctos (sin cambios necesarios):**

- ✅ `components/checkout/OrdersList.tsx` - Ya usaba `useOrganization()`
- ✅ `components/checkout/PendingOrdersBadge.tsx` - Ya usaba `useOrganization()`

**Comportamiento:**

- Un usuario que pertenece a múltiples organizaciones solo ve datos de la
  organización activa (la seleccionada en el Organization Switcher)
- Si intenta acceder por URL a un documento/pedido de otra organización → 404
- Para ver datos de otra organización, debe cambiar la org activa en el switcher

---

### ✅ COMPLETADO - Recuperación Automática de Revisión IA (Ene 7, 2026)

**Problema Identificado:**
Documentos quedaban estancados en estado `pending_ai_review` indefinidamente si la API de disparo fallaba post-pago o si la Edge Function no respondía por timeout/error de red. No existía un mecanismo de auto-curación.

**Solución Implementada:**
Un sistema de monitoreo y reintento automático basado en un cronjob programado que garantiza que ningún documento quede sin procesar.

**Componentes Desarrollados:**

1.  **Base de Datos**:
    - ✅ Nueva columna `ai_review_retry_count` en `signing.documents`.
    - ✅ Índice parcial `idx_documents_ai_retry` para optimizar la búsqueda de documentos estancados.
    - ✅ Migración: `20260107100000_add_ai_review_retry_count.sql`.

2.  **Cronjob API (`/api/cron/retry-ai-reviews`)**:
    - ✅ Implementado con validación de seguridad `CRON_SECRET`.
    - ✅ Busca documentos en `pending_ai_review` con más de 15 minutos de inactividad.
    - ✅ Lógica de reintento inteligente: verifica si ya existe una revisión completada en `signing_ai_reviews` antes de disparar una nueva.
    - ✅ Límite de 3 reintentos automáticos para evitar bucles infinitos en documentos corruptos.
    - ✅ Procesamiento por lotes (max 10 por ejecución) para control de costos y recursos.

3.  **Configuración de Infraestructura**:
    - ✅ Registrado en `vercel.json` con frecuencia de 10 minutos (`*/10 * * * *`).

**Ventajas:**
- ✅ **Resiliencia**: El sistema se recupera solo de fallos temporales de API o red.
- ✅ **Tranquilidad del Usuario**: Se garantiza que el proceso de firma comenzará incluso si hay un fallo técnico inicial.
- ✅ **Monitoreo**: Los reintentos quedan registrados para auditoría en el panel administrativo.

---

### ✅ COMPLETADO - Flujo Público de Firma Sin Login (Ene 8, 2026)

**Problema Identificado:** 

1. **Bug de Carga:** El wizard mostraba "No encontramos una organización activa" incluso con usuarios logueados porque `CountryAndUploadStep` ejecutaba `loadOrgAndCredits` antes de que `OrganizationProvider` terminara de cargar (`isLoading: true`).
2. **Fricción de Entrada:** Requerir login desde el inicio del flujo generaba abandono de usuarios nuevos que querían "probar" el servicio.

**Solución Implementada:**

Sistema de flujo dual que permite a usuarios no autenticados completar los pasos de configuración (1-3) del wizard, requiriendo autenticación solo en el checkout (paso 4), con preservación automática del progreso.

**Arquitectura de Flujos:**

```
FLUJO PÚBLICO (/firmar):
Usuario → Paso 1-3 (sin login) → Paso 4 Checkout → Login/Registro inline → 
Creación automática de org → Creación de documento en BD → Checkout de pago

FLUJO PRIVADO (/dashboard/signing/documents/new):
Usuario logueado → Wizard completo (persiste en BD desde paso 1)
```

**Componentes Modificados:**

1. **`CountryAndUploadStep.tsx`**:
   - ✅ Agregado `isLoading` de `useOrganization()` para esperar carga completa
   - ✅ Eliminada validación estricta de organización al inicio
   - ✅ Carga de configuraciones (países, prompts, precios) sin requerir org
   - ✅ Modo dual: Con usuario → intenta obtener org, Sin usuario → continúa sin error
   - ✅ Función `ensureDocumentAndUpload()` adaptada para retornar sin crear documento si no hay usuario
   - ✅ Análisis IA opcional solo para usuarios logueados con créditos

2. **`ServiceSelectionStep.tsx`**:
   - ✅ Validación de `countryCode` antes de cargar productos
   - ✅ Modo dual: Con `documentId` → persiste en BD, Sin `documentId` → solo actualiza contexto

3. **`SignerManagementStep.tsx`**:
   - ✅ Modo dual: Con `documentId` → usa DB, Sin `documentId` → usa estado local del wizard
   - ✅ Operaciones de agregar/eliminar/reordenar firmantes funcionan en ambos modos
   - ✅ Eliminada validación estricta de `documentId` para continuar

4. **`CheckoutStep.tsx`**:
   - ✅ Detección de autenticación con estado `isAuthenticated`
   - ✅ UI inline de Login/Registro cuando no hay auth (usando `LoginForm` y `SignupForm`)
   - ✅ Lógica post-autenticación:
     - Creación automática de organización personal si no existe
     - Creación de documento en BD con datos del wizard
     - Subida del archivo PDF al Storage
     - Creación de firmantes en BD
     - Creación de orden de pago
   - ✅ Limpieza automática de sessionStorage al completar el flujo

5. **`WizardContext.tsx`**:
   - ✅ Importado `useEffect` que faltaba
   - ✅ Implementación de persistencia en `sessionStorage`
   - ✅ Carga automática del estado al montar el componente
   - ✅ Guardado automático en cada cambio de estado
   - ✅ Limpieza automática en `reset()` del wizard
   - ✅ Manejo especial: El objeto `File` no se serializa (se pierde en recargas, pero se mantiene en SPA)

**Archivos Nuevos:**

- ✅ `app/(public)/firmar/page.tsx` - Página pública con wizard accesible sin login
- ✅ `app/(public)/layout.tsx` - Actualizado con `OrganizationProvider` y `GlobalCountryProvider`

**Mejoras de Seguridad:**

- ✅ Eliminada consulta directa a `organization_users` desde el cliente (causaba "permission denied")
- ✅ Todas las consultas a BD validadas para usuarios no autenticados
- ✅ Las tablas de configuración pública (`signing_products`, `signing_country_settings`, `ai_prompts`, `credit_prices`, `signing_document_types`) requieren políticas RLS de lectura pública

**Flujo de Usuario No Autenticado:**

1. Visita `/firmar`
2. Sube documento PDF y selecciona país (Paso 1)
3. Selecciona tipo de firma y servicio notarial (Paso 2)
4. Agrega firmantes (Paso 3)
5. Al llegar al Paso 4 (Checkout):
   - Ve resumen del pedido
   - Se le muestra tabs Login/Registro inline
   - Inicia sesión o crea cuenta
   - Se redirige de vuelta al checkout con progreso intacto
6. Sistema automáticamente:
   - Crea organización personal si no tiene
   - Crea documento en BD con datos del wizard
   - Sube archivo a Storage
   - Crea firmantes en BD
   - Genera orden de pago
7. Usuario procede al pago normalmente

**Ventajas del Nuevo Flujo:**

- ✅ **Reducción de fricción**: Los usuarios pueden explorar el servicio sin crear cuenta
- ✅ **Mayor conversión**: El usuario invierte tiempo configurando antes de registrarse (sunk cost)
- ✅ **Mejor UX**: Login en el momento natural (antes del pago), no al inicio
- ✅ **Preservación de progreso**: sessionStorage mantiene los datos durante la sesión
- ✅ **Compatibilidad total**: Usuarios logueados siguen usando el dashboard sin cambios
- ✅ **Patrón e-commerce**: Modelo probado (agregar al carrito → checkout → login → pago)

**Compatibilidad con Flujo Existente:**

- ✅ Usuarios logueados que acceden desde `/dashboard/signing/documents/new` funcionan igual que antes
- ✅ El mismo componente `DocumentRequestWizard` funciona en ambas rutas
- ✅ Detección automática del contexto (público vs privado) sin configuración adicional

### 🔜 PRÓXIMOS PASOS INMEDIATOS

**1. Configuración de Base de Datos:**

- [ ] Habilitar políticas RLS de lectura pública para tablas de configuración (requerido para flujo público):
  - `signing_products`
  - `signing_country_settings`
  - `ai_prompts`
  - `credit_prices`
  - `signing_document_types`

**2. Testing del Flujo Completo:**

- [ ] Probar firma con múltiples firmantes secuenciales
- [ ] Verificar notificación email al siguiente firmante
- [ ] Probar rechazo de firma
- [ ] Testing con documentos grandes

**2. Completar Features Adicionales:**

- [ ] Verificación pública `/repository/[documentId]`
- [ ] Panel de notarías
- [ ] Reportes de firmas

**3. Testing Adicional:**

**A.2 - `pdf-merge-with-cover` (Ya existe - Ajustar)**

```
Ubicación: supabase/functions/pdf-merge-with-cover/index.ts
Estado: Código base, necesita ajustar rutas de storage
```

Tareas:

- [ ] Cambiar bucket de `signing-documents` a `docs-originals`
- [ ] Generar QR con URL `https://tupatrimonio.app/repository/{document_id}`
- [ ] Agregar el ID único del documento en la primera página
- [ ] Subir resultado a `docs-originals` como nueva versión
- [ ] Crear registro en `signing.document_versions` con
      `version_type = 'pre_signature'`
- [ ] Actualizar `signing.documents.qr_file_path` y `qr_identifier`

**A.3 - `send-signing-notification` (Ya existe - Completar)**

```
Ubicación: supabase/functions/send-signing-notification/index.ts
Estado: Código completo, listo para testing
```

Tareas:

- [ ] Verificar que `sendgrid_accounts` tenga datos de prueba
- [ ] Crear templates de email para cada tipo:
  - `REVIEW_REQUEST` - Solicitud de revisión interna
  - `SIGNING_REQUEST` - Invitación a firmar (con link `/sign/{token}`)
  - `SIGNING_COMPLETED` - Notificación de documento completado
- [ ] Probar envío real de emails

**A.4 - `signature-webhook` ✅ COMPLETADO (Dic 17, 2025)**

```
Ubicación: supabase/functions/signature-webhook/index.ts
Estado: ✅ COMPLETADO Y PROBADO - Maneja flujo simple y enrolamiento
```

Tareas Completadas:

- [x] Obtener documentación real de API de CDS (Certificadora del Sur)
- [x] Ajustar parsing del payload según formato real (Structure:
      TransactionCode + RUT)
- [x] Implementar manejo de notificaciones de enrolamiento
- [x] Implementar manejo de notificaciones de firma (Flujo Simple)
- [x] Respuesta OK en texto plano para CDS
- [x] Actualización de estados en base de datos (`signing.signers`)

---

#### **FASE B: Portal Público de Firma** (Prioridad Alta)

**B.1 - Página `/sign/[token]`**

```
Crear: apps/web/src/app/sign/[token]/page.tsx
```

Tareas:

- [ ] Crear layout público (sin sidebar, sin autenticación)
- [ ] Validar token contra `signing.signers.signing_token`
- [ ] Verificar que `token_expires_at` no haya pasado
- [ ] Mostrar información del documento (título, descripción)
- [ ] Renderizar PDF con visor (react-pdf o pdf.js)
- [ ] Checkbox de aceptación de términos y condiciones
- [ ] Botón "Firmar" que llame RPC `record_signature`
- [ ] Botón "Rechazar" que llame RPC `reject_signature`
- [ ] Pantalla de confirmación post-firma
- [ ] Manejo de errores (token inválido, expirado, ya firmado)

**B.2 - Verificar turno en firma secuencial**

```
Si document.signing_order = 'sequential':
  - Verificar que signer.signing_order coincida con el turno actual
  - Mostrar mensaje "Esperando que otros firmen primero" si no es su turno
```

---

#### **FASE C: Verificación Pública de Documentos** (Prioridad Media)

**C.1 - Página `/repository/[documentId]`**

```
Crear: apps/web/src/app/repository/[documentId]/page.tsx
```

Tareas:

- [ ] Crear página pública (sin autenticación)
- [ ] Buscar documento por UUID en `signing.documents`
- [ ] Mostrar estado actual del documento
- [ ] Si está firmado/notarizado: generar URL temporal firmada
- [ ] Botón para descargar última versión válida
- [ ] Mostrar información básica (título, fecha, firmantes)
- [ ] No exponer datos sensibles (emails completos, RUTs)

**C.2 - Generar URLs firmadas**

```typescript
// Usar supabase.storage.from('bucket').createSignedUrl()
// Duración: 5-10 minutos
// Buckets: docs-signed, docs-notarized
```

---

#### **FASE D: Panel de Notarías** (Prioridad Media)

**D.1 - Crear organización tipo "notary"**

```sql
-- En core.organizations agregar org_type = 'notary'
-- Crear notaría de prueba con peso = 5
```

**D.2 - Dashboard de notaría `/notary/dashboard`**

```
Crear: apps/web/src/app/notary/dashboard/page.tsx
```

Tareas:

- [ ] Verificar que usuario pertenezca a organización tipo `notary`
- [ ] Listar documentos asignados desde `signing.notary_assignments`
- [ ] Filtros por estado: pending, in_progress, completed, rejected
- [ ] Vista de detalle de cada asignación
- [ ] Descarga del documento a firmar

**D.3 - Subida de documento notarizado**

```
Crear: apps/web/src/app/api/notary/upload-notarized/route.ts
```

Tareas:

- [ ] Recibir PDF notarizado
- [ ] Leer QR del PDF para extraer `document_id`
- [ ] Validar que coincida con la asignación
- [ ] Subir a bucket `docs-notarized`
- [ ] Actualizar `signing.notary_assignments.status = 'completed'`
- [ ] Actualizar `signing.documents.status = 'notarized'`
- [ ] Crear registro en `signing.document_versions`

**D.4 - Sistema de comunicación**

```
Usar: signing.notary_observations
```

Tareas:

- [ ] UI para agregar observaciones/rechazos
- [ ] Notificación al equipo TuPatrimonio
- [ ] Respuestas y resolución de observaciones

---

#### **FASE E: Modificación Post-Envío** ✅ COMPLETADO (Dic 12, 2025)

**E.1 - Panel de edición de documento** ✅

```
✅ Creado: apps/web/src/components/signing/edit/DocumentEditPanel.tsx
✅ Creado: apps/web/src/components/signing/edit/SignerEditPanel.tsx
```

Tareas:

- [x] Permitir agregar/editar/eliminar firmantes si no ha firmado
- [x] Permitir reemplazar PDF si nadie ha firmado
- [x] Si hay firmas existentes → modo "re-envío"

**E.2 - Flujo de re-envío con pago** ✅

```
RPCs disponibles y funcionando:
- begin_document_resend() → Invalida firmas, pone documento en draft
- calculate_resend_cost() → Calcula costo de firmas invalidadas
```

Tareas:

- [x] UI que muestre advertencia de firmas a invalidar
- [x] Llamar `begin_document_resend`
- [x] Calcular costo con `calculate_resend_cost`
- [x] Crear orden vía `/api/checkout/create` con
      `productType: 'electronic_signature_resend'`
- [x] Redirigir a checkout (Stripe/Transbank/Créditos)
- [x] Post-pago: documento vuelve a estado editable

---

#### **FASE F: Integración con Proveedor de Firma** ✅ COMPLETADO (Dic 17, 2025)

**F.1 - Configurar proveedor CDS** ✅

```sql
-- Insertar en signing.providers
INSERT INTO signing.providers (name, slug, provider_type, base_url, endpoints)
VALUES ('Certificadora del Sur', 'cds', 'both', 'https://api.cds.cl/v1', '{...}');
```

**F.2 - Implementar llamadas a API CDS** ✅

Tareas Completadas:

- [x] Crear `supabase/functions/cds-signature/index.ts`
- [x] Método `checkVigenciaFEA` (Refinado con estructura anidada y Debugging)
- [x] Método `enrollFirmante` (Refinado con estructura anidada y Debugging)
- [x] Método `requestSecondFactor` (Refinado con estructura anidada y Debugging)
- [x] Método `signMultiple` (Refinado con estructura anidada y Debugging)
- [x] Método `simpleFlowFEA` (Nueva funcionalidad implementada)
- [x] Panel de Administración CDS (`/admin/cds`) COMPLETO y con Debugging UI

---

#### **FASE G: Testing y QA** (Prioridad Alta - Continuo)

**G.1 - Testing manual del wizard**

- [ ] Crear documento nuevo (todos los pasos)
- [ ] Verificar que se guarde en BD correctamente
- [ ] Verificar precios y cálculos
- [ ] Probar checkout completo

**G.2 - Testing de firma**

- [ ] Abrir link de firma como firmante externo
- [ ] Firmar documento (mock sin proveedor real)
- [ ] Verificar actualización de estados
- [ ] Verificar notificaciones

**G.3 - Testing de notaría**

- [ ] Asignar documento a notaría (usando RPC)
- [ ] Ver documento en panel de notaría
- [ ] Subir documento notarizado
- [ ] Verificar cierre de ciclo

---

### 📋 Orden Recomendado de Implementación (Actualizado Dic 12)

```
✅ COMPLETADO:
- Wizard de creación de documento (4 pasos)
- Checkout con todos los métodos de pago
- Soporte para órdenes $0 (gratuitas)
- FASE E → Modificación post-envío (paneles de edición)

🚧 SIGUIENTE (Prioridad):
1. TESTING     → Verificar flujo completo post-pago (firmantes, emails, estados)
2. FASE A.1-A.3 → Edge Functions (verificar que se ejecutan correctamente)
3. FASE B       → Portal de firma /sign/[token] (crítico para el flujo)
4. FASE C       → Verificación pública /repository/[id]

📋 POSTERIOR:
5. FASE D       → Panel de notarías
6. FASE F       → Integración con proveedor CDS (cuando haya contrato)
```

---

### 🔧 Variables de Entorno Requeridas

```bash
# Supabase Edge Functions
ANTHROPIC_API_KEY=sk-ant-...           # Para análisis IA
SENDGRID_API_KEY=SG....                 # Fallback si org no tiene cuenta
SIGNING_PROVIDER_API_KEY=...            # CDS u otro
SIGNING_PROVIDER_API_SECRET=...
APP_URL=https://tupatrimonio.app        # Para generar links
```

---

**✅ COMPLETADO:** **SISTEMA DE FACTURACIÓN INDEPENDIENTE** 🎉 (Diciembre 2025)

**✅ Sistema de Facturación - 100% COMPLETO Y PROBADO:**

- ✅ **Login/Autenticación** - ✅ COMPLETO Y FUNCIONANDO (Correo, OTP, Google,
  Facebook, GitHub)
- ✅ **Stripe** - ✅ PAGOS FUNCIONANDO CORRECTAMENTE (claves, webhooks, flujos
  de pago probados)
- ✅ **Transbank** - ✅ PAGOS FUNCIONANDO CORRECTAMENTE (Webpay Plus y OneClick
  probados)
- ✅ **Sistema de Facturación Independiente** - ✅ COMPLETO (Diciembre 2025):
  - ✅ Nuevo schema `invoicing` independiente del billing
  - ✅ API RESTful para emisión de documentos
  - ✅ Soporte multi-proveedor: Haulmer (Chile) + Stripe (Internacional)
  - ✅ Factura Electrónica (TipoDTE 33): Emisión y almacenamiento de PDF/XML
  - ✅ Boleta Electrónica (TipoDTE 39): Emisión y almacenamiento de PDF/XML
  - ✅ Invoice Stripe: Emisión y almacenamiento de PDF
  - ✅ Almacenamiento en Supabase Storage (bucket `invoices`)
  - ✅ Página de testing protegida (`/test-invoicing`) solo para platform admins
  - ✅ Documentación completa: `docs/INVOICING-SYSTEM.md`
- ✅ **Pruebas Completadas:**
  - ✅ Testing Factura Haulmer: PDF + XML generados correctamente
  - ✅ Testing Boleta Haulmer: PDF + XML generados correctamente
  - ✅ Testing Invoice Stripe: PDF generado y almacenado correctamente
- 🔄 **SendGrid** - Configurar API keys de producción, verificar envío de
  emails, configurar dominio verificado

**✅ COMPLETADO:**

- ✅ **Admin Panel Core COMPLETADO** (Nov 21, 2025)
- ✅ **Sistema de Créditos y Billing COMPLETADO** (Nov 22, 2025)
- ✅ **Platform Admins: Acceso Completo al Dashboard COMPLETADO** (Dic 2025)
- ✅ **Conversión B2C → B2B COMPLETADO** (Enero 2025)
  - ✅ Función SQL para conversión automática
  - ✅ Endpoint API seguro con validaciones
  - ✅ UI completa para usuarios en `/settings/organization`
  - ✅ Actualización automática de límites del CRM
- ✅ **Conversión B2B → B2C COMPLETADO Y PROBADO** (Diciembre 2025)
  - ✅ Función SQL para conversión automática inversa
  - ✅ Endpoint API seguro con validaciones y advertencias
  - ✅ UI completa con advertencias destacadas para usuarios
  - ✅ Actualización automática de límites del CRM (reducción)
  - ✅ Sistema de advertencias para usuarios adicionales y contactos excedentes
  - ✅ Migración aplicada exitosamente
    (`20251203000000_convert_b2b_to_b2c_function.sql`)
  - ✅ Probado en producción - Conversión funcionando correctamente
- ✅ **Fase 3 - Comunicaciones y CRM avanzado COMPLETADO** (Dic 2025)
  - ✅ Schema communications creado (`20251123191316_schema_communications.sql`)
  - ✅ Integración SendGrid multi-tenant (cuenta por organización)
  - ✅ Sistema de encriptación AES-256-GCM para API keys
  - ✅ Motor de templates Handlebars implementado
  - ✅ API routes de comunicaciones creadas (templates, campaigns, lists,
    analytics)
  - ✅ UI de comunicaciones creada (templates, campaigns, lists, analytics,
    SendGrid settings)
  - ✅ Páginas del CRM completadas (contacts, deals, tickets, products)
  - ✅ Helper `getUserActiveOrganization()` para manejo de organizaciones
  - ✅ **Arquitectura Multi-Canal Implementada** (Dic 2025)
    - ✅ Aplicación `email_marketing` creada en `core.applications`
    - ✅ Separación de Communications como aplicación independiente de CRM
    - ✅ Estructura de URLs: `/dashboard/communications/email/` (campañas y
      templates)
    - ✅ Listas y Analytics compartidos: `/dashboard/communications/lists` y
      `/analytics`
    - ✅ Schema `communications` diseñado para múltiples canales (email, sms,
      whatsapp)
    - ✅ Sistema de visibilidad integrado directamente en `core.applications`
    - ✅ Preparado para futuras aplicaciones: `whatsapp_marketing` y
      `sms_marketing`
- ✅ **Sistema de Facturación Independiente COMPLETADO** (Dic 2025)
  - ✅ Nuevo schema `invoicing` completamente independiente
  - ✅ API RESTful: `POST/GET /api/invoicing/documents`
  - ✅ Multi-proveedor: Haulmer (Factura/Boleta Chile) + Stripe (Invoice
    Internacional)
  - ✅ Emisión correcta de Facturas Electrónicas (TipoDTE 33)
  - ✅ Emisión correcta de Boletas Electrónicas (TipoDTE 39)
  - ✅ Emisión correcta de Invoices Stripe
  - ✅ Almacenamiento de PDF/XML en Supabase Storage
  - ✅ Página de testing `/test-invoicing` (solo platform admins)
  - ✅ Documentación: `docs/INVOICING-SYSTEM.md`

**📋 SIGUIENTE FASE (Después de conectar a producción):**

- 📋 **Servicios Core** - Firmas electrónicas como primer servicio (pendiente)
- 📋 Dashboard B2C/B2B mejorado (pendiente)

---

## 🔗 **SISTEMA CRM UNIFICADO (Core + CRM)** (10 Diciembre 2025) ✨

**✅ INTEGRACIÓN COMPLETA PLATFORM ↔ CRM:**

**1. Modal de Asociaciones Inteligente:**

- ✅ **Unificación de Fuentes**: Búsqueda simultánea en
  `core.users`/`organizations` y `crm.contacts`/`companies`
- ✅ **Indicadores Visuales**: Badges automáticos (🟢 Plataforma vs 🔵 CRM)
- ✅ **Deduplicación Automática**: Priorización inteligente de usuarios
  registrados sobre contactos CRM
- ✅ **Paginación y Búsqueda**: Optimizado para grandes volúmenes de datos
- ✅ **Schema Safety**: Implementación vía RPC functions para bypass seguro de
  restricciones de acceso

**2. Estrategia de Vinculación Automática:**

- ✅ **Auto-Link Triggers**:
  - Al crear contacto CRM: Se vincula si existe el usuario en plataforma (match
    por email)
  - Al registrar usuario Core: Se vinculan automáticamente sus contactos
    históricos del CRM
  - Al crear empresa CRM: Se vincula si existe organización en plataforma (match
    por nombre)
- ✅ **Base de Datos Optimizada**:
  - Nuevas columnas `linked_user_id` y `linked_organization_id`
  - Índices para performance en búsquedas cruzadas
  - Constraints para integridad referencial

**3. Correcciones de Acceso Multi-Schema:**

- ✅ Solución a errores `PGRST106` mediante `createServiceRoleClient`
  encapsulado en RPCs
- ✅ Permisos granulares para funciones de búsqueda y listado
- ✅ Acceso seguro a datos de `auth.users` sin exponer información sensible
- ✅ **Corrección de tipos RPC (Dic 2025)**: Solucionado error `42804` mediante
  casting explícito
- ✅ **Soporte completo de Source**: Frontend y Backend manejan correctamente
  `platform` vs `crm`

**📄 ARCHIVOS CLAVE:**

- Migración: `20251210000020_unified_contact_linking.sql`
- Componentes: `AssociationSelector.tsx`, `AssociationList.tsx`
- Actions: `associations.ts` (con lógica unificada)

---

## 🎉 **ADMIN PANEL CORE - 100% FUNCIONAL** (21 Noviembre 2025) ✨

**✅ SISTEMA DE ADMINISTRACIÓN COMPLETO Y PROBADO**

### 🏗️ **Infraestructura y Soluciones Técnicas Implementadas**

**✅ PROBLEMA CRÍTICO RESUELTO: Recursión Infinita en RLS**

- ✅ Identificado problema estructural de PostgreSQL con políticas RLS
  recursivas
- ✅ Solución implementada: RLS deshabilitado en `organization_users`
- ✅ Seguridad manejada en Server Actions con verificaciones robustas
- ✅ Tabla bypass `_bypass.platform_admins` creada (sin RLS)
- ✅ Función `is_platform_super_admin_bypass()` implementada
- ✅ Todos los checks de permisos actualizados para usar bypass
- ✅ **8 migraciones aplicadas exitosamente** (20251121000000 - 20251121000008)

**✅ SISTEMA DE CORREOS 1:1 - VERSIÓN 1 COMPLETA** (Diciembre 2025)

- ✅ **Threading Inteligente**: Conversaciones agrupadas correctamente por hilo
- ✅ **Prevención de Duplicados**: Safety check implementado para evitar tickets
  dobles
- ✅ **Outbound & Inbound Unificados**: Respuestas y mensajes salientes en el
  mismo hilo
- ✅ **Sincronización Bidireccional**: Gmail API ↔ CRM Tickets
- ✅ **Migración RPC Mejorada**: Lookup robusto en base de datos
  (`20251210000011_fix_email_threading_rpc.sql`)
- ✅ **Probado en Producción**: Flujo completo verificado (Cliente → Admin →
  Cliente → Admin)

**🔧 MIGRACIONES APLICADAS:**

1. ✅ `20251121000000` - Fix inicial RLS recursion
2. ✅ `20251121000001` - Fix v2 con orden de políticas
3. ✅ `20251121000002` - Fix v3 con función auxiliar
4. ✅ `20251121000003` - Fix final con verificación directa
5. ✅ `20251121000004` - Implementación tabla bypass
6. ✅ `20251121000005` - Update función is_platform_admin
7. ✅ `20251121000006` - **Disable RLS en organization_users** (solución
   definitiva)
8. ✅ `20251121000007` - RLS para platform admins en `crm.folders` y
   `crm.thread_labels`
9. ✅ `20251121000008` - SECURITY DEFINER en triggers de folders

**✅ PROBLEMAS RESUELTOS:**

- ✅ Recursión infinita en políticas RLS → **RESUELTO**
- ✅ Permission denied for table folders → **RESUELTO**
- ✅ Next.js 15 params async requirement → **RESUELTO**
- ✅ Supabase relación ambigua con users → **RESUELTO**
- ✅ Triggers ejecutándose sin permisos → **RESUELTO con SECURITY DEFINER**
- ✅ Usuarios sin organizaciones no visibles → **RESUELTO** (especificada
  relación `user_id` en consulta)
- ✅ Platform admin con restricciones de RLS → **RESUELTO** (todas las páginas
  usan `createServiceRoleClient()`)

### 📋 **Funcionalidades del Admin Panel - 100% COMPLETAS**

**✅ GESTIÓN DE ORGANIZACIONES:**

- ✅ **Crear organizaciones** - Formulario completo con validaciones
- ✅ **Editar organizaciones** - Actualización de datos
- ✅ **Ver listado** - Tabla con filtros y búsqueda
- ✅ **Ver detalles** - Página completa con información
- ✅ **Asignar/Remover roles** a usuarios
- ✅ Miembros por organización
- ✅ Aplicaciones habilitadas
- ✅ Suscripciones activas
- ✅ Generación automática de slug
- ✅ Validaciones robustas (email, slug format)
- ✅ **Auto-creación de carpetas CRM** al crear organización

**✅ GESTIÓN DE USUARIOS:**

- ✅ Listado completo de usuarios del sistema (incluye usuarios sin
  organizaciones)
- ✅ Emails visibles correctamente usando ServiceRoleClient
- ✅ Asignación de roles a usuarios
- ✅ Ver organizaciones de cada usuario (o "Sin organización" si no tiene)
- ✅ Gestión de estados (activo/inactivo)
- ✅ Corrección de relación ambigua en `organization_users` (especificada
  `user_id`)

**✅ GESTIÓN DE INVITACIONES:**

- ✅ **Enviar invitaciones** a nuevos usuarios
- ✅ **Cancelar invitaciones** pendientes
- ✅ Ver listado de invitaciones (pendientes, aceptadas, expiradas)
- ✅ Filtros por estado y organización
- ✅ Resend de invitaciones

**✅ GESTIÓN DE TEAMS:**

- ✅ **Crear teams** dentro de organizaciones
- ✅ **Editar teams** (nombre, descripción, color, líder)
- ✅ **Ver listado** de todos los teams
- ✅ **Ver detalles** de team con miembros
- ✅ **Agregar miembros** a teams
- ✅ **Remover miembros** de teams
- ✅ Asignación de líder de team
- ✅ Color identificador por team
- ✅ Roles dentro del team (member, lead, admin)

**✅ GESTIÓN DE API KEYS:**

- ✅ **Crear API keys** para organizaciones
- ✅ **Revocar API keys** existentes
- ✅ Ver listado de keys activas
- ✅ Configuración de permisos por key
- ✅ Tracking de último uso

**✅ GESTIÓN DE ROLES Y PERMISOS:**

- ✅ Ver todos los roles del sistema
- ✅ Ver permisos por rol
- ✅ Asignación de roles a usuarios

### 🎨 **Componentes UI Creados (20+ componentes)**

**Componentes de Formularios:**

- ✅ `OrganizationFormDialog` - Crear/editar organizaciones
- ✅ `TeamFormDialog` - Crear/editar teams
- ✅ `InvitationFormDialog` - Enviar invitaciones
- ✅ `ApiKeyFormDialog` - Crear API keys
- ✅ `AssignRoleDialog` - Asignar roles
- ✅ `AddTeamMemberDialog` - Agregar miembros a team

**Componentes de Acciones:**

- ✅ `CreateOrganizationButton`
- ✅ `EditOrganizationButton`
- ✅ `CreateTeamButton`
- ✅ `EditTeamButton`
- ✅ `CreateInvitationButton`
- ✅ `CancelInvitationButton`
- ✅ `CreateApiKeyButton`
- ✅ `RevokeApiKeyButton`
- ✅ `RemoveTeamMemberButton`
- ✅ `UserRoleActions`

**Componentes Auxiliares:**

- ✅ `StatusBadge` - Estados visuales
- ✅ `OrgTypeBadge` - Tipos de organización
- ✅ `PageHeader` - Headers consistentes
- ✅ `EmptyState` - Estados vacíos

### 📂 **Estructura de Páginas Admin**

```
apps/web/src/app/(admin)/admin/
├── layout.tsx                    ✅ Layout con sidebar
├── page.tsx                      ✅ Dashboard principal
├── organizations/
│   ├── page.tsx                  ✅ Lista de organizaciones
│   └── [id]/
│       └── page.tsx              ✅ Detalles de organización
├── users/
│   └── page.tsx                  ✅ Lista de usuarios
├── roles/
│   └── page.tsx                  ✅ Lista de roles
├── invitations/
│   └── page.tsx                  ✅ Lista de invitaciones
├── teams/
│   ├── page.tsx                  ✅ Lista de teams
│   └── [id]/
│       └── page.tsx              ✅ Detalles de team
├── api-keys/
│   └── page.tsx                  ✅ Lista de API keys
├── applications/
│   ├── page.tsx                  ✅ Lista de aplicaciones
│   └── [id]/
│       └── page.tsx              ✅ Configuración de visibilidad de aplicación
├── subscriptions/
│   └── page.tsx                  ✅ Lista de suscripciones
├── events/
│   └── page.tsx                  ✅ System events
└── settings/
    └── page.tsx                  ✅ Configuración
```

### 🔧 **Server Actions Implementados**

**📄 Archivo:** `apps/web/src/lib/admin/actions.ts` (566 líneas)

**Funciones de Seguridad:**

- ✅ `verifyPlatformAdmin()` - Verificación de permisos usando bypass

**Gestión de Organizaciones:**

- ✅ `createOrganization()` - Crear nueva organización
- ✅ `updateOrganization()` - Actualizar organización existente

**Gestión de Roles:**

- ✅ `assignUserRole()` - Asignar rol a usuario
- ✅ `removeUserFromOrganization()` - Remover usuario

**Gestión de Invitaciones:**

- ✅ `sendInvitation()` - Enviar nueva invitación
- ✅ `cancelInvitation()` - Cancelar invitación pendiente

**Gestión de Teams:**

- ✅ `createTeam()` - Crear nuevo team
- ✅ `updateTeam()` - Actualizar team existente
- ✅ `addTeamMember()` - Agregar miembro a team
- ✅ `removeTeamMember()` - Remover miembro de team

**Gestión de API Keys:**

- ✅ `createApiKey()` - Crear nueva API key
- ✅ `revokeApiKey()` - Revocar API key existente

**✅ TODAS las funciones con:**

- Verificación de permisos
- Validaciones de datos
- Manejo de errores
- Revalidación de paths
- Mensajes de éxito/error

### 🧪 **Testing y Validación**

**✅ PROBADO EXITOSAMENTE EN NAVEGADOR:**

- ✅ Creación de organización "Empresa Demo XYZ"
- ✅ Auto-creación de carpetas CRM (Inbox, Sent, Important, Archive, Spam)
- ✅ Visualización de detalles de organización
- ✅ Navegación entre páginas
- ✅ Sidebar responsive y funcional
- ✅ Formularios con validación en tiempo real
- ✅ Estados de loading y mensajes de error
- ✅ Next.js 15 compatibilidad (async params)
- ✅ TypeScript sin errores
- ✅ Sin linter errors

### 🎯 **Sidebar Admin Completo**

**Secciones Organizadas:**

**Principal:**

- ✅ Dashboard
- ✅ Organizaciones
- ✅ Usuarios
- ✅ Roles y Permisos
- ✅ Invitaciones
- ✅ Teams

**Apps & Servicios:**

- ✅ Aplicaciones (con sistema de visibilidad integrado)
- ✅ Suscripciones
- ✅ CRM
- ✅ Blog

**Facturación:**

- ✅ Créditos
- ✅ Facturas
- ✅ Pagos

**Sistema:**

- ✅ API Keys
- ✅ System Events
- ✅ Configuración

### 🎯 **Sidebar Dashboard para Usuarios Regulares**

**Secciones Organizadas:**

**Principal:**

- ✅ Dashboard

**CRM:**

- ✅ CRM
- ✅ Contactos
- ✅ Empresas
- ✅ Deals
- ✅ Tickets
- ✅ Productos

**Facturación:**

- ✅ Facturación
- ✅ Comprar Créditos
- ✅ Facturas
- ✅ Uso de Créditos
- ✅ Configuración

**Contenido:**

- ✅ Blog

**Características:**

- ✅ Layout con sidebar integrado (`apps/web/src/app/(dashboard)/layout.tsx`)
- ✅ Componente `DashboardSidebar` reutilizable
- ✅ Detección automática de tipo de usuario (platform admin vs regular)
- ✅ Página principal del dashboard con estadísticas y accesos rápidos
- ✅ Navegación consistente con el sidebar del admin

### 📊 **Métricas del Admin Panel**

- **Páginas creadas:** 20+ (15+ admin + 5+ billing admin)
- **Componentes UI:** 25+ (20+ admin + 5+ dashboard)
- **Server Actions:** 12+
- **Migraciones:** 9
- **Sidebars:** 2 (Admin + Dashboard regular)
- **Líneas de código:** ~4,000+
- **Tiempo de desarrollo:** 1 sesión intensiva + actualización sidebars
- **Estado:** ✅ **100% FUNCIONAL Y PROBADO**

### 🚀 **Capacidades del Platform Admin**

**Como Platform Admin puedes:**

1. ✅ Ver y gestionar **todas las organizaciones** del sistema (sin filtros de
   RLS)
2. ✅ Crear nuevas organizaciones (Personal, Business, Enterprise, Platform)
3. ✅ Editar información de organizaciones existentes
4. ✅ Ver **todos los usuarios** registrados (incluye usuarios sin
   organizaciones)
5. ✅ Ver **emails de todos los usuarios** usando ServiceRoleClient
6. ✅ Asignar y remover **roles** a usuarios
7. ✅ Enviar **invitaciones** para nuevos usuarios

### 🎨 **Optimización UX - Kanban CRM** (Diciembre 2025)

- ✅ **Drag & Drop Fluido**: Implementación de **Optimistic UI** para movimiento
  instantáneo
- ✅ **Estética Refinada**:
  - Eliminada rotación al arrastrar
  - Sombra difuminada suave (`shadow-2xl` custom)
  - Eliminado borde en placeholder
- ✅ **Correcciones**: Solucionado conflicto de keys en sidebar (Blog duplicado)

8. ✅ Cancelar invitaciones pendientes
9. ✅ Ver **todas las invitaciones** del sistema (sin restricciones)
10. ✅ Crear y gestionar **teams** dentro de organizaciones
11. ✅ Ver **todos los teams** de todas las organizaciones
12. ✅ Agregar y remover **miembros de teams**
13. ✅ Crear **API keys** para organizaciones
14. ✅ Ver **todas las API keys** del sistema
15. ✅ Revocar API keys existentes
16. ✅ Ver todas las **aplicaciones** del ecosistema
17. ✅ **Configurar visibilidad de aplicaciones** (Dic 2025)
    - ✅ Control de visibilidad por nivel (public, platform_only, beta,
      restricted)
    - ✅ Restricción por países permitidos
    - ✅ Restricción por tiers de suscripción requeridos
    - ✅ Overrides por organización (excepciones específicas)
    - ✅ Habilitar/deshabilitar aplicaciones sin eliminar datos
    - ✅ Sidebar dinámico que filtra según aplicaciones habilitadas
18. ✅ Ver **suscripciones** activas de todas las organizaciones
19. ✅ Monitorear **eventos del sistema** globales
20. ✅ Ver **créditos de todas las organizaciones** (nueva sección)
21. ✅ Ver **facturas de todas las organizaciones** (nueva sección)
22. ✅ Ver **pagos de todas las organizaciones** (nueva sección)
23. ✅ Ver **estadísticas del CRM** globales (nueva sección)
24. ✅ Acceder al **blog** desde el admin (nueva sección)
25. ✅ **Vista completa sin restricciones** - Todas las páginas usan
    ServiceRoleClient para bypass RLS

**Como Usuario Regular puedes:**

1. ✅ Acceder a tu **dashboard personal** con sidebar completo
2. ✅ Gestionar tu **CRM** (contactos, empresas, deals, tickets, productos)
3. ✅ Gestionar tu **facturación** (comprar créditos, ver facturas, uso)
4. ✅ Acceder al **blog** desde el dashboard
5. ✅ Ver estadísticas de créditos y uso en tiempo real
6. ✅ Navegar fácilmente entre todas las secciones disponibles

### 🔐 **Arquitectura de Seguridad**

**Seguridad Multi-Capa:**

1. ✅ **Server Actions** - Toda lógica de negocio en el servidor
2. ✅ **Verificación de permisos** - En cada acción
3. ✅ **RLS deshabilitado en organization_users** - Evita recursión
4. ✅ **Tabla bypass** - Para checks de platform admin sin RLS
5. ✅ **SECURITY DEFINER** - En triggers del sistema
6. ✅ **Validaciones robustas** - En frontend y backend
7. ✅ **Nunca exponer tablas sensibles** - Solo via Server Actions
8. ✅ **ServiceRoleClient en páginas admin** - Platform admin ve todo sin
   restricciones de RLS
9. ✅ **Acceso completo a datos** - Todas las páginas de admin usan
   `createServiceRoleClient()` para bypass RLS

### 🎛️ **Sistema de Visibilidad de Aplicaciones** (Dic 2025)

**✅ IMPLEMENTADO:** Control de visibilidad integrado directamente en
`core.applications`

**Arquitectura:**

- ✅ Campos agregados a `core.applications`:
  - `visibility_level`: public, platform_only, beta, restricted
  - `allowed_countries`: Array de códigos de países permitidos
  - `required_subscription_tiers`: Array de tiers requeridos (starter, pro,
    enterprise)
- ✅ Tabla `core.application_overrides` para excepciones por organización
- ✅ Funciones SQL:
  - `can_access_application(org_id, user_id, app_slug)`: Verifica acceso
    individual
  - `get_enabled_applications(org_id, user_id)`: Lista aplicaciones habilitadas
  - `update_application(app_id, ...)`: Actualización segura desde cliente

**Funcionalidades:**

- ✅ Página `/admin/applications` lista todas las aplicaciones (incluso
  deshabilitadas)
- ✅ Página `/admin/applications/[id]` para configurar visibilidad:
  - Switch para habilitar/deshabilitar aplicación
  - Selector de nivel de visibilidad
  - Selector múltiple de países permitidos
  - Selector múltiple de tiers requeridos
  - Gestión de overrides por organización
- ✅ Protección automática de rutas basada en aplicaciones habilitadas
- ✅ Protección de APIs con `requireApplicationAccess()`
- ✅ Sidebar dinámico que filtra según aplicaciones habilitadas
- ✅ Platform admins siempre ven todas las aplicaciones (incluso deshabilitadas)

**Migraciones Aplicadas:**

- ✅ `20251205000000_applications_visibility.sql` - Campos y funciones de
  visibilidad
- ✅ `20251205000001_update_application_function.sql` - Función RPC para
  actualización
- ✅ `20251205000002_email_marketing_app.sql` - Aplicación email_marketing

**Eliminado:**

- ❌ Sistema de Feature Flags (`core.feature_flags`) - Duplicaba funcionalidad
- ❌ Todas las páginas y APIs de `/admin/feature-flags`
- ❌ Hook `useFeatureAccess` - Reemplazado por `useApplicationAccess`

### 📄 **Documentación Actualizada**

**Archivos de documentación:**

- ✅ Comentarios en migraciones SQL (explicación de soluciones)
- ✅ Comentarios en Server Actions (arquitectura de seguridad)
- ✅ JSDoc en componentes principales
- ✅ README con advertencias de seguridad
- ✅ Documentación de sistema de visibilidad de aplicaciones

### 🎉 **RESULTADO FINAL**

**✅ ADMIN PANEL 100% FUNCIONAL** - Listo para gestionar:

- Cientos de organizaciones
- Miles de usuarios
- Teams distribuidos
- Múltiples aplicaciones
- Suscripciones y billing (cuando se implemente)

**✅ SCHEMA CORE COMPLETO** - Multi-tenant robusto con:

- Organizations, Users, Teams, Roles
- Invitations, API Keys, Applications
- Subscriptions, System Events
- RLS strategy actualizada y probada
- Bypass system para platform admins

**✅ SIDEBARS COMPLETOS** - Navegación para todos los usuarios:

- Sidebar Admin: Gestión completa de plataforma (20+ secciones)
- Sidebar Dashboard: Navegación para usuarios regulares (15+ secciones)
- Detección automática de tipo de usuario
- Layouts separados pero consistentes
- Páginas de admin para billing, CRM y blog

### 🔧 **MEJORAS RECIENTES - Admin Panel (Diciembre 2025)**

**✅ CORRECCIÓN CRÍTICA: Visibilidad Completa de Usuarios**

- ✅ **Problema identificado**: Página de usuarios solo mostraba usuarios con
  organizaciones asignadas
- ✅ **Causa**: Consulta usaba `!inner` (INNER JOIN) que excluía usuarios sin
  organizaciones
- ✅ **Solución**: Eliminado `!inner` y especificada relación `user_id`
  explícitamente
- ✅ **Resultado**: Ahora muestra **todos los usuarios** del sistema, tengan o
  no organizaciones

**✅ CORRECCIÓN CRÍTICA: Emails No Visibles**

- ✅ **Problema identificado**: Columna de emails mostraba "N/A" para todos los
  usuarios
- ✅ **Causa**: `auth.admin.listUsers()` requiere ServiceRoleClient, no funciona
  con cliente normal
- ✅ **Solución**: Actualizada función para usar `createServiceRoleClient()`
  para obtener emails
- ✅ **Resultado**: Emails visibles correctamente para todos los usuarios

**✅ MEJORA ARQUITECTÓNICA: Acceso Completo del Platform Admin**

- ✅ **Problema identificado**: Algunas páginas de admin tenían restricciones de
  RLS que limitaban visibilidad
- ✅ **Solución**: Actualizadas **todas las páginas de admin** para usar
  `createServiceRoleClient()`
- ✅ **Páginas actualizadas** (12 páginas):
  - Dashboard (`admin/page.tsx`)
  - Usuarios (`admin/users/page.tsx`)
  - Organizaciones (`admin/organizations/page.tsx` + detalle)
  - Teams (`admin/teams/page.tsx` + detalle)
  - Invitaciones (`admin/invitations/page.tsx`)
  - API Keys (`admin/api-keys/page.tsx`)
  - Suscripciones (`admin/subscriptions/page.tsx`)
  - Aplicaciones (`admin/applications/page.tsx`)
  - Roles (`admin/roles/page.tsx`)
  - System Events (`admin/events/page.tsx`)
- ✅ **Beneficios**:
  - Platform admin ve **todo el sistema** sin restricciones
  - No hay filtros ocultos por organización
  - Consistencia en todas las páginas de administración
  - Emails y datos completos visibles en todas partes

**✅ LISTO PARA PRODUCCIÓN** 🚀

### 🔧 **MEJORAS RECIENTES - Platform Admins: Acceso Completo al Dashboard (Diciembre 2025)**

**✅ FUNCIONALIDAD IMPLEMENTADA: Acceso Sin Restricciones al Dashboard**

- ✅ **Objetivo**: Permitir que platform admins accedan a todas las áreas
  B2C/B2B sin restricciones
- ✅ **Problema identificado**: Platform admins solo podían acceder a `/admin`,
  no al dashboard regular
- ✅ **Solución implementada**:
  - Helper `getUserActiveOrganization()` creado (`lib/organization/utils.ts`)
  - Si usuario es platform admin sin organización personal, usa organización
    platform automáticamente
  - Middleware actualizado para permitir acceso sin redirección
  - Layout del dashboard actualizado para no bloquear platform admins

**✅ ARCHIVOS CREADOS/MODIFICADOS:**

- ✅ `lib/organization/utils.ts` - Helper para obtener organización activa
  - `getUserActiveOrganization()` - Obtiene organización del usuario o platform
    org si es admin
  - `getUserAndOrganization()` - Helper para API routes
- ✅ `lib/supabase/middleware.ts` - Actualizado para permitir acceso a platform
  admins
- ✅ `app/(dashboard)/layout.tsx` - Comentarios actualizados, sin bloqueo de
  platform admins

**✅ PÁGINAS ACTUALIZADAS PARA USAR HELPER:**

- ✅ `/dashboard/page.tsx` - Dashboard principal
- ✅ `/dashboard/crm/page.tsx` - Dashboard CRM (creada)
- ✅ `/dashboard/crm/companies/page.tsx` - Lista de empresas
- ✅ `/dashboard/crm/contacts/page.tsx` - Lista de contactos (creada)
- ✅ `/dashboard/crm/deals/page.tsx` - Lista de deals (creada)
- ✅ `/dashboard/crm/tickets/page.tsx` - Lista de tickets (creada)
- ✅ `/dashboard/crm/products/page.tsx` - Lista de productos (creada)
- ✅ `/dashboard/crm/templates/page.tsx` - Lista de templates
- ✅ `/billing/invoices/page.tsx` - Facturas
- ✅ `/billing/usage/page.tsx` - Uso de créditos

**✅ PÁGINAS DEL CRM CREADAS:**

- ✅ `/dashboard/crm/page.tsx` - Dashboard principal del CRM con estadísticas
- ✅ `/dashboard/crm/contacts/page.tsx` - Lista de contactos
- ✅ `/dashboard/crm/deals/page.tsx` - Lista de deals
- ✅ `/dashboard/crm/tickets/page.tsx` - Lista de tickets
- ✅ `/dashboard/crm/products/page.tsx` - Lista de productos

**✅ RESULTADO:**

- ✅ Platform admins pueden acceder a todas las áreas del dashboard sin
  restricciones
- ✅ Si no tienen organización personal, usan automáticamente la organización
  platform
- ✅ Todas las páginas funcionan correctamente para platform admins
- ✅ Testing completo realizado en navegador
- ✅ **LISTO PARA PRODUCCIÓN** 🚀

---

## 🚨 Cambios Recientes (Nov 2025)

### ✅ **COMPLETADO - 14 Noviembre 2025:**

**🔐 SISTEMA DE AUTENTICACIÓN COMPLETO CON MEJORES PRÁCTICAS 🔐**

**✅ Autenticación Robusta y Completa - PRODUCCIÓN READY:**

- ✅ **Ruta de logout funcional** (`/auth/signout/route.ts`)
  - Formularios de logout ahora funcionan correctamente
  - Limpieza de sesión y redirect al login

- ✅ **AuthListener global implementado**
  - Detecta sesiones expiradas automáticamente
  - Maneja refresh de tokens en tiempo real
  - Escucha cambios de autenticación (login, logout, updates)
  - Integrado en layout principal de la aplicación

- ✅ **Página de login mejorada con verificación del servidor**
  - Ahora es Server Component que verifica autenticación
  - Si usuario ya está logeado, redirige automáticamente al dashboard
  - Separado en LoginPageClient para funcionalidad del lado cliente

- ✅ **Funcionalidad "Remember Me" implementada**
  - Checkbox funcional con persistencia de sesión
  - Si está marcado: sesión persiste 30 días
  - Si no está marcado: sesión solo durante navegador abierto

- ✅ **Sistema completo de recuperación de contraseña**
  - Página `/login/forgot-password` para solicitar recuperación
  - Ruta callback `/auth/reset-password` para procesar enlace de email
  - Página `/reset-password` con formulario de nueva contraseña
  - Validaciones robustas y mensajes de éxito/error
  - Enlace "¿Olvidaste tu contraseña?" en página de login
  - Manejo correcto de errores y redirects sin mostrar mensajes falsos

- ✅ **Redirect inteligente después de login**
  - Captura ruta original cuando usuario intenta acceder sin autenticación
  - Después de login, redirige a donde intentaba ir
  - Manejo de organizaciones múltiples
  - Redirect a `/dashboard/select-organization` si necesario

- ✅ **Sistema de reenvío de email de confirmación**
  - Página `/login/resend-confirmation` para reenviar email
  - Función `resendConfirmationEmail()` en actions
  - Para usuarios que no recibieron el email inicial

- ✅ **Métodos de autenticación completos y funcionando:**
  - ✅ **Login con correo y contraseña** - Funcionando perfectamente
  - ✅ **Login con OTP (código de 6 dígitos)** - Funcionando perfectamente
  - ✅ **Login con Google OAuth** - Funcionando perfectamente
  - ✅ **Login con Facebook OAuth** - Funcionando perfectamente
  - ✅ **Login con GitHub OAuth** - Funcionando perfectamente
  - Manejo robusto de errores y redirects
  - Callback de OAuth optimizado con timeout de emergencia
  - Detección correcta de NEXT_REDIRECT para evitar mensajes de error falsos
  - Verificación de sesión antes de mostrar errores

**✅ Onboarding B2C + B2B PROBADO Y FUNCIONANDO:**

- ✅ **Onboarding Personal COMPLETADO Y PROBADO**
  - Creación de organización personal automática
  - Habilitación de CRM con 100 contactos
  - Redirect correcto al dashboard
  - Usuario: `test-user-20251114@example.com` ✅ EXITOSO

- ✅ **Onboarding Empresarial CORREGIDO Y PROBADO**
  - Error de constraint en size_category RESUELTO
  - Valores del select corregidos (startup, small, medium, large, enterprise)
  - Creación de organización empresarial funcionando
  - Habilitación de CRM con 1,000 contactos
  - Redirect correcto al dashboard
  - Empresa: "TechCorp SpA" ✅ EXITOSO

**✅ Formatters CRM COMPLETADOS:**

- ✅ **21 funciones de formateo creadas** en
  `apps/web/src/lib/crm/formatters.ts`
  - Funciones de formateo: currency, dates, phone, RUT
  - Funciones de estados: contactos, empresas, deals, tickets, cotizaciones
  - Funciones de colores: badges con Tailwind classes
  - Funciones de etiquetas: labels en español
  - Error `formatCurrency is not a function` RESUELTO

**✅ Testing en Navegador Completo:**

- ✅ Registro de usuarios testeado (Personal y Empresarial)
- ✅ Login/Logout funcionando correctamente
- ✅ Dashboard CRM mostrando estadísticas con formato correcto ($0, etc.)
- ✅ Navegación entre secciones del CRM sin errores
- ✅ Capturas de pantalla de funcionamiento exitoso

**📁 ARCHIVOS CREADOS (14 Nov 2025):**

- `apps/web/src/app/auth/signout/route.ts`
- `apps/web/src/components/AuthListener.tsx`
- `apps/web/src/app/login/LoginPageClient.tsx`
- `apps/web/src/app/login/forgot-password/page.tsx`
- `apps/web/src/app/auth/reset-password/route.ts`
- `apps/web/src/app/reset-password/page.tsx`
- `apps/web/src/app/login/resend-confirmation/page.tsx`
- `apps/web/src/lib/crm/formatters.ts` (completo con 421 líneas)

**📁 ARCHIVOS MODIFICADOS (14 Nov 2025):**

- `apps/web/src/app/layout.tsx` - AuthListener integrado
- `apps/web/src/app/login/page.tsx` - Server Component con verificación
- `apps/web/src/app/login/actions.ts` - Remember Me + Redirect + Resend
- `apps/web/src/app/onboarding/page.tsx` - Flujo corregido y valores de select

**🎯 RESULTADO:**

- ✅ Sistema de autenticación con **TODAS las mejores prácticas**
- ✅ **Todos los métodos de autenticación funcionando:** Correo, OTP, Google,
  Facebook, GitHub
- ✅ Manejo robusto de errores sin mensajes falsos
- ✅ Callbacks de OAuth optimizados y funcionando correctamente
- ✅ Onboarding B2C/B2B **100% funcional y probado**
- ✅ CRM funcionando sin errores
- ✅ Formatters completos para toda la aplicación
- ✅ **AUTENTICACIÓN LISTA PARA PRODUCCIÓN** 🚀

---

### ✅ **COMPLETADO - 12 Noviembre 2025:**

**🎉 FASE 0 COMPLETA AL 100% 🎉**

- ✅ Contenido del sitio actual migrado a las landing pages
- ✅ Blog poblado con 10-15 posts reales
- ✅ Base de conocimiento poblada con 15-20 artículos
- ✅ Optimización final de contenido completada
- ✅ Testing completo realizado
- ✅ **Fase 0: 100% COMPLETADA**

**🔄 EN DESARROLLO - Sistema CRM Multi-Tenant B2B (12 Nov 2025):**

- ✅ **Decisión Arquitectónica**:
  - CRM diseñado como servicio vendible multi-tenant
  - TuPatrimonio Platform como cliente #1 del CRM
  - Cada organización gestiona sus propios contactos
  - Aislamiento total vía RLS por organization_id

- ✅ **Unificación de Sistema de Roles**:
  - Eliminada tabla redundante `marketing.user_roles`
  - Migrado todo a sistema `core.roles` + `core.organization_users`
  - Función `can_access_admin()` actualizada
  - Nueva función `can_access_crm()` creada
  - Código TypeScript actualizado (`page-management.ts`, `users/page.tsx`)
  - Migración SQL corregida: `20251112185905_limpiar-user-roles.sql` ✅

- ✅ **Schema CRM Multi-Tenant Completo - Estilo HubSpot**:
  - **Schema separado**: `crm` (siguiendo arquitectura de schemas por
    aplicación)
  - **10 tablas principales**:
    - Base (6): `contacts`, `companies`, `deals`, `tickets`, `activities`,
      `emails`
    - Comercial (3): `products`, `quotes`, `quote_line_items`
    - Config (2): `pipelines`, `settings`, `notes`
  - **ENUMs completos** (8):
    - Existentes: `contact_status`, `activity_type`, `deal_stage`,
      `email_status`
    - Nuevos: `company_type`, `ticket_status`, `ticket_priority`, `quote_status`
  - **Relaciones HubSpot-style**:
    - Contacto ↔ Empresa (N:1)
    - Empresa → Contactos, Deals, Tickets (1:N)
    - Deal → Contacto/Empresa (flexible)
    - Ticket → Contacto/Empresa (soporte)
    - Quote → Contacto/Empresa/Deal (propuestas)
    - Activities → Universal (timeline para todo)
  - **Features automáticas**:
    - Auto-numeración: TICK-00001, QUO-00001
    - Cálculo automático de totales en cotizaciones
    - Pipelines personalizables por org
    - Subsidiarias (parent_company_id)
  - **Funciones SQL**:
    - `import_marketing_leads_to_crm()`
    - `crm.get_stats(org_id)` - Dashboard principal
    - `crm.get_company_stats(company_id)` - Stats por empresa
    - `crm.get_company_contacts(company_id)` - Contactos de empresa
  - **RLS completo** por organization_id en todas las tablas
  - **Roles específicos** en core: `crm_manager` (nivel 6), `sales_rep`
    (nivel 4)
  - **Aplicación** `crm_sales` registrada en core.applications
  - **Migraciones SQL**:
    - `20251112190000_schema-crm-multitenant.sql` ✅ (Base)
    - `20251112202031_crm-base.sql` ✅ (Expansión HubSpot)

- 📋 **Documentación Creada**:
  - `docs/schemas/crm.md` - Implementación técnica multi-tenant
  - `docs/schemas/crm-hubspot-style.md` - Arquitectura completa estilo HubSpot
    ⭐ NUEVO
  - `docs/schemas/ARCHITECTURE-SCHEMAS.md` - Filosofía de schemas separados
  - `docs/ORGANIZATION-SUMMARY.md` - Resumen de organización de docs
  - `docs/NAVIGATION-MAP.md` - Mapa de navegación de documentación
  - Ejemplos de API routes con permisos
  - Diagramas de relaciones entre entidades
  - Sistema de límites por plan de suscripción
  - Integración Gmail por organización
  - Flujos de trabajo completos
  - Testing multi-tenant

- ✅ **Organización de Documentación** (12 Nov 2025):
  - README raíz simplificado (995 → 89 líneas)
  - Estructura de carpetas clara (schemas/, design/, features/, etc.)
  - READMEs en todas las subcarpetas
  - Archivos históricos movidos a archived/
  - Documentación de packages en su ubicación correcta
  - 8 categorías organizadas + navegación clara

**🚀 Próximo paso:** Implementar UI del CRM (2-3 semanas) → FASE 1

---

### Avances Significativos de Noviembre:

✅ **COMPLETADOS en Noviembre 2025:**

1. **Sistema de Gestión de Páginas Dinámicas**
   - Sistema completo de gestión de rutas y contenido
   - API routes para configuración de páginas
   - Integración con sitemap dinámico
   - Páginas gestionadas desde base de datos

2. **Base de Conocimiento (Knowledge Base)**
   - Sistema completo de artículos KB
   - Categorías y navegación por categorías
   - Integración con Supabase (kb_articles, kb_categories)
   - SEO optimizado para cada artículo
   - URLs amigables: `/base-conocimiento/[categoria]/[slug]`

3. **Sistema de Reviews de Google Business**
   - Integración completa con Google Business API
   - Sincronización automática de reseñas
   - Cron job para actualización periódica
   - Display de reseñas en landing pages
   - Cache de datos para mejor performance

4. **Rutas y Páginas Adicionales**
   - `/ayuda` - Centro de ayuda completo
   - `/nosotros` - Página sobre TuPatrimonio
   - `/contacto` - Formulario de contacto global
   - Todas las páginas legales (`/legal/*`)
   - Páginas de líneas de negocio (legal-tech, business-hub, proptech, fintech)

5. **Mejoras de SEO y Sitemap**
   - Sitemap dinámico que incluye:
     - Páginas estáticas priorizadas
     - Posts del blog con última modificación
     - Artículos de base de conocimiento
     - Categorías de ambos sistemas
   - Prioridades inteligentes por tipo de contenido
   - Change frequencies optimizadas

**✅ COMPLETADO - Fase 0 al 100%:**

1. ✅ **Contenido Real** - COMPLETADO (Nov 12, 2025)
   - ✅ Migrar contenido del sitio actual
   - ✅ Crear posts iniciales para blog
   - ✅ Poblar base de conocimiento con artículos
   - ✅ Optimizar todas las landing pages

2. **Sistema CRM y Gestión de Correos** (3-5 días) ← NUEVO
   - **Panel CRM en Dashboard**:
     - Visualizar contactos de formularios (waitlist + contacto)
     - Ver detalles de cada lead con toda su información
     - Sistema de estados (nuevo, contactado, calificado, convertido)
     - Filtros y búsqueda de contactos
     - Notas y seguimiento por contacto
   - **Integración de Email Workspace**:
     - Conectar correo del workspace (Google Workspace / Outlook)
     - Poder responder emails directamente desde el CRM
     - Recibir y visualizar correos entrantes
     - Threading de conversaciones
     - Templates de respuestas rápidas
   - **Notificaciones**:
     - Alertas cuando llega nuevo contacto
     - Emails de notificación al equipo
     - Dashboard de leads pendientes de respuesta

3. **Sistema de Autenticación Avanzado** (opcional para MVP)
   - OAuth providers (Google, LinkedIn)
   - Magic Links
   - Verificación de correo mejorada

**✅ Fase 0 COMPLETADA AL 100% - Nov 12, 2025**

- ✅ Contenido: COMPLETADO
- ✅ Optimización final: COMPLETADO
- CRM + Email: OPCIONAL (puede implementarse en Fase 1)

---

## 📋 Información del Proyecto

### Stack Tecnológico

- **Backend:** Supabase (PostgreSQL + Auth + Storage + Realtime + pgvector)
- **Frontend:** Next.js 14+ (App Router) + TailwindCSS
- **Deployment:** Netlify
- **Lenguaje:** TypeScript
- **CMS (Landing/Blog):** Contentful / Sanity / WordPress Headless (a definir)

### Servicios Externos

- **Pagos:** Stripe + dLocal Go
- **Email:** SendGrid (solo API, templates propios)
- **Auth/SMS:** Twilio
- **Verificación:** Veriff (biometría + documentos)
- **Storage:** Supabase Storage (integrado)
- **SEO Tools:** Google Search Console, Ahrefs/SEMrush, Schema.org
- **IA:** OpenAI API / Anthropic Claude API

### Principios de Diseño

- **Base de datos ligera:** Mínima documentación almacenada, usar referencias a
  storage
- **Multi-tenant nativo:** Todo filtrado por organization_id
- **API-first:** Diseño REST consistente
- **Event-driven:** Arquitectura basada en eventos para desacoplamiento
- **Seguridad:** RLS en todas las tablas, encriptación en reposo
- **SEO-first:** Contenido optimizado para motores de búsqueda y IA
- **AI schemas separados:** Customer Service y Document Review como servicios
  independientes

---

## 🌐 **FASE 0: Marketing Web + SEO Foundation (Semanas 1-4)**

### **Objetivo:** Establecer presencia digital y comenzar posicionamiento mientras se desarrolla el producto

Esta fase es **CRÍTICA** porque:

1. El SEO toma 3-6 meses en mostrar resultados
2. Genera tráfico orgánico mientras desarrollas
3. Valida messaging y value proposition
4. Construye lista de early adopters
5. Permite iterar contenido según feedback

---

### 0.1 Setup Técnico de Marketing Site

**Objetivo:** Infraestructura optimizada para SEO/AEO/GEO

#### Arquitectura Propuesta:

```
tupatrimonio.app/
├── / (landing page principal)
├── /firmas-electronicas (landing específica)
├── /verificacion-identidad (landing específica)
├── /notaria-digital (landing específica)
├── /asistente-ia (landing específica) ← NUEVO
├── /revision-documentos-ia (landing específica) ← NUEVO
├── /precios
├── /blog/
│   ├── /blog/[slug]
│   └── /blog/categoria/[categoria]
├── /recursos/
│   ├── /guias/[slug]
│   ├── /casos-de-uso/[slug]
│   └── /comparativas/[slug]
├── /legal/
│   ├── /terminos
│   ├── /privacidad
│   └── /cookies
└── /app (redirige a app.tupatrimonio.app en el futuro)
```

#### Tareas Técnicas:

1. **Next.js Configuration para SEO**
   ```typescript
   // next.config.js optimizado
   {
     images: {
       formats: ['image/avif', 'image/webp'],
       deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
     },
     compiler: {
       removeConsole: process.env.NODE_ENV === 'production',
     },
     experimental: {
       optimizeCss: true,
     },
   }

   // app/layout.tsx - Metadata API
   export const metadata = {
     metadataBase: new URL('https://tupatrimonio.app'),
     alternates: {
       canonical: '/',
       languages: {
         'es-CL': '/es-cl',
         'es-MX': '/es-mx',
       },
     },
     openGraph: {
       images: '/og-image.jpg',
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
       },
     },
   }
   ```

2. **Structured Data (Schema.org)**
   ```typescript
   // Implementar JSON-LD en cada página

   // Homepage: Organization
   {
     "@context": "https://schema.org",
     "@type": "SoftwareApplication",
     "name": "TuPatrimonio",
     "applicationCategory": "BusinessApplication",
     "offers": {
       "@type": "Offer",
       "price": "0",
       "priceCurrency": "CLP"
     },
     "aggregateRating": {
       "@type": "AggregateRating",
       "ratingValue": "4.8",
       "ratingCount": "127"
     }
   }

   // Blog posts: Article
   // Guías: HowTo
   // Precios: Product/Offer
   // FAQs: FAQPage
   ```

3. **Performance (Netlify Automático)**
   ```typescript
   // Netlify maneja automáticamente:
   - Next.js Image optimization
   - Font optimization (next/font)
   - Bundle optimization y Code splitting
   - Edge caching global
   - ISR (Incremental Static Regeneration)

   // Solo configurar:
   - Lazy loading de componentes pesados
   - Core Web Vitals monitoring
   ```

4. **Sitemap y Robots.txt Dinámicos**
   ```typescript
   // app/sitemap.ts
   export default async function sitemap() {
     const posts = await getBlogPosts();
     const guides = await getGuides();

     return [
       { url: "https://tupatrimonio.app", changeFrequency: "daily" },
       { url: "https://tupatrimonio.app/precios", changeFrequency: "weekly" },
       ...posts.map((post) => ({
         url: `https://tupatrimonio.app/blog/${post.slug}`,
         lastModified: post.updatedAt,
         changeFrequency: "monthly",
       })),
     ];
   }
   ```

---

### 0.2 CMS Setup para Contenido

**Objetivo:** Sistema de gestión de contenido flexible y SEO-friendly

#### Opciones y Recomendación:

**Opción A: Contentful (Recomendada)**

- Headless CMS robusto
- API GraphQL/REST
- Preview mode nativo
- Gestión de assets optimizada
- Webhooks para rebuild automático

**Opción B: Sanity**

- Más flexible y customizable
- Studio en React
- GROQ queries poderosas
- Real-time collaboration

**Opción C: Supabase Tables**

- Ya estás usando Supabase
- Sin costo adicional
- Menor overhead
- Menos features out-of-the-box

#### Implementación con Contentful:

```typescript
// Modelos de contenido:

1. Blog Post
   - title (Short text)
   - slug (Short text, unique)
   - excerpt (Long text)
   - content (Rich text)
   - featuredImage (Media)
   - author (Reference to Author)
   - category (Reference to Category)
   - tags (Array of Short text)
   - publishedAt (Date)
   - metaTitle (Short text)
   - metaDescription (Long text)
   - readingTime (Number)

2. Landing Page
   - title
   - slug
   - sections (Array of References)
   - seo (Reference to SEO metadata)

3. Guide/Tutorial
   - Similar a Blog Post + difficulty level + steps

4. Case Study
   - company
   - industry
   - challenge
   - solution
   - results (Array)
   - metrics (Array)

5. FAQ
   - question
   - answer
   - category
```

---

### 0.3 Estrategia de Contenido SEO

**Objetivo:** Ranking para keywords de alto valor comercial

#### Research de Keywords:

```
Primarias (High Intent):
- "firma electrónica chile" [590/mes, KD: 42]
- "firmar documentos online" [480/mes, KD: 38]
- "notaría digital" [320/mes, KD: 35]
- "verificación de identidad online" [210/mes, KD: 40]
- "chatbot con IA para empresas" [180/mes, KD: 45] ← NUEVO
- "revisión automática de contratos" [120/mes, KD: 38] ← NUEVO

Secundarias (Medium Intent):
- "cómo firmar un pdf" [1200/mes, KD: 25]
- "qué es firma electrónica avanzada" [390/mes, KD: 28]
- "documentos notariales digitales" [170/mes, KD: 30]
- "asistente virtual inteligente" [850/mes, KD: 40] ← NUEVO
- "IA para revisar documentos legales" [90/mes, KD: 35] ← NUEVO

Long-tail (High Conversion):
- "mejor software firma electrónica empresas" [90/mes, KD: 22]
- "firma electrónica con validez legal chile" [110/mes, KD: 26]
- "automatizar firma de contratos" [50/mes, KD: 18]
- "chatbot IA atención al cliente 24/7" [70/mes, KD: 30] ← NUEVO
- "software IA revisar contratos" [60/mes, KD: 28] ← NUEVO

Informational (Top of Funnel):
- "tipos de firma electrónica" [820/mes, KD: 20]
- "diferencia firma digital y electrónica" [590/mes, KD: 22]
- "requisitos firma electrónica" [280/mes, KD: 24]
- "cómo funciona un chatbot con IA" [620/mes, KD: 22] ← NUEVO
- "IA para análisis de documentos" [340/mes, KD: 25] ← NUEVO
```

#### Content Clusters:

**Cluster 1: Firma Electrónica (Pillar)**

```
Pillar: "Guía Completa de Firma Electrónica en Chile 2025"
Supporting content:
- "Tipos de Firma Electrónica: Simple, Avanzada y Cualificada"
- "Firma Electrónica vs Firma Digital: Diferencias y Similitudes"
- "Marco Legal de la Firma Electrónica en Chile"
- "Cómo Implementar Firma Electrónica en tu Empresa"
- "Casos de Uso: 15 Documentos que Puedes Firmar Digitalmente"
- "Seguridad en Firmas Electrónicas: Todo lo que Debes Saber"
```

**Cluster 2: Verificación de Identidad (Pillar)**

```
Pillar: "Verificación de Identidad Digital: Guía 2025"
Supporting content:
- "KYC Digital: Qué es y Por Qué es Importante"
- "Verificación Biométrica: Tecnología y Casos de Uso"
- "Onboarding Digital Seguro para Clientes"
- "Regulaciones de Verificación de Identidad en LATAM"
```

**Cluster 3: Notaría Digital (Pillar)**

```
Pillar: "Notaría Digital en Chile: El Futuro es Hoy"
Supporting content:
- "Documentos que Puedes Notarizar Online"
- "Validez Legal de Documentos Notarizados Digitalmente"
- "Proceso de Notarización Digital Paso a Paso"
- "Notaría Tradicional vs Notaría Digital: Comparativa"
```

**Cluster 4: IA para Atención al Cliente (Pillar)** ← NUEVO

```
Pillar: "Chatbots con IA: La Revolución en Atención al Cliente 2025"
Supporting content:
- "Cómo Implementar un Chatbot con IA en tu Empresa"
- "Chatbot vs Asistente Virtual: Diferencias y Ventajas"
- "ROI de un Chatbot: Cuánto Ahorras en Atención al Cliente"
- "Casos de Éxito: Empresas que Mejoraron su Atención con IA"
- "Chatbots en Chile: Marco Legal y Mejores Prácticas"
- "Integrar Chatbot IA con WhatsApp Business"
```

**Cluster 5: IA para Revisión de Documentos (Pillar)** ← NUEVO

```
Pillar: "IA para Análisis de Documentos: Guía Completa 2025"
Supporting content:
- "Cómo la IA Revoluciona la Revisión de Contratos"
- "Análisis Automático de Contratos: Ahorro de Tiempo y Dinero"
- "Red Flags en Contratos: Cómo la IA las Detecta"
- "IA vs Abogado: Cuándo Usar Cada Uno"
- "Compliance Automatizado con IA"
- "Extracción de Datos de Documentos con IA"
```

#### Calendario Editorial (Primeras 16 semanas):

```
Semana 1-2:
- Pillar article: Firma Electrónica (5000+ palabras)
- Blog: "5 Razones para Digitalizar tu Proceso de Firmas"
- Guía: "Cómo Firmar un PDF Gratis en 2025"

Semana 3-4:
- Supporting: "Tipos de Firma Electrónica"
- Blog: "Casos de Éxito: Empresa X Redujo Tiempos en 80%"
- Comparativa: "Top 5 Software de Firma Electrónica"

Semana 5-6:
- Supporting: "Marco Legal Firma Electrónica Chile"
- Blog: "Errores Comunes al Implementar Firma Digital"
- Tutorial: "Integrar Firma Electrónica en tu CRM"

Semana 7-8:
- Pillar article: Verificación de Identidad (4000+ palabras)
- Supporting: "KYC Digital para FinTech"
- Case Study: Cliente real (anonimizado)

Semana 9-10:
- Supporting: "Verificación Biométrica Explicada"
- Blog: "Tendencias en IdentityTech 2025"
- Infografía: "Proceso de Verificación en 4 Pasos"

Semana 11-12:
- Pillar article: Notaría Digital (4500+ palabras)
- Supporting: "Documentos Notarizables Online"
- Comparativa: "Notaría Digital vs Tradicional"

Semana 13-14: ← NUEVO
- Pillar article: Chatbots con IA (5000+ palabras)
- Supporting: "Cómo Implementar un Chatbot con IA"
- Blog: "ROI de Chatbots: Casos Reales con Números"

Semana 15-16: ← NUEVO
- Pillar article: IA para Análisis de Documentos (4500+ palabras)
- Supporting: "Cómo la IA Revoluciona Revisión de Contratos"
- Tutorial: "Análisis Automático de Contratos Paso a Paso"
```

---

### 0.4 Landing Pages Optimizadas

**Objetivo:** Conversión de tráfico en leads

#### Landing Pages a Crear:

**1. Homepage (`/`)**

```
Estructura:
- Hero: Value prop clara + CTA principal
- Social proof: Logos clientes + testimonios
- Features: 5-6 beneficios principales (incluir IA)
- How it works: 3 pasos simples
- Use cases: Tabs con diferentes industrias
- Pricing preview: Link a página de precios
- FAQ accordion
- Final CTA: "Empieza Gratis"

SEO:
- Meta title: "TuPatrimonio - Firma Electrónica, IA y Verificación Digital | Chile"
- Meta desc: "Firma documentos online, chatbot IA 24/7, revisión automática de contratos. Verificación biométrica. Prueba gratis 30 días. +500 empresas confían."
- H1: "Digitaliza tus Procesos con IA: Firmas, Verificación y Más"
```

**2. Landing: Firmas Electrónicas (`/firmas-electronicas`)**

```
Enfoque: SEO-optimizada para "firma electrónica"
Estructura:
- Hero específico para firmas
- Comparativa de tipos de firma
- Casos de uso específicos
- Integraciones disponibles
- Calculadora de ROI
- Testimonios de clientes
- FAQ específico de firmas
- CTA: "Prueba Firmas Electrónicas Gratis"

Content additions:
- Video explicativo (hosted en YouTube para SEO)
- Infografía descargable (lead magnet)
- Checklist PDF: "10 Pasos para Digitalizar Firmas"
```

**3. Landing: Verificación de Identidad (`/verificacion-identidad`)**

```
Enfoque: Para compliance officers y fintechs
Keywords: "verificación de identidad", "KYC digital", "onboarding digital"
Estructura similar pero enfocada en:
- Compliance y regulaciones
- Velocidad de verificación
- Tasa de aprobación
- Prevención de fraude
```

**4. Landing: Notaría Digital (`/notaria-digital`)**

```
Enfoque: Disruption del modelo tradicional
Estructura:
- Ahorro de tiempo y dinero vs notaría tradicional
- Documentos soportados
- Validez legal
- Proceso paso a paso
- Comparativa de precios
```

**5. Landing: Asistente IA (`/asistente-ia`)** ← NUEVO

```
Enfoque: Automatización de atención al cliente
Keywords: "chatbot con IA", "asistente virtual inteligente", "atención 24/7"

Estructura:
- Hero: "Atiende a tus Clientes 24/7 con IA"
- Pain points: Costos de soporte, tiempos de respuesta
- Solution: Chatbot que aprende de tu negocio
- Features específicas:
  * Respuestas instantáneas
  * Aprende de tu documentación
  * Múltiples canales (web, WhatsApp, Slack)
  * Escalamiento a humanos cuando necesario
  * Analytics de conversaciones
- Demo interactivo: Widget de chat funcionando
- Pricing específico: Por conversación o flat fee
- ROI calculator: "Cuánto ahorrarás en soporte"
- Casos de uso por industria
- Testimonios con métricas (% reducción tickets)
- FAQ sobre implementación
- CTA: "Prueba el Asistente IA Gratis"

Content additions:
- Video: "Configura tu Chatbot en 10 Minutos"
- Whitepaper: "El Futuro de la Atención al Cliente con IA"
- Template: "Knowledge Base para Entrenar tu Chatbot"
```

**6. Landing: Revisión Documentos IA (`/revision-documentos-ia`)** ← NUEVO

```
Enfoque: Automatización de análisis legal/contractual
Keywords: "revisión automática contratos", "IA análisis documentos", "compliance automatizado"

Estructura:
- Hero: "Analiza Contratos en Minutos, No en Horas"
- Pain points: Costos de abogados, tiempo de revisión, errores humanos
- Solution: IA que detecta riesgos y extrae datos clave
- Features específicas:
  * Detección de red flags
  * Extracción de cláusulas clave
  * Análisis de riesgo automatizado
  * Comparación de versiones
  * Compliance checks
  * Reportes ejecutivos
- Demo visual: Documento antes/después con anotaciones
- Tipos de documentos soportados
- Pricing: Por documento o suscripción mensual
- Precisión y confiabilidad (% de exactitud)
- Seguridad y confidencialidad
- Casos de uso:
  * Equipos legales
  * Procurement
  * Real estate
  * Startups
- Comparativa: "IA + Abogado vs Solo Abogado"
- Testimonios con tiempo ahorrado
- FAQ sobre precisión y limitaciones
- CTA: "Analiza tu Primer Contrato Gratis"

Content additions:
- Video: "Cómo la IA Revisa un Contrato Paso a Paso"
- eBook: "Guía de Red Flags en Contratos Comerciales"
- Checklist: "Qué Revisar en un Contrato de SaaS"
```

**7. Página de Precios (`/precios`)**

```
Estructura:
- Tabla comparativa de planes
- Toggle: Mensual/Anual (con descuento)
- NUEVO: Tabs por servicio (Firmas, IA Chat, IA Review, etc.)
- Calculator: Estimar costo según uso
- FAQ sobre facturación
- CTA por plan
- Opción "Hablar con Ventas" para Enterprise

Pricing IA Services:
- Chatbot IA:
  * Starter: 100 conversaciones/mes - $29/mes
  * Pro: 1,000 conversaciones/mes - $199/mes
  * Enterprise: Ilimitado - Custom
  
- Revisión IA:
  * Pay as you go: $5 por documento
  * Plan 50: 50 documentos/mes - $199/mes
  * Plan 200: 200 documentos/mes - $599/mes
  * Enterprise: Volumen - Custom

SEO considerations:
- Schema markup para Offers
- Comparativa con competidores
- Transparencia de precios (good for SEO)
```

---

### 0.5 Blog SEO-Optimizado

**Objetivo:** Motor de contenido para SEO de largo plazo

#### Features del Blog:

1. **Arquitectura**
   ```
   /blog
   ├── / (index con posts recientes)
   ├── /[slug] (post individual)
   ├── /categoria/[slug] (archive por categoría)
   ├── /autor/[slug] (archive por autor)
   └── /tag/[slug] (archive por tag)
   ```

2. **Categorías Principales**
   ```
   - Firma Electrónica
   - Verificación de Identidad
   - Notaría Digital
   - Inteligencia Artificial ← NUEVO
   - Automatización ← NUEVO
   - Compliance
   - Casos de Éxito
   - Guías y Tutoriales
   - Noticias del Sector
   ```

3. **Features SEO del Blog**
   ```typescript
   - Breadcrumbs con schema markup
   - Related posts (interno linking)
   - Reading time estimate
   - Social sharing buttons
   - Author bio con links
   - Table of contents (para posts largos)
   - Code syntax highlighting (para tutoriales técnicos)
   - Download resources (PDFs, templates)
   - Interactive demos (para posts de IA)
   ```

4. **Template de Blog Post Optimizado**
   ```
   - Meta title: "[Keyword] - Guía [Año] | TuPatrimonio"
   - Meta description: 150-160 chars con keyword
   - H1: Keyword principal
   - Featured image: Alt text optimizado, 1200x630px
   - Intro: Responde la pregunta inmediatamente (para featured snippet)
   - H2s con keywords relacionadas
   - H3s para subsecciones
   - Internal links: Mínimo 3-5 por post
   - External links: 2-3 a fuentes autoritativas
   - CTA: Mid-content + al final
   - Schema: Article + Author + Organization
   ```

---

### 0.6 Optimización para AEO/GEO (AI Engine Optimization)

**Objetivo:** Aparecer en respuestas de ChatGPT, Perplexity, Gemini, Claude

#### Estrategias:

1. **Structured FAQ Pages**
   ```
   Crear páginas FAQ específicas con schema FAQPage:
   - "Preguntas Frecuentes sobre Firma Electrónica"
   - "FAQ: Verificación de Identidad Digital"
   - "FAQ: Chatbots con Inteligencia Artificial" ← NUEVO
   - "FAQ: Revisión Automática de Contratos con IA" ← NUEVO

   Las IA's priorizan contenido estructurado en Q&A format
   ```

2. **Authoritative Content Signals**
   ```
   - Citar fuentes legales oficiales
   - Referencias a papers de IA (OpenAI, Anthropic)
   - Incluir fechas de actualización
   - Mostrar expertise: bio de autores con credenciales
   - Enlaces a legislación chilena (.gob.cl)
   - Estudios de caso con datos verificables
   ```

3. **Clear, Direct Answers**
   ```
   Formato preferido por IA's:
   - Primera oración responde directamente
   - Párrafo expandido con contexto
   - Lista de pasos o bullets
   - Ejemplo práctico

   Ejemplo:
   "¿Qué tan precisa es la IA en revisar contratos?

   Los sistemas de IA para revisión de contratos alcanzan una 
   precisión del 85-95% en la detección de cláusulas estándar 
   y red flags comunes, según estudios de 2024.

   Factores que afectan la precisión:
   - Calidad del entrenamiento del modelo
   - Tipo de contrato (estandarizado vs personalizado)
   - Complejidad del lenguaje legal
   - Idioma del documento

   En TuPatrimonio utilizamos Claude 3.5 Sonnet para análisis 
   legal, logrando 92% de precisión en contratos comerciales 
   estándar..."
   ```

4. **Knowledge Panels**
   ```
   Optimizar para Google Knowledge Graph:
   - Consistent NAP (Name, Address, Phone)
   - Wikidata entry (crear/editar)
   - Crunchbase profile
   - LinkedIn company page completo
   - Wikipedia entry (si calificas)
   ```

5. **Entities y Topical Authority**
   ```
   - Usar consistently términos técnicos correctos
   - Crear glosario de términos (incluir términos de IA)
   - Link interno entre términos relacionados
   - Cubrir exhaustivamente cada subtopic
   - Definir claramente: Machine Learning, NLP, LLM, RAG, etc.
   ```

---

### 0.7 Technical SEO Checklist

**Objetivo:** Foundation técnica impecable

#### Implementar:

1. **Core Web Vitals (Netlify Automático)**
   ```
   // Netlify optimiza automáticamente:
   - LCP: Image optimization + CDN
   - FID: Code splitting óptimo
   - CLS: Layout optimization

   // Solo monitorear con Lighthouse
   ```

2. **Mobile-First**
   ```
   - Responsive design
   - Touch targets > 48px
   - Readable font sizes (16px mínimo)
   - No horizontal scroll
   - Mobile usability en Search Console
   ```

3. **Indexación**
   ```
   - Sitemap XML automático
   - robots.txt optimizado
   - Canonical URLs
   - Hreflang tags (si multi-región)
   - Noindex en páginas de admin/login
   ```

4. **Security**
   ```
   - HTTPS everywhere
   - Security headers (CSP, HSTS, etc.)
   - No mixed content
   ```

5. **Structured Data Testing**
   ```
   - Validar con Google Rich Results Test
   - Testing con schema.org validator
   - Monitoring en Search Console
   ```

---

### 0.8 Link Building Strategy

**Objetivo:** Authority building mientras desarrollas

#### Tácticas:

1. **Digital PR**
   ```
   - Press release sobre el lanzamiento (enfatizar IA)
   - Pitch a TechCrunch LATAM, Contxto, otros
   - Entrevistas en podcasts del sector (legaltech + AI)
   ```

2. **Guest Posting**
   ```
   Target sites:
   - Blogs de legaltech
   - Publicaciones de transformación digital
   - Blogs de SaaS B2B
   - Blogs de IA y automatización ← NUEVO

   Pitch examples:
   - "5 Formas en que la Firma Digital Acelera Ventas"
   - "Cómo la IA Reduce Costos de Atención al Cliente en 60%" ← NUEVO
   - "El Futuro del Análisis de Contratos: IA vs Humanos" ← NUEVO
   ```

3. **Resource Link Building**
   ```
   Crear recursos linkables:
   - "Estado de la Digitalización en Chile 2025" (report con data)
   - "Benchmark: IA en Atención al Cliente LATAM 2025" ← NUEVO
   - Infografías compartibles
   - Calculadoras interactivas (ROI firma, ROI chatbot, ahorro revisión contratos)
   - Templates gratuitos (contrato de NDA para firma)
   - "Prompts para Análisis de Contratos con IA" (recurso único) ← NUEVO
   ```

4. **Partnerships**
   ```
   - Co-marketing con SaaS complementarios (CRM, ERP)
   - Integraciones mencionadas en sus blogs
   - Webinars conjuntos
   - Partners de IA (OpenAI, Anthropic - si aplica)
   ```

5. **Local SEO (si aplica)**
   ```
   - Google Business Profile
   - Directorios de startups chilenas
   - Listados en marketplaces de software
   - Listados en directorios de AI tools ← NUEVO
   ```

---

### 0.9 Analytics y Tracking - ✅ **COMPLETADO (28 Oct 2025)**

**Objetivo:** Medir todo desde día 1

#### Setup:

1. **✅ Google Analytics 4 - IMPLEMENTADO EN AMBAS APPS**

   **Marketing App (tupatrimonio.app):**
   - ✅ GA4 configurado y funcionando
   - ✅ Tracking de eventos: page_view, click_cta, scroll_depth
   - ✅ Eventos de formularios: form_start, form_submit
   - ✅ Eventos de blog: blog_read, navigation_click
   - ✅ ID de medición configurado en variables de entorno

   **Web App (app.tupatrimonio.app):**
   - ✅ GA4 configurado con propiedad separada (G-HKK7H001DB)
   - ✅ Componente GoogleAnalytics.tsx creado
   - ✅ Librería analytics.ts type-safe implementada
   - ✅ Eventos comunes: cta_click, form_submit, navigation_click,
     external_link_click
   - ✅ Eventos específicos de app web implementados:
     ```typescript
     // Autenticación
     -user_login,
       user_logout -
       // Dashboard
       dashboard_view -
       // Documentos
       document_created,
       document_updated,
       document_deleted -
       // Firmas
       signature_requested,
       signature_completed -
       // Verificación
       verification_started,
       verification_completed -
       // Perfil y Pagos
       profile_updated,
       payment_initiated,
       payment_completed;
     ```
   - ✅ Configuración de variables de entorno para Vercel
   - ✅ Solo funciona en producción (NODE_ENV=production)
   - ✅ Logs en desarrollo para debugging

   **Ventajas de Propiedades Separadas:**
   - Métricas específicas por aplicación
   - Análisis independiente de marketing vs producto
   - Embudos de conversión diferenciados
   - Mejor segmentación de audiencias

2. **✅ Google Search Console - COMPLETADO (27 Oct 2025)**
   - ✅ Propiedad verificada
   - ✅ Sitemap enviado
   - ✅ Monitoreo de coverage activo
   - ✅ Tracking de rankings iniciado

3. **📋 Hotjar / Microsoft Clarity - PENDIENTE**
   ```
   - Heatmaps
   - Session recordings
   - Surveys / feedback polls
   - Focus en landing pages de IA
   ```

4. **📋 SEO Monitoring - PARCIAL**
   ```
   Tools implementados:
   ✅ Google Search Console: Performance

   Tools pendientes:
   - Ahrefs / SEMrush: Keyword tracking
   - Screaming Frog: Technical audits

   KPIs a trackear semanalmente:
   - Organic traffic
   - Keyword rankings (top 20)
   - Backlinks (nuevos y perdidos)
   - Domain Authority
   - Indexed pages
   - CTR por keyword
   ```

---

### 0.10 Conversion Optimization

**Objetivo:** Maximizar conversión de tráfico orgánico

#### Implementar:

1. **Lead Magnets**
   ```
   General:
   - eBook: "Guía Completa de Digitalización de Documentos"
   - Checklist: "Cómo Elegir Software de Firma Electrónica"
   - Template: "Contrato de Confidencialidad para Firmar"
   - Webinar: "Demostración en Vivo de Firma Electrónica"

   IA-específicos: ← NUEVO
   - eBook: "Implementar IA en tu Empresa: Guía Práctica 2025"
   - Template: "100 Prompts para Entrenar tu Chatbot"
   - Checklist: "Red Flags en Contratos: Qué Buscar"
   - Webinar: "IA para Análisis de Contratos: Demo en Vivo"
   - Calculator: "ROI de Automatizar Atención con IA"
   ```

2. **CTAs Estratégicos**
   ```
   Primary CTA: "Empieza Gratis" (no credit card required)
   Secondary CTA: "Ver Demo" (video o calendario)
   Tertiary CTA: "Hablar con Ventas"

   IA-specific CTAs: ← NUEVO
   - "Prueba el Chatbot IA"
   - "Analiza un Contrato Gratis"
   - "Ver Demo Interactiva"

   Placement:
   - Above the fold
   - Después de cada value prop
   - Al final de blog posts
   - Sticky bar (no intrusivo)
   - Exit intent popup (A/B test)
   ```

3. **Social Proof**
   ```
   - Logos de clientes (con permiso)
   - Testimonios con foto y empresa
   - Reviews de G2/Capterra (embedded)
   - Contador de usuarios/documentos firmados
   - Trust badges (certificaciones, seguridad)
   - Métricas de IA: "X conversaciones atendidas", "X contratos analizados"
   ```

4. **Forms Optimization**
   ```
   Signup form:
   - Minimal fields: Email, Nombre, Empresa
   - Progressive profiling (pedir más después)
   - Single column layout
   - Clear value prop sobre el form
   - Privacy assurance

   Demo request (para IA services):
   - Email, Nombre, Empresa, Tamaño empresa
   - "¿Qué te interesa?" → Multiple select
   ```

5. **Interactive Demos** ← NUEVO
   ```
   - Widget de chatbot funcionando en landing
   - Upload documento sample → ver análisis IA
   - Calculadoras interactivas
   - Comparison tools interactivos
   ```

---

### 0.11 Deliverables de Fase 0

**Al finalizar la Fase 0 tendrás:**

✅ **Marketing Website Live:**

- Homepage
- 5 Landing pages específicas (firmas, verificación, notaría, chatbot IA,
  revisión IA)
- Página de precios (con pricing de servicios IA)
- Sección legal (términos, privacidad)

✅ **Blog Operacional:**

- ✅ 10-15 posts publicados (COMPLETADO Nov 2025)
- 2 pillar articles (1 puede ser sobre IA)
- ✅ CMS configurado
- Pipeline de contenido para 4 meses

✅ **SEO Foundation:**

- Technical SEO impecable (Lighthouse > 95)
- Schema markup implementado
- Analytics y tracking completo
- Google Search Console configurado

✅ **Content Assets:**

- 3-4 lead magnets (eBooks, templates, incluir 1-2 de IA)
- 2 calculadoras interactivas (ROI firma + ROI chatbot)
- Biblioteca de recursos iniciada

✅ **Early Traction:**

- 50-100 visitas orgánicas diarias (optimista)
- 15-25 signups para early access
- Rankings top 20 para 5-7 keywords (incluir keywords IA)
- 5-10 backlinks de calidad

---

### 0.12 Métricas de Éxito para Fase 0

**Semana 4 (fin de fase):**

- ✅ Website live y sin errores técnicos
- ✅ 100% pages indexed en Google
- ✅ Lighthouse score > 90 en todas las páginas
- ✅ 10-15 blog posts publicados (COMPLETADO Nov 2025)
- ✅ 50+ organic visits (cualquier cantidad es inicio)
- ✅ Landing pages de IA con demos funcionales

**Mes 3 (mientras desarrollas Fase 1-2):**

- [ ] 500+ organic visits/mes
- [ ] Rankings top 10 para 3-4 long-tail keywords
- [ ] 100+ signups para waitlist
- [ ] 10+ backlinks de DA > 30
- [ ] 2-3 keywords de IA rankeando top 20

**Mes 6 (mientras desarrollas Fase 3-5):**

- [ ] 2,000+ organic visits/mes
- [ ] Rankings top 5 para keyword principal
- [ ] 500+ waitlist
- [ ] Featured snippet para 1+ query
- [ ] 30+ backlinks de calidad
- [ ] Keywords de IA rankeando top 10

---

## 🌐 **FASE 0: Marketing Web + SEO Foundation (Semanas 1-4)** - **INICIANDO** 🚀

### **Objetivo:** Establecer presencia digital y SEO foundation mientras desarrollamos el backend

**¿Por qué Fase 0 primero?**

1. **SEO toma 3-6 meses** en mostrar resultados
2. **Genera tráfico orgánico** mientras desarrollas el backend
3. **Valida messaging** y value proposition
4. **Construye waitlist** de early adopters
5. **$0 en herramientas adicionales** (usa Supabase existente)

### 0.1 **Implementación Híbrida: Supabase + Hardcodeado**

**Decisión Arquitectónica:**

- **Landing Pages**: Hardcodeadas (performance + SEO óptimo)
- **Blog**: Supabase tables (dinámico, $0 extra cost)
- **Sin CMS externo**: Speed to market + control total

```sql
-- Blog table en Supabase
CREATE TABLE blog_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  content TEXT NOT NULL,
  excerpt TEXT,
  category TEXT,
  published BOOLEAN DEFAULT false,
  published_at TIMESTAMPTZ DEFAULT NOW(),
  seo_title TEXT,
  seo_description TEXT
);
```

### 0.2 **Landing Pages a Crear (Hardcodeadas)**

1. **Homepage** (`/`) - Value proposition + servicios + CTA
2. **Firmas Electrónicas** (`/firmas-electronicas`) - SEO keyword: "firma
   electrónica chile"
3. **Verificación Identidad** (`/verificacion-identidad`) - Para
   compliance/fintechs
4. **Notaría Digital** (`/notaria-digital`) - Disruption modelo tradicional
5. **Precios** (`/precios`) - Planes B2C/B2B diferenciados
6. **Legal** (`/legal/*`) - Términos, privacidad, cookies

### 0.3 **Blog Operacional (Supabase)**

```
Estructura:
/blog - Index con posts recientes
/blog/[slug] - Post individual  
/blog/categoria/[categoria] - Archive por categoría

Categorías iniciales:
- Firma Electrónica
- Verificación de Identidad  
- Notaría Digital
- Compliance
- Guías y Tutoriales
```

### 0.4 **SEO Foundation**

- Metadata API configurada
- Structured data (Schema.org JSON-LD)
- Sitemap XML dinámico (incluye posts de Supabase)
- OpenGraph + Twitter Cards
- Performance optimization (automático con Netlify)

### 0.5 **Timeline Fase 0 (3 semanas)**

```
Semana 1: Structure + Landing Pages
- Monorepo setup
- Homepage + 3 landing principales
- SEO básico

Semana 2: Blog + Content  
- Blog con Supabase
- 5-6 posts iniciales
- Structured data

Semana 3: Deploy + Analytics
- Netlify deploy
- DNS tupatrimonio.app
- Analytics + forms

Al completar Fase 0:
✅ Marketing site live
✅ 6 landing pages SEO-optimizadas 
✅ Blog operacional
✅ Foundation para tráfico orgánico
✅ Waitlist funcionando
```

---

## 🏗️ Fase 1: Fundación (Semanas 5-8) - **EN PROGRESO** ✅

**Nota:** Esta fase comenzó en semana 5. **Admin Panel Core completado en Nov
21, 2025.**

### 📊 **Estado Actual del Proyecto (21 Noviembre 2025):**

#### ✅ **COMPLETADO (Oct 2025):**

- ✅ Proyecto Supabase configurado y funcionando
- ✅ **Migración 1**: `20251021120052_enable-pgvector.sql`
  - pgvector extension habilitado para servicios de IA
  - Preparado para embeddings de chatbot y análisis de documentos

- ✅ **Migración 2**: `20251021120854_schema-core.sql` - **FOUNDATION COMPLETA**
  - 📊 **13 tablas principales** implementadas
  - 🏢 **Multi-tenancy nativo**: organizations como partición principal
  - 👥 **Sistema de usuarios**: Integración con Supabase Auth + perfiles
    extendidos
  - 🛡️ **Roles jerárquicos**: Con permisos JSONB flexibles
  - 🔗 **Relaciones M:N**: organization_users con roles por organización
  - 👨‍👩‍👧‍👦 **Equipos**: Colaboración interna en organizaciones
  - 🎯 **Ecosistema de apps**: Sistema para habilitar servicios por organización
  - 💳 **Suscripciones**: Base completa para monetización con Stripe
  - 📧 **Invitaciones**: Sistema de invitaciones con tokens y expiración
  - 🔑 **API Keys**: Claves hasheadas con scopes y rate limiting
  - 📝 **Audit trail**: system_events para trazabilidad completa
  - ⚡ **Performance**: 20+ índices optimizados + triggers automáticos
  - 🛡️ **Validaciones**: Constraints robustos + ENUMs consistentes
  - 📚 **Documentación**: Comentarios completos en todas las tablas

- ✅ **Migración 3**: `20251021194734_schema-marketing.sql` - **MARKETING
  FOUNDATION COMPLETA**
  - 🌐 **8 tablas marketing**: blog_posts, categories, waitlist, contact, faqs,
    testimonials, newsletter, case_studies
  - 📝 **Blog dinámico**: Sistema completo con categorías y SEO
  - 📧 **Lead capture**: Formularios de waitlist y contacto preparados
  - 🏆 **Social proof**: Testimonials con ratings y gestión
  - 📊 **Analytics ready**: Tracking de engagement y métricas
  - 🛡️ **RLS policies**: Seguridad pública para lectura, autenticado para
    gestión
  - ⚡ **Performance**: 20+ índices optimizados para marketing queries

#### ✅ **COMPLETADO - ADMIN PANEL CORE (Nov 21, 2025):**

- ✅ **9 Migraciones de RLS y Admin Panel**: `20251121000000` - `20251121000008`
  - 🔐 **Solución recursión infinita RLS**: RLS deshabilitado en
    `organization_users`
  - 🛡️ **Sistema de bypass**: Tabla `_bypass.platform_admins` sin RLS
  - ⚡ **Función bypass**: `is_platform_super_admin_bypass()` evita recursión
  - 🔑 **SECURITY DEFINER**: Triggers de folders con permisos de superusuario
  - 📁 **RLS folders CRM**: Políticas para platform admins
  - ✅ **Testing exitoso**: Creación de organizaciones funcionando
  - 🎯 **15+ páginas admin**: Organizaciones, usuarios, teams, invitaciones, API
    keys
  - 🧩 **20+ componentes UI**: Formularios, acciones, badges, estados
  - ⚙️ **12+ server actions**: CRUD completo con validaciones de seguridad
  - 📊 **Sidebar admin completo**: 3 secciones organizadas (Principal, Apps,
    Sistema)
  - 🔒 **Arquitectura de seguridad**: Multi-capa con verificaciones en cada
    acción
  - ✨ **Production ready**: Sistema probado en navegador con casos reales

#### 🔄 **FASE 0: Marketing Web + SEO Foundation** - **EN PROGRESO**

- ✅ **Schema marketing completo CREADO** (21 Oct 2025)
  - 8 tablas implementadas: blog_posts, categories, waitlist, contact, faqs,
    testimonials, newsletter, case_studies
  - RLS policies, índices optimizados, datos iniciales
  - Lead capture y social proof preparados
- ✅ **Monorepo estructura COMPLETADA** (21 Oct 2025)
  - apps/web: Aplicación principal migrada
  - apps/marketing: Nueva aplicación para marketing site
  - Workspaces configurados, Next.js 14+, Shadcn/UI
- ✅ **Marketing site foundation COMPLETADO** (21 Oct 2025)
  - Homepage con hero, servicios, social proof y CTAs
  - Landing page firmas-electronicas (ejemplo SEO-optimizado)
  - Blog dinámico funcionando con Supabase
  - Sitemap dinámico + robots.txt
  - Servidor ejecutándose en puerto 3001
- ✅ **Build y deploy preparation COMPLETADO** (21 Oct 2025)
  - ✅ Errores ESLint corregidos (comillas escapadas, imports, tipos)
  - ✅ Error updateProfile en web app solucionado
  - ✅ next.config.ts configurado para ignorar ESLint durante build
  - ✅ Builds locales funcionando: Marketing ✓ Web ✓
  - ✅ Apps listas para deploy en Netlify
- ✅ **Deploy a Vercel COMPLETADO** (21 Oct 2025)
  - ✅ Marketing site deployado exitosamente
  - ✅ Web app deployada exitosamente
  - ✅ Monorepo funcionando en producción
  - ✅ Build commands y publish directories configurados correctamente
  - ✅ Variables de entorno configuradas
  - ✅ **Ambas apps live en Vercel** 🚀
- ✅ **Estructura Internacional COMPLETADA** (22 Oct 2025)
  - ✅ Reestructuración por países: /cl/, /co/, /mx/
  - ✅ Content Chile migrado a /cl/ con legislación local
  - ✅ Páginas Colombia y México (próximamente) creadas
  - ✅ Redirects automáticos con detección de país
  - ✅ Sitemap actualizado para SEO internacional
  - ✅ Hreflang y metadata por país configurados
  - ✅ **Marketing site preparado para expansión LATAM** 🌎
- ✅ **Formularios Lead Capture COMPLETADOS** (22 Oct 2025)
  - ✅ WaitlistForm component conectado a marketing.waitlist_subscribers
  - ✅ ContactForm component conectado a marketing.contact_messages
  - ✅ Formularios integrados en páginas Colombia y México
  - ✅ Página de contacto específica para Chile (/cl/contacto)
  - ✅ Tracking por país y fuente de leads
  - ✅ **Lead capture funcionando en producción** 📧
- ✅ **Sistema de Storage para Imágenes del Blog COMPLETADO** (24 Oct 2025)
  - ✅ 6 buckets de storage públicos creados en Supabase
  - ✅ Políticas RLS configuradas (lectura pública, escritura autenticada)
  - ✅ Package @tupatrimonio/utils con helpers de imágenes
  - ✅ Integración en marketing app con blog-images.ts
  - ✅ Campos adicionales en BD (icon_url, content_images)
  - ✅ Placeholders SVG para fallbacks
  - ✅ Documentación completa en DEVELOPMENT.md
  - ✅ **Sistema completo de gestión de imágenes con optimización** 📸
- ✅ **Panel de Administración del Blog COMPLETADO** (25 Oct 2025)
  - ✅ Sistema de roles platform (super_admin + marketing_admin)
  - ✅ Organización "TuPatrimonio Platform" para equipo interno
  - ✅ Función is_platform_admin() en schema public (accesible vía RPC)
  - ✅ Políticas RLS restrictivas (solo platform admins gestionan contenido)
  - ✅ Permisos GRANT configurados correctamente (authenticated rol)
  - ✅ Constraints relajados para desarrollo (contenido min 10 chars)
  - ✅ Middleware de protección de rutas /admin
  - ✅ Página de login con autenticación Supabase
  - ✅ Dashboard con métricas en tiempo real
  - ✅ Lista de posts con tabla interactiva (ver, editar, eliminar)
  - ✅ Editor completo de posts (crear/editar) con Markdown
  - ✅ Upload de imágenes a Supabase Storage
  - ✅ Toggle publicar/borrador
  - ✅ Campos SEO completos (título, descripción)
  - ✅ Validaciones frontend completas
  - ✅ Gestión de categorías (visualización)
  - ✅ Galería de medios (copiar URL, eliminar)
  - ✅ Página de configuración del sistema
  - ✅ Actualizado a @supabase/ssr (versión recomendada)
  - ✅ Componentes Shadcn/UI con diseño TuPatrimonio
  - ✅ **Gestión completa del blog sin necesidad de Supabase Studio** 🎨
- ✅ **Migración Admin Blog a Web App COMPLETADA** (28 Oct 2025)
  - ✅ Admin del blog migrado de apps/marketing a apps/web/dashboard/blog
  - ✅ Hook useBlogManagement.ts centralizado en apps/web
  - ✅ Componentes admin: BlogPostsList, BlogPostEditor, CategoryManagement,
    MediaGallery
  - ✅ Rutas del dashboard: /dashboard/blog, /dashboard/blog/new,
    /dashboard/blog/[id]/edit
  - ✅ Gestión de categorías completa con colores y ordenamiento
  - ✅ Sistema de Storage con 6 buckets (blog-featured, blog-content, etc.)
  - ✅ Políticas RLS corregidas: admins ven TODO (borradores e inactivos)
  - ✅ **Administración centralizada en una sola app** 🎯
- ✅ **Sistema de Cálculo de Tiempo de Lectura MEJORADO** (28 Oct 2025)
  - ✅ Limpieza completa de sintaxis Markdown antes de contar palabras
  - ✅ Eliminación de bloques de código, imágenes, enlaces, encabezados
  - ✅ Cálculo basado en 200 palabras por minuto (estándar)
  - ✅ Actualización automática en tiempo real mientras se edita
  - ✅ Recálculo automático al cargar posts existentes
  - ✅ **Precisión mejorada del 60% en cálculo de tiempo de lectura** ⏱️
- ✅ **Sistema de Storage de Imágenes DOCUMENTADO** (28 Oct 2025)
  - ✅ 6 buckets en Supabase Storage: blog-featured (5MB), blog-content (3MB)
  - ✅ blog-categories (1MB), blog-authors (1MB), blog-thumbnails (2MB),
    blog-meta (2MB)
  - ✅ Políticas RLS: Lectura pública, escritura autenticada
  - ✅ Formatos soportados: JPG, PNG, WEBP, GIF (+ SVG en categories)
  - ✅ Nomenclatura de archivos: timestamp-random.extensión
  - ✅ URLs públicas automáticas vía CDN de Supabase
  - ✅ **Arquitectura de storage clara y escalable** 📦
- ✅ **Estructura de URLs del Blog Mejorada** (25 Oct 2025)
  - ✅ Nueva estructura SEO-friendly: `/blog/[category]/[slug]`
  - ✅ Posts sin categoría usan: `/blog/general/[slug]`
  - ✅ Slugs únicos globalmente (sin duplicados entre categorías)
  - ✅ URLs descriptivas con keyword de categoría
  - ✅ Sitemap actualizado con nueva estructura
  - ✅ Todos los links internos actualizados
  - ✅ Preview dinámico de URL en editor
  - ✅ **Mejor jerarquía de contenido para SEO** 🔗
- ✅ **Structured Data (Schema.org) COMPLETADO** (25 Oct 2025)
  - ✅ Organization schema en homepage
  - ✅ WebSite schema en homepage
  - ✅ Article schema en cada post del blog
  - ✅ BreadcrumbList en cada post del blog
  - ✅ Componente StructuredData reutilizable
  - ✅ Helpers para generar schemas automáticamente
  - ✅ Incluye: autor, fecha, imagen, tiempo de lectura, categoría, word count
  - ✅ URLs dinámicas con categoría en schemas
  - ✅ **Optimizado para Rich Results de Google** 🌟
- ✅ **Build de Producción Corregido** (25 Oct 2025)
  - ✅ Login page con Suspense boundary (fix para useSearchParams)
  - ✅ Sin errores de linting
  - ✅ Compatible con Netlify build process
  - ✅ **Listo para deploy en producción** 🚀
- ✅ **Favicons Personalizados COMPLETADOS** (27 Oct 2025)
  - ✅ Favicons diferenciados para marketing y web apps
  - ✅ Descargadas imágenes desde Supabase Storage (512x512px)
  - ✅ Generados múltiples formatos para soporte completo:
    - favicon.ico (32x32)
    - icon.png (32x32 para navegadores modernos)
    - apple-icon.png (180x180 para iOS)
  - ✅ Archivos colocados en apps/marketing/src/app/ y apps/web/src/app/
  - ✅ Metadata actualizada en ambos layout.tsx
  - ✅ Script automatizado con sharp para generación
  - ✅ **Branding visual completo en ambas aplicaciones** 🎨

#### ✅ **COMPLETADO - FASE 2: CRÉDITOS Y BILLING (Nov 22, 2025):**

- ✅ **Schemas credits + billing**: Completados y funcionando
- ✅ **Migraciones aplicadas**: 11 migraciones completas (incluye corrección
  numeración facturas)
- ✅ **Integraciones Stripe + dLocal**: Funcionando al 100%
- ✅ **Webhooks configurados**: Stripe y dLocal operativos
- ✅ **UI completa**: Todas las páginas de billing implementadas
- ✅ **Auto-recarga**: Con verificación automática
- ✅ **Notificaciones**: Sistema completo integrado
- ✅ **PDFs**: Generación de facturas funcionando
- ✅ **Testing**: Flujo completo probado exitosamente
- ✅ **Corrección numeración facturas** (Nov 24, 2025): Sistema por organización
  `{ORG_SLUG}-{NÚMERO}` implementado, eliminadas colisiones
- ✅ **Simplificación historial de pedidos** (Dic 1, 2025): Sistema de
  trazabilidad optimizado para mostrar solo eventos relevantes al cliente
  - ✅ **Migración de limpieza mejorada**:
    `20251201000004_improved_cleanup_order_history.sql`
    - Elimina eventos técnicos y duplicados por descripción específica
    - Deduplica eventos por cambio de estado (mantiene solo el más reciente)
    - Prioriza eventos `order_completed` sobre `status_changed` duplicados
    - Normaliza descripciones a formato amigable
  - ✅ **Mejoras en componente OrderTimeline.tsx**:
    - Filtrado mejorado por tipo y descripción de eventos
    - Función `deduplicateByStatus()` para eliminar duplicados en frontend
    - Filtrado de eventos técnicos: `invoice_created`, `payment_initiated`,
      `order_modified`
    - Filtrado de descripciones técnicas: "Pago exitoso vía...", "Factura
      creada", etc.
    - Resultado: Solo 3 eventos visibles para el cliente:
      1. "Tu pedido fue creado"
      2. "Pago confirmado"
      3. "Pedido completado exitosamente"

#### ✅ **COMPLETADO - SISTEMA DE OPERACIONES Y REEMBOLSOS (Dic 8, 2025):**

**🎯 Objetivo:** Reemplazar la combinación WordPress + Make.com + HubSpot con un
sistema interno propio para gestión de pedidos, operaciones y reembolsos.

**✅ FASE 1: PANEL DE OPERACIONES - COMPLETADO:**

- ✅ Vista centralizada para equipo de atención al cliente
- ✅ Lista de pedidos (`/admin/orders`) con filtros y paginación
- ✅ Detalle de pedidos (`/admin/orders/[id]`) con información completa
- ✅ Integración con sidebar admin
- ✅ Sistema de navegación y filtros funcional

**✅ FASE 2: PIPELINES CONFIGURABLES - COMPLETADO:**

- ✅ Schema `billing.order_pipeline_stages` creado
- ✅ Etapas globales por defecto:
  - Pendiente de Pago (pending_payment) - 🟡 Yellow
  - Pagado (paid) - 🔵 Blue
  - En Proceso (processing) - 🟠 Orange
  - Completado (completed) - 🟢 Green [FINAL]
  - Cancelado (cancelled) - ⚫ Gray [FINAL]
  - Reembolsado (refunded) - 🔴 Red [FINAL]
- ✅ Componente `OrderStatusSelector` para cambio manual de estado
- ✅ API route `/api/admin/orders/[id]/status` para actualización
- ✅ API route `/api/admin/orders/pipeline-stages` para obtener etapas
- ✅ Migración: `20251207000001_create_order_pipeline_stages.sql`

**✅ FASE 3: ANULACIONES Y REEMBOLSOS - COMPLETADO:**

- ✅ Schema `billing.refund_requests` creado con tipos:
  - `refund_destination`: payment_method, wallet
  - `refund_status`: pending, approved, processing, completed, rejected
- ✅ Integración Stripe Refunds API
  - Función `createStripeRefund()` en `lib/stripe/refunds.ts`
  - Manejo de errores y logging completo
- ✅ Integración Transbank Refunds
  - Función `createTransbankWebpayRefund()` para Webpay Plus
  - Función `createTransbankOneclickRefund()` para OneClick
  - Cliente Transbank extendido con métodos de reembolso
- ✅ Reembolso a Créditos/Monedero Digital
  - Función RPC `credits.add_refund_credits()` creada
  - Wrapper público `public.add_refund_credits()` para acceso desde API
  - Integración con sistema de créditos existente
- ✅ API route `/api/admin/orders/[id]/refund` unificada
  - Maneja reembolsos a tarjeta (Stripe/Transbank)
  - Maneja reembolsos a créditos/monedero
  - Actualización automática de estado de pedido
  - Logging completo de transacciones
- ✅ Componente `RefundModal` para UI de reembolsos
  - Selector de destino (tarjeta original o monedero)
  - Campo de razón y notas
  - Validaciones y manejo de errores
- ✅ Funciones RPC para evitar problemas con vistas:
  - `billing.create_refund_request()` + wrapper `public.create_refund_request()`
  - `billing.update_refund_request()` + wrapper `public.update_refund_request()`
- ✅ Migraciones aplicadas:
  - `20251207000002_create_refund_requests.sql`
  - `20251208000001_add_create_refund_request_rpc.sql`
  - `20251208000002_add_public_add_refund_credits_wrapper.sql`
  - `20251208000003_add_update_refund_request_rpc.sql`
- ✅ **PRUEBAS EXITOSAS:**
  - ✅ Reembolso a créditos probado y funcionando correctamente
  - ✅ Créditos agregados correctamente a la cuenta de la organización
  - ✅ Transacción registrada en historial de créditos
  - ✅ Estado del pedido actualizado a "Reembolsado"
  - ⏳ Pendiente: Pruebas con Stripe y Transbank

**✅ FASE 4: COMUNICACIONES - COMPLETADO:**

- ✅ Schema `communications.email_history` creado
- ✅ Integración Gmail API
  - Cliente OAuth2 configurado (`lib/gmail/client.ts`)
  - Manejo de tokens y refresh automático
- ✅ Integración SendGrid mejorada
  - Cliente actualizado para compatibilidad con nuevo sistema
- ✅ API route `/api/admin/communications/email/send`
  - Soporte para Gmail y SendGrid
  - Logging automático en `email_history`
  - Manejo de errores robusto
- ✅ Migración: `20251207000003_create_email_history.sql`
- 📋 **PAUSADO:** WhatsApp Business API migration (requiere migración de números
  desde HubSpot)

**✅ FASE 5: RETIROS DE MONEDERO - COMPLETADO:**

- ✅ Schema `credits.withdrawal_requests` creado
- ✅ Tipo `withdrawal_status`: pending, approved, processing, completed,
  rejected
- ✅ Vista pública `public.withdrawal_requests` con información relacionada
- ✅ Función RPC `credits.deduct_credits_for_withdrawal()`
  - Deduce créditos de la cuenta
  - Crea transacción de tipo 'spent'
  - Validación de balance disponible
- ✅ Página admin `/admin/billing/withdrawals` para listar solicitudes
- ✅ Página admin `/admin/billing/withdrawals/[id]` para detalle
- ✅ Componente `WithdrawalActions` para acciones admin (aprobar, rechazar,
  procesar, completar)
- ✅ API route `/api/admin/billing/withdrawals/[id]/status` para actualizar
  estado
- ✅ Página usuario `/wallet/withdraw` para solicitar retiros
- ✅ Componente `WithdrawForm` para formulario de solicitud
- ✅ API route `/api/wallet/withdraw` para crear solicitudes
- ✅ Integración con sidebar admin (link "Retiros" en Facturación)
- ✅ Migración: `20251207000004_create_withdrawal_requests.sql`

**✅ MEJORAS ADICIONALES:**

- ✅ Vista de créditos y movimientos en detalle de organización
  - Sección agregada en `/admin/organizations/[id]`
  - Muestra balance total, disponible, reservado y total ganado
  - Lista de movimientos recientes (últimos 20)
  - Indicadores visuales (verde para ingresos, rojo para gastos)
  - Fecha, hora y balance después de cada transacción
- ✅ Verificación de reembolsos exitosa
  - Los créditos se agregan correctamente
  - Las transacciones aparecen en el historial
  - El balance se actualiza correctamente

**📄 ARCHIVOS CREADOS/MODIFICADOS:**

- Migraciones SQL: 4 nuevas migraciones
- Componentes React: `OrderStatusSelector`, `RefundModal`, `WithdrawalActions`,
  `WithdrawForm`
- API Routes: 5 nuevas rutas
- Utilidades: `lib/stripe/refunds.ts`, `lib/transbank/refunds.ts`,
  `lib/credits/refunds.ts`, `lib/gmail/client.ts`
- Páginas: 4 nuevas páginas admin/usuario
- Funciones RPC: 4 nuevas funciones (2 en billing, 2 en credits)

**🎯 PRÓXIMOS PASOS:**

- ⏳ Pruebas de reembolsos con Stripe
- ⏳ Pruebas de reembolsos con Transbank (Webpay Plus y OneClick)
- 📋 Configuración de pipelines personalizados por organización (futuro)
- 📋 Acciones automáticas en pipelines (futuro)
- 📋 Migración WhatsApp Business API (cuando se migren números desde HubSpot)

#### 📋 **PAUSADO TEMPORALMENTE (Fase 1):**

- 📋 Integración GitHub para migraciones automáticas

#### 📋 **ROADMAP DE MIGRACIONES PENDIENTES:**

```
✅ Migración 1: 20251021120052_enable-pgvector.sql
✅ Migración 2: 20251021120854_schema-core.sql
✅ Migración 3: 20251021194734_schema-marketing.sql
✅ Migración 4: 20251024140513_blog-guia-firma-electronica.sql (CONTENT SEED)
✅ Migración 5: 20251024152738_permisos-schema-marketing.sql (PERMISSIONS)
✅ Migración 6: 20251024184320_update-guia-firma-electronica-chile-2025.sql (UPDATE)
✅ Migración 7: 20251024190000_blog-storage-setup.sql (STORAGE BUCKETS)
✅ Migración 8: 20251024191000_add-image-fields-marketing.sql (IMAGE FIELDS)
✅ Migración 9: 20251024194000_platform-organization-setup.sql (PLATFORM ORG + ROLES + RLS)
✅ Migración 10: 20251025002728_mejora-ingreso-admin.sql (FUNCTION PUBLIC SCHEMA)
✅ Migración 11: 20251025011238_politicas-rls-blog.sql (RLS POLICIES UPDATE)
✅ Migración 12: 20251025012425_corrige-permisos-grant.sql (GRANT PERMISSIONS)
✅ Migración 13: 20251025013000_relaja-constraints-blog.sql (CONSTRAINTS FLEXIBILITY)
🔄 Migración 14: 20251028240000_fix_admin_rls_policies.sql (CREADA - PENDIENTE APLICAR)
   - Corrige políticas RLS para que admins vean borradores e inactivos
   - Separa políticas para usuarios anónimos vs autenticados
   - Lectura completa para authenticated, filtrada para anon
✅ Migración 15: schema-credits-billing.sql (COMPLETADO - Nov 22, 2025)
   - ✅ 20251121220000_schema-credits.sql
   - ✅ 20251121220001_schema-billing.sql
   - ✅ 20251121220002_credits-functions.sql
   - ✅ 20251121220003_credits-billing-rls.sql
   - ✅ 20251121220004_seed-credits-billing.sql
   - ✅ 20251121220005_add-credits-to-plans.sql
   - ✅ 20251122000001_schema-notifications.sql
   - ✅ 20251122000002_notifications-rls.sql
   - ✅ 20251122000003_notifications-functions.sql
   - ✅ 20251122000004_expose-notifications-view.sql
✅ Migración 16: Corrección sistema numeración facturas (COMPLETADO - Nov 24, 2025)
   - ✅ 20251123000003_fix_invoice_number_race_condition.sql (fix inicial)
   - ✅ 20251123000004_add_public_invoice_number_wrapper.sql (wrapper public)
   - ✅ 20251124000001_change_invoice_number_format.sql (formato por organización)
✅ Migración 17: Sistema de trazabilidad de pedidos (COMPLETADO - Dic 1, 2025)
   - ✅ 20251201000001_create_order_history.sql (sistema de historial completo)
   - ✅ 20251201000002_simplify_order_history_descriptions.sql (descripciones amigables)
   - ✅ 20251201000003_cleanup_duplicate_order_history.sql (limpieza inicial)
   - ✅ 20251201000004_improved_cleanup_order_history.sql (limpieza mejorada y deduplicación)
📋 Migración 15: schema-services.sql (communications, workflows, files, audit)
📋 Migración 16: schema-business.sql (signatures, verifications, notary, documents)
📋 Migración 17: schema-ai.sql (ai_customer_service, ai_document_review con VECTOR)
📋 Migración 18: schema-analytics.sql (usage_metrics, ai_usage_metrics)
📋 Migración 19: rls-policies.sql (seguridad multi-tenant)
📋 Migración 20: functions-triggers.sql (lógica de negocio)
📋 Migración 21: seed-data.sql (datos iniciales)
```

#### ✅ **PROGRESO FASE 0 - ACTUALIZADO (12 Nov 2025):**

**✅ COMPLETADO - Marketing Site Foundation:**

**1. Estructura y Setup (100% Completado)**

- ✅ Monorepo completo con apps/marketing + apps/web
- ✅ Next.js 15.5.6 + TailwindCSS v4 + Shadcn/UI
- ✅ Sistema de tipografía triple (Josefin Sans, Outfit, Nunito)
- ✅ Sistema de colores dual (funcional gris + marca vino)
- ✅ SEO avanzado (metadata API, sitemap dinámico, robots.txt)
- ✅ Dark mode completo con next-themes

**2. Landing Pages (100% Completado)**

- ✅ Homepage global con value proposition
- ✅ Landing `/cl/firmas-electronicas` completa y optimizada
- ✅ Landing `/cl/notaria-online` completa y optimizada
- ✅ Landing `/cl/modificaciones-empresa` completa
- ✅ Landing `/cl/contrato-de-arriendo-online` completa
- ✅ Landing `/cl/verificacion-identidad` (redirect configurado)
- ✅ Página `/cl/precios` con planes diferenciados
- ✅ Páginas legales completas (`/legal/terminos`, `/legal/privacidad`,
  `/legal/cookies`)

**3. Sistema de Contenido Completo (100% Completado)**

- ✅ **Blog dinámico** con Supabase
  - Schema `marketing.blog_posts` y `blog_categories`
  - Páginas dinámicas `/blog/[category]/[slug]`
  - Sistema de categorías funcionando
  - Panel admin completo para gestionar posts
- ✅ **Base de Conocimiento** (Knowledge Base) - NUEVO Nov 2025
  - Schema `marketing.kb_articles` y `kb_categories`
  - Páginas dinámicas `/base-conocimiento/[category]/[slug]`
  - Sistema de categorías independiente
  - Navegación por categorías `/base-conocimiento/categoria/[slug]`
  - Integrado en sitemap dinámico
- ✅ **Sistema de Gestión de Páginas**
  - API routes para configuración de páginas
  - `marketing.page_config` para gestión dinámica
  - Integración con sitemap automático
  - Estados por país (activo, coming-soon)

**4. Deploy Infrastructure (100% Completado)**

- ✅ **Ambas apps en Vercel**
  - Marketing app: `tupatrimonio.app`
  - Web app: `app.tupatrimonio.app`
  - Build commands optimizados
  - Variables de entorno configuradas
  - Edge Middleware para geolocalización

**5. Páginas Adicionales (100% Completado) - NUEVO Nov 2025**

- ✅ `/ayuda` - Centro de ayuda completo con FAQs
- ✅ `/nosotros` - Página sobre TuPatrimonio
- ✅ `/contacto` - Formulario de contacto global
- ✅ `/base-conocimiento` - Hub de artículos KB
- ✅ Líneas de negocio:
  - `/legal-tech` - Servicios legales digitales
  - `/business-hub` - Soluciones empresariales
  - `/proptech` - Tecnología inmobiliaria
  - `/fintech` - Servicios financieros

**6. Integraciones y APIs (NUEVO Nov 2025)**

- ✅ **Google Business Reviews**
  - API completa de sincronización
  - Cron job para actualización automática
  - Display de reseñas en landing pages
  - Cache de datos para performance
  - Endpoints: `/api/google-reviews`, `/api/google-stats`
- ✅ **API de Gestión de Páginas**
  - `/api/pages-config` - Configuración dinámica
  - Sistema de estados por país
  - Integración con sitemap

**7. SEO Avanzado (100% Completado)**

- ✅ Sitemap dinámico multicapa:
  - Páginas estáticas con prioridades
  - Posts del blog con última modificación
  - Artículos KB con categorías
  - Categorías de ambos sistemas
  - Sistema de gestión de páginas integrado
- ✅ Prioridades inteligentes por tipo de contenido
- ✅ Change frequencies optimizadas
- ✅ Structured data (Organization, WebSite, Article, BreadcrumbList)

#### 📊 **RESUMEN DE PROGRESO FASE 0: ✅ 100% COMPLETADO**

**✅ COMPLETADO (Oct-Nov 2025):**

**Infraestructura y Setup:**

- ✅ Monorepo completo con 2 apps + packages compartidos
- ✅ Next.js 15.5.6 + TailwindCSS v4 + Shadcn/UI
- ✅ Sistema de colores dual y tipografía triple
- ✅ Dark mode completo
- ✅ Deploy en Vercel (ambas apps)
- ✅ PWA funcional en web app

**Marketing Site:**

- ✅ 8+ landing pages principales para Chile
- ✅ Estructura internacional (/cl/, /co/, /mx/, /pe/, /ar/)
- ✅ Detección automática de país
- ✅ Blog dinámico con categorías
- ✅ Base de conocimiento completa (NUEVO Nov 2025)
- ✅ Centro de ayuda
- ✅ Páginas legales completas
- ✅ Formularios de lead capture

**Integraciones:**

- ✅ Google Business Reviews (NUEVO Nov 2025)
- ✅ Google Analytics 4 (propiedades separadas)
- ✅ Google Search Console
- ✅ Sistema de gestión de páginas dinámicas

**SEO:**

- ✅ Sitemap dinámico multicapa
- ✅ Structured data completo
- ✅ Metadata optimizada por página
- ✅ Robots.txt configurado
- ✅ Prioridades y change frequencies optimizadas

**Backend (Supabase):**

- ✅ Schema marketing completo (13+ tablas)
- ✅ Sistema de blog
- ✅ Sistema de base de conocimiento
- ✅ Sistema de reviews
- ✅ Lead capture y contacto
- ✅ Storage buckets para imágenes

**✅ COMPLETADO - FASE 0 AL 100%:**

**PRIORIDAD 1: Contenido Real** ✅ COMPLETADO

- ✅ **Migrar contenido del sitio actual** (COMPLETADO)
  - ✅ Copiar textos de producción actual
  - ✅ Actualizar landing pages con información real
  - ✅ Revisar y optimizar mensajes
- ✅ **Poblar Blog** (COMPLETADO)
  - ✅ Migrar 10-15 posts existentes
  - ✅ Crear 3-5 posts nuevos sobre servicios
  - ✅ Optimizar imágenes y SEO
- ✅ **Poblar Base de Conocimiento** (COMPLETADO)
  - ✅ Crear 15-20 artículos iniciales
  - ✅ Organizar por categorías
  - ✅ Optimizar para búsqueda
- ✅ **Optimización Final** (COMPLETADO)
  - ✅ Revisar todos los textos
  - ✅ Verificar enlaces internos
  - ✅ Testing de formularios
  - ✅ Verificar responsive design

**PRIORIDAD 2: Sistema CRM y Gestión de Correos (3-5 días)** ← NUEVO

- [ ] **Panel CRM en Dashboard**
  - Vista de lista de contactos (waitlist + formulario contacto)
  - Página de detalle por contacto con toda su información
  - Sistema de estados: nuevo, contactado, calificado, convertido, descartado
  - Filtros por estado, fecha, país, tipo de lead
  - Búsqueda de contactos
  - Sistema de notas y seguimiento
  - Tags personalizables
- [ ] **Integración Email Workspace**
  - Conectar con Google Workspace o Microsoft 365
  - OAuth para acceso a emails
  - Visualizar correos entrantes en el CRM
  - Responder emails directamente desde dashboard
  - Threading de conversaciones por contacto
  - Templates de respuestas rápidas
  - Firma automática de emails
- [ ] **Sistema de Notificaciones**
  - Notificación en dashboard cuando llega nuevo lead
  - Email de alerta al equipo comercial
  - Dashboard de leads sin responder
  - Recordatorios de seguimiento
  - Webhook para Slack (opcional)

**PRIORIDAD 3 (Opcional): Sistema de Autenticación Mejorado**

- [ ] OAuth providers (Google, LinkedIn)
- [ ] Magic Links
- [ ] Verificación de correo mejorada
- [ ] Flujo de onboarding refinado

**NOTA**: El sistema de autenticación básico ya funciona. Esta prioridad es
opcional para MVP.

- ✅ **Arquitectura Completa** (Oct-Nov 2025)
  - ✅ Sistema de rutas dinámicas por país (cl, mx, co, pe, ar)
  - ✅ Componentes reutilizables con Shadcn/UI
  - ✅ Verticales de negocio (Legal-Tech, PropTech, Business-Hub, FinTech)
  - ✅ Sistema de detección de país híbrido
  - ✅ Middleware con validación y redirects
  - ✅ 60+ páginas implementadas y funcionando
  - ✅ Build exitoso y deployado en Vercel

**📈 PROGRESO FASE 0: ✅ 100% COMPLETADO** (Actualizado Nov 12, 2025)

**🎉 FASE 0 COMPLETADA AL 100%**

- ✅ **Contenido real**: COMPLETADO
  - ✅ Migración de contenido existente
  - ✅ Población de blog y KB
  - ✅ Optimización final
- **Sistema CRM y correos**: OPCIONAL (puede implementarse en Fase 1 o después)
  - Panel de gestión de leads
  - Integración con email workspace
  - Sistema de notificaciones
- **Sistema de autenticación avanzado**: Opcional para MVP

**🎯 ÚLTIMAS MEJORAS (Nov 2025):**

- ✅ **Sistema de Base de Conocimiento** completo (kb_articles, kb_categories)
- ✅ **Integración Google Business Reviews** con API y cron jobs
- ✅ **Sistema de gestión de páginas dinámicas** con page_config
- ✅ **Sitemap multicapa** con todas las fuentes de contenido
- ✅ **Páginas adicionales**: /ayuda, /nosotros, /contacto, /base-conocimiento
- ✅ **Líneas de negocio**: legal-tech, business-hub, proptech, fintech
- ✅ **APIs robustas** para reviews, stats y configuración
- ✅ **Sistema completo de contenido** listo para población masiva

**🎯 MEJORAS PREVIAS (Oct 2025):**

- ✅ Admin del blog centralizado en apps/web/dashboard/blog
- ✅ RLS policies corregidas para mostrar borradores e inactivos
- ✅ Cálculo de tiempo de lectura mejorado con limpieza de Markdown
- ✅ Arquitectura de storage documentada y funcionando
- ✅ Sistema de colores dual implementado
- ✅ Tipografía triple configurada
- ✅ Dark mode completo
- ✅ PWA funcional

#### 📝 **NOTAS IMPORTANTES:**

**🌐 URLs de Desarrollo:**

- **Marketing Local**: `http://localhost:3001` (comando: `npm run dev:marketing`
  desde raíz)
- **Web Local**: `http://localhost:3000` (comando: `npm run dev` desde raíz)
- **Supabase Local Studio**: `http://localhost:54323`
- **Netlify Marketing**: https://tupatrimonio.app
- **Netlify Web**: https://app.tupatrimonio.app

**📝 Comandos Útiles:**

```bash
# Desarrollo
npm run dev              # Web app (puerto 3000)
npm run dev:marketing    # Marketing app (puerto 3001)

# Build
npm run build            # Ambas apps + packages
npm run build:marketing  # Solo marketing
npm run build:web        # Solo web

# Build packages compartidos
npm run build:packages   # Todos los packages
```

**📂 Estructura del Proyecto (Actualizada - Oct 27, 2025):**

```
/apps/marketing  # Marketing site (tupatrimonio.app)
├── /src/app
│   ├── page.tsx                 ✅ Homepage global con selector países
│   │
│   ├── /nosotros                ✅ Sobre TuPatrimonio
│   ├── /contacto                ✅ Formulario contacto global
│   │
│   ├── /(country)/[pais]/       ✅ RUTAS DINÁMICAS POR PAÍS (cl, mx, co, pe, ar)
│   │   ├── page.tsx             ✅ Landing parametrizada por país
│   │   ├── /precios             ✅ Precios en moneda local
│   │   └── /contacto            ✅ Contacto con info local
│   │
│   ├── /legal-tech/             ✅ VERTICAL LEGAL TECH
│   │   ├── page.tsx             ✅ Landing del vertical
│   │   ├── /firma-electronica   ✅ Firma electrónica completa
│   │   ├── /tramites-notariales ✅ Notaría digital
│   │   └── /modificaciones-empresa ✅ Cambios societarios
│   │
│   ├── /proptech/               ✅ VERTICAL PROPTECH (landing)
│   ├── /business-hub/           ✅ VERTICAL BUSINESS (landing)
│   ├── /fintech/                ✅ VERTICAL FINTECH (landing)
│   │
│   ├── /recursos/               ✅ HUB DE RECURSOS
│   │   ├── page.tsx             ✅ Centro de recursos
│   │   ├── /guias               ✅ Guías legales
│   │   ├── /calculadoras        ✅ Herramientas cálculo
│   │   └── /plantillas          ✅ Templates documentos
│   │
│   ├── /casos-exito             ✅ Casos de éxito clientes
│   ├── /ayuda                   ✅ Centro de ayuda
│   ├── /faq                     ✅ Preguntas frecuentes
│   │
│   ├── /terminos-y-condiciones  ✅ Términos globales
│   ├── /politica-privacidad     ✅ Política privacidad
│   │
│   ├── /registrarse             ✅ CTA con detección sesión
│   ├── /login                   ✅ CTA con detección sesión
│   ├── /empezar                 ✅ CTA con detección sesión
│   │
│   ├── /blog/                   ✅ Blog compartido entre países
│   │   ├── page.tsx             ✅ Lista dinámica con categorías
│   │   ├── [category]/[slug]/  ✅ Posts individuales con SEO
│   │   └── categoria/[slug]/   ✅ Posts por categoría
│   │
│   ├── /admin/                  ✅ Panel de administración COMPLETO
│   │   ├── dashboard/           ✅ Métricas del blog
│   │   ├── blog/                ✅ Gestión de posts
│   │   ├── media/               ✅ Galería de imágenes
│   │   └── settings/            ✅ Configuración del sistema
│   │
│   ├── /cl/, /co/, /mx/         ✅ Páginas legacy (con redirects)
│   ├── sitemap.ts               ✅ SEO internacional + URLs con categorías
│   ├── robots.ts                ✅ Optimizado para crawling
│   └── middleware.ts            ✅ Protección admin + validación países
│
├── /src/components/
│   ├── CTAWithAuth.tsx          ✅ Detección sesión + redirección
│   ├── CountryRouteWrapper.tsx  ✅ Gestión contenido por país
│   ├── VerticalLayout.tsx       ✅ Layout para verticales
│   ├── VerticalCard.tsx         ✅ Cards reutilizables
│   └── CountryPricingTable.tsx  ✅ Precios por país

/apps/web        # App principal (app.tupatrimonio.app)
└── [Dashboard híbrido B2C/B2B - Fase 1]
```

**🗄️ Base de Datos (Actualizado Nov 2025):**

- **Schema core**: 13 tablas ✅ COMPLETO
  - organizations, users, teams, roles, subscriptions, api_keys, etc.
  - Multi-tenancy nativo con RLS
  - Platform organization configurada

- **Schema marketing**: 13+ tablas ✅ COMPLETO
  - **Blog**: blog_posts, blog_categories
  - **Knowledge Base**: kb_articles, kb_categories ← NUEVO Nov 2025
  - **Reviews**: google_reviews, review_stats ← NUEVO Nov 2025
  - **Lead Capture**: waitlist_subscribers, contact_messages
  - **Content**: testimonials, faqs, case_studies
  - **Config**: page_config ← NUEVO Nov 2025

- **Storage buckets**: 6 buckets optimizados ✅
  - blog-featured, blog-content, blog-categories
  - blog-authors, blog-thumbnails, blog-meta

- **Roles y permisos**: Sistema completo ✅
  - platform_super_admin, marketing_admin
  - Función RPC: public.is_platform_admin()
  - RLS policies completas para todos los schemas

**📦 Packages Compartidos:**

- **@tupatrimonio/location**: Sistema de ubicación ✅ COMPLETO
- **@tupatrimonio/ui**: Componentes Shadcn/UI ✅ COMPLETO
- **@tupatrimonio/utils**: Helpers de imágenes ✅ COMPLETO
- **@tupatrimonio/update-notifier**: Notificaciones de actualizaciones ✅
  COMPLETO

**🎯 Siguiente Task**: Escribir contenido para blog y finalizar SEO + DNS

#### 🎉 **LOGROS PRINCIPALES (Oct-Nov 2025):**

**🆕 NUEVAS FUNCIONALIDADES (Nov 2025):**

- ✅ **Sistema de Base de Conocimiento Completo**:
  - Tablas kb_articles y kb_categories
  - Páginas dinámicas con routing SEO-friendly
  - Navegación por categorías
  - Integrado en sitemap automático

- ✅ **Integración Google Business Reviews**:
  - API completa de sincronización
  - Cron jobs para actualización automática
  - Display dinámico en landing pages
  - Sistema de cache para performance
  - Endpoints: /api/google-reviews, /api/google-stats

- ✅ **Sistema de Gestión de Páginas**:
  - Tabla page_config para configuración dinámica
  - API routes para gestión
  - Estados por país (active, coming-soon)
  - Integración con sitemap

- ✅ **Sitemap Multicapa Avanzado**:
  - Páginas estáticas con prioridades
  - Blog posts dinámicos
  - Artículos KB dinámicos
  - Categorías de ambos sistemas
  - Páginas gestionadas desde BD

- ✅ **Páginas Adicionales Completas**:
  - /ayuda - Centro de ayuda
  - /nosotros - Sobre TuPatrimonio
  - /contacto - Formulario global
  - /base-conocimiento - Hub KB
  - Líneas de negocio (4 páginas)

**🎯 MEJORAS OCTUBRE 2025:**

- ✅ Migración Admin Blog a apps/web/dashboard/blog
- ✅ Fix RLS Crítico para borradores e inactivos
- ✅ Cálculo de Tiempo de Lectura mejorado (limpieza Markdown)
- ✅ Arquitectura de Storage documentada (6 buckets)
- ✅ Sistema de colores dual implementado
- ✅ Tipografía triple configurada
- ✅ Dark mode completo con next-themes
- ✅ PWA funcional en web app

**🗄️ BACKEND & FOUNDATION:**

- ✅ **15+ migraciones aplicadas** (pgvector + core + marketing + KB + reviews +
  content + storage + RLS)
- ✅ **3 schemas completos**:
  - Core: 13 tablas (multi-tenant B2C/B2B)
  - Marketing: 13+ tablas (blog + KB + reviews + config)
  - Storage: 6 buckets optimizados
- ✅ **Sistema de roles platform** completo
- ✅ **Modelo híbrido B2C + B2B** implementado
- ✅ **Monorepo enterprise** (2 apps + 4 packages)
- ✅ **Deploy en Vercel** (ambas apps funcionando)
- ✅ **Packages compartidos** (location + ui + utils + update-notifier)
- ✅ **Seguridad robusta** (RLS + GRANT + políticas completas)

**🌍 MARKETING SITE INTERNACIONAL:**

- ✅ **Estructura por países** /cl/, /co/, /mx/, /pe/, /ar/
- ✅ **8+ landing pages Chile**:
  - Homepage, firmas electrónicas, notaría online
  - Modificaciones empresa, contrato arriendo
  - Verificación identidad, precios, legales
- ✅ **Páginas globales**:
  - /ayuda, /nosotros, /contacto
  - /base-conocimiento (KB completo)
  - Líneas de negocio (4 páginas)
- ✅ **Páginas próximamente** para otros países con waitlists
- ✅ **Blog dinámico** con Supabase (categorías + posts)
- ✅ **Base de Conocimiento** con categorías y artículos (NUEVO Nov 2025)
- ✅ **URLs SEO-friendly** para todo el contenido
- ✅ **SEO internacional** completo (hreflang, sitemap, redirects)
- ✅ **Structured Data** en todas las páginas

**📧 LEAD CAPTURE SYSTEM:**

- ✅ **WaitlistForm + ContactForm** components funcionando
- ✅ **Formularios conectados** a marketing schema (waitlist_subscribers +
  contact_messages)
- ✅ **Tracking por país** y fuente de leads
- ✅ **Páginas de contacto** específicas por mercado

**📸 SISTEMA DE IMÁGENES DEL BLOG:**

- ✅ **4 buckets de storage** organizados (marketing-images, public-assets,
  documents, ai-training-data)
- ✅ **Políticas RLS diferenciadas** (público vs privado, platform admins)
- ✅ **Transformaciones automáticas** (resize, format, quality) via Supabase
- ✅ **Campos adicionales en BD** (icon_url en categories, content_images en
  posts)
- ✅ **Documentación completa** con ejemplos y workflow
- ✅ **Upload integrado** en panel admin

**🎨 PANEL DE ADMINISTRACIÓN DEL BLOG:**

- ✅ **Ubicación**: apps/web/dashboard/blog (centralizado con otros dashboards)
- ✅ **Sistema de autenticación** con @supabase/ssr (versión recomendada)
- ✅ **Middleware de protección** (solo platform admins acceden)
- ✅ **Dashboard con métricas** (total posts, publicados, borradores,
  categorías)
- ✅ **Lista de posts** con tabla interactiva y acciones (ver, editar, eliminar)
- ✅ **Editor completo** de posts con Markdown y preview
- ✅ **Upload de imágenes** integrado a Storage (6 buckets)
- ✅ **Gestión de SEO** (título, descripción optimizados con contadores)
- ✅ **Toggle publicar/borrador** con confirmaciones
- ✅ **Validaciones frontend** (título, contenido, slug)
- ✅ **Auto-generación de slugs** desde título
- ✅ **Preview de URLs dinámico** con categoría incluida
- ✅ **Gestión de categorías** (CRUD completo con colores y ordenamiento)
- ✅ **Galería de medios** (visualizar, copiar URL, eliminar imágenes)
- ✅ **Página de configuración** (info del sistema)
- ✅ **Componentes Shadcn/UI** con diseño TuPatrimonio
- ✅ **Navegación intuitiva** (sidebar + header + logout)
- ✅ **Schema marketing** explícito en todas las queries
- ✅ **Políticas RLS corregidas** (admins ven borradores e inactivos)
- ✅ **Cálculo preciso de tiempo de lectura** con limpieza de Markdown
- ✅ **Gestión sin Supabase Studio** - 100% desde frontend

**🎨 BRANDING Y ANALYTICS:**

- ✅ **Google Analytics 4** configurado y recabando datos (27-28 Oct 2025)
  - **Marketing App (tupatrimonio.app):**
    - Componente GoogleAnalytics.tsx implementado
    - Librería analytics.ts con helpers type-safe
    - Eventos: cta_click, form_submit, blog_read, navigation_click
    - Configurado en Vercel
  - **Web App (app.tupatrimonio.app):**
    - GA4 con propiedad separada (G-HKK7H001DB)
    - Componente GoogleAnalytics.tsx creado
    - Librería analytics.ts extendida con eventos específicos:
      - Autenticación: user_login, user_logout
      - Dashboard: dashboard_view
      - Documentos: document_created, document_updated, document_deleted
      - Firmas: signature_requested, signature_completed
      - Verificación: verification_started, verification_completed
      - Perfil/Pagos: profile_updated, payment_initiated, payment_completed
    - Configurado para Vercel (variable de entorno)
    - Type-safe con TypeScript
    - Solo funciona en producción
    - Logs en desarrollo para debugging
  - **Ventajas:** Métricas separadas por aplicación, análisis independiente,
    mejor segmentación
- ✅ **Google Search Console** configurado y verificado
- ✅ **Favicons personalizados** en ambas apps (marketing + web)
  - Descarga automática desde Supabase Storage
  - Generación con Sharp en múltiples formatos (ico, png, apple-icon)
  - Metadata configurada en layout.tsx
  - Branding visual diferenciado por aplicación

**🔧 CONFIGURACIÓN VERCEL (Web App):**

- ✅ **Headers de seguridad** migrados a next.config.ts (28 Oct 2025)
  - X-Frame-Options, XSS-Protection, Content-Type-Options
  - Headers específicos para dashboard (no-index, no-cache)
  - Headers para PWA (service workers, manifest, version, icons)
  - Headers para autenticación (no-cache)
- ✅ **Redirects** migrados a next.config.ts
  - /signin → /login
  - /signup → /login
  - /register → /login
- ✅ **Middleware de autenticación** mejorado
  - Manejo de raíz (/) con detección de sesión
  - Protección de rutas /dashboard/*
  - Redirección inteligente según estado de autenticación
  - Rutas públicas definidas (/login, /auth, /404)
- ✅ **Documentación VERCEL-CONFIG.md** creada
  - Guía completa de configuración
  - Variables de entorno
  - Diferencias Netlify vs Vercel
  - Troubleshooting
- ✅ **Sistema de Notificaciones de Actualización COMPLETADO** (28 Oct 2025)
  - ✅ **Problema identificado y solucionado**: Archivos version.json estáticos
    no estaban siendo servidos (404)
  - ✅ **API Routes dinámicas implementadas**: `/src/app/version.json/route.ts`
    en ambas apps
  - ✅ **Packages rebuildeados**: update-notifier y ui con mejoras incluidas
  - ✅ **Testing completo**: Sistema funcionando con logging limpio
  - ✅ **Configuración simplificada**: Removida lógica compleja de generación de
    archivos estáticos
  - ✅ **Documentación organizada**: Documentación movida a
    `docs/update-notifications/`
  - ✅ **Sistema limpio y funcional**: Consola sin logs verbosos, funcionamiento
    silencioso
  - ✅ **BUG FIX CRÍTICO - BUCLE INFINITO SOLUCIONADO** (28 Oct 2025)
    - **PROBLEMA**: API routes generaban versión nueva con `Date.now()` en cada
      request
    - **CAUSA**: Cada verificación de actualización detectaba nueva versión →
      popup infinito
    - **SOLUCIÓN**: Cambié a versiones estables usando `SERVER_START_TIME` y
      `BUILD_ID`
    - **IMPLEMENTACIÓN**: Variables generadas al iniciar servidor (no per
      request)
    - **ARCHIVOS**: `apps/marketing/src/app/version.json/route.ts` +
      `apps/web/src/app/version.json/route.ts`
    - **LÓGICA**: Usa `process.env.VERCEL_GIT_COMMIT_SHA` o `NEXT_BUILD_ID` como
      base
    - **RESULTADO**: Popup solo aparece con deployments reales, no bucle
      infinito
  - 🎯 **Resultado**: Sistema de notificaciones 100% funcional en ambas
    aplicaciones
  - 📂 **Documentación**: Ver `docs/update-notifications/` para detalles
    técnicos

**📈 PROGRESO FASE 0: ✅ 100% COMPLETADO** (Actualizado Nov 12, 2025)

**🎉 FASE 0 COMPLETADA AL 100% 🎉**

**✅ COMPLETADOS en Nov 2025:**

- ✅ Sistema de Base de Conocimiento completo
- ✅ Integración Google Business Reviews
- ✅ Sistema de gestión de páginas dinámicas
- ✅ Sitemap multicapa con todas las fuentes
- ✅ Páginas adicionales y líneas de negocio
- ✅ APIs robustas
- ✅ **Migración de contenido del sitio actual**
- ✅ **Blog poblado con 10-15 posts reales**
- ✅ **Base de conocimiento con 15-20 artículos**
- ✅ **Optimización final completada**
- ✅ **Testing completo realizado**

**✅ COMPLETADOS en Oct 2025:**

- ✅ Google Analytics 4 + Search Console
- ✅ Favicons personalizados
- ✅ Deploy completo en Vercel
- ✅ Arquitectura de URLs y routing
- ✅ Sistema de colores y tipografía
- ✅ Dark mode + PWA

**📋 OPCIONAL (para implementar después):**

**1. CRM Básico (puede implementarse en Fase 1)**

- Panel de visualización de leads
- Integración email workspace
- Sistema de notificaciones

**2. Auth Avanzado (Opcional para MVP)**

- OAuth providers
- Magic Links
- Mejoras UX

**✅ FASE 0 COMPLETA AL 100%** **🚀 Próximo paso: INICIAR FASE 1 - Backend
Foundation**

**📅 Última actualización: 12 Noviembre 2025**

**🔄 MIGRACIÓN A VERCEL (Web App):**

- ✅ **Headers** migrados de netlify.toml a next.config.ts
- ✅ **Redirects** migrados de netlify.toml a next.config.ts
- ✅ **Middleware** actualizado con lógica mejorada de autenticación
- ✅ **Variables de entorno** configuradas para Vercel Dashboard
- ✅ **Documentación completa** en VERCEL-CONFIG.md
- ✅ **Sin linter errors** - código limpio y funcionando

**✅ FASE 0 100% COMPLETADA → LISTO PARA FASE 1 (Backend Foundation):**

**Criterios para considerar Fase 0 COMPLETA - TODOS CUMPLIDOS:**

1. ✅ Sistema de autenticación completo con mejores prácticas (COMPLETADO - Nov
   14, 2025)
2. ✅ Contenido real migrado y optimizado (COMPLETADO - Nov 2025)
3. ✅ Landing pages con información definitiva (COMPLETADO - Nov 2025)
4. ✅ Blog poblado con posts reales (COMPLETADO - Nov 2025)
5. ✅ KB poblado con artículos (COMPLETADO - Nov 2025)
6. ✅ **Sistema CRM completo y funcional** (COMPLETADO - Nov 12, 2025)
7. ✅ **Onboarding B2C + B2B probado exitosamente** (COMPLETADO - Nov 14, 2025)
8. ✅ SEO y analytics funcionando (COMPLETADO)
9. ✅ Infraestructura técnica lista (COMPLETADO)
10. ✅ Todas las páginas implementadas (COMPLETADO)
11. ✅ Formatters y utilidades completos (COMPLETADO - Nov 14, 2025)
12. ✅ Testing en navegador exitoso (COMPLETADO - Nov 14, 2025)

**Tareas de Fase 1 (después de completar contenido y CRM básico):**

- ✅ Completar schemas credits + billing (COMPLETADO - Nov 22, 2025)
- [ ] Mejorar dashboard apps/web (B2C/B2B)
- ✅ RLS policies adicionales (COMPLETADO para credits + billing)
- ✅ Funciones y triggers de negocio (COMPLETADO para créditos)
- ✅ Integración con servicios externos (Stripe + dLocal COMPLETADO)
- [ ] Expandir funcionalidades del CRM (reportes, automatizaciones)

**🎯 ENFOQUE ACTUAL:**

- ✅ **Fase 0**: COMPLETADA AL 100%
- ✅ **Fase 2**: COMPLETADA AL 100% (Nov 22, 2025)
- ✅ **Platform Admins: Acceso Completo al Dashboard**: COMPLETADO AL 100%
  (Dic 2025)
- ✅ **Fase 3 - Comunicaciones y CRM avanzado**: COMPLETADO (Dic 2025)
  - ✅ Schema communications completo (`communications` schema creado)
  - ✅ Integración SendGrid multi-tenant (cuenta por organización, encriptación
    AES-256-GCM)
  - ✅ Motor de templates Handlebars implementado
  - ✅ API routes de comunicaciones creadas (templates, campaigns, lists,
    analytics, webhooks)
  - ✅ UI de comunicaciones creada (templates, campaigns, lists, analytics,
    SendGrid settings)
  - ✅ Páginas del CRM completadas (contacts, deals, tickets, products, página
    principal CRM)
  - ✅ Helper `getUserActiveOrganization()` para manejo automático de
    organizaciones
  - ✅ **Arquitectura Multi-Canal Implementada** (Dic 2025)
    - ✅ Aplicación `email_marketing` separada de CRM
    - ✅ Estructura de URLs: `/dashboard/communications/email/`
    - ✅ Listas y Analytics compartidos entre canales
    - ✅ Sistema de visibilidad integrado en `core.applications`
    - ✅ Preparado para `whatsapp_marketing` y `sms_marketing` (futuro)
  - ✅ **Sistema de Visibilidad de Aplicaciones** (Dic 2025)
    - ✅ Control de visibilidad integrado directamente en `core.applications`
    - ✅ Campos: `visibility_level`, `allowed_countries`,
      `required_subscription_tiers`
    - ✅ Tabla `core.application_overrides` para excepciones por organización
    - ✅ Funciones SQL: `can_access_application()`, `get_enabled_applications()`
    - ✅ Protección de rutas y APIs basada en aplicaciones habilitadas
    - ✅ Sidebar dinámico que filtra según aplicaciones habilitadas
  - 🔄 Pendiente: Testing completo de envío de campañas
  - 🔄 Pendiente: Migración a producción
  - 📋 Automatizaciones avanzadas (pendiente)
  - 📋 Integración WhatsApp Business API (pendiente)
  - 📋 Integración SMS (Twilio/Meta) (pendiente)
  - 📋 Reportes y analytics avanzados del CRM (pendiente)

---

### 1.1 Configuración Inicial del Proyecto

**Objetivo:** Establecer la base técnica del proyecto (simplificada)

#### Tareas:

1. **Setup de Repositorio Simple**
   - Monorepo con npm workspaces
   - ESLint + Prettier básico
   - **Deploy automático**: Netlify + Supabase manejan CI/CD
   - **Estructura simple:**
     ```
     /apps/marketing (tupatrimonio.app)
     /apps/web (app.tupatrimonio.app)
     /packages/* (compartidos)
     ```

2. **✅ Configuración de Supabase (COMPLETADO)**
   - ✅ Proyecto creado en Supabase
   - ✅ **pgvector extension habilitado** (migración aplicada)
   - ✅ **Schema CORE creado** con todas las tablas multi-tenant
   - 🔄 Conectar con GitHub para migraciones automáticas (PENDIENTE)
   - 🔄 Configurar Storage buckets con políticas de acceso (PENDIENTE)
   - 🔄 Implementar Row Level Security (RLS) (PENDIENTE)

3. **Configuración de Next.js - Monorepo Simple**
   ```
   /apps/web                    # Aplicación principal (app.tupatrimonio.app)
   /apps/marketing              # Marketing site (tupatrimonio.app)
   /packages/ui                 # Componentes compartidos Shadcn/UI
   /packages/database           # Types de Supabase
   /packages/utils              # Utilidades compartidas
   /packages/config             # Configuraciones compartidas
   /packages/ai                 # Utilidades de IA (futuro)
   ```

4. **Variables de Entorno**
   ```
   # Supabase
   NEXT_PUBLIC_SUPABASE_URL
   NEXT_PUBLIC_SUPABASE_ANON_KEY
   SUPABASE_SERVICE_ROLE_KEY

   # Servicios externos
   STRIPE_SECRET_KEY
   STRIPE_WEBHOOK_SECRET
   DLOCAL_SECRET_KEY
   SENDGRID_API_KEY
   TWILIO_ACCOUNT_SID
   TWILIO_AUTH_TOKEN
   VERIFF_API_KEY
   AWS_ACCESS_KEY_ID / FIREBASE_CONFIG

   # IA Services ← NUEVO
   OPENAI_API_KEY
   ANTHROPIC_API_KEY
   OPENAI_ORG_ID
   AI_MODEL_DEFAULT=claude-3-5-sonnet-20241022

   # App
   NEXT_PUBLIC_APP_URL
   NEXT_PUBLIC_MARKETING_URL
   JWT_SECRET
   ENCRYPTION_KEY
   ```

### 1.2 ✅ Modelado de Base de Datos - Schema Core (COMPLETADO)

**Objetivo:** ✅ Implementar el corazón del sistema multi-tenant híbrido B2C +
B2B

#### 🏢➕🏠 **Modelo Híbrido B2C + B2B** ← ACTUALIZADO

**Concepto Principal:** Mismo sistema para usuarios individuales (B2C) y
empresas (B2B) usando "organizaciones personales" automáticas.

##### **Tipos de Organizaciones:**

```sql
-- Modificación requerida al schema
ALTER TABLE core.organizations 
ADD COLUMN org_type TEXT DEFAULT 'business' 
CHECK (org_type IN ('personal', 'business', 'platform'));

ALTER TABLE core.organization_users
ADD COLUMN is_personal_org BOOLEAN DEFAULT false;
```

##### **Organización Platform (Super Admin):**

```sql
-- Organización especial para administradores de la plataforma
INSERT INTO core.organizations (
  name: "TuPatrimonio Platform",
  slug: "tupatrimonio-platform", 
  org_type: "platform",
  settings: {
    "is_platform_org": true,
    "system_organization": true,
    "can_access_all_orgs": true
  }
)
```

##### **Roles de Plataforma:**

```sql
-- Roles específicos para la organización platform
core.roles:
1. "platform_super_admin" → Acceso total al sistema
2. "platform_admin" → Soporte técnico  
3. "platform_billing" → Solo facturación y pagos
```

##### **Flujos de Usuario:**

**B2C (Usuario Individual):**

- Al registrarse: Sistema crea automáticamente "organización personal"
- Usuario = owner de su org personal
- UI simplificada (sin gestión de equipos)
- Planes: Personal Free ($0), Pro ($9), Business ($29)

**B2B (Empresa):**

- Al registrarse: Crea organización empresarial
- Puede invitar usuarios con roles
- UI completa (teams, admin, etc.)
- Planes: Team Starter ($49), Business ($199), Enterprise (Custom)

**Platform Admin (Nosotros):**

- Organización especial "TuPatrimonio Platform"
- Vista "de Dios" de todo el sistema
- Puede acceder a cualquier organización para soporte

##### **Registro con Intención Clara:**

```typescript
// Pantalla de registro con opciones claras
¿Cómo vas a usar TuPatrimonio?

🏠 Uso Personal
   "Para mis documentos personales, freelance o proyectos individuales"
    
🏢 Uso Empresarial  
   "Para mi empresa o equipo de trabajo"
    
🔗 Tengo una invitación
   "Alguien me invitó a su organización"
```

##### **Ventajas del Modelo Híbrido:**

✅ Misma arquitectura para ambos segmentos ✅ Usuario B2C puede crear una empresa
B2B separada **← IMPLEMENTADO (Enero 2026)**

- Endpoint API `/api/organizations/create-business` disponible
- UI completa en `/settings/organization` para creación desde frontend
- Configuración automática de límites y datos de facturación del CRM ✅ Usuario
  mantiene su cuenta personal intacta para máxima privacidad y orden legal.
- El sistema anterior de conversión bidireccional fue eliminado para evitar
  mezcla de datos.

#### ✅ Implementación COMPLETADA:

1. **✅ Schema `core` CREADO** - Migración: `20251021120854_schema-core.sql`
   ```sql
   ✅ COMPLETADO - 13 tablas principales:
   - users (integración con Supabase Auth + perfil extendido)
   - organizations (multi-tenant base con settings JSONB)
   - organization_users (relación M:N con roles)
   - teams + team_members (colaboración)
   - roles (jerarquía + permisos JSONB)
   - applications (servicios del ecosistema) 
   - organization_applications (apps habilitadas por org)
   - subscription_plans + organization_subscriptions (monetización)
   - invitations (sistema de invitaciones con tokens)
   - api_keys (claves hasheadas con scopes)
   - system_events (audit trail completo)
   ```

2. **✅ ADMIN PANEL CORE COMPLETADO** - (Nov 21, 2025)
   ```
   ✅ FUNCIONAL AL 100% - 9 migraciones aplicadas:
   - Solución a recursión infinita en RLS
   - Sistema de bypass para platform admins
   - 15+ páginas de administración
   - 20+ componentes UI reutilizables
   - 12+ server actions con seguridad
   - CRUD completo de organizaciones, usuarios, teams, invitaciones, API keys
   - Testing exitoso en navegador
   - Production ready y escalable

   BONUS implementado:
   - ✅ 5 ENUMs para status consistentes
   - ✅ 20+ índices optimizados para performance
   - ✅ Triggers automáticos para updated_at
   - ✅ Constraints robustos con validaciones
   - ✅ Documentación completa con comentarios
   ```

#### 🔄 PRÓXIMOS PASOS TÉCNICOS (Consolidado desde Setup):

**2. Configuración Supabase Completa:**

- 🔄 Conectar con GitHub para migraciones automáticas
- 🔄 Configurar Storage buckets:
  - `documents` (privado, RLS)
  - `public-assets` (público)
  - `ai-training-data` (privado)

**3. RLS Policies (Multi-tenant Híbrido):**

- Usuario solo ve sus organizaciones
- Usuario solo ve miembros de sus organizaciones
- Solo org_admin puede modificar configuraciones
- Solo org_owner puede eliminar organización
- Platform admin puede acceder a todas las orgs

**4. Functions y Triggers:**

- `create_organization()`: Crea org + asigna owner + detecta tipo
- `invite_user()`: Genera token + envía invitación
- `accept_invitation()`: Agrega usuario a org
- `update_user_last_seen()`: Trigger automático
- Functions para manejo de créditos

**5. Datos Semilla:**

- Roles estándar (incluir roles platform: platform_super_admin, platform_admin,
  platform_billing)
- Aplicaciones del ecosistema (incluir ai_customer_service y ai_document_review)
- Planes de suscripción diferenciados B2C/B2B
- **Organización platform "TuPatrimonio Platform"**
- Super admin inicial
- Credit prices para servicios IA

**6. Stack y Configuración:**

```
GitHub → Netlify (Frontend + CI/CD automático)
GitHub → Supabase (Database + migraciones automáticas)

Monorepo Structure:
/apps/marketing      # Marketing site (tupatrimonio.app)
/apps/web           # App principal (app.tupatrimonio.app) 
/packages/ui        # Componentes compartidos Shadcn/UI
/packages/database  # Types de Supabase
/packages/utils     # Utilidades compartidas
/packages/config    # Configuraciones
/packages/ai        # Utilidades de IA (futuro)
```

**7. Variables de Entorno Esenciales:**

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# IA Services
OPENAI_API_KEY=
ANTHROPIC_API_KEY=
AI_MODEL_DEFAULT=claude-3-5-sonnet-20241022

# App URLs
NEXT_PUBLIC_APP_URL=https://app.tupatrimonio.app
NEXT_PUBLIC_MARKETING_URL=https://tupatrimonio.app

# Platform Configuration
PLATFORM_ORG_ID=
DEFAULT_PERSONAL_ORG_SETTINGS={}

# Servicios externos (placeholder)
STRIPE_SECRET_KEY=
SENDGRID_API_KEY=
TWILIO_ACCOUNT_SID=
VERIFF_API_KEY=
```

### 1.3 Sistema de Autenticación - ✅ **COMPLETADO AL 100%** (14 Nov 2025)

**Objetivo:** ✅ Auth robusto con múltiples métodos y verificación completa -
**LOGRADO**

#### ✅ Estado Actual - TODAS LAS MEJORES PRÁCTICAS IMPLEMENTADAS:

- ✅ Login con email/password funcionando
- ✅ **Logout funcional con ruta `/auth/signout`**
- ✅ **AuthListener global para sesiones expiradas**
- ✅ **Página de login con verificación del servidor** (Server Component)
- ✅ **Remember Me funcional** (persistencia de sesión)
- ✅ **Sistema completo de recuperación de contraseña**
- ✅ **Redirect inteligente después de login**
- ✅ **Reenvío de email de confirmación**
- ✅ **OAuth con GitHub** implementado
- ✅ Middleware de autenticación robusto
- ✅ Protección de rutas funcionando
- ✅ **Sistema PROBADO en navegador exitosamente**

#### ✅ Tareas Completadas (14 Nov 2025):

1. **✅ Ruta de Logout** - COMPLETADO
   ```typescript
   - ✅ Creado `/auth/signout/route.ts`
   - ✅ Formularios HTML POST funcionando
   - ✅ Limpieza de sesión correcta
   - ✅ Redirect automático al login
   ```

2. **✅ AuthListener Global** - COMPLETADO
   ```typescript
   - ✅ Componente `AuthListener.tsx` creado
   - ✅ Detecta sesiones expiradas (SIGNED_OUT)
   - ✅ Maneja refresh de tokens (TOKEN_REFRESHED)
   - ✅ Detecta cambios de usuario (USER_UPDATED)
   - ✅ Redirige automáticamente cuando expira sesión
   - ✅ Integrado en layout principal
   ```

3. **✅ Página de Login con Verificación** - COMPLETADO
   ```typescript
   - ✅ Convertido a Server Component
   - ✅ Verifica autenticación antes de mostrar formulario
   - ✅ Redirige a dashboard si ya está logeado
   - ✅ Separado en LoginPageClient (componente cliente)
   - ✅ OAuth con GitHub funcionando
   ```

4. **✅ Funcionalidad "Remember Me"** - COMPLETADO
   ```typescript
   - ✅ Checkbox conectado al backend
   - ✅ persistSession implementado en Supabase
   - ✅ Sesión por 30 días si marcado
   - ✅ Sesión temporal si no marcado
   ```

5. **✅ Sistema de Recuperación de Contraseña** - COMPLETADO
   ```typescript
   - ✅ Página `/login/forgot-password` creada
   - ✅ Ruta callback `/auth/reset-password` creada
   - ✅ Página `/reset-password` con formulario nuevo password
   - ✅ Función `resetPassword()` en actions
   - ✅ Validaciones completas
   - ✅ Mensajes de error amigables
   - ✅ Enlace en página de login
   ```

6. **✅ Redirect Después de Login** - COMPLETADO
   ```typescript
   - ✅ Middleware captura ruta original
   - ✅ Login actions acepta parámetro `redirectTo`
   - ✅ LoginPageClient captura y envía redirect
   - ✅ Usuario redirigido a ruta original después de login
   - ✅ Manejo de organizaciones múltiples
   ```

7. **✅ Reenvío de Email de Confirmación** - COMPLETADO
   ```typescript
   - ✅ Página `/login/resend-confirmation` creada
   - ✅ Función `resendConfirmationEmail()` implementada
   - ✅ UI amigable con mensajes claros
   - ✅ Para usuarios que no recibieron email inicial
   ```

8. **✅ Middleware y Protección de Rutas** - YA FUNCIONABA
   ```typescript
   - ✅ Verificar sesión en cada request
   - ✅ Redireccionar rutas protegidas
   - ✅ Protección de /dashboard/*
   - ✅ Redirect de / según autenticación
   - ✅ Verificación de permisos admin
   ```

9. **✅ Auth Helpers** - COMPLETOS
   ```typescript
   - ✅ getSession() implementado
   - ✅ getCurrentUser() implementado
   - ✅ getCurrentOrganization() implementado
   - ✅ Helpers de organización funcionando
   ```

10. **✅ Páginas de Auth** - TODAS CREADAS
    - ✅ `/login` - Completo con OAuth GitHub
    - ✅ `/login/forgot-password` - Recuperación de contraseña
    - ✅ `/reset-password` - Nueva contraseña
    - ✅ `/login/resend-confirmation` - Reenviar email
    - ✅ `/auth/callback` - Callback OAuth funcionando
    - ✅ `/auth/signout` - Logout funcionando

#### ✅ COMPLETADO EN TIEMPO RÉCORD:

- **Todas las funcionalidades**: 1 día
- **Testing completo**: Mismo día
- **Sin errores de linter**: ✅

#### 🎯 Criterios de Completitud - TODOS CUMPLIDOS:

- ✅ Usuario puede registrarse y crear organización
- ✅ Usuario puede hacer login con email/password
- ✅ Usuario puede hacer login con GitHub OAuth
- ✅ Usuario puede recuperar contraseña olvidada
- ✅ Sesiones expiran y redirigen automáticamente
- ✅ Remember Me funciona correctamente
- ✅ Redirect inteligente después de login
- ✅ Flujo de onboarding claro y sin fricciones (Personal + Empresa)
- ✅ Middleware maneja correctamente todos los estados
- ✅ Testing completo realizado en navegador
- ✅ **PRODUCCIÓN READY** 🚀

### 1.4 Dashboard Base y Navegación

**Objetivo:** UI foundation con cambio de contexto organizacional

#### Implementación:

1. **Layout Principal**
   - Sidebar con navegación (incluir secciones de IA)
   - Organization Switcher (dropdown)
   - User menu
   - Notification bell (placeholder)

2. **Dashboard Home**
   - Widgets de métricas básicas
   - Actividad reciente
   - Quick actions (incluir "Hablar con IA" y "Analizar documento")

3. **Componentes Base (Shadcn/UI)**
   ```
   - Button, Input, Select, Checkbox, etc.
   - DataTable (con sorting, filtering, pagination)
   - Modal, Sheet, Dialog
   - Toast notifications
   - Command palette (Cmd+K)
   - Chat widget component (para customer service) ← NUEVO
   - Document viewer component (para review results) ← NUEVO
   ```

4. **Configuración de Temas**
   - Light/Dark mode
   - Persistencia en user.preferences

---

## 🔧 Fase 2: Sistema de Créditos y Facturación (Semanas 11-16) - **✅ COMPLETADA AL 100%** (22 Nov 2025)

**Nota:** ✅ Schema core ya completado, podemos proceder directamente con
credits + billing

### 2.1 Schema Credits + Billing - **✅ COMPLETADO** ✅

**Objetivo:** Sistema de monetización completo - **LOGRADO**

#### ✅ Implementación COMPLETADA:

1. **✅ Schema `core` YA COMPLETADO** (organizations, subscription_plans,
   organization_subscriptions)
2. **✅ Schemas `credits` y `billing` CREADOS Y FUNCIONANDO** - **COMPLETADO**
   ```sql
   Credits:
   - credit_accounts
   - credit_transactions
   - credit_packages
   - credit_prices (incluir precios para servicios IA) ← ACTUALIZADO

   Billing:
   - payment_methods
   - invoices
   - invoice_line_items
   - payments
   - tax_rates
   ```

3. **Credit Prices para IA Services** ← NUEVO
   ```sql
   -- Precios específicos para servicios de IA
   INSERT INTO credits.credit_prices (service_code, application_code, operation, credit_cost) VALUES
   ('ai_chat_message', 'ai_customer_service', 'send_message', 0.5),
   ('ai_chat_message_kb', 'ai_customer_service', 'send_message_with_kb', 1.0),
   ('ai_document_review_page', 'ai_document_review', 'review_page', 2.0),
   ('ai_document_review_full', 'ai_document_review', 'review_document', 10.0),
   ('ai_document_compare', 'ai_document_review', 'compare_documents', 15.0);
   ```

4. **✅ Integración Stripe COMPLETA**
   ```typescript
   ✅ setupIntent para guardar payment methods
   ✅ Webhooks: payment_intent.succeeded, customer.subscription.*
   ✅ Manejo de 3D Secure
   ✅ Sincronización de invoices
   ✅ Payment Intents para compra de créditos
   ✅ Service role client para webhooks (bypass RLS)
   ```

5. **✅ Integración dLocal Go COMPLETA**
   ```typescript
   ✅ Flujo para LATAM
   ✅ Métodos locales: Tarjeta (CARD) y Transferencia Bancaria (BANK_TRANSFER)
   ✅ Webhooks para confirmaciones
   ✅ Fallback a Stripe si dLocal falla
   ✅ Creación de pagos dLocal
   ✅ Manejo de estados de pago
   ✅ Componente DLocalCheckout con estado de loading
   ✅ Construcción robusta de URLs (baseUrl con múltiples fallbacks)
   ✅ Corrección de schema: uso de vistas públicas en lugar de .schema('billing')
   ✅ Métodos de pago configurados por país (CL, AR, CO, MX, PE)
   ✅ Opción de pago en efectivo deshabilitada (solo CARD y BANK_TRANSFER)
   ```

6. **✅ Lógica de Créditos COMPLETA**
   ```typescript
   ✅ reserveCredits(): Bloquea créditos antes de operación + verificación auto-recarga
   ✅ confirmCredits(): Confirma uso después de éxito
   ✅ releaseCredits(): Libera si falla operación
   ✅ addCredits(): Agrega créditos desde compra/suscripción
   ✅ Verificación automática de auto-recarga antes de reservar
   ✅ Sistema de notificaciones integrado
   ```

### 2.2 UI de Facturación - **✅ COMPLETADA AL 100%**

**Objetivo:** Experiencia de usuario para gestión de pagos - **LOGRADO**

#### ✅ Páginas IMPLEMENTADAS Y FUNCIONANDO:

1. **✅ `/billing` (overview)**
   - ✅ Balance de créditos en tiempo real
   - ✅ Próxima factura
   - ✅ Métodos de pago guardados
   - ✅ Estado de auto-recarga
   - ✅ Enlaces a todas las secciones

2. **✅ `/billing/purchase-credits`**
   - ✅ Lista de paquetes disponibles
   - ✅ Precios por moneda (CLP, USD, MXN, COP, etc.)
   - ✅ Checkout flow completo (Stripe + dLocal)
   - ✅ Detección automática de país para método de pago
   - ✅ Componente DLocalCheckout con loading states mejorados
   - ✅ Selección de método de pago (CARD o BANK_TRANSFER)
   - ✅ Construcción robusta de URLs para dLocal Go API

3. **✅ `/billing/invoices`**
   - ✅ Lista de facturas con filtros
   - ✅ Vista de detalle completa
   - ✅ **Generación y descarga de PDF** (jsPDF)
   - ✅ Historial de pagos
   - ✅ Estados de factura

4. **✅ `/billing/payment-methods`**
   - ✅ Agregar métodos de pago (Stripe + dLocal)
   - ✅ Eliminar métodos
   - ✅ Marcar como default
   - ✅ Lista de métodos guardados

5. **✅ `/billing/subscription`**
   - ✅ Plan actual
   - ✅ Cambio de plan
   - ✅ Cancelación de suscripción
   - ✅ Historial de suscripciones

6. **✅ `/billing/settings`**
   - ✅ Configuración de auto-recarga
   - ✅ Threshold y monto configurable
   - ✅ Selección de método de pago para auto-recarga

7. **✅ `/billing/usage`**
   - ✅ Gráficos de uso por servicio
   - ✅ Breakdown de créditos consumidos
   - ✅ Export de datos (CSV)
   - ✅ Filtros por fecha

### ✅ **FUNCIONALIDADES ADICIONALES IMPLEMENTADAS:**

**✅ Sistema de Auto-Recarga:**

- ✅ Verificación automática antes de reservar créditos
- ✅ Ejecución automática cuando balance < threshold
- ✅ Configuración por organización
- ✅ Notificaciones de ejecución y fallos

**✅ Sistema de Notificaciones de Billing:**

- ✅ Schema `core.notifications` completo
- ✅ 13 tipos de notificaciones soportados
- ✅ Integración con webhooks de Stripe y dLocal
- ✅ Notificaciones para: créditos agregados, pagos exitosos/fallidos,
  auto-recarga, suscripciones, facturas
- ✅ Componentes UI: NotificationBell, NotificationsList
- ✅ Endpoints de API para gestión

**✅ Generación de PDFs:**

- ✅ Facturas en formato PDF profesional
- ✅ Usando jsPDF (compatible con Next.js)
- ✅ Incluye: header con marca, información de factura, items, totales, footer
- ✅ Descarga y visualización en navegador

**✅ Migraciones Aplicadas:**

- ✅ `20251121220000_schema-credits.sql` - Schema completo de créditos
- ✅ `20251121220001_schema-billing.sql` - Schema completo de billing
- ✅ `20251121220002_credits-functions.sql` - Funciones SQL (reserve, confirm,
  release, add)
- ✅ `20251121220003_credits-billing-rls.sql` - Políticas RLS completas
- ✅ `20251121220004_seed-credits-billing.sql` - Datos iniciales (paquetes,
  precios)
- ✅ `20251121220005_add-credits-to-plans.sql` - Créditos en planes de
  suscripción
- ✅ `20251122000001_schema-notifications.sql` - Schema de notificaciones
- ✅ `20251122000002_notifications-rls.sql` - RLS para notificaciones
- ✅ `20251122000003_notifications-functions.sql` - Funciones SQL de
  notificaciones
- ✅ `20251122000004_expose-notifications-view.sql` - Vista pública de
  notificaciones

**✅ Testing Completo:**

- ✅ Flujo completo de compra probado (Stripe test cards)
- ✅ Webhooks funcionando correctamente
- ✅ Créditos agregándose automáticamente
- ✅ Facturas generándose correctamente
- ✅ PDFs generándose y descargándose
- ✅ Auto-recarga verificada y funcionando
- ✅ Notificaciones creándose en eventos de billing

**📄 Documentación:**

- ✅ `docs/STRIPE-WEBHOOK-SETUP.md` - Guía de configuración de webhooks
- ✅ `docs/BILLING-NOTIFICATIONS.md` - Sistema de notificaciones documentado
- ✅ Scripts PowerShell para facilitar testing local

**🎯 RESULTADO FINAL:**

- ✅ Sistema de créditos y billing 100% funcional y probado
- ✅ Integraciones Stripe y dLocal operativas
- ✅ Webhooks configurados y funcionando
- ✅ UI completa para gestión de facturación
- ✅ Auto-recarga con verificación automática
- ✅ Sistema de notificaciones integrado
- ✅ Generación de PDFs funcionando
- ✅ **LISTO PARA PRODUCCIÓN** 🚀

**Paralelamente durante Fase 2:**

- Continuar publicando 2 blog posts/semana (incluir 1 sobre IA cada 2 semanas)
- Optimizar landings según analytics
- Responder comentarios y engagement en blog
- Guest posting (1-2 artículos, uno sobre IA)

---

## 📧 Fase 3: Comunicaciones y CRM (Semanas 17-22) 🚀 EN PROGRESO

> **📝 NOTA IMPORTANTE (Nov 2025):** Se implementó una **versión básica del
> CRM** al final de Fase 0 para gestionar los leads de los formularios y
> conectar el email del workspace. Esta sección describe el CRM completo que se
> está desarrollando en Fase 3 con funcionalidades avanzadas.

**CRM Básico Fase 0 (COMPLETADO):**

- ✅ Vista de contactos de formularios
- ✅ Sistema de estados básico
- ✅ Integración con email workspace (Google/Microsoft)
- ✅ Responder correos desde dashboard
- ✅ Notificaciones de nuevos leads

**CRM Completo Fase 3 (COMPLETADO - Dic 2025):**

- ✅ Gestión avanzada de contactos (páginas creadas)
- ✅ Pipelines de ventas (deals implementado)
- ✅ Campañas de email marketing (COMPLETADO - separado como aplicación
  independiente)
- ✅ Sistema de visibilidad de aplicaciones integrado en `core.applications`
- 📋 Automatizaciones (pendiente)
- 📋 Reportes y analytics avanzados (pendiente)

---

### 3.1 Schema Communications ✅ COMPLETADO (Dic 2025)

**Objetivo:** Sistema completo de comunicación con usuarios - Arquitectura
Multi-Canal

#### Arquitectura Implementada:

**✅ Schema Compartido `communications`** - Diseñado para múltiples canales:

```sql
✅ Migración: 20251123191316_schema_communications.sql
- ✅ contact_lists (listas de contactos COMPARTIDAS entre todos los canales)
- ✅ contact_list_members (M:N entre listas y contactos)
- ✅ message_templates (templates con campo 'type': email, sms, whatsapp)
- ✅ campaigns (campañas - tipo heredado del template)
- ✅ campaign_messages (mensajes enviados - email/sms/whatsapp)
- ✅ message_events (eventos unificados: delivered, opened, clicked, bounced)
- ✅ user_notifications (notificaciones in-app mejoradas)
- ✅ notification_preferences (preferencias por usuario)
- ✅ sendgrid_accounts (cuentas SendGrid por organización, encriptadas)

✅ Enum template_type soporta múltiples canales:
CREATE TYPE communications.template_type AS ENUM (
  'email',        -- Email
  'sms',          -- SMS (futuro)
  'whatsapp'      -- WhatsApp (futuro)
);
```

**✅ Aplicaciones Separadas en `core.applications`:**

- ✅ `email_marketing` - Controla campañas/templates tipo 'email'
- 📋 `whatsapp_marketing` - Futuro: Controla campañas/templates tipo 'whatsapp'
- 📋 `sms_marketing` - Futuro: Controla campañas/templates tipo 'sms'

**✅ Estructura de URLs Implementada:**

```
/dashboard/communications/
├── email/              → email_marketing app
│   ├── campaigns/
│   └── templates/
├── whatsapp/          → whatsapp_marketing app (futuro)
│   ├── campaigns/
│   └── templates/
├── sms/               → sms_marketing app (futuro)
│   ├── campaigns/
│   └── templates/
├── lists/             → Compartido (controlado por cualquier app activa)
└── analytics/         → Compartido (unificado para todos los canales)
```

**✅ Ventajas de la Arquitectura:**

- ✅ Monetización granular por canal (cobrar WhatsApp, SMS, Email por separado)
- ✅ Listas de contactos compartidas (reutilización entre canales)
- ✅ Analytics unificado (comparación de rendimiento entre canales)
- ✅ Escalable (agregar nuevos canales = agregar app + filtros por type)
- ✅ Control de visibilidad independiente por canal desde `/admin/applications`

#### Implementación:

1. **✅ Crear schema `communications`** - COMPLETADO

2. **✅ Integración SendGrid Multi-Tenant** - COMPLETADO
   ```typescript
   ✅ Implementado:
   - ✅ Wrapper para API de SendGrid (`lib/sendgrid/client.ts`)
   - ✅ Gestión de cuentas por organización (`lib/sendgrid/accounts.ts`)
   - ✅ Encriptación AES-256-GCM para API keys (`lib/crypto.ts`)
   - ✅ Procesar webhooks: delivered, opened, clicked, bounced (`api/communications/sendgrid/webhook/route.ts`)
   - ✅ Verificación de API keys (`api/communications/sendgrid/account/verify/route.ts`)
   - ✅ Retry logic con exponential backoff (pendiente en producción)
   - ✅ Rate limiting según plan de SendGrid (pendiente en producción)
   ```

3. **✅ Motor de Templates** - COMPLETADO
   ```typescript
   ✅ Implementado:
   - ✅ Template engine Handlebars (`lib/communications/template-engine.ts`)
   - ✅ Variables dinámicas: {{user.name}}, {{organization.name}}, {{contact.email}}
   - ✅ Helpers personalizados para formateo
   - ✅ Validación de sintaxis de templates
   - ✅ Extracción automática de variables
   - 📋 Versionado de templates (pendiente)
   - 📋 Preview antes de enviar (pendiente)
   ```

4. **✅ Sistema de Notificaciones** - COMPLETADO (Base)
   ```typescript
   ✅ Implementado:
   - ✅ Tabla user_notifications con tipos específicos
   - ✅ API routes para gestión (`api/communications/notifications/route.ts`)
   - ✅ Marcar como leído (`api/communications/notifications/[id]/read/route.ts`)
   - 📋 Supabase Realtime para notificaciones live (pendiente)
   - 📋 Agrupación de notificaciones similares (pendiente)
   - 📋 Notificaciones específicas de IA (pendiente)
   ```

### 3.2 UI de CRM ✅ COMPLETADO (Dic 2025)

**Objetivo:** Herramientas de gestión de contactos y ventas

#### Páginas Implementadas:

1. **✅ `/dashboard/crm`** - Dashboard principal del CRM
   - ✅ Estadísticas en tiempo real (contactos, empresas, deals, tickets)
   - ✅ Accesos rápidos a todas las secciones
   - ✅ Diseño consistente con el resto del dashboard

2. **✅ `/dashboard/crm/contacts`** - COMPLETADO
   - ✅ Lista de contactos con estado vacío
   - ✅ Botón para crear nuevo contacto
   - ✅ Integrado con helper `getUserActiveOrganization()`
   - 📋 Filtros avanzados (pendiente)
   - 📋 Importar desde CSV (pendiente)
   - 📋 Enriquecimiento de datos (pendiente)

3. **✅ `/dashboard/crm/companies`** - COMPLETADO (ya existía)
   - ✅ Lista de empresas funcionando
   - ✅ CRUD completo implementado

4. **✅ `/dashboard/crm/deals`** - COMPLETADO
   - ✅ Lista de deals con badges de estado
   - ✅ Botón para crear nuevo deal
   - ✅ Integrado con helper `getUserActiveOrganization()`

5. **✅ `/dashboard/crm/tickets`** - COMPLETADO
   - ✅ Lista de tickets con badges de estado y prioridad
   - ✅ Botón para crear nuevo ticket
   - ✅ Integrado con helper `getUserActiveOrganization()`

6. **✅ `/dashboard/crm/products`** - COMPLETADO
   - ✅ Lista de productos con badges de estado
   - ✅ Botón para crear nuevo producto
   - ✅ Integrado con helper `getUserActiveOrganization()`

7. **✅ `/dashboard/communications/email/campaigns`** - COMPLETADO (Dic 2025)
   - ✅ Lista de campañas de email marketing
   - ✅ Botón para crear nueva campaña
   - ✅ Estado vacío con mensaje apropiado
   - ✅ Protección por aplicación `email_marketing`
   - ✅ Rutas: `/campaigns`, `/campaigns/new`, `/campaigns/[id]`

8. **✅ `/dashboard/communications/email/templates`** - COMPLETADO (Dic 2025)
   - ✅ Lista de templates de email
   - ✅ Botón para crear nuevo template
   - ✅ Integrado con helper `getUserActiveOrganization()`
   - ✅ Protección por aplicación `email_marketing`
   - ✅ Rutas: `/templates`, `/templates/new`, `/templates/[id]`

9. **✅ `/dashboard/communications/lists`** - COMPLETADO (Dic 2025)
   - ✅ Lista de listas de contactos (COMPARTIDAS entre canales)
   - ✅ Botón para crear nueva lista
   - ✅ Integrado con helper `getUserActiveOrganization()`
   - ✅ Protección por aplicación `email_marketing` (por ahora)
   - ✅ Rutas: `/lists`, `/lists/new`, `/lists/[id]`

10. **✅ `/dashboard/communications/analytics`** - COMPLETADO (Dic 2025)
    - ✅ Dashboard de analytics de comunicaciones (UNIFICADO para todos los
      canales)
    - ✅ Métricas: campañas enviadas, emails enviados, tasas de apertura/clics
    - ✅ Estado vacío cuando no hay datos
    - ✅ Protección por aplicación `email_marketing` (por ahora)

11. **✅ `/dashboard/crm/settings/sendgrid`** - COMPLETADO
    - ✅ Configuración de cuenta SendGrid por organización
    - ✅ Verificación de API keys
    - ✅ Encriptación automática de credenciales

#### Páginas Implementadas Adicionales:

- ✅ `/dashboard/communications/email/campaigns/[id]` - Detalle y gestión de
  campaña
- ✅ `/dashboard/communications/email/templates/[id]` - Edición de template con
  preview
- ✅ `/dashboard/communications/lists/[id]` - Gestión de miembros de lista

#### Páginas Pendientes:

- 📋 `/dashboard/crm/contacts/:id` - Perfil detallado de contacto
- 📋 `/dashboard/crm/pipelines` - Kanban de deals (futuro)
- 📋 `/dashboard/communications/whatsapp/` - Futuro: Campañas y templates de
  WhatsApp
- 📋 `/dashboard/communications/sms/` - Futuro: Campañas y templates de SMS

**Paralelamente durante Fase 3:**

- Lanzar primer pillar content piece sobre IA
- Comenzar link building activo
- Crear primer lead magnet interactivo (calculadora ROI chatbot)
- A/B testing de CTAs en landings

---

## ⚙️ Fase 4: Workflows y Manejo de Errores (Semanas 23-28)

### 4.1 Schema Workflows

**Objetivo:** Sistema de automatización tipo Make.com

#### Implementación:

1. **Crear schema `workflows`**
   ```sql
   - workflows
   - workflow_executions
   - workflow_execution_steps
   - error_logs
   - service_health
   - circuit_breakers
   - retry_queue
   - webhooks
   - webhook_deliveries
   ```

2. **Motor de Ejecución**
   ```typescript
   WorkflowEngine:
   - Interpreta JSON definition
   - Ejecuta nodos secuencialmente/paralelo
   - Maneja condiciones y branches
   - Implementa circuit breakers
   - Retry logic con backoff
   - Timeout handling
   ```

3. **Tipos de Nodos**
   ```typescript
   - Trigger: webhook, schedule, event, manual
   - Action: api_call, email, create_record, update_record
   - Condition: if/else basado en datos
   - Transform: mapear/transformar datos
   - Delay: esperar X tiempo
   - Loop: iterar sobre array
   - AI Action: call_chatbot, analyze_document ← NUEVO
   ```

4. **Monitoreo de Servicios**
   ```typescript
   HealthCheck Service:
   - Ping cada servicio externo cada 5min (incluir APIs de IA)
   - Registrar en service_health
   - Abrir circuit breaker si falla threshold
   - Alertar a admins
   - Dashboard de estado
   ```

5. **Sistema de Reintentos**
   ```typescript
   RetryQueue Processor:
   - Job queue (BullMQ o similar)
   - Procesar retry_queue periódicamente
   - Estrategias: immediate, linear, exponential
   - Max attempts configurable
   - Dead letter queue para fallos permanentes
   ```

### 4.2 UI de Workflows

**Objetivo:** Visual workflow builder

#### Páginas:

1. **`/workflows`**
   - Lista de workflows
   - Filtros por status/trigger
   - Quick actions
   - Templates pre-hechos (incluir templates con IA) ← NUEVO

2. **`/workflows/builder`**
   - Drag & drop node-based editor (React Flow)
   - Panel de nodos disponibles (incluir nodos de IA)
   - Configuración por nodo
   - Test workflow
   - Save & Activate

3. **`/workflows/:id/executions`**
   - Historial de ejecuciones
   - Timeline de pasos
   - Logs detallados (incluir tokens usados si hay IA)
   - Retry manual

4. **`/monitoring/services`**
   - Dashboard de salud
   - Circuit breakers status
   - Error rate por servicio (incluir OpenAI/Anthropic)
   - Latency graphs

5. **`/monitoring/errors`**
   - Log explorer
   - Filtros por severity/service
   - Marcar como resuelto
   - Export logs

**Workflow Templates Sugeridos con IA:** ← NUEVO

```
1. "Auto-responder con IA"
   Trigger: Nuevo mensaje en chat
   → Analizar intención con IA
   → Si confianza > 80%: Responder automáticamente
   → Si confianza < 80%: Transferir a humano

2. "Análisis de contrato + notificación"
   Trigger: Nuevo documento subido
   → Analizar con IA Document Review
   → Si riesgo > "medium": Notificar equipo legal
   → Crear tarea en CRM

3. "Seguimiento inteligente de leads"
   Trigger: Lead descarga recurso
   → Analizar comportamiento con IA
   → Enviar email personalizado según perfil
   → Asignar a sales rep apropiado
```

**Paralelamente durante Fase 4:**

- Segundo cluster de contenido (sobre IA)
- Case studies de beta users
- Webinar o demo en vivo (enfoque en automatización con IA)
- Actualizar contenido según feedback

---

## 📁 Fase 5: Gestión de Archivos y Storage (Semanas 29-33)

### 5.1 Schema Files + Integración Storage

**Objetivo:** Sistema centralizado de archivos con versionado

#### Implementación:

1. **Crear schema `files`**
   ```sql
   - file_storage
   - file_versions
   - file_shares
   ```

2. **Abstracción de Storage**
   ```typescript
   StorageProvider Interface:
   - upload(file, path)
   - download(path)
   - delete(path)
   - getSignedUrl(path, expiresIn)
   - listVersions(path)

   Implementaciones:
   - SupabaseStorageProvider
   - S3StorageProvider
   - FirebaseStorageProvider
   ```

3. **Versionado Automático**
   ```typescript
   - Cada update crea nueva versión
   - Mantener X versiones (configurable)
   - Limpieza automática de versiones antiguas
   - Restaurar versión anterior
   ```

4. **Seguridad de Archivos**
   ```typescript
   - Virus scanning (ClamAV via Lambda/Cloud Function)
   - Encriptación en reposo (KMS)
   - Signed URLs con expiración
   - Watermarks para documentos sensibles
   ```

5. **Optimizaciones (Supabase + Netlify Automático)**
   ```typescript
   // Automático con Supabase Storage:
   - Compresión de imágenes
   - Generación de thumbnails
   - CDN global automático

   // Configurar manualmente:
   - OCR para documentos (preparación para IA Review)
   ```

### 5.2 UI de Gestión de Archivos

**Objetivo:** Drive-like experience

#### Páginas:

1. **`/files`**
   - Vista de lista/grid
   - Drag & drop upload
   - Carpetas virtuales (tags)
   - Preview modal
   - Quick actions: "Analizar con IA" ← NUEVO

2. **`/files/:id`**
   - Detalles del archivo
   - Historial de versiones
   - Compartir con usuarios/links
   - Actividad reciente
   - Análisis de IA (si aplica) ← NUEVO

---

## 🔐 Fase 6: Auditoría y Compliance (Semanas 34-38)

### 6.1 Schema Audit

**Objetivo:** Trazabilidad completa para compliance

#### Implementación:

1. **Crear schema `audit`**
   ```sql
   - audit_logs
   - compliance_documents
   - user_consents
   - data_retention_policies
   ```

2. **Audit Logging Automático**
   ```typescript
   - Middleware que registra toda acción sensible
   - Trigger en BD para cambios críticos
   - Capturar: user, org, action, resource, changes, IP, timestamp
   - Inmutable: solo INSERT
   - Registrar uso de IA (qué modelo, tokens, prompts si corresponde) ← NUEVO
   ```

3. **Compliance Tools**
   ```typescript
   - Exportar datos de usuario (GDPR)
   - Anonimizar usuario
   - Eliminar datos según retention policy
   - Generar reporte de compliance
   - Auditoría de uso de IA (transparencia) ← NUEVO
   ```

4. **Gestión de Consentimientos**
   ```typescript
   - Banner de cookies
   - Términos y condiciones con versionado
   - Registro de aceptación con IP y timestamp
   - Revocación de consentimientos
   - Consentimiento de uso de IA para análisis ← NUEVO
   ```

### 6.2 UI de Auditoría

**Objetivo:** Herramientas para compliance officers

#### Páginas:

1. **`/audit/logs`**
   - Log explorer avanzado
   - Filtros: user, resource, date range, action
   - Export a CSV/JSON
   - Filtro específico: "AI usage" ← NUEVO

2. **`/audit/data-requests`**
   - GDPR requests
   - Procesar solicitudes de datos
   - Timeline de procesamiento

3. **`/settings/compliance`**
   - Políticas de retención
   - Documentos legales activos
   - Estadísticas de consentimientos
   - Transparency report (uso de IA) ← NUEVO

---

## 🎯 Fase 7: Servicios de Negocio - Firmas Electrónicas (Semanas 39-46)

### 7.1 Schema Signatures + Integración Veriff

**Objetivo:** Primer servicio core del ecosistema

#### Implementación:

1. **Crear schema `signatures`**
   ```sql
   - signature_documents
   - signature_signers
   - signature_workflows
   - signature_templates
   - signature_certificates
   ```

2. **Integración Veriff**
   ```typescript
   - Iniciar sesión de verificación
   - Webhook para resultados
   - Almacenar evidencias en files schema
   - Link con user en core schema
   ```

3. **Flujo de Firma**
   ```typescript
   CreateSignatureRequest:
   1. Upload documento → files schema
   2. Agregar firmantes
   3. (Opcional) Verificar identidad con Veriff
   4. Enviar invitaciones → communications schema
   5. Tracking de firmas
   6. Generar certificado final
   7. Notarizar (si aplica) → notary schema
   8. Consumir créditos → credits schema
   ```

4. **Tipos de Firma**
   ```typescript
   - Firma Simple (email verification)
   - Firma Avanzada (SMS OTP via Twilio)
   - Firma con Certificado (integración CA)
   - Firma Biométrica (Veriff)
   ```

### 7.2 UI de Firmas

**Objetivo:** Experiencia fluida de firma de documentos

#### Páginas:

1. **`/signatures`**
   - Documentos pendientes/completados
   - Crear nuevo documento
   - Templates

2. **`/signatures/new`**
   - Upload documento
   - Agregar firmantes
   - Configurar orden de firma
   - Establecer deadline
   - Preview

3. **`/signatures/:id`**
   - Estado del documento
   - Tracking de firmantes
   - Preview del documento
   - Descargar certificado

4. **`/sign/:token`**
   - Página pública para firmar
   - Verificación de identidad
   - Canvas de firma
   - Confirmar firma

5. **`/settings/signature-templates`**
   - Templates de documentos
   - Campos predefinidos

**Nota:** Al lanzar este servicio, actualizar:

- Landing de firmas con features reales
- Blog post anunciando lanzamiento
- Case studies de early adopters
- Video tutorial completo

---

## 🔍 Fase 8: Servicios Complementarios (Semanas 47-60)

### 8.1 App-Verifications (Semanas 47-49)

**Objetivo:** Sistema de verificación de identidad standalone

#### Implementación:

1. **Schema `verifications`**
   ```sql
   - verification_requests
   - verification_results
   - verification_documents
   - identity_records
   ```

2. **Lógica de Negocio**
   - Crear request → llamar Veriff
   - Procesar webhooks
   - Almacenar resultados + evidencia
   - Marcar user como verificado en core schema

3. **API Endpoints**
   ```typescript
   POST /api/verifications/start
   GET /api/verifications/:id/status
   GET /api/verifications/:id/result
   ```

### 8.2 App-Notary (Semanas 50-52)

**Objetivo:** Servicios notariales digitales

#### Implementación:

1. **Schema `notary`**
   ```sql
   - notary_certificates
   - notary_timestamps
   - notary_chains
   ```

2. **Lógica de Negocio**
   - Timestamp notarial
   - Hash del documento
   - Blockchain anchoring (opcional)
   - Certificado de autenticidad

### 8.3 App-Documents Editor (Semanas 53-55)

**Objetivo:** Editor colaborativo de documentos

#### Implementación:

1. **Schema `documents`**
   ```sql
   - documents
   - document_collaborators
   - document_comments
   - document_versions (linked to files schema)
   ```

2. **Editor**
   - Integrar TipTap o similar
   - Colaboración en tiempo real (Supabase Realtime)
   - Track changes
   - Comentarios

### 8.4 App-Real Estate Consulting (Semanas 56-57)

**Objetivo:** CRM específico para inmobiliarias

#### Implementación:

1. **Schema `real_estate`**
   ```sql
   - properties
   - property_visits
   - property_offers
   - property_documents
   ```

2. **Features específicas**
   - Catálogo de propiedades
   - Gestión de visitas
   - Pipeline de ofertas
   - Documentos asociados

### 8.5 App-Property Administration (Semanas 58-60)

**Objetivo:** Gestión de arriendos y condominios

#### Implementación:

1. **Schema `property_admin`**
   ```sql
   - rental_contracts
   - tenants
   - payment_schedules
   - maintenance_requests
   - common_expenses
   ```

---

## 🤖 **Fase 9: Servicios de IA - Customer Service (Semanas 61-66)**

### **Objetivo:** Chatbot inteligente 24/7 para atención al cliente

Esta es una fase crítica ya que es uno de los diferenciadores principales del
producto.

### 9.1 Schema AI Customer Service

**Objetivo:** Base de datos para chatbot conversacional

#### Implementación:

1. **Crear schema `ai_customer_service`**
   ```sql
   -- Habilitar pgvector extension primero
   CREATE EXTENSION IF NOT EXISTS vector;

   -- Tablas principales
   - chatbot_configurations
   - knowledge_bases
   - knowledge_base_chunks (con columna VECTOR)
   - conversations
   - conversation_messages
   - conversation_feedback
   - chatbot_analytics
   ```

2. **Configuración de pgvector**
   ```sql
   -- Índice para búsqueda vectorial eficiente
   CREATE INDEX ON ai_customer_service.knowledge_base_chunks 
   USING ivfflat (embedding vector_cosine_ops)
   WITH (lists = 100);
   ```

3. **Integración OpenAI/Anthropic**
   ```typescript
   AIProvider Interface:
   - chat(messages, model, options)
   - embed(text, model)
   - streamChat(messages, model, onChunk)

   Implementaciones:
   - OpenAIProvider (GPT-4)
   - AnthropicProvider (Claude 3.5 Sonnet) - RECOMENDADO

   Razones para Claude:
   - Mejor comprensión de contexto largo
   - Menos alucinaciones
   - Mejor en español
   - Más económico para uso intensivo
   ```

4. **Sistema RAG (Retrieval Augmented Generation)**
   ```typescript
   RAGEngine:
   - ingestDocument(document) → chunks → embeddings
   - searchSimilar(query, topK) → relevant chunks
   - buildContext(chunks) → formatted context
   - generateResponse(query, context) → answer

   Pipeline:
   1. Usuario pregunta
   2. Embed pregunta
   3. Buscar chunks similares (cosine similarity)
   4. Construir contexto con top 5 chunks
   5. Enviar a LLM con contexto
   6. Recibir respuesta fundamentada
   ```

5. **Knowledge Base Management**
   ```typescript
   KnowledgeBaseService:
   - addDocument(file) → parse → chunk → embed → store
   - updateDocument(id, newContent)
   - deleteDocument(id)
   - syncFromURL(url) → scrape → process
   - syncFromNotion(notionPageId)

   Chunking strategies:
   - Fixed size: 500 tokens con 50 overlap
   - Semantic: Por párrafos/secciones
   - Recursive: Dividir recursivamente si muy grande
   ```

6. **Conversation Management**
   ```typescript
   ConversationService:
   - startConversation(userId, channel)
   - sendMessage(conversationId, content)
   - getHistory(conversationId, limit)
   - transferToHuman(conversationId, reason)
   - endConversation(conversationId)

   Features:
   - Context window management (últimos 10 mensajes)
   - Intent detection
   - Sentiment analysis
   - Escalation triggers
   ```

7. **Channels Integration**
   ```typescript
   Channels a soportar:
   - Web Widget (embeddable)
   - WhatsApp Business (Twilio)
   - Slack
   - Telegram (futuro)
   - Email (futuro)

   Abstracción:
   ChannelAdapter Interface:
   - sendMessage(to, message)
   - receiveMessage(webhook)
   - supports(messageType)
   ```

### 9.2 UI de AI Customer Service

**Objetivo:** Configuración y monitoreo del chatbot

#### Páginas:

1. **`/ai/chat/dashboard`**
   ```
   Métricas principales:
   - Conversaciones hoy/semana/mes
   - Tasa de resolución (AI vs humano)
   - Tiempo promedio de respuesta
   - Satisfaction score
   - Top intents detectados
   - Gráficos de uso por hora
   ```

2. **`/ai/chat/conversations`**
   ```
   Features:
   - Lista de conversaciones (filtros: estado, channel, fecha)
   - Live conversations (en tiempo real)
   - Takeover: Admin puede tomar control
   - Transcript export
   - Tags y categorización
   ```

3. **`/ai/chat/conversations/:id`**
   ```
   Vista detallada:
   - Transcript completo
   - Metadata: duración, mensajes, canal
   - Intent tracking
   - Sentiment timeline
   - Sources used (qué chunks de KB)
   - Feedback del usuario
   - Actions: Transfer, Close, Add note
   ```

4. **`/ai/chat/knowledge-base`**
   ```
   Gestión de conocimiento:
   - Lista de documentos/URLs ingresados
   - Upload nuevo documento
   - Sync desde URL (scheduled)
   - Integración Notion
   - Previsualizar chunks
   - Test search (debugging)
   - Analytics: chunks más usados
   ```

5. **`/ai/chat/knowledge-base/:id`**
   ```
   Detalle de documento:
   - Metadata
   - Content preview
   - Chunks breakdown
   - Usage stats
   - Re-index button
   - Delete con confirmación
   ```

6. **`/ai/chat/settings`**
   ```
   Configuración del chatbot:

   General:
   - Nombre del bot
   - Avatar
   - Bienvenida
   - Horario de operación

   AI Configuration:
   - Model selection (GPT-4, Claude 3.5)
   - Temperature (0-1)
   - Max tokens
   - System prompt customization

   Personality:
   - Tone (profesional, casual, friendly)
   - Language (es-CL, es-MX, en)
   - Custom instructions

   Escalation Rules:
   - Confidence threshold para transferir
   - Keywords que disparan transferencia
   - Usuarios/equipos para asignar

   Channels:
   - Enable/disable por canal
   - Configuración específica (WhatsApp number, etc.)
   ```

7. **`/ai/chat/training`**
   ```
   Mejora continua:
   - Conversaciones para revisar
   - Thumbs up/down feedback
   - Correcciones sugeridas
   - Add to training set
   - Fine-tuning dashboard (futuro)
   ```

8. **`/ai/chat/widget`**
   ```
   Configuración del widget embebible:
   - Customización visual (colores, posición)
   - Configuración de behavior
   - Code snippet para copiar
   - Preview en vivo
   ```

### 9.3 Widget Embebible

**Objetivo:** Chatbot fácil de integrar en cualquier sitio

#### Implementación:

```html
<!-- Código que el cliente pega en su sitio -->
<script src="https://tupatrimonio.app/widgets/ai-chat-widget.js"></script>
<script>
  TuPatrimonioChat.init({
    organizationId: "org_123",
    chatbotId: "bot_456",
    position: "bottom-right", // o 'bottom-left'
    theme: "light", // o 'dark'
    primaryColor: "#0070f3",
    locale: "es-CL",
  });
</script>
```

**Features del widget:**

- Bubble indicator (para abrir chat)
- Chat window con historial
- Typing indicators
- Message status (sent, delivered, read)
- File attachments (si está habilitado)
- Emoji support
- Responsive
- Accessibility (ARIA labels, keyboard navigation)

### 9.4 Lógica de Negocio Avanzada

#### Implementación:

1. **Intent Detection**
   ```typescript
   // Detectar intención del usuario
   const intents = {
     "pricing_inquiry": ["precio", "costo", "cuánto cuesta", "plan"],
     "technical_support": ["error", "no funciona", "problema", "bug"],
     "sales_inquiry": ["comprar", "contratar", "demo", "prueba"],
     "cancellation": ["cancelar", "dar de baja", "terminar suscripción"],
   };

   function detectIntent(message: string): Intent {
     // Usar embeddings similarity o keyword matching
     // Priorizar intents que requieren escalación
   }
   ```

2. **Confidence Scoring**
   ```typescript
   function shouldEscalate(response: AIResponse): boolean {
     if (response.confidence < 0.6) return true;
     if (detectSensitiveTopic(response.message)) return true;
     if (userRequestsHuman(response.userMessage)) return true;
     return false;
   }
   ```

3. **Context Management**
   ```typescript
   // Mantener contexto relevante sin explotar token limit
   function buildConversationContext(
     conversationId: string,
     maxMessages: number = 10,
   ): Message[] {
     const messages = getRecentMessages(conversationId, maxMessages);

     // Summarize older messages if needed
     if (messages.length > maxMessages) {
       const summary = summarizeMessages(messages.slice(0, -maxMessages));
       return [
         {
           role: "system",
           content: `Resumen de conversación previa: ${summary}`,
         },
         ...messages.slice(-maxMessages),
       ];
     }

     return messages;
   }
   ```

4. **Cost Tracking**
   ```typescript
   async function trackAIUsage(
     conversationId: string,
     messageId: string,
     tokensUsed: { prompt: number; completion: number },
   ) {
     const totalTokens = tokensUsed.prompt + tokensUsed.completion;
     const creditCost = calculateCreditCost(totalTokens, hasKBSearch);

     await reserveAndConfirmCredits(organizationId, creditCost, {
       service: "ai_customer_service",
       operation: "send_message",
       metadata: { conversationId, messageId, tokensUsed },
     });
   }
   ```

### 9.5 Testing y Quality Assurance

#### Test Suite:

```typescript
// Test de knowledge base
test('Knowledge base retrieval', async () => {
  const query = "¿Cuál es el precio del plan Pro?"
  const results = await searchKnowledgeBase(query, topK: 3)
  
  expect(results).toHaveLength(3)
  expect(results[0].similarity).toBeGreaterThan(0.7)
  expect(results[0].content).toContain('plan Pro')
})

// Test de respuesta
test('AI generates relevant response', async () => {
  const context = getRelevantChunks("pricing question")
  const response = await generateResponse(userMessage, context)
  
  expect(response.confidence).toBeGreaterThan(0.7)
  expect(response.message).not.toContain('[PLACEHOLDER]')
  expect(response.sources).toHaveLength.greaterThan(0)
})

// Test de escalación
test('Escalates low confidence responses', async () => {
  const response = { confidence: 0.5, message: '...' }
  expect(shouldEscalate(response)).toBe(true)
})
```

### 9.6 Monitoring y Observability

#### Métricas a Trackear:

```typescript
// Performance metrics
- Average response time
- P95, P99 response times
- Token usage per conversation
- Cost per conversation

// Quality metrics
- Confidence score distribution
- Escalation rate
- CSAT score
- Resolution rate

// Usage metrics
- Conversations per hour
- Messages per conversation
- Active conversations
- Channel distribution

// Error tracking
- API failures (OpenAI/Anthropic)
- Embedding failures
- Knowledge base search failures
- Widget loading errors
```

### 9.7 Optimizaciones

#### Implementar:

1. **Caching**
   ```typescript
   // Cache de embeddings frecuentes
   const embeddingCache = new Map<string, number[]>();

   // Cache de respuestas a preguntas comunes
   const responseCache = new TTLCache({
     ttl: 3600, // 1 hora
     maxSize: 1000,
   });
   ```

2. **Streaming Responses**
   ```typescript
   // Para mejor UX, hacer streaming de respuestas
   async function* streamChatResponse(prompt: string) {
     const stream = await anthropic.messages.stream({
       model: "claude-3-5-sonnet-20241022",
       messages: [{ role: "user", content: prompt }],
       max_tokens: 1024,
     });

     for await (const chunk of stream) {
       if (chunk.type === "content_block_delta") {
         yield chunk.delta.text;
       }
     }
   }
   ```

3. **Batch Processing**
   ```typescript
   // Procesar embeddings en batch para eficiencia
   async function batchEmbed(texts: string[]): Promise<number[][]> {
     const batchSize = 20;
     const batches = chunk(texts, batchSize);

     const results = await Promise.all(
       batches.map((batch) =>
         openai.embeddings.create({
           model: "text-embedding-ada-002",
           input: batch,
         })
       ),
     );

     return results.flatMap((r) => r.data.map((d) => d.embedding));
   }
   ```

**Paralelamente durante Fase 9:**

- Blog posts sobre el lanzamiento del chatbot IA
- Case study de beta users usando chatbot
- Video tutorial: "Configura tu chatbot en 10 minutos"
- Actualizar landing de AI Customer Service con features reales

---

## 🤖 **Fase 10: Servicios de IA - Document Review (Semanas 67-74)**

### **Objetivo:** Análisis automático de documentos legales/comerciales con IA

### 10.1 Schema AI Document Review

**Objetivo:** Base de datos para análisis de documentos

#### Implementación:

1. **Crear schema `ai_document_review`**
   ```sql
   - review_templates
   - document_reviews
   - review_results
   - review_annotations
   - review_feedback
   - review_comparisons
   - training_feedback
   ```

2. **No necesita pgvector** (diferente approach que chatbot)
   - Análisis más estructurado
   - Usa prompts específicos por tipo de documento
   - Focus en extracción y análisis, no en búsqueda semántica

3. **Integración con Vision Models**
   ```typescript
   // Para documentos escaneados o PDFs complejos
   AIVisionProvider Interface:
   - analyzeDocument(file, instructions)
   - extractText(file)
   - extractTables(file)
   - detectLayout(file)

   Implementaciones:
   - GPT-4-Vision (OpenAI)
   - Claude 3 Opus (mejor para documentos largos)
   ```

4. **Document Processing Pipeline**
   ```typescript
   DocumentReviewPipeline:

   1. Upload & Validation
      - Verificar formato (PDF, DOCX, images)
      - Validar tamaño (max 50MB)
      - Extraer metadata

   2. Text Extraction
      - Si PDF: usar pdf.js o pdfplumber
      - Si DOCX: usar mammoth
      - Si imagen: OCR con Tesseract o Vision API
      - Preservar estructura (headers, lists, tables)

   3. Preprocessing
      - Limpiar texto
      - Identificar secciones
      - Extraer tablas
      - Detectar idioma

   4. AI Analysis
      - Seleccionar template apropiado
      - Construir prompt con criteria
      - Enviar a LLM (Claude 3.5 Sonnet recomendado)
      - Parse structured response

   5. Post-processing
      - Calcular risk score
      - Generar anotaciones
      - Extraer red flags
      - Crear recomendaciones

   6. Storage
      - Guardar resultados
      - Link a documento original
      - Generar PDF report
   ```

5. **Template System**
   ```typescript
   ReviewTemplate {
     name: "Revisión de Contrato Comercial",
     documentType: "contract",
     reviewCriteria: {
       sectionsToExtract: [
         "payment_terms",
         "delivery_terms",
         "warranties",
         "liability_limits",
         "termination_clauses",
         "dispute_resolution"
       ],
       redFlags: [
         {
           id: "unlimited_liability",
           pattern: /liability.{0,50}unlimited/i,
           severity: "critical",
           description: "Contrato establece responsabilidad ilimitada"
         },
         {
           id: "auto_renewal",
           pattern: /auto.{0,20}renew/i,
           severity: "high",
           description: "Cláusula de renovación automática"
         }
       ],
       complianceChecks: [
         "gdpr_mention",
         "force_majeure_clause",
         "intellectual_property_rights"
       ]
     },
     promptTemplate: `
       Analiza el siguiente contrato comercial.
       
       Documento:
       {document_text}
       
       Por favor:
       1. Extrae las siguientes secciones: {sections}
       2. Identifica cualquier red flag de esta lista: {red_flags}
       3. Verifica cumplimiento de: {compliance_checks}
       4. Asigna un risk score (0-100)
       5. Proporciona recomendaciones
       
       Responde en formato JSON estructurado.
     `
   }
   ```

6. **AI Analysis Logic**
   ```typescript
   async function analyzeDocument(
     documentId: string,
     templateId: string
   ): Promise<ReviewResult> {
     
     // 1. Get document and template
     const doc = await getDocument(documentId)
     const template = await getTemplate(templateId)
     
     // 2. Extract text
     const text = await extractText(doc.file)
     
     // 3. Build prompt
     const prompt = buildPrompt(template, text)
     
     // 4. Call AI (chunked if document is long)
     const chunks = splitIntoChunks(text, maxTokens: 100000)
     const analyses = await Promise.all(
       chunks.map(chunk => 
         claude.messages.create({
           model: 'claude-3-5-sonnet-20241022',
           max_tokens: 4096,
           messages: [{
             role: 'user',
             content: prompt.replace('{document_text}', chunk)
           }]
         })
       )
     )
     
     // 5. Merge and structure results
     const mergedResult = mergeAnalyses(analyses)
     const structuredResult = parseAIResponse(mergedResult)
     
     // 6. Calculate scores
     structuredResult.overallScore = calculateRiskScore(structuredResult)
     structuredResult.riskLevel = categorizeRisk(structuredResult.overallScore)
     
     // 7. Generate annotations
     const annotations = generateAnnotations(structuredResult, doc)
     
     return {
       ...structuredResult,
       annotations,
       metadata: {
         tokensUsed: calculateTokens(analyses),
         processingTime: Date.now() - startTime,
         aiModel: 'claude-3-5-sonnet'
       }
     }
   }
   ```

7. **Structured Output Parsing**
   ```typescript
   interface AIReviewResponse {
     extracted_sections: {
       [key: string]: {
         content: string;
         location: string; // "Section 5.2, Page 8"
         analysis: string;
       };
     };
     red_flags: Array<{
       type: string;
       severity: "low" | "medium" | "high" | "critical";
       location: string;
       description: string;
       recommendation: string;
     }>;
     compliance_status: {
       [key: string]: {
         compliant: boolean;
         details: string;
       };
     };
     risk_assessment: {
       overall_score: number; // 0-100
       category_scores: {
         financial_risk: number;
         legal_risk: number;
         operational_risk: number;
       };
       justification: string;
     };
     recommendations: Array<{
       priority: "low" | "medium" | "high";
       action: string;
       rationale: string;
     }>;
   }
   ```

### 10.2 UI de AI Document Review

**Objetivo:** Análisis visual e interactivo de documentos

#### Páginas:

1. **`/ai/review/dashboard`**
   ```
   Métricas principales:
   - Documentos analizados hoy/semana/mes
   - Average risk score
   - Top red flags detectados
   - Tiempo promedio de análisis
   - Distribución por tipo de documento
   - Satisfaction score de usuarios
   ```

2. **`/ai/review/reviews`**
   ```
   Lista de revisiones:
   - Filtros: status, risk level, document type, date
   - Columnas: Documento, Tipo, Risk Score, Status, Fecha
   - Quick actions: Ver, Re-analizar, Exportar
   - Bulk actions: Comparar, Exportar múltiples
   ```

3. **`/ai/review/new`**
   ```
   Iniciar nueva revisión:

   Step 1: Upload
   - Drag & drop o seleccionar archivo
   - Múltiples archivos soportados
   - Preview del documento

   Step 2: Select Template
   - Grid de templates disponibles
   - "Contrato Comercial", "NDA", "Arrendamiento", etc.
   - Preview de qué se analizará

   Step 3: Configure (opcional)
   - Ajustar criteria específicos
   - Agregar custom red flags
   - Set priority

   Step 4: Review & Submit
   - Resumen de configuración
   - Estimación de tiempo/costo
   - Submit
   ```

4. **`/ai/review/reviews/:id`**
   ```
   Vista de resultados (dos paneles):

   Panel Izquierdo: Documento
   - PDF viewer o document renderer
   - Anotaciones highlighteadas
   - Click en anotación → scroll a ubicación
   - Zoom, navegación por páginas

   Panel Derecho: Análisis

   Tab "Overview":
   - Risk Score (visual gauge)
   - Executive Summary
   - Key Findings (top 3-5)
   - Quick Stats

   Tab "Sections":
   - Accordion de secciones extraídas
   - Cada sección:
     * Contenido extraído
     * Análisis
     * Location en documento
     * Risk indicator

   Tab "Red Flags":
   - Lista de issues encontrados
   - Agrupados por severity
   - Cada flag:
     * Descripción
     * Ubicación (clickeable)
     * Recomendación
     * Mark as "Reviewed" o "False Positive"

   Tab "Recommendations":
   - Lista priorizada de acciones
   - Checkbox para marcar completadas
   - Assign to team member
   - Add notes

   Tab "Compliance":
   - Checklist de compliance items
   - Status por item
   - Details/evidence

   Actions:
   - Download PDF Report
   - Share with team
   - Request Human Review (escalar a abogado)
   - Compare with another version
   - Re-analyze with different template
   ```

5. **`/ai/review/reviews/:id/annotate`**
   ```
   Vista de anotación (fullscreen):
   - Document viewer grande
   - Toolbar de anotación:
     * Add comment
     * Highlight text
     * Add sticky note
     * Draw rectangle/circle
   - AI annotations en un color
   - User annotations en otro color
   - Sidebar con lista de annotations
   - Save & Export
   ```

6. **`/ai/review/compare`**
   ```
   Comparar documentos:
   - Seleccionar 2-3 documentos
   - Side-by-side view
   - Diff highlighting
   - AI analysis de diferencias
   - "What changed?" summary
   - Risk comparison table
   ```

7. **`/ai/review/templates`**
   ```
   Gestión de templates:
   - Lista de templates (system + custom)
   - Create new template:
     * Name, description
     * Document type
     * Sections to extract (list)
     * Red flags patterns (list)
     * Compliance checks (list)
     * Custom prompt instructions
   - Edit existing
   - Duplicate
   - Test template (upload sample doc)
   - Usage stats por template
   ```

8. **`/ai/review/templates/:id/edit`**
   ```
   Editor de template:
   - Visual builder
   - Add/remove sections
   - Define red flag patterns (regex or plain text)
   - Configure compliance checks
   - Prompt preview
   - Test section (run on sample)
   - Save & Activate
   ```

9. **`/ai/review/training`**
   ```
   Feedback loop para mejorar:
   - Reviews que necesitan corrección
   - User feedback: "Was this accurate?"
   - Corrections:
     * Mark false positive
     * Add missed red flag
     * Correct extraction
   - Training dataset builder
   - Trigger re-training (futuro: fine-tuning)
   ```

10. **`/ai/review/settings`**
    ```
    Configuración:

    General:
    - Default template
    - Auto-analyze on upload
    - Notification preferences

    AI Configuration:
    - Model selection (Claude 3.5, GPT-4, etc.)
    - Temperature
    - Max tokens per analysis
    - Confidence threshold

    Cost Controls:
    - Budget limits
    - Approval required for documents > X pages
    - Rate limiting

    Integrations:
    - Google Drive: Auto-analyze new docs
    - Dropbox
    - Email: Forward contracts for analysis
    ```

### 10.3 PDF Report Generation

**Objetivo:** Reportes profesionales exportables

#### Implementación:

```typescript
async function generatePDFReport(reviewId: string): Promise<Buffer> {
  const review = await getReview(reviewId);
  const result = await getReviewResult(reviewId);

  // Usar biblioteca como PDFKit o Puppeteer
  const pdf = new PDFDocument();

  // Header
  pdf.image("logo.png", 50, 45, { width: 50 });
  pdf.fontSize(20).text("Análisis de Documento con IA", 120, 50);

  // Executive Summary
  pdf.moveDown();
  pdf.fontSize(16).text("Resumen Ejecutivo");
  pdf.fontSize(12).text(result.summary);

  // Risk Score
  pdf.moveDown();
  pdf.fontSize(16).text("Nivel de Riesgo");
  // Visual gauge o color-coded box
  pdf.rect(50, pdf.y, 200, 30)
    .fillAndStroke(getRiskColor(result.riskLevel), "#000");
  pdf.fontSize(12).text(`Score: ${result.overallScore}/100`);

  // Sections
  pdf.addPage();
  pdf.fontSize(16).text("Secciones Analizadas");
  for (const [key, section] of Object.entries(result.extractedData)) {
    pdf.fontSize(14).text(key);
    pdf.fontSize(10).text(section.content);
    pdf.moveDown();
  }

  // Red Flags
  pdf.addPage();
  pdf.fontSize(16).text("Red Flags Detectados");
  for (const flag of result.redFlags) {
    pdf.fontSize(12)
      .fillColor(getSeverityColor(flag.severity))
      .text(`[${flag.severity.toUpperCase()}] ${flag.description}`);
    pdf.fillColor("#000")
      .fontSize(10)
      .text(`Ubicación: ${flag.location}`)
      .text(`Recomendación: ${flag.recommendation}`);
    pdf.moveDown();
  }

  // Recommendations
  pdf.addPage();
  pdf.fontSize(16).text("Recomendaciones");
  // ... similar structure

  // Footer
  pdf.fontSize(8)
    .text(
      `Generado por TuPatrimonio.app - ${new Date().toLocaleDateString()}`,
      50,
      pdf.page.height - 50,
    );

  return pdf.pipe(); /* output stream */
}
```

### 10.4 Advanced Features

#### Implementar:

1. **Batch Processing**
   ```typescript
   // Para procesar múltiples documentos en paralelo
   async function batchReview(
     fileIds: string[],
     templateId: string,
   ): Promise<BatchReviewJob> {
     const jobId = generateId();

     // Queue jobs
     for (const fileId of fileIds) {
       await queue.add("document-review", {
         jobId,
         fileId,
         templateId,
       });
     }

     return { jobId, status: "queued", total: fileIds.length };
   }
   ```

2. **Version Comparison**
   ```typescript
   async function compareVersions(
     docId1: string,
     docId2: string,
   ): Promise<ComparisonResult> {
     const [review1, review2] = await Promise.all([
       getReview(docId1),
       getReview(docId2),
     ]);

     // AI-powered diff
     const diffAnalysis = await claude.messages.create({
       model: "claude-3-5-sonnet-20241022",
       messages: [{
         role: "user",
         content: `
           Compara estas dos versiones de contrato y explica qué cambió:
           
           Versión 1:
           ${review1.documentText}
           
           Versión 2:
           ${review2.documentText}
           
           Enfócate en cambios significativos en términos, condiciones, riesgos.
         `,
       }],
     });

     return {
       changes: parseDiffAnalysis(diffAnalysis),
       riskDelta: review2.overallScore - review1.overallScore,
       newRedFlags: findNewRedFlags(review1, review2),
     };
   }
   ```

3. **Custom Red Flag Training**
   ```typescript
   // Permitir a usuarios entrenar patrones específicos
   interface CustomRedFlag {
     organizationId: string;
     name: string;
     pattern: string; // regex o descripción en lenguaje natural
     severity: "low" | "medium" | "high" | "critical";
     examples: string[]; // ejemplos de texto que deberían matchear
   }

   // El sistema aprende de feedback y ajusta detección
   ```

### 10.5 Cost Optimization

#### Estrategias:

```typescript
// 1. Smart chunking - solo analizar secciones relevantes
function smartChunk(document: string, template: Template): string[] {
  // Usar modelo más barato para identificar secciones relevantes
  const sectionMap = identifySections(document); // GPT-3.5-turbo

  // Luego usar Claude 3.5 solo en secciones importantes
  const relevantSections = template.sectionsToExtract
    .map((section) => sectionMap[section])
    .filter(Boolean);

  return relevantSections;
}

// 2. Caching de análisis comunes
const analysisCache = new Map<string, ReviewResult>();

function getCacheKey(document: string, template: string): string {
  return `${hashDocument(document)}_${template}`;
}

// 3. Progressive analysis
// Análisis rápido (barato) primero, profundo solo si se solicita
async function progressiveReview(docId: string) {
  // Paso 1: Quick scan (GPT-3.5)
  const quickScan = await quickAnalysis(docId);

  if (quickScan.riskScore > 70 || userRequestsDeep) {
    // Paso 2: Deep analysis (Claude 3.5 Opus)
    return await deepAnalysis(docId);
  }

  return quickScan;
}
```

### 10.6 Testing

#### Test Suite:

```typescript
describe("Document Review", () => {
  test("extracts payment terms correctly", async () => {
    const sample = loadSampleContract("commercial.pdf");
    const result = await analyzeDocument(sample, "commercial_template");

    expect(result.extractedData.payment_terms).toBeDefined();
    expect(result.extractedData.payment_terms.content).toContain("Net 30");
  });

  test("detects unlimited liability red flag", async () => {
    const sample = loadSampleContract("high_risk.pdf");
    const result = await analyzeDocument(sample, "commercial_template");

    const unlimitedLiabilityFlag = result.redFlags.find(
      (f) => f.type === "unlimited_liability",
    );
    expect(unlimitedLiabilityFlag).toBeDefined();
    expect(unlimitedLiabilityFlag.severity).toBe("critical");
  });

  test("calculates risk score accurately", async () => {
    const lowRiskDoc = loadSampleContract("low_risk.pdf");
    const highRiskDoc = loadSampleContract("high_risk.pdf");

    const [lowResult, highResult] = await Promise.all([
      analyzeDocument(lowRiskDoc, "commercial_template"),
      analyzeDocument(highRiskDoc, "commercial_template"),
    ]);

    expect(lowResult.overallScore).toBeLessThan(40);
    expect(highResult.overallScore).toBeGreaterThan(70);
  });
});
```

**Paralelamente durante Fase 10:**

- Blog posts sobre lanzamiento de Document Review
- Case studies con métricas reales (tiempo ahorrado, errores evitados)
- Webinar: "Cómo la IA Revoluciona la Revisión de Contratos"
- Actualizar landing de AI Document Review con demos reales

---

## 📊 Fase 11: Analytics y Reportes (Semanas 75-81)

### 11.1 Schema Analytics

**Objetivo:** Data-driven decision making

#### Implementación:

1. **Crear schema `analytics`**
   ```sql
   - usage_metrics (particionado por fecha)
   - usage_aggregates
   - user_activity_summary
   - revenue_metrics
   - ai_usage_metrics ← NUEVO (métricas específicas de IA)
   - report_templates
   - scheduled_reports
   - generated_reports
   ```

2. **AI Usage Metrics** ← NUEVO
   ```sql
   CREATE TABLE analytics.ai_usage_metrics (
     id UUID PRIMARY KEY,
     organization_id UUID REFERENCES core.organizations,
     service_type TEXT, -- 'customer_service' o 'document_review'
     date DATE,
     
     -- Customer Service metrics
     total_conversations INTEGER,
     messages_sent INTEGER,
     ai_responses INTEGER,
     human_escalations INTEGER,
     avg_confidence_score DECIMAL,
     
     -- Document Review metrics
     documents_analyzed INTEGER,
     pages_analyzed INTEGER,
     red_flags_detected INTEGER,
     avg_risk_score DECIMAL,
     
     -- Cost metrics
     total_tokens_used BIGINT,
     total_credits_consumed DECIMAL,
     
     created_at TIMESTAMP DEFAULT NOW()
   );
   ```

3. **Data Collection**
   ```typescript
   - Event tracking en frontend
   - Server-side tracking
   - Batch insert para performance
   - Agregaciones periódicas (cron jobs)
   - Track AI model usage y costos
   ```

4. **Dashboards**
   ```typescript
   - Organization dashboard (sus métricas + uso de IA)
   - Platform dashboard (métricas globales + ROI de IA)
   - AI-specific dashboards
   - Gráficos con Recharts/Chart.js
   - Export a Excel/PDF
   ```

### 11.2 UI de Analytics

**Objetivo:** Insights accionables

#### Páginas:

1. **`/analytics/overview`**
   ```
   KPIs principales:
   - Total users, organizations
   - MRR/ARR
   - Active services
   - Usage trends
   - AI adoption metrics ← NUEVO
   ```

2. **`/analytics/usage`**
   ```
   - Uso por aplicación
   - Usuarios más activos
   - Features más usadas
   - AI services breakdown ← NUEVO
     * Conversaciones atendidas
     * Documentos analizados
     * Tokens consumidos
     * Cost per service
   ```

3. **`/analytics/revenue`**
   ```
   - MRR/ARR
   - Churn rate
   - Customer LTV
   - Revenue by service (incluir IA)
   - Forecast
   ```

4. **`/analytics/ai`** ← NUEVO
   ```
   Dashboard específico de IA:

   Customer Service:
   - Conversations handled by AI vs humans
   - Resolution rate
   - Average confidence score
   - Top intents
   - Escalation reasons
   - Cost per conversation

   Document Review:
   - Documents analyzed
   - Average risk score distribution
   - Top red flags detected
   - Processing time trends
   - Cost per document
   - Accuracy feedback

   ROI Calculator:
   - Time saved (estimated)
   - Cost savings (vs manual)
   - Efficiency gains
   ```

5. **`/analytics/reports`**
   ```
   - Reportes programados
   - Crear nuevo reporte
   - Historial
   - Templates (incluir templates de IA)
   ```

---

## 🔌 Fase 12: Integraciones y API Pública (Semanas 82-88)

### 12.1 Schema Integrations

**Objetivo:** Conectar con ecosistema externo

#### Implementación:

1. **Crear schema `integrations`**
   ```sql
   - integration_providers
   - organization_integrations
   - integration_sync_logs
   ```

2. **Conectores Pre-built**
   ```typescript
   - Google Drive
   - Dropbox
   - Zapier
   - Make.com
   - Slack
   - Microsoft Teams
   - Notion (para Knowledge Base) ← NUEVO
   ```

3. **OAuth Flow**
   ```typescript
   - Iniciar OAuth
   - Callback handling
   - Refresh tokens
   - Almacenar credentials encriptados
   ```

### 12.2 API Pública

**Objetivo:** API REST completa para B2B

#### Implementación:

1. **Documentación OpenAPI**
   - Swagger/Redoc
   - SDK generation
   - Postman collection

2. **Endpoints por Servicio**
   ```
   /api/v1/signatures/*
   /api/v1/verifications/*
   /api/v1/notary/*
   /api/v1/documents/*
   /api/v1/credits/*
   /api/v1/organizations/*
   /api/v1/ai/chat/* ← NUEVO
   /api/v1/ai/review/* ← NUEVO
   ```

3. **AI API Endpoints** ← NUEVO
   ```typescript
   // Customer Service API
   POST /api/v1/ai/chat/conversations
   POST /api/v1/ai/chat/conversations/:id/messages
   GET  /api/v1/ai/chat/conversations/:id
   GET  /api/v1/ai/chat/conversations/:id/history
   POST /api/v1/ai/chat/knowledge-base/ingest

   // Document Review API
   POST /api/v1/ai/review/analyze
   GET  /api/v1/ai/review/:id/status
   GET  /api/v1/ai/review/:id/results
   POST /api/v1/ai/review/compare
   GET  /api/v1/ai/review/templates
   ```

4. **Rate Limiting**
   ```typescript
   - Por API key
   - Por plan de suscripción
   - Redis para contadores
   - Headers: X-RateLimit-*
   - Rate limits más altos para AI endpoints (son más costosos)
   ```

5. **Webhooks Salientes**
   ```typescript
   - Configurar endpoints
   - Retry logic
   - HMAC signatures
   - Event types configurables
   - Eventos de IA:
     * ai.chat.conversation.completed
     * ai.review.analysis.completed
     * ai.review.high_risk_detected
   ```

### 12.3 Developer Portal

**Objetivo:** Self-service para developers

#### Páginas:

1. **`/developers/api-keys`**
   - Crear/revocar API keys
   - Usage por key
   - Scopes y permisos

2. **`/developers/webhooks`**
   - Configurar webhooks
   - Test endpoints
   - Delivery logs

3. **`/developers/docs`**
   - Documentación interactiva
   - Code examples (incluir ejemplos de IA)
   - Changelog
   - Sandbox para testing

4. **`/developers/playground`** ← NUEVO
   ```
   Interactive API playground:
   - Test AI Chat API
   - Test Document Review API
   - Ver responses en tiempo real
   - Code generation
   ```

---

## 🚀 Fase 13: Optimización y Escalabilidad (Semanas 89-95)

### 13.1 Performance

**Objetivo:** Sub-second response times

#### Tareas:

1. **Database Optimization**
   ```sql
   - Analizar slow queries
   - Agregar índices faltantes (especialmente en tablas de IA)
   - Optimizar RLS policies
   - Implementar materialized views
   - Particionamiento de tablas grandes (usage_metrics, conversations)
   ```

2. **Caching Strategy (Simplificado)**
   ```typescript
   - Redis (solo si necesario):
     * AI embeddings cache
     * Common AI responses cache
   - Next.js optimización automática (Netlify)
   - CDN global automático (Netlify)
   ```

3. **Frontend Performance (Netlify Automático)**
   ```typescript
   // Netlify maneja automáticamente:
   - Code splitting óptimo
   - Image optimization
   - Bundle optimization

   // Solo configurar manualmente:
   - Lazy loading de componentes pesados
   - Virtualización de listas largas (si necesario)
   ```

4. **AI Performance Optimization** ← NUEVO
   ```typescript
   - Batch embedding generation
   - Streaming responses (mejor UX)
   - Progressive analysis (quick → deep)
   - Smart chunking (solo procesar lo necesario)
   - Model selection basado en complejidad
   - Fallback a modelos más baratos cuando sea posible
   ```

### 13.2 Monitoring y Observabilidad

**Objetivo:** Detectar problemas antes que usuarios

#### Implementación:

1. **APM**
   ```typescript
   - Integrar Sentry (errors)
   - New Relic o Datadog (performance)
   - LogRocket (session replay)
   ```

2. **Logging**
   ```typescript
   - Structured logging (JSON)
   - Log levels apropiados
   - Correlation IDs
   - Integrar con Papertrail/LogDNA
   - AI-specific logs (model used, tokens, latency)
   ```

3. **Alerting**
   ```typescript
   - Error rate > threshold
   - Response time > threshold
   - Service health down
   - Credits balance low
   - AI API failures ← NUEVO
   - AI cost spikes ← NUEVO
   - Enviar a Slack/PagerDuty
   ```

4. **AI Monitoring** ← NUEVO
   ```typescript
   Dashboards específicos:
   - Token usage trends
   - Cost per request
   - Model latency
   - Error rates por provider
   - Quality metrics (confidence, satisfaction)
   ```

### 13.3 Testing

**Objetivo:** Confianza en deployments

#### Estrategia:

1. **Unit Tests**
   ```typescript
   - Utils y funciones puras
   - Business logic
   - AI helper functions
   - Coverage > 70%
   ```

2. **Integration Tests**
   ```typescript
   - API endpoints
   - Database operations
   - Service integrations (mocked)
   - AI pipelines (mocked)
   ```

3. **E2E Tests**
   ```typescript
   - Playwright/Cypress
   - Critical user flows
   - Include AI features (mock AI responses)
   - Smoke tests en staging
   ```

4. **Load Testing**
   ```typescript
   - k6 scripts
   - Test escenarios reales
   - Include AI endpoints
   - Identificar bottlenecks
   ```

5. **AI Testing** ← NUEVO
   ```typescript
   - Regression tests con sample documents
   - Accuracy benchmarking
   - Cost monitoring en tests
   - A/B testing de prompts
   ```

---

## 🎨 Fase 14: UX/UI Polish y Features Finales (Semanas 96-102)

### 14.1 Refinamiento de UI

**Objetivo:** Experiencia delightful

#### Tareas:

1. **Micro-interactions**
   - Animaciones suaves (Framer Motion)
   - Loading skeletons (especialmente para AI responses)
   - Empty states informativos
   - Error states amigables
   - Typing indicators en chat

2. **Responsive Design**
   - Mobile-first approach
   - Tablet optimization
   - Desktop enhancements

3. **Accessibility**
   - ARIA labels
   - Keyboard navigation
   - Screen reader testing
   - WCAG 2.1 AA compliance

4. **Onboarding**
   - Welcome tour (incluir features de IA)
   - Tooltips contextuales
   - Sample data
   - Interactive tutorials
   - "Try AI" prompts en empty states

### 14.2 Features Finales

**Objetivo:** Nice-to-haves que marcan diferencia

#### Lista:

1. **Command Palette (Cmd+K)**
   - Búsqueda global
   - Quick actions (incluir "Ask AI", "Analyze Document")
   - Navigation rápida

2. **Advanced Search**
   - Full-text search (PostgreSQL)
   - Filtros combinables
   - Saved searches
   - AI-powered search (semantic)

3. **Bulk Operations**
   - Select multiple
   - Batch actions (incluir batch document review)
   - Progress tracking

4. **Export/Import**
   - CSV/Excel export
   - PDF generation
   - Bulk import con validation

5. **Activity Feed**
   - Timeline de cambios
   - Filtros por tipo
   - Notificaciones agrupadas
   - AI activity (análisis completados, chats atendidos)

6. **Collaboration Features** ← NUEVO
   - Comments on documents
   - @mentions
   - Share AI analysis with team
   - Collaborative annotation

---

## 📱 Fase 15: Mobile App (Opcional - Semanas 103-114)

### 15.1 Capacitor de Ionic App

**Objetivo:** Experiencia móvil nativa

#### Consideraciones:

- Capacitor de Ionic framework
- Reutilización del código web existente (Next.js)
- Mismo stack tecnológico (React, TypeScript, Tailwind)
- Push notifications (Capacitor Push Notifications o Firebase)
- Offline-first approach con Service Worker existente
- Biometric authentication (Capacitor plugins)
- Acceso a APIs nativas (cámara, geolocalización, etc.)

#### Features prioritarias mobile:

- Chat con AI (notificaciones push)
- Ver análisis de documentos
- Firmar documentos
- Notifications dashboard
- Camera para capturar documentos → enviar a AI Review

---

## 🎯 Fase 16: Go-to-Market (Semanas 115-121)

### 16.1 Preparación para Lanzamiento

**Objetivo:** Launch ready

#### Checklist:

1. **Legal**
   - Términos de servicio (actualizados con uso de IA)
   - Privacy policy (incluir procesamiento de datos por IA)
   - Cookie policy
   - GDPR compliance
   - AI Ethics policy

2. **Marketing Site Evolution**
   - Actualizar con features reales (no "coming soon")
   - Agregar demos interactivos de IA
   - Customer success stories reales (con métricas de IA)
   - Optimizar según 12+ meses de data SEO

3. **Content Milestone**
   ```
   A esta altura deberías tener:
   - 80+ blog posts
   - 7+ pillar articles (2 sobre IA)
   - 5+ downloadable resources
   - 15+ video tutorials (incluir varios de IA)
   - Rankings top 3 para varias keywords (incluir IA)
   - 10,000+ organic visits/mes
   ```

4. **Launch PR**
   ```
   - Press release a medios tech (enfatizar IA como diferenciador)
   - Product Hunt launch (destacar AI features)
   - LinkedIn announcement
   - Email a waitlist (1000+ personas)
   - Webinar de lanzamiento (demo en vivo de IA)
   - Launch en comunidades de IA (Hacker News, etc.)
   ```

5. **Support**
   - Help center (Intercom/Zendesk)
   - Live chat (con AI bot como first line)
   - Email templates
   - Onboarding videos (incluir tutoriales de IA)

6. **Analytics**
   - Google Analytics 4 (ya configurado)
   - Mixpanel/Amplitude
   - Conversion tracking completo
   - Cohort analysis setup
   - AI usage funnels

### 16.2 Public Launch

**Objetivo:** Convertir tráfico orgánico en customers

**Ventaja competitiva:** Llegas al launch con:

- ✅ SEO maduro (12+ meses de antigüedad)
- ✅ 10,000+ visitas orgánicas/mes
- ✅ 1,000+ waitlist
- ✅ Content library de 80+ posts
- ✅ Authority establecida (incluir en IA)
- ✅ Backlink profile sólido
- ✅ **Diferenciadores de IA probados y funcionando**

#### Launch Day Strategy:

```
T-7 días: Email a waitlist (teaser)
T-3 días: Soft launch para early adopters
T-0: Public launch
  - Product Hunt
  - Hacker News
  - LinkedIn
  - Twitter/X
  - Paid ads (boost inicial)
T+1: Follow-up content
T+7: First case study
T+30: Launch retrospective
```

---

## 📊 **Métricas de Éxito Actualizadas**

### Fase 0 (Semanas 1-4):

- Website live con Lighthouse > 95
- 10-14 blog posts publicados (incluir 2 sobre IA)
- 100% páginas indexadas
- 50+ organic visits (baseline)
- Landings de IA con demos funcionales

### Durante Fases 1-6 (Semanas 5-38):

**Marketing parallels:**

- Mes 3: 500+ organic visits/mes
- Mes 6: 2,000+ organic visits/mes
- Rankings top 10 para 5+ keywords (incluir 2 de IA)
- 150+ signups waitlist
- 25+ quality backlinks

**Desarrollo:**

- ✅ Foundation completa (auth, credits, billing) - **COMPLETADO Nov 22, 2025**
- ✅ CRM operacional - **COMPLETADO Nov 12, 2025**
- 📋 Workflows funcionales (pendiente)
- 📋 Compliance ready (pendiente)

### Durante Fases 7-12 (Semanas 39-88):

**Marketing parallels:**

- Mes 9: 5,000+ organic visits/mes
- Mes 12: 10,000+ organic visits/mes
- Rankings top 5 para keyword principal
- Rankings top 10 para keywords de IA
- 1,000+ waitlist
- Featured snippets
- 60+ backlinks DA > 30

**Desarrollo:**

- Servicios core operacionales (firmas, verificación, notaría)
- **AI Customer Service live y probado**
- **AI Document Review live y probado**
- API pública documentada
- Analytics completo

### Fases 13-14 - Optimization (Semanas 89-102):

- Performance optimizada
- AI costs optimizados
- UX refinado
- Tests comprehensivos

### Fase 16 - Launch (Semanas 115-121):

- 15,000+ organic visits/mes
- 15-20% signup rate (2,000-3,000 signups/mes orgánico)
- Rankings dominantes (incluir IA)
- Thought leadership establecido
- **AI services con adoption > 40% de usuarios**

---

## 🎯 **Priorización Final Actualizada**

### Absolutely Critical (No lanzar sin esto):

1. **Fase 0:** Marketing + SEO foundation
2. Fase 1-2: Foundation + Credits
3. Fase 3: Comunicaciones básicas
4. Fase 7: Signatures (servicio core)
5. **Fase 9: AI Customer Service** (diferenciador clave)
6. **Fase 10: AI Document Review** (diferenciador clave)
7. Seguridad completa

### High Priority:

- Fase 4: Workflows
- Fase 5: Files
- Fase 6: Audit
- Fase 12: API pública
- **Contenido continuo (paralelo a todo)**

### Medium Priority:

- Otros servicios (8.x)
- Fase 11: Analytics
- Fase 13: Optimization

### Nice to Have:

- Fase 15: Mobile app
- Integraciones avanzadas
- AI features avanzados (fine-tuning, custom models)

---

## 🔄 **Proceso Paralelo: Content y SEO (Continuo)**

Mientras desarrollas las Fases 1-16, mantén este ritmo:

### Mensual:

- 8 blog posts (2/semana)
  - 6 posts tradicionales
  - 2 posts sobre IA
- 1 pillar content piece o guía larga
- 2 actualizaciones de contenido existente
- 1 guest post o PR initiative
- Análisis de rankings y ajustes

### Trimestral:

- 1 lead magnet nuevo (incluir 1 de IA cada 2 trimestres)
- Content audit y actualización
- Backlink campaign
- Video content (tutoriales, incluir demos de IA)

### Semestral:

- Comprehensive SEO audit
- Content cluster expansion
- Competitor analysis
- UX improvements en marketing site

---

## 🛠️ **Stack Tecnológico Final Simplificado**

### Frontend:

- Next.js 14+ (App Router)
- React 18
- TypeScript
- TailwindCSS + Shadcn/UI
- React Flow (workflow builder)
- TipTap (document editor)
- PDF.js (document viewer)

### Backend (Todo en Supabase):

- Supabase (PostgreSQL + Auth + Storage + Realtime)
- pgvector extension (AI embeddings)
- Supabase Edge Functions (si necesario)

### AI & ML:

- Anthropic Claude API (primary)
- OpenAI API (secondary/fallback)
- Vector search: pgvector integrado

### Servicios Externos:

- Stripe + dLocal Go (pagos)
- SendGrid (email)
- Twilio (SMS/auth)
- Veriff (identity verification)

### Deploy y Hosting (Ultra Simple):

- **Vercel**: Ambas apps (tupatrimonio.app + app.tupatrimonio.app) + CI/CD
  automático
- **Supabase**: Backend + Migraciones automáticas
- **DNS**: Solo configurar dominios
- **Analytics**: Google Analytics 4 con propiedades separadas por app

### Monitoring (Básico):

- Sentry (errors)
- Supabase Analytics (built-in)

### CMS:

- Contentful/Sanity (marketing content)

---

## ✅ **Checklist de Launch Simplificado**

### Pre-Launch:

- [ ] **Base de datos completa** (todas las migraciones aplicadas)
- [ ] **Marketing site optimizado** (SEO + contenido)
- [ ] **App funcional** con servicios core
- [ ] **AI Customer Service** funcionando (chatbot)
- [ ] **AI Document Review** funcionando (análisis)
- [ ] **Testing completo** (funcional + performance)
- [ ] **Legal docs** finalizados
- [ ] **Costos controlados** (especialmente IA)

### Launch:

- [ ] **Deploy a producción** (automático con Vercel)
- [ ] **Email a waitlist**
- [ ] **Product Hunt launch**
- [ ] **Contenido de lanzamiento** (blog, social media)
- [ ] **Monitoring básico** activo
- [ ] **Google Analytics** recabando datos en ambas apps

### Post-Launch:

- [ ] **Feedback loop** activo
- [ ] **Hotfixes** según necesidad
- [ ] **Case studies** reales
- [ ] **Optimización** basada en datos
- [ ] **Scaling** según demanda

---

## 🎓 **Principios de Desarrollo Simplificados**

### Filosofía Core:

1. **Simple pero robusto:** Evitar over-engineering
2. **Type-safe:** TypeScript + Supabase types automáticos
3. **Mobile-first:** Responsive desde el inicio
4. **Fast by default:** Aprovechar optimizaciones automáticas
5. **Secure by design:** RLS + validaciones desde día 1
6. **AI-responsible:** Transparencia + control de costos
7. **Data-driven:** Medir lo importante, no todo

### Stack Ultra-Simple:

- **Backend:** Solo Supabase (base de datos + auth + storage)
- **Frontend:** Next.js + Tailwind + Shadcn/UI
- **Deploy:** Vercel (ambas apps) - todo automático
- **Analytics:** Google Analytics 4 con propiedades separadas
- **No necesitas:** Docker, CI/CD complex, CDN manual, SSL config

### Flujo de Desarrollo:

1. **Codigo** → Push a GitHub
2. **Deploy automático** → Vercel (ambas apps)
3. **Migraciones** → Supabase automático
4. **Monitoreo** → Supabase dashboard + Google Analytics
5. **Variables de entorno** → Vercel Dashboard

### AI Development Best Practices:

```typescript
// 1. Siempre manejar errores de API
try {
  const response = await claude.messages.create({...})
} catch (error) {
  if (error.status === 529) {
    // Overloaded, retry
  } else if (error.status === 429) {
    // Rate limited, backoff
  }
  // Log y fallback
}

// 2. Siempre trackear costs
await trackAIUsage({
  tokens: response.usage,
  model: 'claude-3-5-sonnet',
  organizationId
})

// 3. Implementar timeouts
const response = await Promise.race([
  claude.messages.create({...}),
  timeout(30000) // 30s max
])

// 4. Cache cuando sea posible
const cached = await getCachedEmbedding(text)
if (cached) return cached

// 5. Usar streaming para mejor UX
for await (const chunk of stream) {
  yield chunk.delta.text
}
```

---

## 🎉 **Resultado Final Simplificado**

Llegas al lanzamiento con una **arquitectura ultra-simple pero poderosa**:

### Producto (Simple pero Completo):

1. ✅ **Base robusta multi-tenant** (Supabase)
2. ✅ **Servicios core** (firmas, verificación, notaría)
3. ✅ **IA diferenciadora** (chatbot + document review)
4. ✅ **API nativa** (Supabase automático)
5. ✅ **Mobile responsive** (Next.js + Tailwind)

### Marketing (SEO-First):

1. ✅ **Tráfico orgánico** creciendo desde día 1
2. ✅ **Authority establecida** (contenido + backlinks)
3. ✅ **Waitlist cualificada**
4. ✅ **Content library** rica
5. ✅ **Keywords dominantes** (incluir IA)

### Tecnología (Ultra-Simple):

1. ✅ **Solo 3 servicios principales**:
   - GitHub (código)
   - Vercel (ambas apps + deploy automático)
   - Supabase (backend completo)
2. ✅ **Deploy automático** (sin configuración)
3. ✅ **Escalabilidad nativa** (Supabase + Vercel)
4. ✅ **Analytics separadas** (GA4 con propiedades por app)
5. ✅ **Costos predecibles**
6. ✅ **Mantenimiento mínimo**

### Ventajas Competitivas:

1. ✅ **Time-to-market ultra rápido**
2. ✅ **IA como diferenciador principal**
3. ✅ **SEO head-start** (12+ meses de ventaja)

---

## 🔧 **MEJORAS RECIENTES - Integración dLocal Go (Diciembre 2025)**

### ✅ **Correcciones y Mejoras Implementadas:**

**1. Componente DLocalCheckout - Estados de Loading**

- ✅ Agregado estado `loadingMethods` para evitar error breve antes de cargar
  métodos de pago
- ✅ UI mejorada con spinner mientras se cargan métodos disponibles
- ✅ Manejo de errores mejorado con estados claros

**2. Construcción Robusta de URLs**

- ✅ Implementado sistema de múltiples fallbacks para `baseUrl`:
  - Primero: `NEXT_PUBLIC_APP_URL` (variable de entorno)
  - Segundo: Header `origin` de la request
  - Tercero: Construcción desde `request.url` como último recurso
- ✅ Validación de URLs antes de enviar a dLocal Go API
- ✅ `notification_url` construida desde `successUrl` para consistencia
- ✅ Resuelto error "must be a valid URL" de dLocal Go API

**3. Corrección de Schema**

- ✅ Eliminado uso de `.schema('billing')` en favor de vistas públicas
- ✅ Consistencia con implementación de Stripe
- ✅ Uso de vistas públicas: `invoices`, `payments`, `invoice_line_items`
- ✅ Mantiene seguridad RLS a través de las vistas

## 🔧 **MEJORAS RECIENTES - Simplificación Historial de Pedidos (Diciembre 2025)**

### ✅ **Optimización del Sistema de Trazabilidad de Pedidos:**

**Objetivo:** Simplificar el historial de pedidos para mostrar solo eventos
relevantes y comprensibles para el cliente, eliminando información técnica y
duplicados.

**Problema identificado:**

- El historial mostraba múltiples eventos técnicos y duplicados que confundían
  al cliente
- Eventos como "invoice_created", "payment_initiated", "Estado actualizado con
  información adicional" no aportaban valor
- Existían duplicados cuando el mismo cambio de estado se registraba múltiples
  veces
- Descripciones técnicas como "Estado cambiado de pending_payment a paid" no
  eran amigables

**Solución implementada:**

**1. Migración SQL de Limpieza Mejorada**
(`20251201000004_improved_cleanup_order_history.sql`):

- ✅ Elimina eventos por descripción específica:
  - "Pago exitoso vía...", "Factura creada", "Pago iniciado..."
  - "Estado actualizado con información adicional"
  - "Pedido completado" cuando es `status_changed` (mantiene `order_completed`)
  - Descripciones técnicas antiguas que empiezan con "Estado cambiado de..."
- ✅ Deduplica eventos por cambio de estado:
  - Mantiene solo el evento más reciente cuando hay múltiples eventos para el
    mismo cambio
  - Ejemplo: Si hay 3 eventos `pending_payment → paid`, mantiene solo el último
- ✅ Deduplica eventos de completado:
  - Si existe `order_completed` con "Pedido completado exitosamente", elimina el
    `status_changed` duplicado
- ✅ Normaliza descripciones:
  - Actualiza todas las descripciones antiguas al formato amigable estándar

**2. Mejoras en Componente OrderTimeline.tsx**:

- ✅ Filtrado mejorado por tipo y descripción:
  - Filtra eventos técnicos: `invoice_created`, `payment_initiated`,
    `order_modified`
  - Filtra descripciones técnicas: "Pago exitoso vía...", "Factura creada", etc.
- ✅ Función `deduplicateByStatus()`:
  - Deduplica eventos por cambio de estado en el frontend
  - Mantiene solo el evento más reciente para cada cambio único
  - Prioriza `order_completed` sobre `status_changed` cuando ambos existen
  - Maneja eventos únicos como `order_created` correctamente

**Resultado final:** El historial de pedidos ahora muestra solo **3 eventos
claros y relevantes**:

1. ✅ "Tu pedido fue creado" (`order_created`)
2. ✅ "Pago confirmado" (`status_changed` a `paid`)
3. ✅ "Pedido completado exitosamente" (`order_completed`)

**Archivos modificados:**

- `supabase/migrations/20251201000004_improved_cleanup_order_history.sql` (nueva
  migración)
- `apps/web/src/components/checkout/OrderTimeline.tsx` (mejoras en filtrado y
  deduplicación)

**Beneficios:**

- ✅ Experiencia de usuario más clara y comprensible
- ✅ Eliminación de ruido técnico innecesario
- ✅ Historial limpio y profesional
- ✅ Mejor comprensión del estado del pedido por parte del cliente

---

## 🔧 **MEJORAS RECIENTES - Detalles del Pedido y Enlace a Flujo de Firmas (Enero 2026)**

### ✅ **Mejoras en Página de Detalle del Pedido:**

**Objetivo:** Mejorar la visibilidad de información del pedido y facilitar el acceso a la administración del flujo de firmas desde la página de checkout.

**Cambios implementados:**

**1. Enlace a Administración del Flujo de Firmas:**

- ✅ **Consulta de documento de firma asociado:**
  - Consulta a `signing_documents` filtrando por `order_id` para obtener el documento asociado al pedido
  - Solo se obtiene el `id` necesario para construir el enlace
- ✅ **Botón en sección "Acciones":**
  - Nuevo botón "Gestionar Firmas" con ícono `PenTool` de lucide-react
  - Enlace a `/dashboard/signing/documents/{document_id}`
  - Solo se muestra cuando existe un documento de firma asociado al pedido
  - Ubicado junto a otros botones de acciones (Ver Boleta, XML, etc.)

**2. Sección Colapsable de Detalles del Pedido:**

- ✅ **Componente `OrderDetailsCollapsible.tsx` creado:**
  - Componente cliente (`'use client'`) con estado para controlar expansión/colapso
  - Colapsado por defecto para no ocupar espacio innecesario
  - Solo se muestra para pedidos de tipo `electronic_signature` o cuando existe documento de firma asociado

- ✅ **Información mostrada:**
  - **Firma Electrónica Avanzada:** Nombre del producto, cantidad, precio unitario y subtotal
  - **Servicio Notarial:** Si aplica, muestra nombre, cantidad, precio y subtotal
  - **Información del documento:** Identificador interno (primeros 8 caracteres del UUID) y título del documento
  - **Cantidad de firmantes:** Número total de firmantes configurados
  - **Lista de firmantes:** Email y RUT de cada firmante, ordenados por `signing_order`
  - **Configuración:** Indica si se enviará el documento finalizado a los firmantes (Sí/No)
  - **Datos de facturación:** Nombre completo, RUT, email, teléfono, dirección completa (calle, ciudad, región) y tipo DTE (Boleta/Factura)

- ✅ **Consultas de datos ampliadas:**
  - Consulta de `signing_documents` ampliada para incluir `title` y `send_to_signers_on_complete`
  - Nueva consulta de `signing_signers` para obtener lista completa de firmantes con email, nombre completo, RUT y orden de firma
  - Datos de facturación obtenidos desde `order.metadata.billing_data`

**Archivos modificados:**

- ✅ `apps/web/src/app/(dashboard)/checkout/[orderId]/page.tsx`
  - Importado ícono `PenTool` de lucide-react
  - Ampliada consulta de `signing_documents` para incluir título y configuración
  - Agregada consulta de firmantes desde `signing_signers`
  - Agregado botón "Gestionar Firmas" en sección de Acciones
  - Integrado componente `OrderDetailsCollapsible` después del Card de Resumen

- ✅ `apps/web/src/components/checkout/OrderDetailsCollapsible.tsx` (nuevo)
  - Componente cliente con estado para controlar expansión/colapso
  - Formateo de moneda usando `Intl.NumberFormat` con formato chileno
  - Diseño responsive y mobile-first
  - Uso de componentes Shadcn UI (Card, Button, Separator)
  - Íconos de lucide-react para mejor UX

**Beneficios:**

- ✅ Acceso directo a la administración del flujo de firmas desde el detalle del pedido
- ✅ Visibilidad completa de todos los detalles del pedido en un formato organizado
- ✅ Información colapsable que no ocupa espacio cuando no se necesita
- ✅ Mejor experiencia de usuario con información detallada del producto, firmantes y facturación
- ✅ Consistencia con el sistema de diseño de TuPatrimonio

---

**4. Corrección del Sistema de Numeración de Facturas (Nov 24, 2025)**

- ✅ **Problema resuelto**: Error "duplicate key value violates unique
  constraint invoices_invoice_number_key"
- ✅ **Causa identificada**: Sistema global de numeración causaba colisiones
  cuando múltiples organizaciones creaban facturas simultáneamente
- ✅ **Solución implementada**: Cambio a formato por organización
  `{ORG_SLUG}-{NÚMERO}` (similar a Stripe)
  - Ejemplo: `TU-PATRIMONIO-000001`, `MI-EMPRESA-000001`
- ✅ **Mejoras técnicas**:
  - Función SQL `generate_invoice_number(org_id UUID)` creada con lock por
    organización
  - Numeración independiente por organización (sin colisiones entre orgs)
  - Lock por organización permite paralelismo mejorado
  - Reintentos automáticos con backoff exponencial en código TypeScript
  - Formato legible y profesional
- ✅ **Archivos actualizados**:
  - `supabase/migrations/20251124000001_change_invoice_number_format.sql` (nueva
    migración)
  - `apps/web/src/lib/stripe/checkout.ts`
  - `apps/web/src/lib/stripe/invoices.ts`
  - `apps/web/src/lib/dlocal/checkout.ts`
  - `apps/web/src/lib/credits/auto-recharge.ts`
  - `apps/web/src/lib/credits/packages.ts`
- ✅ **Compatibilidad**: Función legacy mantenida para facturas existentes con
  formato `INV-YYYY-NNNNN`
- ✅ **Estado**: Completado y listo para producción

**5. Configuración de Métodos de Pago**

- ✅ Opción de pago en efectivo (CASH) deshabilitada
- ✅ Solo disponibles: CARD (Tarjeta) y BANK_TRANSFER (Transferencia Bancaria)
- ✅ Configuración aplicada para todos los países LATAM (CL, AR, CO, MX, PE)
- ✅ Métodos consistentes entre componente UI y función de cliente

**Archivos Modificados:**

- `apps/web/src/components/billing/DLocalCheckout.tsx`
- `apps/web/src/lib/dlocal/checkout.ts`
- `apps/web/src/lib/dlocal/client.ts`
- `apps/web/src/app/api/dlocal/checkout/route.ts`

**Estado:** ✅ **COMPLETADO Y LISTO PARA PRODUCCIÓN**

---

### 🎯 **Próximos Pasos Recomendados:**

1. **Testing en Producción:**
   - ✅ Verificar credenciales dLocal Go (DLOCAL_API_KEY, DLOCAL_SECRET_KEY)
   - ✅ Configurar webhook URL en dashboard de dLocal Go
   - ✅ Probar flujo completo de checkout con métodos CARD y BANK_TRANSFER
   - ✅ Verificar recepción y procesamiento de webhooks
   - ✅ Validar carga de créditos después de pago exitoso

2. **Monitoreo:**
   - 📊 Revisar logs de webhooks en producción
   - 📊 Verificar que las URLs se construyen correctamente en diferentes
     entornos
   - 📊 Monitorear errores de API de dLocal Go

3. **Mejoras Futuras (Opcional):**
   - 🔄 Re-habilitar pago en efectivo si es necesario (configuración por país)
   - 🔄 Agregar más métodos de pago según disponibilidad de dLocal Go
   - 🔄 Implementar retry logic para webhooks fallidos
   - 🔄 Dashboard de monitoreo de pagos dLocal
4. ✅ **Arquitectura que escala automáticamente**
5. ✅ **Stack que cualquier developer puede mantener**

---

**🚀 Con esta arquitectura simplificada tienes lo mejor de ambos mundos: la
robustez de un sistema enterprise pero la simplicidad de un startup. Puedes
enfocarte en construir features y conseguir clientes, no en mantener
infraestructura.**

**Tu ventaja competitiva está en los servicios de IA y el SEO foundation, no en
complejidad técnica innecesaria.**

**¡A ejecutar! 🎯**

---

## 💳 **DIRECTRICES PARA AGREGAR NUEVOS MEDIOS DE PAGO**

> **📅 Última actualización:** Enero 2025\
> **✅ Estado:** Sistema de pagos funcionando correctamente con Stripe,
> Transbank Webpay Plus y Transbank OneClick

### 🎯 **Principios Fundamentales**

Estas directrices aseguran que cualquier nuevo medio de pago siga el mismo
patrón probado y funcional que los medios actuales. **Aplican a TODOS los tipos
de compra, no solo créditos.**

### 📋 **Reglas Obligatorias**

#### **1. Estado Inicial del Pago: SIEMPRE 'pending'**

**❌ INCORRECTO:**

```typescript
status: "authorized"; // ❌ NUNCA hacer esto
status: "succeeded"; // ❌ NUNCA hacer esto directamente
```

**✅ CORRECTO:**

```typescript
status: "pending"; // ✅ SIEMPRE crear con este estado
```

**Razón:** El webhook o la página de success es responsable de actualizar el
estado. Esto permite:

- Verificación consistente del estado real del pago
- Procesamiento de créditos/productos en el momento correcto
- Manejo de errores y reintentos

**Ejemplo de implementación:**

```typescript
// apps/web/src/lib/[provider]/checkout.ts
const { data: payment } = await supabase
  .from("payments")
  .insert({
    // ... otros campos
    status: "pending", // ✅ SIEMPRE 'pending'
    metadata: {
      order_id: orderId,
      order_number: order.order_number,
      product_type: order.product_type,
      // ... metadata completo
    },
  });
```

#### **2. Crear Factura ANTES del Pago**

**Orden correcto:**

1. ✅ Crear factura en BD
2. ✅ Agregar línea de detalle (invoice_line_items)
3. ✅ Actualizar orden con `invoice_id` y status `'pending_payment'`
4. ✅ Crear pago con el provider
5. ✅ Crear registro de pago en BD con `invoice_id`

**Ejemplo:**

```typescript
// 1. Crear factura
const invoiceNumber = await generateInvoiceNumber(order.organization_id);
const { data: invoice } = await supabase
  .from('invoices')
  .insert({
    organization_id: order.organization_id,
    invoice_number: invoiceNumber,
    status: 'open',
    type: order.product_type === 'credits' ? 'credit_purchase' : 'one_time',
    // ... otros campos
  })
  .select()
  .single();

// 2. Agregar línea de detalle
await supabase
  .from('invoice_line_items')
  .insert({
    invoice_id: invoice.id,
    description: productData.name || `Producto ${order.product_type}`,
    // ... otros campos
  });

// 3. Actualizar orden
await updateOrderStatus(orderId, 'pending_payment', { invoiceId: invoice.id });

// 4. Crear pago con provider
const paymentResult = await providerClient.createPayment({...});

// 5. Crear registro de pago
const { data: payment } = await supabase
  .from('payments')
  .insert({
    invoice_id: invoice.id, // ✅ Vincular con factura
    status: 'pending', // ✅ Estado inicial
    // ... otros campos
  });
```

#### **3. Metadata Completo en el Pago**

**Metadata obligatorio:**

```typescript
metadata: {
  order_id: orderId,                    // ✅ ID de la orden
  order_number: order.order_number,     // ✅ Número de orden legible
  product_type: order.product_type,     // ✅ Tipo de producto (credits, service, etc.)
  product_id: order.product_id || '',   // ✅ ID del producto si existe
  type: order.product_type === 'credits' ? 'credit_purchase' : order.product_type,
  // Para créditos, agregar:
  ...(order.product_type === 'credits' && productData.credits_amount 
    ? { credits_amount: productData.credits_amount.toString() }
    : {}),
  // Información específica del provider:
  payment_method: 'webpay_plus' | 'oneclick' | 'stripe' | 'nuevo_provider',
  // ... otros campos específicos del provider
}
```

**Razón:** Permite buscar pagos por múltiples criterios y procesar correctamente
según el tipo de producto.

#### **4. URLs de Redirect desde Headers de Request**

**❌ INCORRECTO:**

```typescript
const baseUrl = "http://localhost:3000"; // ❌ Hardcodeado
const baseUrl = process.env.NEXT_PUBLIC_APP_URL; // ⚠️ Puede no estar configurado
```

**✅ CORRECTO:**

```typescript
// En la API route (apps/web/src/app/api/[provider]/checkout/route.ts)
const host = request.headers.get("host");
const protocol = request.headers.get("x-forwarded-proto") || "https";
const baseUrl = host
  ? `${protocol}://${host}`
  : process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

// Pasar baseUrl a la función de checkout
const result = await createPaymentForOrder(orderId, baseUrl);
```

**Razón:** Asegura que las URLs funcionen correctamente en producción,
desarrollo local y diferentes entornos de deploy.

#### **5. Página de Success: Verificación y Actualización Inmediata**

**Patrón obligatorio en `/checkout/[orderId]/success/page.tsx`:**

```typescript
// 1. Buscar pago por provider_payment_id o metadata
const { data: payment } = await supabase
  .from("payments")
  .select("*, invoice:invoices(*)")
  .eq("provider", "nuevo_provider")
  .eq("provider_payment_id", token)
  .maybeSingle();

// 2. Si está pendiente, verificar estado con el provider
if (payment?.status === "pending") {
  // Verificar directamente con el provider
  const providerStatus = await providerClient.verifyPayment(token);

  // Si está autorizado/completo, actualizar inmediatamente
  if (providerStatus.isAuthorized || providerStatus.isComplete) {
    await supabase
      .from("payments")
      .update({
        status: "succeeded",
        processed_at: new Date().toISOString(),
      })
      .eq("id", payment.id);

    // Actualizar factura
    await supabase
      .from("invoices")
      .update({ status: "paid", paid_at: new Date().toISOString() })
      .eq("id", payment.invoice.id);

    // Actualizar orden
    await updateOrderStatus(orderId, "paid", { paymentId: payment.id });
  }
}
```

**Razón:** Proporciona feedback inmediato al usuario sin esperar al webhook.

#### **6. Webhook: Procesamiento Completo**

**Patrón obligatorio en `/lib/[provider]/webhooks.ts`:**

```typescript
export async function handleProviderWebhook(event: ProviderWebhookEvent) {
  const supabase = createServiceRoleClient(); // ✅ Usar service role

  // 1. Buscar pago
  const { data: payment } = await supabase
    .from("payments")
    .select("*, invoice:invoices(*)")
    .eq("provider_payment_id", event.paymentId)
    .eq("provider", "nuevo_provider")
    .single();

  if (!payment) {
    // Buscar por order_id si no se encuentra por payment_id
    const { data: tempPayment } = await supabase
      .from("payments")
      .select("*, invoice:invoices(*)")
      .eq("metadata->>order_id", event.metadata.order_id)
      .eq("provider", "nuevo_provider")
      .maybeSingle();

    payment = tempPayment;
  }

  // 2. Verificar estado del pago con el provider
  const isSuccess = event.status === "paid" || event.status === "succeeded";

  if (!isSuccess) {
    // Actualizar a failed
    await supabase
      .from("payments")
      .update({ status: "failed", failure_reason: event.error })
      .eq("id", payment.id);
    return;
  }

  // 3. Actualizar pago a succeeded
  await supabase
    .from("payments")
    .update({
      status: "succeeded",
      processed_at: new Date().toISOString(),
    })
    .eq("id", payment.id);

  // 4. Actualizar factura
  if (payment.invoice) {
    await supabase
      .from("invoices")
      .update({ status: "paid", paid_at: new Date().toISOString() })
      .eq("id", payment.invoice.id);
  }

  // 5. Actualizar orden
  if (payment.metadata?.order_id) {
    await updateOrderStatus(payment.metadata.order_id, "paid", {
      paymentId: payment.id,
    });
  }

  // 6. Procesar producto según tipo (NO solo créditos)
  if (payment.metadata?.type === "credit_purchase") {
    // Agregar créditos
    await addCredits(
      payment.invoice.organization_id,
      parseFloat(payment.metadata.credits_amount),
      "credit_purchase",
      { payment_id: payment.id, invoice_id: payment.invoice.id },
    );
  } else if (payment.metadata?.product_type === "service") {
    // Activar servicio, enviar email, etc.
    await activateService(
      payment.metadata.product_id,
      payment.invoice.organization_id,
    );
  } else if (payment.metadata?.product_type === "subscription") {
    // Activar suscripción
    await activateSubscription(
      payment.metadata.product_id,
      payment.invoice.organization_id,
    );
  }
  // ... otros tipos de productos

  // 7. Enviar notificaciones
  await notifyPaymentSucceeded(
    payment.invoice.organization_id,
    payment.amount,
    payment.currency,
    payment.invoice.id,
  );
}
```

**Razón:** El webhook es la fuente de verdad. Debe manejar todos los tipos de
productos, no solo créditos.

#### **7. Actualización de Orden: Estados Correctos**

**Estados de orden:**

- `'pending'` → Orden creada, esperando pago
- `'pending_payment'` → Pago iniciado, factura creada
- `'paid'` → Pago confirmado (webhook o success page)
- `'completed'` → Producto entregado (créditos agregados, servicio activado,
  etc.)

**Ejemplo:**

```typescript
// Al crear pago
await updateOrderStatus(orderId, "pending_payment", {
  invoiceId: invoice.id,
  paymentId: payment.id,
});

// Al confirmar pago (webhook o success page)
await updateOrderStatus(orderId, "paid", { paymentId: payment.id });

// Al entregar producto (en webhook después de agregar créditos/activar servicio)
await updateOrderStatus(orderId, "completed");
```

### 📁 **Estructura de Archivos Requerida**

Para un nuevo provider `nuevo_provider`, crear:

```
apps/web/src/
├── lib/
│   └── nuevo_provider/
│       ├── client.ts          # Cliente del provider
│       ├── checkout.ts        # Funciones de creación de pago
│       └── webhooks.ts        # Manejo de webhooks
├── app/
│   └── api/
│       └── nuevo_provider/
│           ├── checkout/
│           │   └── route.ts   # API route para crear checkout
│           └── webhook/
│               └── route.ts   # API route para recibir webhooks
└── components/
    └── checkout/
        └── NuevoProviderCheckout.tsx  # Componente UI (opcional)
```

### ✅ **Checklist de Implementación**

Al agregar un nuevo medio de pago, verificar:

- [ ] ✅ Pago se crea con `status: 'pending'`
- [ ] ✅ Factura se crea ANTES del pago
- [ ] ✅ Orden se actualiza a `'pending_payment'` con `invoice_id`
- [ ] ✅ Metadata completo incluye `order_id`, `order_number`, `product_type`
- [ ] ✅ URLs de redirect se construyen desde headers de request
- [ ] ✅ Página success verifica estado y actualiza si está autorizado
- [ ] ✅ Webhook busca pago por `provider_payment_id` y por `order_id`
      (fallback)
- [ ] ✅ Webhook actualiza pago, factura y orden correctamente
- [ ] ✅ Webhook procesa TODOS los tipos de productos (no solo créditos)
- [ ] ✅ Webhook envía notificaciones de éxito/fallo
- [ ] ✅ Manejo de errores en cada paso
- [ ] ✅ Logging adecuado para debugging

### 🔍 **Ejemplos de Referencia**

**Implementaciones correctas actuales:**

- **Stripe**: `apps/web/src/lib/stripe/checkout.ts` y `webhooks.ts`
- **Transbank Webpay Plus**: `apps/web/src/lib/transbank/checkout.ts` (función
  `createTransbankPaymentForOrder`)
- **Transbank OneClick**: `apps/web/src/lib/transbank/checkout.ts` (función
  `createOneclickPaymentForOrder`)

**Página success de referencia:**

- `apps/web/src/app/(dashboard)/checkout/[orderId]/success/page.tsx`

### ⚠️ **Errores Comunes a Evitar**

1. **❌ Crear pago con status 'authorized' o 'succeeded'**
   - ✅ Siempre usar 'pending' inicialmente

2. **❌ No crear factura antes del pago**
   - ✅ Factura debe existir antes de crear el pago

3. **❌ Hardcodear URLs de redirect**
   - ✅ Construir desde headers de request

4. **❌ No verificar estado en página success**
   - ✅ Verificar con provider y actualizar si está autorizado

5. **❌ Webhook solo busca por provider_payment_id**
   - ✅ Implementar fallback buscando por order_id

6. **❌ Webhook solo procesa créditos**
   - ✅ Procesar todos los tipos de productos según metadata

7. **❌ No actualizar factura y orden en webhook**
   - ✅ Actualizar factura a 'paid' y orden a 'paid' → 'completed'

### 📚 **Documentación Adicional**

- **Sistema de Créditos**: `docs/features/CREDITS-SYSTEM.md`
- **Sistema de Facturación**: `docs/features/BILLING-SYSTEM.md`
- **Arquitectura de Checkout**: `docs/ARCHITECTURE.md` (sección de pagos)

---

**✅ Con estas directrices, cualquier nuevo medio de pago seguirá el mismo
patrón probado y funcionará correctamente para TODOS los tipos de compra.**

---

## ✅ **SISTEMA DE FACTURACIÓN ELECTRÓNICA INDEPENDIENTE - COMPLETADO** (Diciembre 2025)

> **📅 Completado:** Diciembre 2025\
> **🎯 Objetivo:** Sistema de facturación API-first independiente con
> integración Haulmer y Stripe\
> **📄 Documentación:** Ver `docs/INVOICING-SYSTEM.md` para detalles completos

### ✅ **Resumen de Implementación**

Se implementó un sistema de facturación completamente independiente en el schema
`invoicing` que reemplaza el sistema anterior basado en `billing.invoices`. Este
nuevo sistema:

- ✅ **API-first**: Endpoints RESTful para crear y gestionar documentos desde
  cualquier aplicación
- ✅ **Multi-proveedor**: Integración completa con Haulmer (Chile) y Stripe
  (Internacional)
- ✅ **Multi-tenant**: Aislamiento completo por `organization_id` con RLS
- ✅ **Almacenamiento**: PDFs y XMLs guardados automáticamente en Supabase
  Storage
- ✅ **Autenticación flexible**: Supabase Auth (usuarios internos) y API Keys
  (sistemas externos)

### ✅ **Schema `invoicing` Implementado**

**Tablas principales:**

- `invoicing.customers` - Receptores de documentos
- `invoicing.documents` - Documentos emitidos (facturas, boletas, invoices)
- `invoicing.document_items` - Líneas de detalle
- `invoicing.api_keys` - API Keys para acceso externo (futuro)
- `invoicing.emission_config` - Configuración por organización (futuro)

**Migraciones aplicadas:**

- `20251202120000_schema-invoicing-new.sql` - Schema base
- `20251202130000_invoicing-functions.sql` - Funciones helper
- `20251202140000_invoicing-rls.sql` - Políticas RLS
- `20251202150000_invoicing-views.sql` - Vistas públicas
- `20251202160000_invoicing-rpc-wrappers.sql` - Wrappers RPC
- `20251202170000_fix-determine-provider-syntax.sql` - Fix sintaxis
- `20251202180000_invoicing-schema-permissions.sql` - Permisos
- `20251202190000_invoicing-crud-functions.sql` - Funciones CRUD
- `20251202200000_fix-generate-document-number.sql` - Fix generación números

### ✅ **Integraciones Completadas**

**Haulmer (Chile):**

- ✅ Cliente API completo (`apps/web/src/lib/haulmer/client.ts`)
- ✅ Emisión de facturas electrónicas (TipoDTE: 33)
- ✅ Emisión de boletas electrónicas (TipoDTE: 39)
- ✅ Generación de PDF y XML
- ✅ Almacenamiento en `invoices/haulmer/{org_id}/`
- ✅ Datos del emisor configurados (RUT: 77028682-4)

**Stripe (Internacional):**

- ✅ Integración con Stripe Invoices
- ✅ Generación automática de invoices
- ✅ Descarga y almacenamiento de PDFs
- ✅ Almacenamiento en `invoices/stripe/{org_id}/`

### ✅ **API Endpoints Implementados**

- ✅ `POST /api/invoicing/documents` - Crear y emitir documento
- ✅ `GET /api/invoicing/documents` - Listar documentos
- ✅ `GET /api/invoicing/documents/[id]` - Obtener documento específico
- ✅ `POST /api/invoicing/documents/[id]/void` - Anular documento
- ✅ `POST /api/invoicing/customers` - Crear cliente
- ✅ `GET /api/invoicing/customers` - Listar clientes

### ✅ **Testing Completado**

- ✅ Factura Haulmer probada exitosamente (PDF + XML generados)
- ✅ Invoice Stripe probado exitosamente (PDF generado)
- ✅ Almacenamiento en Supabase Storage verificado
- ✅ URLs públicas funcionando correctamente

### 📋 **Configuración para Producción**

**Variables de entorno necesarias:**

- `HAULMER_API_KEY` - API Key de producción de Haulmer
- `HAULMER_ENVIRONMENT=production` - Cambiar de sandbox a production
- `STRIPE_SECRET_KEY` - Clave de producción de Stripe

**Datos del emisor:**

- Configurados en `apps/web/src/lib/haulmer/client.ts` (líneas 24-33)
- Pueden sobrescribirse con variables de entorno (`HAULMER_EMISOR_*`)

**Bucket Storage:**

- Bucket `invoices` debe existir en Supabase producción
- Políticas RLS configuradas para lectura pública

Ver `docs/INVOICING-SYSTEM.md` para documentación completa y checklist
pre-producción.

---

## 📋 **PRÓXIMO MILESTONE: Integración de Facturación Electrónica** (OBSOLETO - YA COMPLETADO)

> **📅 Planificado:** Enero 2025\
> **🎯 Objetivo:** Establecer sistema de facturación electrónica automática
> según proveedor de pago\
> **⚠️ NOTA:** Este milestone fue completado en Diciembre 2025 con el nuevo
> sistema independiente. Ver sección anterior.

### 🎯 **Requisitos del Sistema**

#### **Reglas de Facturación Automática:**

**✅ CAMBIO DE LÓGICA - Facturación Externa Automática:**

1. **Pago con Stripe** → Factura electrónica generada automáticamente por Stripe
   - No generamos facturas manualmente
   - Stripe maneja toda la facturación electrónica
   - Disponible para todos los usuarios (B2C y B2B)

2. **Pago con Transbank** → Factura electrónica generada automáticamente por
   Haulmer
   - No generamos facturas manualmente
   - Haulmer maneja toda la facturación electrónica
   - Solo disponible bajo condiciones específicas (ver restricciones)

#### **Restricciones de Transbank:**

**Transbank SOLO está disponible cuando se cumplen TODAS estas condiciones:**

1. ✅ **País:** Solo Chile (CL)
2. ✅ **Tipo de Usuario:** Solo usuarios B2B (organizaciones empresariales)
3. ✅ **Moneda Configurada:** La organización debe tener CLP (Peso Chileno) como
   moneda en su configuración
4. ✅ **Resto de casos:** Todos los demás usuarios deben usar Stripe

**Lógica de Disponibilidad:**

- Si usuario es B2C → Solo Stripe disponible
- Si usuario es B2B pero no tiene CLP configurado → Solo Stripe disponible
- Si usuario es B2B con CLP pero no es de Chile → Solo Stripe disponible
- Si usuario es B2B, tiene CLP configurado y es de Chile → Transbank
  disponible + Stripe disponible

### 📋 **Tareas de Implementación**

#### **1. Extender Schema de Facturas**

**Agregar campos a tabla `invoices` para tracking de facturas externas:**

```sql
ALTER TABLE invoices ADD COLUMN external_provider VARCHAR(50);
-- Valores: 'stripe', 'haulmer', NULL
-- Indica qué proveedor generó la factura automáticamente
ALTER TABLE invoices ADD COLUMN external_document_id VARCHAR(255);
-- ID del documento en el proveedor externo (Stripe invoice ID o Haulmer document ID)
ALTER TABLE invoices ADD COLUMN external_pdf_url TEXT;
-- URL del PDF del documento en el proveedor externo
ALTER TABLE invoices ADD COLUMN external_xml_url TEXT;
-- URL del XML (solo para Haulmer)
ALTER TABLE invoices ADD COLUMN external_status VARCHAR(50);
-- Estado del documento en el proveedor externo
```

**Agregar campo de moneda a tabla `organizations` (si no existe):**

```sql
ALTER TABLE organizations ADD COLUMN currency VARCHAR(3) DEFAULT 'USD';
-- Moneda preferida de la organización: 'USD', 'CLP', 'ARS', 'COP', 'MXN', 'PEN'
-- Usado para determinar disponibilidad de Transbank
```

#### **2. Integración con Haulmer**

**Crear módulo de integración:**

```
apps/web/src/lib/
└── haulmer/
    ├── client.ts          # Cliente API de Haulmer
    ├── invoices.ts        # Funciones para crear/generar facturas
    └── types.ts          # Tipos TypeScript para Haulmer
```

**Funcionalidades requeridas:**

- Autenticación con API de Haulmer
- Crear factura electrónica en Haulmer
- Obtener estado de factura
- Descargar PDF y XML de factura
- Manejo de errores y reintentos

**Variables de entorno necesarias:**

```env
HAULMER_API_URL=https://api.haulmer.com
HAULMER_API_KEY=tu_api_key
HAULMER_API_SECRET=tu_api_secret
HAULMER_COMPANY_RUT=12345678-9
HAULMER_ENVIRONMENT=production|sandbox
```

#### **3. Lógica de Disponibilidad de Transbank**

**Función para determinar si Transbank está disponible:**

```typescript
// apps/web/src/lib/checkout/transbank-availability.ts
export async function isTransbankAvailable(
  organizationId: string,
): Promise<boolean> {
  // Obtener datos de la organización
  const { data: org } = await supabase
    .from("organizations")
    .select("country, currency, organization_type")
    .eq("id", organizationId)
    .single();

  if (!org) return false;

  // Verificar todas las condiciones:
  // 1. País debe ser Chile
  if (org.country !== "CL") return false;

  // 2. Debe ser organización B2B (no personal)
  if (org.organization_type !== "business") return false;

  // 3. Moneda debe ser CLP
  if (org.currency !== "CLP") return false;

  return true;
}
```

**En funciones de checkout, filtrar métodos de pago disponibles:**

```typescript
// apps/web/src/lib/checkout/core.ts
export async function getAvailablePaymentMethods(organizationId: string) {
  const transbankAvailable = await isTransbankAvailable(organizationId);

  const methods = ["stripe"]; // Stripe siempre disponible

  if (transbankAvailable) {
    methods.push("transbank_webpay_plus", "transbank_oneclick");
  }

  return methods;
}
```

#### **4. Sincronización de Facturas Generadas por Proveedores**

**✅ IMPORTANTE:** Los proveedores generan las facturas automáticamente. Nuestro
sistema solo sincroniza la información.

**Para Stripe - Obtener factura generada automáticamente:**

```typescript
// apps/web/src/lib/stripe/invoices.ts
export async function syncStripeInvoice(
  paymentIntentId: string,
  invoiceId: string,
) {
  // Stripe genera facturas automáticamente al procesar el pago
  // Obtener el invoice asociado al payment intent
  const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

  if (paymentIntent.invoice) {
    const stripeInvoice = await stripe.invoices.retrieve(
      paymentIntent.invoice as string,
    );

    // Sincronizar información en nuestra BD
    await supabase
      .from("invoices")
      .update({
        external_provider: "stripe",
        external_document_id: stripeInvoice.id,
        external_pdf_url: stripeInvoice.invoice_pdf,
        external_status: stripeInvoice.status,
      })
      .eq("id", invoiceId);
  }
}
```

**Para Haulmer - Obtener factura generada automáticamente:**

```typescript
// apps/web/src/lib/haulmer/invoices.ts
export async function syncHaulmerInvoice(
  transactionToken: string,
  invoiceId: string,
) {
  // Haulmer genera facturas automáticamente al procesar el pago con Transbank
  // Obtener datos de la transacción desde Transbank
  const transbankResponse = await transbank.getTransactionResult(
    transactionToken,
  );

  // Obtener factura generada por Haulmer usando el token de transacción
  const haulmerInvoice = await haulmerClient.getInvoiceByTransaction(
    transactionToken,
  );

  // Sincronizar información en nuestra BD
  await supabase
    .from("invoices")
    .update({
      external_provider: "haulmer",
      external_document_id: haulmerInvoice.folio,
      external_pdf_url: haulmerInvoice.pdf_url,
      external_xml_url: haulmerInvoice.xml_url,
      external_status: haulmerInvoice.estado,
    })
    .eq("id", invoiceId);
}
```

#### **5. Procesamiento en Webhooks - Sincronización de Facturas**

**Actualizar webhooks para sincronizar facturas generadas automáticamente por
los proveedores:**

```typescript
// apps/web/src/lib/transbank/webhooks.ts
export async function handleTransbankWebhook(
  token: string,
  type: "webpay_plus" | "oneclick",
) {
  // ... código existente de procesamiento de pago ...

  // Después de actualizar pago a succeeded:
  if (payment.invoice && payment.status === "succeeded") {
    // Transbank procesa el pago y Haulmer genera la factura automáticamente
    // Sincronizar información de la factura generada por Haulmer
    await syncHaulmerInvoice(token, payment.invoice.id);
  }
}
```

```typescript
// apps/web/src/lib/stripe/webhooks.ts
export async function handlePaymentIntentSucceeded(
  paymentIntent: Stripe.PaymentIntent,
) {
  // ... código existente ...

  // Después de actualizar pago:
  if (payment.invoice && paymentIntent.status === "succeeded") {
    // Stripe genera facturas automáticamente al procesar el pago
    // Sincronizar información de la factura generada por Stripe
    await syncStripeInvoice(paymentIntent.id, payment.invoice.id);
  }
}
```

#### **6. UI para Selección de Método de Pago**

**Mostrar métodos disponibles según restricciones:**

```typescript
// apps/web/src/components/checkout/OrderCheckoutForm.tsx
const [availableMethods, setAvailableMethods] = useState<string[]>([]);

useEffect(() => {
  async function loadMethods() {
    const methods = await getAvailablePaymentMethods(organizationId);
    setAvailableMethods(methods);
  }
  loadMethods();
}, [organizationId]);

// En el formulario, mostrar solo métodos disponibles:
{
  availableMethods.includes("stripe") && (
    <PaymentMethodOption
      value="stripe"
      label="Tarjeta de Crédito/Débito (Stripe)"
      description="Pago seguro con Stripe"
    />
  );
}

{
  availableMethods.includes("transbank_webpay_plus") && (
    <PaymentMethodOption
      value="transbank_webpay_plus"
      label="Webpay Plus (Transbank)"
      description="Solo disponible para empresas chilenas con CLP"
    />
  );
}

{
  availableMethods.includes("transbank_oneclick") && (
    <PaymentMethodOption
      value="transbank_oneclick"
      label="OneClick (Transbank)"
      description="Pago rápido con tarjeta guardada"
    />
  );
}
```

#### **7. Visualización de Documentos**

**Página para descargar facturas/boletas:**

```typescript
// apps/web/src/app/(dashboard)/billing/invoices/[id]/page.tsx
// Mostrar botones de descarga según external_provider:
{
  invoice.external_provider === "stripe" && invoice.external_pdf_url && (
    <Button asChild>
      <a
        href={invoice.external_pdf_url}
        target="_blank"
        rel="noopener noreferrer"
      >
        Descargar PDF (Stripe)
      </a>
    </Button>
  );
}

{
  invoice.external_provider === "haulmer" && (
    <>
      {invoice.external_pdf_url && (
        <Button asChild>
          <a
            href={invoice.external_pdf_url}
            target="_blank"
            rel="noopener noreferrer"
          >
            Descargar PDF (Haulmer)
          </a>
        </Button>
      )}
      {invoice.external_xml_url && (
        <Button asChild variant="outline">
          <a
            href={invoice.external_xml_url}
            target="_blank"
            rel="noopener noreferrer"
          >
            Descargar XML (Haulmer)
          </a>
        </Button>
      )}
    </>
  );
}
```

### ✅ **Checklist de Implementación**

- [ ] ✅ Migración SQL: Agregar campos `external_provider`,
      `external_document_id`, `external_pdf_url`, `external_xml_url`,
      `external_status` a tabla `invoices`
- [ ] ✅ Migración SQL: Agregar campo `currency` a tabla `organizations` (si no
      existe)
- [ ] ✅ Lógica de disponibilidad: Función `isTransbankAvailable()` que verifica
      país, tipo B2B y moneda CLP
- [ ] ✅ Integración Haulmer: Crear cliente API y función `syncHaulmerInvoice()`
      para sincronizar facturas generadas automáticamente
- [ ] ✅ Integración Stripe: Función `syncStripeInvoice()` para sincronizar
      facturas generadas automáticamente
- [ ] ✅ Webhooks Transbank: Actualizar para sincronizar factura de Haulmer
      después del pago exitoso
- [ ] ✅ Webhooks Stripe: Actualizar para sincronizar factura de Stripe después
      del pago exitoso
- [ ] ✅ UI Checkout: Filtrar métodos de pago disponibles según restricciones
      (mostrar Transbank solo si aplica)
- [ ] ✅ UI Configuración: Permitir seleccionar moneda (CLP) en configuración de
      organización B2B
- [ ] ✅ Visualización: Página para descargar PDFs/XMLs según proveedor externo
- [ ] ✅ Testing: Probar flujo completo con Stripe (todos los usuarios)
- [ ] ✅ Testing: Probar flujo completo con Transbank (solo B2B Chile con CLP)
- [ ] ✅ Testing: Verificar que usuarios no elegibles no vean Transbank como
      opción
- [ ] ✅ Documentación: Actualizar documentación de facturación con nueva lógica

### 📚 **Referencias**

- **API Haulmer**: Documentación oficial de Haulmer
- **Stripe Invoicing**:
  [Stripe Billing Documentation](https://stripe.com/docs/billing/invoices)
- **Sistema de Facturación Actual**: `docs/features/BILLING-SYSTEM.md`

### ⚠️ **Consideraciones Importantes**

1. **Facturación Automática**: Los proveedores (Stripe y Haulmer) generan las
   facturas automáticamente. Nuestro sistema solo sincroniza la información, no
   genera facturas manualmente.

2. **Restricciones de Transbank**: Transbank SOLO está disponible cuando se
   cumplen TODAS estas condiciones:
   - País: Chile (CL)
   - Tipo de usuario: B2B (organización empresarial)
   - Moneda configurada: CLP (Peso Chileno)
   - Si alguna condición no se cumple, solo Stripe está disponible

3. **Validación de RUT**: Haulmer requiere RUT válido de la organización para
   generar facturas. Asegurar que las organizaciones B2B chilenas tengan RUT
   completo.

4. **Datos de Cliente**: Asegurar que los datos de la organización estén
   completos para sincronización con Haulmer (RUT, razón social, dirección,
   etc.)

5. **Ambiente**: Configurar correctamente ambiente sandbox/producción de Haulmer
   según el entorno.

6. **Manejo de Errores**: Implementar retry logic para sincronización de
   facturas si falla la obtención desde los proveedores externos.

7. **Sincronización**: Mantener sincronizado estado entre nuestra BD y
   proveedores externos. Los webhooks deben sincronizar las facturas
   inmediatamente después del pago exitoso.

8. **Estado de Pagos**: ✅ **Los pagos con Stripe y Transbank ya están
   funcionando correctamente** - Solo falta implementar la sincronización de
   facturas.

9. **Configuración de Moneda**: Las organizaciones B2B deben poder configurar su
   moneda preferida (CLP para habilitar Transbank). El campo `currency` debe
   estar en la tabla `organizations`.

---

**📋 Este milestone establecerá un sistema robusto de sincronización de
facturación electrónica automática. Los proveedores (Stripe y Haulmer) generan
las facturas automáticamente al procesar los pagos, y nuestro sistema sincroniza
la información para mantener los registros actualizados. Transbank solo está
disponible para organizaciones B2B chilenas con CLP configurado, mientras que
Stripe está disponible para todos los usuarios.**

---

## ✅ **SISTEMA DE FACTURACIÓN ELECTRÓNICA AUTOMÁTICA - IMPLEMENTADO** (Diciembre 2025)

**📅 Fecha de Implementación:** 2 Diciembre 2025

### 🎯 **Objetivo**

Implementar sincronización automática de facturas electrónicas (Stripe/Haulmer)
que se dispara cuando las órdenes pasan al estado **"completed"** (no "paid"),
con restricciones de Transbank para B2B Chile CLP.

**Flujo de estados:** `pending_payment` → `paid` → `completed` → **[Emitir
factura externa]**

### ✅ **Implementación Completada**

#### **1. Migraciones SQL**

- ✅ **Migración 20251202000001**: Agregados campos a tabla `invoices`:
  - `external_provider` (stripe | haulmer)
  - `external_document_id` (ID en el proveedor)
  - `external_pdf_url` (URL del PDF)
  - `external_xml_url` (URL del XML - solo Haulmer)
  - `external_status` (estado en el proveedor)
- ✅ **Migración 20251202000002**: Creado bucket Storage `invoices` para
  almacenar PDFs/XMLs con políticas RLS

#### **2. Lógica de Disponibilidad de Métodos de Pago**

- ✅ **Archivo**: `apps/web/src/lib/payments/availability.ts`
- ✅ Función `isTransbankAvailable()` - Verifica:
  - `org_type === 'business'` (B2B)
  - `country === 'CL'` (Chile)
  - `currency === 'CLP'` (determinado automáticamente por país)
- ✅ Función `getAvailablePaymentMethods()` - Retorna métodos disponibles según
  organización
- ✅ Función `isPaymentMethodAvailable()` - Verifica disponibilidad de método
  específico

#### **3. Integración con Stripe**

- ✅ **Archivo**: `apps/web/src/lib/stripe/sync.ts`
- ✅ Función `createStripeInvoiceForOrder()` - Crea Invoice en Stripe siguiendo
  flujo de Make:
  1. Crear Invoice (`POST /v1/invoices`)
  2. Agregar Invoice Item (`createInvoiceItem`)
  3. Marcar como pagado (`POST /v1/invoices/{id}/pay` con
     `paid_out_of_band: true`)
  4. Enviar Invoice (`POST /v1/invoices/{id}/send`)
- ✅ Función `syncStripeInvoice()` - Crea invoice cuando orden llega a
  "completed"
- ✅ Función `syncStripeInvoiceById()` - Sincroniza invoice existente por ID

#### **4. Integración con Haulmer (OpenFactura)**

- ✅ **Archivo**: `apps/web/src/lib/haulmer/client.ts`
- ✅ Cliente API Haulmer con autenticación correcta (header `apikey`, no Bearer)
- ✅ Función `emitirDTE()` - Emite Documento Tributario Electrónico
- ✅ Función `emitirFactura()` - Emite Factura Electrónica (TipoDTE: 33)
- ✅ Función `emitirBoleta()` - Emite Boleta Electrónica (TipoDTE: 39)
- ✅ Función `listarDocumentosEmitidos()` - Lista documentos con filtros
- ✅ **Datos del Emisor configurados** (TuPatrimonio):
  - RUT: 77028682-4
  - Razón Social: TU PATRIMONIO ASESORIAS SPA
  - Giro: SERV DIGITALES, INMOBILIARIOS, FINANCIEROS, COMERCIALIZACION VEHICULO
  - Acteco: 620900
  - Dirección: AV. PROVIDENCIA 1208, OF 207
  - Comuna: Providencia
  - Código SII Sucursal: 83413793
  - Teléfono: +56949166719

- ✅ **Archivo**: `apps/web/src/lib/haulmer/sync.ts`
- ✅ Función `emitHaulmerInvoice()` - Emite factura y guarda PDF/XML en Storage
- ✅ Función `syncHaulmerInvoice()` - Wrapper que obtiene datos y emite factura
- ✅ Guardado automático de PDF y XML en Supabase Storage (bucket `invoices`)

#### **5. Orquestador de Sincronización**

- ✅ **Archivo**: `apps/web/src/lib/billing/invoice-sync.ts`
- ✅ Función `syncExternalInvoice()` - Detecta proveedor y llama función
  correspondiente:
  - Si Stripe → `syncStripeInvoice()`
  - Si Transbank → `syncHaulmerInvoice()`

#### **6. Hook de Sincronización en Estado "completed"**

- ✅ **Archivo**: `apps/web/src/lib/checkout/core.ts`
- ✅ Modificado `updateOrderStatus()` para disparar sincronización cuando orden
  pasa a "completed"
- ✅ Importación dinámica para evitar dependencias circulares
- ✅ Manejo de errores no bloqueante (no falla actualización de estado si
  sincronización falla)

#### **7. UI Actualizada**

- ✅ **Checkout**: `apps/web/src/app/(dashboard)/checkout/[orderId]/page.tsx`
  - Filtra métodos de pago usando `isTransbankAvailable()`
  - Transbank solo visible para B2B Chile CLP
- ✅ **Facturas**: `apps/web/src/app/(dashboard)/billing/invoices/[id]/page.tsx`
  - Botones de descarga según proveedor externo:
    - Stripe: Botón PDF
    - Haulmer: Botones PDF y XML

### 📋 **Archivos Creados/Modificados**

**Migraciones SQL:**

- `supabase/migrations/20251202000001_add_external_invoice_fields.sql`
- `supabase/migrations/20251202000002_create_invoices_storage_bucket.sql`

**Librerías:**

- `apps/web/src/lib/payments/availability.ts` (nuevo)
- `apps/web/src/lib/haulmer/client.ts` (nuevo)
- `apps/web/src/lib/haulmer/sync.ts` (nuevo)
- `apps/web/src/lib/stripe/sync.ts` (nuevo)
- `apps/web/src/lib/billing/invoice-sync.ts` (nuevo)
- `apps/web/src/lib/checkout/core.ts` (modificado)

**UI:**

- `apps/web/src/app/(dashboard)/checkout/[orderId]/page.tsx` (modificado)
- `apps/web/src/app/(dashboard)/billing/invoices/[id]/page.tsx` (modificado)

### 🔧 **Variables de Entorno Requeridas**

```env
# Haulmer API
HAULMER_API_KEY=b3c13eadf1374286947fbea9d5888f87
HAULMER_ENVIRONMENT=production  # o 'sandbox' para pruebas

# Opcional: Sobrescribir datos del emisor (valores por defecto ya configurados)
# HAULMER_EMISOR_RUT=77028682-4
# HAULMER_EMISOR_RAZON_SOCIAL=TU PATRIMONIO ASESORIAS SPA
# HAULMER_EMISOR_GIRO=SERV DIGITALES, INMOBILIARIOS, FINANCIEROS...
# HAULMER_EMISOR_ACTECO=620900
# HAULMER_EMISOR_DIRECCION=AV. PROVIDENCIA 1208, OF 207
# HAULMER_EMISOR_COMUNA=Providencia
# HAULMER_EMISOR_SUCURSAL=83413793
# HAULMER_EMISOR_TELEFONO=+56949166719
```

### ⚠️ **Consideraciones Técnicas**

1. **Emisión vs Sincronización**:
   - **Stripe**: Crea Invoice nuevo cuando orden llega a "completed" (aunque ya
     se haya cobrado)
   - **Haulmer**: Emite DTE (Factura/Boleta) cuando orden llega a "completed"

2. **Moneda Automática**: La moneda se determina automáticamente por país:
   - Chile (CL) → CLP → Transbank habilitado
   - Otros países → USD → Solo Stripe

3. **Storage**: PDFs y XMLs de Haulmer se guardan en Supabase Storage (bucket
   `invoices`) y se almacenan las URLs en la BD

4. **Idempotencia**: Haulmer soporta Idempotency Key para evitar emisiones
   duplicadas

5. **Rate Limits Haulmer**:
   - 3 peticiones por segundo
   - 100 peticiones por minuto

### 📋 **PRÓXIMO PASO PENDIENTE**

**🔄 TESTING COMPLETO DE FACTURACIÓN:**

- [ ] **Testing Stripe**: Probar flujo completo de compra de créditos con
      Stripe:
  - [ ] Crear orden
  - [ ] Pagar con Stripe
  - [ ] Verificar que orden pasa a "paid"
  - [ ] Verificar que orden pasa a "completed" (después de agregar créditos)
  - [ ] Verificar que se crea Invoice en Stripe
  - [ ] Verificar que PDF está disponible en la página de factura
  - [ ] Verificar que campos `external_provider`, `external_document_id`,
        `external_pdf_url` están correctos

- [ ] **Testing Transbank**: Probar flujo completo de compra de créditos con
      Transbank:
  - [ ] Crear orden con organización B2B Chile CLP
  - [ ] Pagar con Transbank (Webpay Plus o OneClick)
  - [ ] Verificar que orden pasa a "paid"
  - [ ] Verificar que orden pasa a "completed" (después de agregar créditos)
  - [ ] Verificar que se emite DTE en Haulmer
  - [ ] Verificar que PDF y XML están disponibles en Storage
  - [ ] Verificar que PDF y XML están disponibles en la página de factura
  - [ ] Verificar que campos `external_provider`, `external_document_id`,
        `external_pdf_url`, `external_xml_url` están correctos

- [ ] **Testing Restricciones**: Verificar que usuarios no elegibles no ven
      Transbank:
  - [ ] Usuario B2C no ve Transbank
  - [ ] Usuario B2B de otro país no ve Transbank
  - [ ] Usuario B2B Chile sin CLP no ve Transbank (si aplica)

- [ ] **Testing Errores**: Verificar manejo de errores:
  - [ ] Error si Haulmer API Key no está configurada
  - [ ] Error si organización no tiene RUT
  - [ ] Error si falla creación de Invoice en Stripe
  - [ ] Error si falla emisión de DTE en Haulmer
  - [ ] Verificar que errores no bloquean actualización de estado de orden

- [ ] **Testing Storage**: Verificar que archivos se guardan correctamente:
  - [ ] PDFs de Haulmer se guardan en Storage
  - [ ] XMLs de Haulmer se guardan en Storage
  - [ ] URLs públicas funcionan correctamente
  - [ ] Políticas RLS permiten acceso solo a usuarios de la organización

---

## 🔧 Correcciones y Optimizaciones - Diciembre 9, 2025

### ✅ **Corrección Página de Reembolsos (`/admin/refunds`)**

**Problema identificado:**

- Error en consola: "A <Select.Item /> must have a value prop that is not an
  empty string"
- Los componentes Select de filtros (Estado, Proveedor, Destino) usaban
  `value=""` que no está permitido por Radix UI Select
- Esto causaba errores en la consola y potenciales problemas de renderizado

**Solución implementada:**

- ✅ Cambiado valores vacíos (`value=""`) por `value="all"` en todos los
  SelectItem de filtros
- ✅ Actualizada lógica de filtrado para tratar `"all"` como "sin filtro"
- ✅ Actualizado estado inicial de filtros para usar `"all"` en lugar de `""`
- ✅ Actualizada función `clearFilters()` para establecer `"all"` en lugar de
  `""`
- ✅ Actualizada función `hasActiveFilters` para verificar que el valor no sea
  `"all"`

**Archivos modificados:**

- `apps/web/src/app/(admin)/admin/refunds/page.tsx`

**Resultado:**

- ✅ Error crítico eliminado de la consola
- ✅ Filtros funcionando correctamente
- ✅ Página carga sin errores
- ✅ Sin errores de linting

### ✅ **Optimización Componente PendingOrdersBadge**

**Problema identificado:**

- El componente `PendingOrdersBadge` estaba haciendo peticiones repetidas a
  `/api/checkout/pending` con código 401 cuando el usuario estaba en páginas de
  admin
- Esto causaba:
  - Sobrecarga del sistema con cientos de peticiones innecesarias
  - Logs repetitivos en el terminal
  - Peticiones que fallaban sistemáticamente (401) porque el componente no
    debería ejecutarse en admin

**Solución implementada:**

- ✅ Retorno temprano: El componente retorna `null` cuando detecta que está en
  una página de admin (`pathname?.startsWith('/admin')`)
- ✅ Limpieza de recursos: Cuando detecta que está en admin, limpia:
  - Intervalos de polling (`clearInterval`)
  - Canales de Realtime (`supabase.removeChannel`)
  - Estado del componente (`setOrders([])`)
- ✅ Verificaciones adicionales: Cada ejecución del intervalo verifica
  nuevamente si está en admin antes de hacer peticiones
- ✅ Eliminación de logs innecesarios: Removidos logs de consola que generaban
  ruido

**Archivos modificados:**

- `apps/web/src/components/checkout/PendingOrdersBadge.tsx`

**Resultado:**

- ✅ No más peticiones a `/api/checkout/pending` cuando el usuario está en
  páginas de admin
- ✅ Reducción significativa de carga en el sistema
- ✅ Logs más limpios en el terminal
- ✅ Mejor rendimiento general de la aplicación

**Impacto:**

- **Antes**: Cientos de peticiones fallidas por minuto cuando navegando en admin
- **Después**: Cero peticiones cuando en admin, solo cuando es necesario en
  dashboard

---

## 🔌 INTEGRACIÓN CERTIFICADORA DEL SUR (CDS) (Diciembre 2025)

> **Estado:** FUNCIONANDO 🟢 **Objetivo:** Gestión completa de firma electrónica
> avanzada (FEA) con proveedor CDS

### ✅ COMPLETADO - Edge Function `cds-signature`

Core de la integración que maneja todas las llamadas a la API de CDS.

**Operaciones Soportadas:**

1. ✅ `check-vigencia`: Consultar si un RUT tiene firma vigente
2. ✅ `enroll`: Enrolar un nuevo firmante (crear usuario CDS)
3. ✅ `request-second-factor`: Solicitar código OTP al correo
4. ✅ `sign-multiple`: Firmar documentos (flujo principal)
5. ✅ `get-document`: Obtener documento firmado por código de transacción
6. ✅ `unblock-certificate`: Desbloquear certificado bloqueado
7. ✅ `unblock-second-factor`: Desbloquear segundo factor

**Mejoras Críticas Implementadas:**

- ✅ **Robustez SQL:** Uso de `LIMIT 1` y acceso seguro a arrays en
  `getCDSConfig` para evitar errores `PGRST116`.
- ✅ **Validation Pings:** Webhook optimizado para responder `200 OK` incluso
  sin transacción, permitiendo la validación de URL de CDS.
- ✅ **Authorization Payload:** Inclusión automática de `authorization` en el
  cuerpo de la solicitud de enrolamiento.
- ✅ **Debug Logs:** Logging detallado de requests y responses para trazar
  errores HTTP/API.

### ✅ COMPLETADO - Webhook `signature-webhook`

Punto de entrada para notificaciones de CDS.

- ✅ Soporte para métodos `GET` (validación) y `POST` (eventos).
- ✅ Autorización relajada para permitir validación inicial de CDS.
- ✅ Procesamiento de eventos de firma exitosa.
- ✅ Actualización automática del estado del documento y firmante en BD.

### ✅ COMPLETADO - Frontend & API

- ✅ Route `/api/signing/enroll`: Manejo de errores detallado de CDS.
- ✅ Componente `EnrollmentForm`: UI clara para datos de enrolamiento.
- ✅ Componente `SigningPageClient`: Preview de documentos con seguridad por
  token.
- ✅ Route `/api/signing/preview/[id]`: Streaming seguro de documentos desde
  Storage (Service Role authorized).

### 🚧 EN PROCESO - Panel de Administración CDS

Ubicación: `/admin/cds`

Panel para probar manualmente cada endpoint sin realizar un flujo de firma
completo. Permitirá:

- Verificar credenciales.
- Desbloquear usuarios (casos de soporte comunes).
- Descargar documentos manualmente por código de transacción.
---

## 🆕 SISTEMA DE BETA SIGNUP & WAITLIST 🚀 (Diciembre 2025)

> **📅 Fecha:** Diciembre 30, 2025\
> **📊 Estado:** COMPLETADO ✅\
> **🎯 Objetivo:** Captura de leads para beta y futuras campañas con soporte
> para embedding.

### ✅ COMPLETADO - Backend & Base de Datos Multi-Campaña

**Schema `marketing` Actualizado:**

- ✅ Modificación de `marketing.waitlist_subscribers`:
  - Eliminada restricción de email único global.
  - Nueva columna `campaign` (default: 'beta').
  - Nueva restricción compuesta: `UNIQUE(email, campaign)`.
  - Permite que un mismo usuario se suscriba a múltiples listas (ej: Beta, País
    X, Newsletter).
- ✅ **RPC `public.subscribe_to_waitlist`:**
  - Función segura (`SECURITY DEFINER`) para insertar en schema `marketing`
    desde API pública.
  - Lógica automática para `use_case`: Detecta si es 'business' (si hay empresa)
    o 'personal'.
  - Manejo de duplicados específico por campaña.

**Migraciones:**

- `20251230000002_enable_multi_campaign_waitlist.sql` - Habilita multi-campaña.
- `20251230000001_fix_waitlist_rpc.sql` - RPC corregida para constraint
  `use_case`.

### ✅ COMPLETADO - Frontend & Embed

**Componentes:**

- ✅ `BetaSignupForm.tsx` - Formulario reactivo optimizado para iframe.
- ✅ Página pública: `/beta-signup` (sin layout de dashboard, limpia).

**Seguridad & Embed:**

- ✅ Configuración de `next.config.ts` para Headers de seguridad.
- ✅ **CSP Restrictivo:** Iframe permitido SOLO en dominios autorizados:
  - `tupatrimon.io`
  - `www.tupatrimon.io`
  - `localhost`
- ✅ Protección contra Clickjacking en otros sitios.

**Integración:**

- ✅ API Route `/api/beta/signup` actualizada para enviar `campaign`.

---

## 📋 HISTORIAL DE REVISIONES EN ADMIN (Enero 2025)

> **📅 Fecha:** Enero 5, 2026\
> **📊 Estado:** COMPLETADO ✅\
> **🎯 Objetivo:** Mejorar trazabilidad mostrando todas las revisiones (IA y manuales) en panel admin.

### ✅ COMPLETADO - Vista SQL Consolidada

**Nueva Migración:**

- ✅ `20251231000012_review_history_view.sql` - Vista `signing.review_history` que consolida:
  - Información de documentos con su estado actual
  - Revisión IA más reciente (con score de confianza)
  - Conteo de mensajes cliente-equipo
  - Indicador de revisión manual
  - Ordenado por fecha de última revisión

### ✅ COMPLETADO - Interfaz con Pestañas

**Página Admin Actualizada:** `/admin/document-review`

- ✅ **Pestaña "Pendientes":**
  - Cola de trabajo para el equipo de revisión
  - Estados: `manual_review`, `needs_correction`
  - Filtro por estado (Todos, Revisión Manual, Necesita Corrección)
  
- ✅ **Pestaña "Historial":**
  - Todos los documentos que pasaron por revisión
  - Estados expandidos: pending_ai_review, ai_rejected, approved, pending_signature, signed, completed, rejected
  - Columna "Tipo de Revisión": muestra si fue IA, Manual o Ambas
  - Columna "Mensajes": conteo de interacciones con ícono
  - Revisión IA con score de confianza (ej: "IA Aprobó (95%)")

**Componentes Actualizados:**

- ✅ `DocumentReviewClient.tsx`:
  - Integración de componente `Tabs` de shadcn
  - Badges expandidos para todos los estados del documento
  - Funciones para calcular tipo de revisión y conteo de mensajes
  - Navegación entre pestañas manteniendo paginación

- ✅ `apps/web/src/app/(admin)/admin/document-review/page.tsx`:
  - Manejo de parámetro `tab` en searchParams
  - Queries diferenciadas para pendientes vs historial
  - Inclusión de conteo de mensajes (`signing_document_messages`)

**Trazabilidad Mejorada:**

- ✅ Historial completo de todas las revisiones realizadas
- ✅ Identificación clara de qué documentos pasaron por IA vs revisión manual
- ✅ Visibilidad del número de interacciones con el cliente
- ✅ Score de confianza de la IA en cada revisión
- ✅ Fecha de última revisión para ordenamiento cronológico

**Impacto:**

- **Antes**: Solo se veían documentos en cola de revisión manual (2 estados)
- **Después**: Vista completa de 9+ estados diferentes con historial trazable de todas las revisiones