# 🗺️ Hoja de Ruta - Ecosistema TuPatrimonio

## 📋 Información del Proyecto

### Stack Tecnológico
- **Backend:** Supabase (PostgreSQL + Auth + Storage + Realtime)
- **Frontend:** Next.js 14+ (App Router) + TailwindCSS
- **Deployment:** Netlify
- **Lenguaje:** TypeScript
- **CMS (Landing/Blog):** Contentful / Sanity / WordPress Headless (a definir)

### Servicios Externos
- **Pagos:** Stripe + dLocal Go
- **Email:** SendGrid (solo API, templates propios)
- **Auth/SMS:** Twilio
- **Verificación:** Veriff (biometría + documentos)
- **Storage:** AWS S3 o Firebase Storage
- **SEO Tools:** Google Search Console, Ahrefs/SEMrush, Schema.org

### Principios de Diseño
- **Base de datos ligera:** Mínima documentación almacenada, usar referencias a storage
- **Multi-tenant nativo:** Todo filtrado por organization_id
- **API-first:** Diseño REST consistente
- **Event-driven:** Arquitectura basada en eventos para desacoplamiento
- **Seguridad:** RLS en todas las tablas, encriptación en reposo
- **SEO-first:** Contenido optimizado para motores de búsqueda y IA

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

3. **Performance Optimization**
   ```typescript
   // Implementar:
   - Next.js Image optimization
   - Font optimization (next/font)
   - Code splitting automático
   - ISR (Incremental Static Regeneration) para blog
   - Edge caching con Netlify
   - Lazy loading de componentes pesados
   
   // Targets:
   - Lighthouse Score > 95
   - Core Web Vitals: Todos en verde
   - First Contentful Paint < 1.8s
   - Largest Contentful Paint < 2.5s
   - Cumulative Layout Shift < 0.1
   ```

4. **Sitemap y Robots.txt Dinámicos**
   ```typescript
   // app/sitemap.ts
   export default async function sitemap() {
     const posts = await getBlogPosts()
     const guides = await getGuides()
     
     return [
       { url: 'https://tupatrimonio.app', changeFrequency: 'daily' },
       { url: 'https://tupatrimonio.app/precios', changeFrequency: 'weekly' },
       ...posts.map(post => ({
         url: `https://tupatrimonio.app/blog/${post.slug}`,
         lastModified: post.updatedAt,
         changeFrequency: 'monthly',
       })),
     ]
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

Secundarias (Medium Intent):
- "cómo firmar un pdf" [1200/mes, KD: 25]
- "qué es firma electrónica avanzada" [390/mes, KD: 28]
- "documentos notariales digitales" [170/mes, KD: 30]

Long-tail (High Conversion):
- "mejor software firma electrónica empresas" [90/mes, KD: 22]
- "firma electrónica con validez legal chile" [110/mes, KD: 26]
- "automatizar firma de contratos" [50/mes, KD: 18]

Informational (Top of Funnel):
- "tipos de firma electrónica" [820/mes, KD: 20]
- "diferencia firma digital y electrónica" [590/mes, KD: 22]
- "requisitos firma electrónica" [280/mes, KD: 24]
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

#### Calendario Editorial (Primeras 12 semanas):

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
- Features: 3-4 beneficios principales
- How it works: 3 pasos simples
- Use cases: Tabs con diferentes industrias
- Pricing preview: Link a página de precios
- FAQ accordion
- Final CTA: "Empieza Gratis"

SEO:
- Meta title: "TuPatrimonio - Firma Electrónica y Verificación de Identidad Digital | Chile"
- Meta desc: "Firma documentos online con validez legal. Verificación de identidad biométrica. Notaría digital. Prueba gratis 30 días. +500 empresas confían en nosotros."
- H1: "Digitaliza tus Documentos con Firma Electrónica Legal en Chile"
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

**5. Página de Precios (`/precios`)**
```
Estructura:
- Tabla comparativa de planes
- Toggle: Mensual/Anual (con descuento)
- Calculator: Estimar costo según uso
- FAQ sobre facturación
- CTA por plan
- Opción "Hablar con Ventas" para Enterprise

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
   
   Las IA's priorizan contenido estructurado en Q&A format
   ```

2. **Authoritative Content Signals**
   ```
   - Citar fuentes legales oficiales
   - Incluir fechas de actualización
   - Mostrar expertise: bio de autores con credenciales
   - Enlaces a legislación chilena (.gob.cl)
   ```

