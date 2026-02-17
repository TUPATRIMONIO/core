# 🏢 TuPatrimonio - Ecosistema de Servicios Legales Digitales

Plataforma multi-tenant B2C + B2B que digitaliza procesos legales, notariales e inmobiliarios con IA avanzada.

> **📊 Estado:** Fase 0 COMPLETA ✅ | **Firma Simple (FES) Integrada** ✍️ | **Veriff API On-Demand Activo** 🚀 | **Notificaciones Pedido Completado** 📧 | **Lectura de QR Robustecida** 🔍
> **📅 Actualización:** 17 Febrero 2026
> **📋 Roadmap:** [`docs/archived/PLAN_DE_ACCION.md`](docs/archived/PLAN_DE_ACCION.md)

---

## 🎯 Características Principales

- **🌍 Multi-País**: Detección automática y contenido localizado (Chile, México, Colombia)
- **💳 Facturación Unificada por País**: Todas las organizaciones de Chile (personales y empresas) emiten Boleta/Factura vía Haulmer con medios de pago chilenos. Organizaciones internacionales usan Stripe Invoice.
- **🏠 B2C + 🏢 B2B**: Modelo híbrido con organizaciones personales y empresariales
- **🤖 IA Integrada**: Chatbot inteligente + análisis automático de documentos
- **✍️ Servicios Core**: Firmas electrónicas (FES/FEA) con flujo público sin login, validación de identidad con biometría (Veriff) y firma manuscrita, notaría digital
- **🔍 Lectura de QR Robusta**: Sistema de 3 niveles (Texto PDFjs > Imagen jsQR > Bytes crudos) para asociar documentos notarizados automáticamente.
- **📧 Notificaciones Inteligentes**: Sistema de correos automáticos al completar pedidos con enlaces de descarga (1 año validez) e incentivos de reseña
- **🎨 UI/UX Refinada**: Interfaz limpia y profesional que prioriza la tranquilidad del usuario, ocultando detalles técnicos sensibles (como nombres de notarías) tras estados simples como "Sí" o "Notaría asignada".
- **🔄 Finalización Automática**: Los pedidos se completan automáticamente cuando todos los documentos están firmados/notarizados.
- **Reasignación Automática de Notarías**: Sistema de cronjob que reintenta asignar notarías a documentos pendientes cada 5 minutos cuando hay disponibilidad.
- **Gestión Avanzada de Notarías**: Panel administrativo para gestionar servicios notariales con sistema de pesos para distribución equitativa de documentos y límites diarios de capacidad.
- **🔓 Flujo Público**: Ruta `/signing/new` accesible sin autenticación (inicia siempre desde cero)
- **🛡️ Admin Veriff**: Herramientas avanzadas en `/admin/verifications` para consulta directa de API y sincronización manual con firma HMAC.
- **📊 CRM Universal**: Sistema configurable con pipelines, custom properties y permisos granulares
- **📧 Sistema de soporte unificado**: Tickets de soporte y CRM fusionados en `crm.tickets`
- **💬 Mensajes internos en tickets**: Conversación interna y externa del equipo en el panel admin
- **🎨 Design System**: Colores dual, dark mode, componentes Shadcn/UI

---

## 💬 ADN de Marca (Esencial)

> Todo el contenido y funcionalidad debe reflejar nuestra promesa: **"Tu Tranquilidad, Nuestra Prioridad"**

### Valores Core

**WHY**: Brindar **tranquilidad, abundancia y confianza** en áreas legal, inmobiliaria y financiera.

**HOW**: Amigable • Confiable • Colaborador • Intuitivo • Moderno • Eficiente

### Voz de Marca

✅ **SÍ**: Cercano, sin tecnicismos, profesional pero alegre, empático, transparente, tutear  
❌ **NO**: Jerga legal, corporativo, frío, complicado