3. **Clear, Direct Answers**
   ```
   Formato preferido por IA's:
   - Primera oración responde directamente
   - Párrafo expandido con contexto
   - Lista de pasos o bullets
   - Ejemplo práctico
   
   Ejemplo:
   "¿Qué es una firma electrónica avanzada?
   
   Una firma electrónica avanzada es un tipo de firma digital 
   que permite identificar de manera única al firmante y detectar 
   cualquier cambio posterior en el documento firmado. 
   
   Características principales:
   - Vinculada únicamente al firmante
   - Permite identificar al firmante
   - Creada con medios bajo control exclusivo del firmante
   - Detecta alteraciones posteriores
   
   En Chile, está regulada por la Ley 19.799..."
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
   - Crear glosario de términos
   - Link interno entre términos relacionados
   - Cubrir exhaustivamente cada subtopic
   ```

---

### 0.7 Technical SEO Checklist

**Objetivo:** Foundation técnica impecable

#### Implementar:

1. **Core Web Vitals**
   ```
   - LCP < 2.5s: Optimizar featured images, lazy loading
   - FID < 100ms: Code splitting, defer non-critical JS
   - CLS < 0.1: Size de imágenes explícito, reservar espacio para ads
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
   - Press release sobre el lanzamiento
   - Pitch a TechCrunch LATAM, Contxto, otros
   - Entrevistas en podcasts del sector
   ```

2. **Guest Posting**
   ```
   Target sites:
   - Blogs de legaltech
   - Publicaciones de transformación digital
   - Blogs de SaaS B2B
   
   Pitch: "5 Formas en que la Firma Digital Acelera Ventas"
   ```

3. **Resource Link Building**
   ```
   Crear recursos linkables:
   - "Estado de la Digitalización en Chile 2025" (report con data)
   - Infografías compartibles
   - Calculadoras interactivas (ROI, ahorro de tiempo)
   - Templates gratuitos (contrato de NDA para firma)
   ```

4. **Partnerships**
   ```
   - Co-marketing con SaaS complementarios (CRM, ERP)
   - Integraciones mencionadas en sus blogs
   - Webinars conjuntos
   ```

5. **Local SEO (si aplica)**
   ```
   - Google Business Profile
   - Directorios de startups chilenas
   - Listados en marketplaces de software
   ```

---

### 0.9 Analytics y Tracking

**Objetivo:** Medir todo desde día 1

#### Setup:

1. **Google Analytics 4**
   ```typescript
   Events a trackear:
   - page_view (automático)
   - click_cta (custom)
   - scroll_depth
   - form_start / form_submit
   - download_resource
   - video_play / video_complete
   - outbound_link_click
   
   Conversions:
   - sign_up
   - contact_form_submit
   - pricing_page_view
   - demo_request
   ```

2. **Google Search Console**
   ```
   - Verificar propiedad
   - Submit sitemap
   - Monitor coverage issues
   - Track rankings
   ```

3. **Hotjar / Microsoft Clarity**
   ```
   - Heatmaps
   - Session recordings
   - Surveys / feedback polls
   ```

4. **SEO Monitoring**
   ```
   Tools:
   - Ahrefs / SEMrush: Keyword tracking
   - Google Search Console: Performance
   - Screaming Frog: Technical audits
   
   KPIs a trackear semanalmente:
   - Organic traffic
   - Keyword rankings (top 20)
   - Backlinks (nuevos y perdidos)
   - Domain Authority
   - Indexed pages
   ```

---

### 0.10 Conversion Optimization

**Objetivo:** Maximizar conversión de tráfico orgánico

#### Implementar:

1. **Lead Magnets**
   ```
   - eBook: "Guía Completa de Digitalización de Documentos"
   - Checklist: "Cómo Elegir Software de Firma Electrónica"
   - Template: "Contrato de Confidencialidad para Firmar"
   - Webinar: "Demostración en Vivo de Firma Electrónica"
   ```

2. **CTAs Estratégicos**
   ```
   Primary CTA: "Empieza Gratis" (no credit card required)
   Secondary CTA: "Ver Demo" (video o calendario)
   Tertiary CTA: "Hablar con Ventas"
   
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
   ```

4. **Forms Optimization**
   ```
   Signup form:
   - Minimal fields: Email, Nombre, Empresa
   - Progressive profiling (pedir más después)
   - Single column layout
   - Clear value prop sobre el form
   - Privacy assurance
   ```

---

### 0.11 Deliverables de Fase 0

**Al finalizar la Fase 0 tendrás:**

✅ **Marketing Website Live:**
- Homepage
- 3 Landing pages específicas (firmas, verificación, notaría)
- Página de precios
- Sección legal (términos, privacidad)

✅ **Blog Operacional:**
- 8-12 posts publicados
- 1-2 pillar articles
- CMS configurado
- Pipeline de contenido para 3 meses

✅ **SEO Foundation:**
- Technical SEO impecable (Lighthouse > 95)
- Schema markup implementado
- Analytics y tracking completo
- Google Search Console configurado

✅ **Content Assets:**
- 2-3 lead magnets (eBooks, templates)
- 1 calculadora interactiva
- Biblioteca de recursos iniciada

✅ **Early Traction:**
- 50-100 visitas orgánicas diarias (optimista)
- 10-20 signups para early access
- Rankings top 20 para 3-5 keywords
- 5-10 backlinks de calidad

---

### 0.12 Métricas de Éxito para Fase 0

**Semana 4 (fin de fase):**
- [ ] Website live y sin errores técnicos
- [ ] 100% pages indexed en Google
- [ ] Lighthouse score > 90 en todas las páginas
- [ ] 8+ blog posts publicados
- [ ] 50+ organic visits (cualquier cantidad es inicio)

**Mes 3 (mientras desarrollas Fase 1-2):**
- [ ] 500+ organic visits/mes
- [ ] Rankings top 10 para 2-3 long-tail keywords
- [ ] 100+ signups para waitlist
- [ ] 10+ backlinks de DA > 30

**Mes 6 (mientras desarrollas Fase 3-5):**
- [ ] 2,000+ organic visits/mes
- [ ] Rankings top 5 para keyword principal
- [ ] 500+ waitlist
- [ ] Featured snippet para 1+ query
- [ ] 30+ backlinks de calidad

---

## 🏗️ Fase 1: Fundación (Semanas 5-10)

**Nota:** Esta fase ahora comienza en semana 5, permitiendo que el SEO trabaje mientras desarrollas.

### 1.1 Configuración Inicial del Proyecto

**Objetivo:** Establecer la base técnica del proyecto

#### Tareas:
1. **Setup de Repositorio**
   - Inicializar monorepo (opción: Turborepo o pnpm workspaces)
   - Configurar ESLint, Prettier, Husky
   - Setup de CI/CD con GitHub Actions
   - Configurar ambientes: dev, staging, production
   - **Separar marketing site de app:** 
     ```
     /apps/marketing (lo de Fase 0, ya deployado)
     /apps/web (nueva app, app.tupatrimonio.app)
     ```

2. **Configuración de Supabase**
   - Crear proyecto en Supabase
   - Configurar schemas según arquitectura definida
   - Habilitar Row Level Security (RLS)
   - Configurar Storage buckets con políticas de acceso
   - Setup de funciones Edge (si necesario)

3. **Configuración de Next.js para App**
   ```
   /apps/web                    # Aplicación principal (app.tupatrimonio.app)
   /apps/marketing              # Marketing site (tupatrimonio.app) - YA EXISTE
   /apps/api                    # API routes adicionales (opcional)
   /packages/ui                 # Componentes compartidos
   /packages/database           # Types de Supabase
   /packages/utils              # Utilidades compartidas
   /packages/config             # Configuraciones compartidas
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

   # App
   NEXT_PUBLIC_APP_URL
   NEXT_PUBLIC_MARKETING_URL
   JWT_SECRET
   ENCRYPTION_KEY
   ```

### 1.2 Modelado de Base de Datos - Schema Core

*(Contenido igual que antes)*

### 1.3 Sistema de Autenticación

*(Contenido igual que antes)*

### 1.4 Dashboard Base y Navegación

*(Contenido igual que antes, pero ahora en app.tupatrimonio.app)*

**Nota Importante:** Ahora tienes dos sitios:
- `tupatrimonio.app` → Marketing site (SEO, blog, landings)
- `app.tupatrimonio.app` → Aplicación (requiere login)

---

## 🔧 Fase 2: Sistema de Créditos y Facturación (Semanas 11-16)

*(Contenido igual que antes)*

**Paralelamente durante Fase 2:**
- Continuar publicando 2 blog posts/semana
- Optimizar landings según analytics
- Responder comentarios y engagement en blog
- Guest posting (1-2 artículos)

---

## 📧 Fase 3: Comunicaciones y CRM (Semanas 17-22)

*(Contenido igual que antes)*

**Paralelamente durante Fase 3:**
- Lanzar primer pillar content piece
- Comenzar link building activo
- Crear primer lead magnet interactivo
- A/B testing de CTAs en landings

---