**Ejemplo de voz correcta**:
```
"¿Te estresa pensar en ir a la notaría? Lo entendemos. Por eso creamos 
algo diferente: firma tus documentos desde tu casa, con el mismo respaldo 
legal. Sin filas, sin coordinar agendas. Solo tú, tu celular, y tu tranquilidad."
```

📖 **Más detalles**: Ver sección completa en [`docs/README.md`](docs/README.md)

---

## 🛠️ Stack Tecnológico

- **Framework**: Next.js 15.5 (App Router) + React 19 + TypeScript
- **Styling**: Tailwind CSS v4 + Shadcn/UI
- **Backend**: Supabase (PostgreSQL + Auth + Storage + pgvector)
- **Deployment**: Vercel (2 apps) con Edge Middleware
- **IA**: Anthropic Claude + OpenAI
- **Monorepo**: npm workspaces

---

## 📁 Estructura del Proyecto

```
tupatrimonio-app/
├── apps/
│   ├── marketing/          # Marketing site (puerto 3001)
│   │   └── src/app/
│   │       ├── (paises)/   # Rutas por país: /cl, /mx, /co
│   │       ├── blog/       # Blog dinámico
│   │       └── base-conocimiento/  # Knowledge base
│   └── web/               # App principal (puerto 3000)
│       └── src/app/
│           ├── dashboard/  # Panel de control
│           ├── login/      # Autenticación
│           └── auth/       # Callbacks OAuth
├── packages/              # Código compartido
│   ├── location/         # Detección de país
│   ├── ui/              # Sistema de diseño
│   ├── utils/           # Utilidades
│   └── assets/          # Logos e imágenes
├── supabase/           # Backend
│   └── migrations/     # Migraciones SQL
└── docs/              # Documentación completa
    ├── schemas/       # Arquitectura de BD
    ├── design/        # Sistema de diseño
    ├── features/      # Features implementados
    └── deployment/    # Guías de deploy
```

---

## 🏗️ Arquitectura de Base de Datos

Cada servicio tiene su propio schema para mejor organización:

| Schema | Propósito | Estado |
|--------|-----------|--------|
| `core` | Foundation multi-tenant (orgs, users, roles, suscripciones) - 13 tablas | ✅ Completo |
| `marketing` | Blog, KB, leads, reviews, testimonios - 11 tablas | ✅ Completo |
| `crm` | CRM completo estilo HubSpot: contacts, companies, deals, tickets, ticket_messages, products, quotes, email multi-cuenta, pipelines configurables - 16+ tablas | ✅ Sistema Universal |
| `signing` | Firma electrónica (FES/FEA) y procesos notariales - 11 tablas | ✅ Completo |
| `identity_verifications` | KYC y verificación de identidad con biometría (Veriff) | ✅ Completo |
| `ai_customer_service` | Chatbot IA con RAG | 📋 Fase 9 |
| `ai_document_review` | Análisis de docs IA (Interno y Público) | ✅ Operativo |
| `notarial_services` | Servicios notariales multi-tenant | ✅ Operativo |
| `analytics` | Métricas y reportes | 📋 Fase 11 |

📖 **Arquitectura completa**: [`docs/schemas/ARCHITECTURE-SCHEMAS.md`](docs/schemas/ARCHITECTURE-SCHEMAS.md)

---

## 🚀 Quick Start

### Instalación

```bash
# Clonar repositorio
git clone https://github.com/tupatrimonio/tupatrimonio-app.git
cd tupatrimonio-app

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env.local
# Editar .env.local con tus keys de Supabase
```

### Desarrollo

```bash
# Marketing site (puerto 3001)
npm run dev:marketing

# Web app (puerto 3000)
npm run dev

# Ambas apps simultáneamente
npm run dev:marketing & npm run dev
```

### Build

```bash
# Build completo (ambas apps + packages)
npm run build

# Build específico
npm run build:marketing
npm run build:web
```

📖 **Setup completo**: [`docs/DEVELOPMENT.md`](docs/DEVELOPMENT.md)

---

## 🌍 Apps Deployadas

| App | URL | Estado |
|-----|-----|--------|
| Marketing | https://tupatrimonio.app | ✅ Live |
| Web App | https://app.tupatrimonio.app | ✅ Live |

---

## 💳 Medios de Pago

El sistema soporta múltiples proveedores de pago con un patrón unificado:

- **✅ Stripe** - Pagos con tarjeta internacional
- **✅ Transbank Webpay Plus** - Pagos con tarjeta (Chile)
- **✅ Transbank OneClick** - Pagos recurrentes (Chile)

### Directrices para Agregar Nuevos Medios de Pago

**Reglas fundamentales que DEBEN seguirse:**

1. **Estado inicial**: Siempre crear pagos con `status: 'pending'`
2. **Factura primero**: Crear factura ANTES del pago
3. **Metadata completo**: Incluir `order_id`, `order_number`, `product_type` en metadata
4. **URLs dinámicas**: Construir URLs de redirect desde headers de request
5. **Verificación inmediata**: Página success debe verificar estado y actualizar si está autorizado
6. **Webhook completo**: Procesar TODOS los tipos de productos (no solo créditos)

📖 **Directrices completas**: Ver sección en [`docs/archived/PLAN_DE_ACCION.md`](docs/archived/PLAN_DE_ACCION.md#-directrices-para-agregar-nuevos-medios-de-pago)

---

## 📚 Documentación

La documentación completa está organizada en `/docs`:

- **🚀 Inicio**: [DEVELOPMENT.md](docs/DEVELOPMENT.md) - Setup y comandos
- **🏗️ Arquitectura**: [ARCHITECTURE.md](docs/ARCHITECTURE.md) - Decisiones técnicas
- **🗄️ Base de Datos**: [schemas/](docs/schemas/) - Todos los schemas
- **🎨 Diseño**: [design/](docs/design/) - Sistema de diseño
- **⚙️ Features**: [features/](docs/features/) - Implementaciones específicas
- **🚀 Deploy**: [deployment/](docs/deployment/) - Guías de producción
- **🆕 CRM Universal**: [CRM-UNIVERSAL-SYSTEM.md](docs/CRM-UNIVERSAL-SYSTEM.md) - Sistema configurable
- **💳 Medios de Pago**: [PLAN_DE_ACCION.md](docs/archived/PLAN_DE_ACCION.md#-directrices-para-agregar-nuevos-medios-de-pago) - Directrices de pagos

📖 **Índice completo**: [`docs/README.md`](docs/README.md)

---

## 🎨 Sistema de Diseño

### Colores Dual

**Funcional** (UI interactiva):
- `--tp-buttons: #404040` - Botones y controles

**Marca** (identidad):
- `--tp-brand: #800039` - Vino corporativo

### Tipografía

- **Josefin Sans** → H1 únicamente
- **Outfit** → H2-H6
- **Nunito** → Body text

### Componentes

Basados en **Shadcn/UI** personalizados con variables TuPatrimonio.

📖 **Guías completas**: [`docs/design/`](docs/design/)

---

## 🤝 Contribuir

1. Fork el proyecto
2. Crea tu rama: `git checkout -b feature/nueva-funcionalidad`
3. Commit: `git commit -m 'Agregar nueva funcionalidad'`
4. Push: `git push origin feature/nueva-funcionalidad`
5. Abre un Pull Request

### Estándares de Código

- TypeScript estricto
- ESLint configurado
- Commits descriptivos
- Documentar cambios importantes

---

## 📄 Licencia

Copyright © 2025 TuPatrimonio. Todos los derechos reservados.

---

## 📞 Contacto

- **Website**: https://tupatrimonio.app
- **Email**: contacto@tupatrimonio.app
- **GitHub**: [@tupatrimonio](https://github.com/tupatrimonio)

---

**Desarrollado con 💙 por el equipo de TuPatrimonio**