## ⚙️ Fase 4: Workflows y Manejo de Errores (Semanas 23-28)

*(Contenido igual que antes)*

**Paralelamente durante Fase 4:**
- Segundo cluster de contenido
- Case studies de beta users
- Webinar o demo en vivo
- Actualizar contenido según feedback

---

## 📁 Fase 5: Gestión de Archivos y Storage (Semanas 29-33)

*(Contenido igual que antes)*

---

## 🔐 Fase 6: Auditoría y Compliance (Semanas 34-38)

*(Contenido igual que antes)*

---

## 🎯 Fase 7: Servicios de Negocio - Firmas Electrónicas (Semanas 39-46)

*(Contenido igual que antes)*

**Nota:** Al lanzar este servicio, actualizar:
- Landing de firmas con features reales
- Blog post anunciando lanzamiento
- Case studies de early adopters
- Video tutorial completo

---

## 🔍 Fase 8: Servicios Complementarios (Semanas 47-58)

*(Contenido igual que antes)*

---

## 📊 Fase 9: Analytics y Reportes (Semanas 59-65)

*(Contenido igual que antes)*

---

## 🔌 Fase 10: Integraciones y API Pública (Semanas 66-72)

*(Contenido igual que antes)*

**Nota:** Crear documentación pública de API como parte del SEO strategy:
- `/developers` con documentación interactiva
- Blog posts sobre "Cómo integrar X con TuPatrimonio"
- OpenAPI spec público (buen para SEO técnico)

---

## 🚀 Fase 11: Optimización y Escalabilidad (Semanas 73-79)

*(Contenido igual que antes)*

---

## 🎨 Fase 12: UX/UI Polish y Features Finales (Semanas 80-86)

*(Contenido igual que antes)*

---

## 📱 Fase 13: Mobile App (Opcional - Semanas 87-98)

*(Contenido igual que antes)*

---

## 🎯 Fase 14: Go-to-Market (Semanas 99-105)

### 14.1 Preparación para Lanzamiento

**Objetivo:** Launch ready

#### Checklist:
1. **Legal**
   - Términos de servicio (ya en marketing site)
   - Privacy policy (ya en marketing site)
   - Cookie policy (ya en marketing site)
   - GDPR compliance

2. **Marketing Site Evolution**
   - Actualizar con features reales (no "coming soon")
   - Agregar demo interactivo
   - Customer success stories reales
   - Optimizar según 6+ meses de data SEO

3. **Content Milestone**
   ```
   A esta altura deberías tener:
   - 50+ blog posts
   - 5+ pillar articles
   - 3+ downloadable resources
   - 10+ video tutorials
   - Rankings top 3 para varias keywords
   - 5,000+ organic visits/mes
   ```

4. **Launch PR**
   - Press release a medios tech
   - Product Hunt launch
   - LinkedIn announcement
   - Email a waitlist (500+ personas)
   - Webinar de lanzamiento

5. **Support**
   - Help center (Intercom/Zendesk)
   - Live chat
   - Email templates
   - Onboarding videos

6. **Analytics**
   - Google Analytics 4 (ya configurado)
   - Mixpanel/Amplitude
   - Conversion tracking completo
   - Cohort analysis setup

### 14.2 Public Launch

**Objetivo:** Convertir tráfico orgánico en customers

**Ventaja competitiva:** Llegas al launch con:
- ✅ SEO maduro (6+ meses de antigüedad)
- ✅ 5,000+ visitas orgánicas/mes
- ✅ 500+ waitlist
- ✅ Content library de 50+ posts
- ✅ Authority establecida
- ✅ Backlink profile sólido

---

## 📊 **Métricas de Éxito Actualizadas**

### Fase 0 (Semanas 1-4):
- Website live con Lighthouse > 95
- 8-12 blog posts publicados
- 100% páginas indexadas
- 50+ organic visits (baseline)

### Durante Fases 1-6 (Semanas 5-38):
**Marketing parallels:**
- Mes 3: 500+ organic visits/mes
- Mes 6: 2,000+ organic visits/mes
- Rankings top 10 para 5+ keywords
- 100+ signups waitlist
- 20+ quality backlinks

**Desarrollo:**
- Foundation completa (auth, credits, billing)
- CRM operacional
- Workflows funcionales
- Compliance ready

### Durante Fases 7-13 (Semanas 39-98):
**Marketing parallels:**
- Mes 9: 5,000+ organic visits/mes
- Mes 12: 10,000+ organic visits/mes
- Rankings top 5 para keyword principal
- 500+ waitlist
- Featured snippets
- 50+ backlinks DA > 30

**Desarrollo:**
- Servicios core operacionales
- API pública documentada
- Mobile app (opcional)
- Integraciones clave

### Fase 14 - Launch (Semanas 99-105):
- 10,000+ organic visits/mes
- 10-15% signup rate (1,000-1,500 signups/mes orgánico)
- Rankings dominantes
- Thought leadership establecido

---

## 🎯 **Priorización Final Actualizada**

### Absolutely Critical (No lanzar sin esto):
1. **Fase 0:** Marketing + SEO foundation
2. Fase 1-2: Foundation + Credits
3. Fase 3: Comunicaciones básicas
4. Fase 7: Signatures (servicio core)
5. Seguridad completa

### High Priority:
- Fase 4: Workflows
- Fase 5: Files
- Fase 6: Audit
- Fase 10: API pública
- **Contenido continuo (paralelo a todo)**

### Medium Priority:
- Otros servicios (8.x)
- Fase 9: Analytics
- Fase 11: Optimization

### Nice to Have:
- Fase 13: Mobile app
- Integraciones avanzadas
- AI features avanzados

---

## 🔄 **Proceso Paralelo: Content y SEO (Continuo)**

Mientras desarrollas las Fases 1-14, mantén este ritmo:

### Mensual:
- 8 blog posts (2/semana)
- 1 pillar content piece o guía larga
- 2 actualizaciones de contenido existente
- 1 guest post o PR initiative
- Análisis de rankings y ajustes

### Trimestral:
- 1 lead magnet nuevo (eBook, template, calculator)
- Content audit y actualización
- Backlink campaign
- Video content (tutoriales)

### Semestral:
- Comprehensive SEO audit
- Content cluster expansion
- Competitor analysis
- UX improvements en marketing site

---

## 🎓 **Notas Adicionales para el Desarrollador**

### Separación de Concerns:
```typescript
// Marketing site (tupatrimonio.app)
- Next.js con ISR para blog
- Headless CMS (Contentful)
- Optimizado para SEO
- No requiere auth
- Deploy: Netlify

// App (app.tupatrimonio.app)
- Next.js con SSR
- Supabase backend
- Optimizado para UX
- Requiere auth
- Deploy: Netlify (separado)
```

### Cross-linking Strategy:
```
Marketing site → App:
- CTAs en blog llevan a signup
- Landing pages → app signup
- Resource downloads → app signup

App → Marketing site:
- Help links → blog/guides
- Learn more → landing pages
- Logout → marketing homepage
```

### Shared Components:
```typescript
// packages/ui
- Mismo design system
- Misma tipografía y colores
- Componentes reutilizables
- Pero: Marketing es estático, App es dinámico
```

---

## ✅ **Checklist de Launch Actualizado**

### Pre-Launch (Semana 98):
- [ ] Marketing site optimizado y actualizado
- [ ] 50+ blog posts publicados
- [ ] 5,000+ organic visits/mes
- [ ] 500+ waitlist confirmed
- [ ] App completamente funcional
- [ ] Beta testing completado
- [ ] Security audit passed
- [ ] Legal docs finalizados

### Launch Week (Semana 99):
- [ ] Email a waitlist (batch sending)
- [ ] Press release enviado
- [ ] Product Hunt launch
- [ ] Social media campaign
- [ ] Webinar de demostración
- [ ] Paid ads (boost inicial)

### Post-Launch (Semanas 100-105):
- [ ] Monitoring intensivo
- [ ] Respuesta rápida a feedback
- [ ] Hotfixes según necesidad
- [ ] Content actualizaciones
- [ ] Case studies de primeros clientes
- [ ] Optimization basada en data

---

**🎉 Resultado Final:**

Llegas al lanzamiento público con:
1. ✅ **Producto robusto y testeado**
2. ✅ **Tráfico orgánico establecido** (10K+ visits/mes)
3. ✅ **Authority en el nicho**
4. ✅ **Waitlist de clientes potenciales**
5. ✅ **Content library rica**
6. ✅ **SEO dominante**
7. ✅ **Cost per acquisition bajo** (orgánico)

Esto te pone en una posición mucho más fuerte que lanzar sin presencia digital establecida. El SEO es una inversión a largo plazo que comienza a dar frutos justamente cuando tu producto está listo para escalar.

---

**Nota Final:** Esta hoja de ruta actualizada maximiza el ROI de tu tiempo de desarrollo. Mientras construyes el producto (6-12 meses), simultáneamente construyes tu canal de adquisición orgánica. Al momento del launch, no estás empezando de cero en marketing.