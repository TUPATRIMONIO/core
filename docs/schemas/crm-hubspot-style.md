# CRM Estilo HubSpot - Arquitectura Completa

## 📊 Overview

El CRM de TuPatrimonio está diseñado siguiendo el modelo de HubSpot con todas las entidades principales interconectadas.

---

## 🏗️ Entidades Principales

### Estructura Completa (10 Tablas)

```
CRM Multi-Tenant TuPatrimonio
│
├── 👥 CONTACTOS (contacts)
│   └─ Personas individuales
│
├── 🏢 EMPRESAS (companies)
│   └─ Organizaciones/Compañías
│
├── 💼 NEGOCIOS (deals)
│   └─ Oportunidades de venta
│
├── 🎫 TICKETS (tickets)
│   └─ Soporte al cliente
│
├── 📦 PRODUCTOS (products)
│   └─ Catálogo de productos/servicios
│
├── 📋 COTIZACIONES (quotes + quote_line_items)
│   └─ Propuestas con items y precios
│
├── 📅 ACTIVIDADES (activities)
│   └─ Timeline universal
│
├── 📧 EMAILS (emails)
│   └─ Comunicaciones
│
├── 🔀 PIPELINES (pipelines)
│   └─ Stages personalizables
│
└── ⚙️ CONFIGURACIÓN (settings)
    └─ Settings por org
```

---

## 🔗 Relaciones Entre Entidades

### Diagrama de Relaciones

```
                    ┌──────────────┐
                    │   EMPRESAS   │
                    │  (companies) │
                    └───────┬──────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
        │ 1:N               │ 1:N               │ 1:N
        ▼                   ▼                   ▼
┌───────────────┐   ┌───────────────┐   ┌───────────────┐
│   CONTACTOS   │   │    NEGOCIOS   │   │    TICKETS    │
│  (contacts)   │   │    (deals)    │   │   (tickets)   │
└───────┬───────┘   └───────┬───────┘   └───────┬───────┘
        │                   │                   │
        │ 1:N               │ 1:N               │ 1:N
        │                   │                   │
        └───────────┬───────┴───────┬───────────┘
                    │               │
                    ▼               ▼
            ┌───────────────┐   ┌───────────────┐
            │  ACTIVIDADES  │   │    EMAILS     │
            │ (activities)  │   │   (emails)    │
            └───────────────┘   └───────────────┘

            ┌───────────────┐
            │  COTIZACIONES │
            │   (quotes)    │
            └───────┬───────┘
                    │ 1:N
                    ▼
            ┌───────────────┐
            │  QUOTE ITEMS  │◄─── Referencia a
            │(line_items)   │     PRODUCTOS
            └───────────────┘
```

### Relaciones Clave

#### **Empresa → Contactos** (1:N)
Una empresa puede tener múltiples contactos (empleados, stakeholders)

```typescript
// Contacto pertenece a empresa
contact.company_id → company.id

// Ver todos los contactos de una empresa
SELECT * FROM crm.contacts WHERE company_id = 'company-uuid';
```

#### **Empresa → Negocios** (1:N)
Una empresa puede tener múltiples deals activos

```typescript
// Deal a nivel de empresa
deal.company_id → company.id
deal.contact_id → contact.id (opcional, puede ser solo a nivel empresa)
```

#### **Contacto → Negocios** (1:N)
Un contacto puede tener múltiples oportunidades

```typescript
// Deal específico de un contacto
deal.contact_id → contact.id
deal.company_id → company.id (heredado automáticamente)
```

#### **Tickets → Contacto/Empresa** (N:1)
Un ticket puede ser de un contacto específico o de una empresa en general

```typescript
ticket.contact_id → contact.id (quien reportó)
ticket.company_id → company.id (empresa afectada)
```

#### **Universal → Actividades** (N:1)
Cualquier entidad puede tener actividades

```typescript
activity.contact_id → Para timeline del contacto
activity.company_id → Para timeline de la empresa
activity.deal_id → Para timeline del negocio
activity.ticket_id → Para timeline del ticket
```

---

## 📋 Tablas Detalladas

### 1. 🏢 **Companies (Empresas)**

**Propósito**: Agrupar contactos y centralizar información corporativa

**Campos principales**:
```sql
crm.companies
├── name                    # Nombre de la empresa
├── domain                  # ejemplo.com
├── type                    # prospect, customer, partner
├── industry                # Industria/sector
├── company_size            # 1-10, 11-50, etc.
├── annual_revenue          # Ingresos anuales
├── parent_company_id       # Para subsidiarias
├── assigned_to             # Account manager
└── custom_fields           # Campos personalizados
```

**Casos de uso**:
- Ver todos los contactos de una empresa
- Tracking de revenue total por empresa
- Hierarchías corporativas (matriz-subsidiarias)
- Account-based marketing

### 2. 🎫 **Tickets (Soporte)**

**Propósito**: Sistema de soporte al cliente con SLA

**Campos principales**:
```sql
crm.tickets
├── ticket_number           # TICK-00001 (auto-generado)
├── subject                 # Asunto del ticket
├── status                  # new, open, in_progress, resolved, closed
├── priority                # low, medium, high, urgent
├── category                # technical, billing, sales, etc.
├── contact_id              # Quien reportó
├── company_id              # Empresa afectada
├── assigned_to             # Agente asignado
├── team_id                 # Equipo responsable
├── due_date                # SLA deadline
└── resolved_at             # Cuándo se resolvió
```

**Casos de uso**:
- Soporte técnico post-venta
- Atención al cliente
- Bug tracking
- Feature requests
- Métricas de SLA

### 3. 📦 **Products (Catálogo)**

**Propósito**: Catálogo de productos/servicios para cotizaciones

**Campos principales**:
```sql
crm.products
├── name                    # Nombre del producto
├── sku                     # Código único
├── price                   # Precio de venta
├── cost                    # Costo (para calcular margen)
├── billing_type            # one_time, recurring, usage_based
├── billing_frequency       # monthly, yearly
├── track_inventory         # Si controla stock
└── stock_quantity          # Cantidad disponible
```

**Casos de uso**:
- Crear cotizaciones rápidamente
- Calcular márgenes automáticamente
- Tracking de productos más vendidos
- Control de inventario (opcional)

### 4. 📋 **Quotes (Cotizaciones)**

**Propósito**: Propuestas comerciales con line items

**Campos principales**:
```sql
crm.quotes
├── quote_number            # QUO-00001 (auto-generado)
├── contact_id / company_id # Cliente
├── deal_id                 # Deal relacionado
├── status                  # draft, sent, accepted, rejected
├── subtotal                # Suma de items (auto-calculado)
├── tax_amount              # Impuestos
├── discount_amount         # Descuentos
├── total                   # Total final (auto-calculado)
├── valid_until             # Fecha de expiración
└── payment_terms           # Condiciones de pago

crm.quote_line_items
├── quote_id                # Cotización
├── product_id              # Producto (opcional)
├── quantity                # Cantidad
├── unit_price              # Precio unitario
├── discount_percent        # Descuento %
└── line_total              # Total línea (auto-calculado)
```

**Casos de uso**:
- Enviar propuestas profesionales
- Track de cotizaciones enviadas vs aceptadas
- Conversión de quote → deal → invoice
- Historial de precios por cliente

### 5. 🔀 **Pipelines**

**Propósito**: Stages personalizables para deals y tickets

**Estructura**:
```json
{
  "name": "Pipeline de Ventas",
  "type": "deals",
  "stages": [
    {
      "id": "1",
      "name": "Prospección",
      "probability": 10,
      "order": 1,
      "color": "#94a3b8"
    },
    {
      "id": "2",
      "name": "Calificación",
      "probability": 25,
      "order": 2,
      "color": "#60a5fa"
    }
  ]
}
```

**Casos de uso**:
- Múltiples pipelines para diferentes tipos de venta
- Pipelines por producto o mercado
- Personalización por organización
- Métricas de conversión por stage

---

## 🎨 UI Navegación (Estilo HubSpot)

### Dashboard Principal

```
┌────────────────────────────────────────────────────┐
│  CRM Dashboard                            👤 Admin  │
├────────────────────────────────────────────────────┤
│                                                    │
│  📊 KPIs Overview                                  │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ │
│  │   156   │ │   42    │ │   18    │ │   12    │ │
│  │Contactos│ │Empresas │ │ Deals   │ │Tickets  │ │
│  │         │ │         │ │ Activos │ │ Abiertos│ │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘ │
│                                                    │
│  📈 Pipeline de Ventas                             │
│  ┌──────────────────────────────────────────────┐ │
│  │ Prospección  Calificación  Propuesta  ...   │ │
│  │    $50K         $120K         $80K           │ │
│  │   [3 deals]   [5 deals]    [2 deals]        │ │
│  └──────────────────────────────────────────────┘ │
│                                                    │
│  🎯 Actividad Reciente                             │
│  • Juan Pérez abrió ticket #1234 - Hace 2h        │
│  • Deal "Proyecto X" movido a Negociación - 3h    │
│  • Nueva empresa "Tech Corp" creada - 5h          │
│                                                    │
└────────────────────────────────────────────────────┘
```

### Sidebar de Navegación

```
┌─────────────────────┐
│  📊 Dashboard       │
├─────────────────────┤
│  👥 Contactos       │
│  🏢 Empresas        │ ← NUEVO
│  💼 Negocios        │
│  🎫 Tickets         │ ← NUEVO
│  📦 Productos       │ ← NUEVO
│  📋 Cotizaciones    │ ← NUEVO
├─────────────────────┤
│  📧 Emails          │
│  📅 Actividades     │
│  📈 Reportes        │
├─────────────────────┤
│  ⚙️ Configuración   │
│     • Pipelines     │ ← NUEVO
│     • Campos        │
│     • Integraciones │
└─────────────────────┘
```

---

## 🔄 Flujos de Trabajo

### Flujo 1: De Lead a Cliente

```
1. Lead entra por formulario web
   → Crear CONTACTO

2. Investigar y calificar
   → Ver si pertenece a EMPRESA existente
   → O crear nueva EMPRESA
   → Vincular contacto con empresa

3. Oportunidad identificada
   → Crear NEGOCIO vinculado a contacto y empresa
   → Mover por stages del pipeline

4. Enviar propuesta
   → Crear COTIZACIÓN con productos del catálogo
   → Enviar por email (tracked)

5. Negociación
   → Actividades de seguimiento
   → Ajustar cotización si necesario

6. Cierre
   → Deal marcado como "Ganado"
   → Contacto/Empresa cambia a status "Customer"
```

### Flujo 2: Soporte Post-Venta

```
1. Cliente reporta problema
   → Crear TICKET
   → Auto-vincular con contacto y empresa
   → Asignar a equipo de soporte

2. Investigación
   → Actividades de diagnóstico
   → Comunicación vía email (tracked)

3. Resolución
   → Actualizar status a "Resuelto"
   → Notificar al cliente
   → Solicitar feedback
```

### Flujo 3: Account Management

```
1. Vista de Empresa
   → Ver todos los contactos
   → Ver todos los deals (historial)
   → Ver tickets activos
   → Ver revenue total

2. Identificar oportunidades
   → Cross-sell de productos
   → Upsell de servicios
   → Crear nuevo deal

3. Relationship tracking
   → Actividades con diferentes contactos
   → Notas de reuniones
   → Timeline completo de la empresa
```

---

## 📊 Interconexiones

### Vista desde CONTACTO

```
Juan Pérez (Contacto)
├── Pertenece a: Empresa XYZ
├── Negocios (2):
│   ├── Deal #1 - $50,000 (Propuesta)
│   └── Deal #2 - $30,000 (Negociación)
├── Tickets (1):
│   └── TICK-00123 - Problema técnico (Abierto)
├── Cotizaciones (3):
│   ├── QUO-00045 - Aceptada
│   └── QUO-00046 - Enviada
└── Actividades (15):
    ├── Email - Hace 2h
    ├── Llamada - Hace 1 día
    └── Reunión - Hace 3 días
```

### Vista desde EMPRESA

```
Empresa XYZ (Company)
├── Contactos (3):
│   ├── Juan Pérez (CEO)
│   ├── María López (CFO)
│   └── Carlos Díaz (CTO)
├── Negocios (4):
│   ├── Deal #1 - Juan - $50,000
│   ├── Deal #2 - María - $30,000
│   └── Deal #3 - Empresa - $100,000
├── Tickets (5):
│   ├── TICK-00123 - Técnico (Juan)
│   └── TICK-00124 - Billing (María)
├── Revenue Total: $180,000
└── Timeline: 45 actividades
```

### Vista desde NEGOCIO

```
Deal: Proyecto ABC
├── Empresa: Empresa XYZ
├── Contacto: Juan Pérez
├── Valor: $50,000
├── Stage: Propuesta (50% probabilidad)
├── Cotizaciones (2):
│   ├── QUO-00045 - v1 - Rechazada
│   └── QUO-00046 - v2 - Enviada
├── Actividades:
│   ├── Email propuesta enviado
│   ├── Reunión de presentación
│   └── Llamada de seguimiento
└── Productos relacionados:
    ├── Firma Electrónica Pro
    └── Verificación de Identidad
```

---

## 🎯 Features Estilo HubSpot

### 1. **Multi-Pipeline**

Cada organización puede tener varios pipelines:

```
Cliente A
├── Pipeline "Ventas Enterprise" (6 stages)
├── Pipeline "Ventas SMB" (4 stages)
└── Pipeline "Soporte L1" (5 stages)

Cliente B
├── Pipeline "Deals Inmobiliarios" (7 stages)
└── Pipeline "Tickets Técnicos" (4 stages)
```

### 2. **Auto-Numeración**

```
Tickets: TICK-00001, TICK-00002, ...
Quotes:  QUO-00001, QUO-00002, ...
```

Secuencial por organización, nunca duplicados.

### 3. **Cálculos Automáticos**

**Cotizaciones**:
```
Line Item 1: 10 unidades × $100 - 10% descuento = $900
Line Item 2: 5 unidades × $50 = $250
────────────────────────────────────────────────────
Subtotal:                                    $1,150
Tax (19%):                                   $218.50
Discount:                                    -$50.00
────────────────────────────────────────────────────
TOTAL:                                       $1,318.50
```

Calculado automáticamente con triggers.

### 4. **Estadísticas por Empresa**

```sql
SELECT crm.get_company_stats('company-uuid');

-- Retorna:
{
  "contact_count": 5,
  "active_deals": 3,
  "open_tickets": 2,
  "total_revenue": 180000
}
```

### 5. **Timeline Universal**

Todas las actividades se registran en un solo lugar y se filtran por entidad:

```typescript
// Ver timeline de una empresa
SELECT * FROM crm.activities 
WHERE company_id = 'uuid' 
ORDER BY performed_at DESC;

// Ver timeline de un contacto
SELECT * FROM crm.activities 
WHERE contact_id = 'uuid' 
ORDER BY performed_at DESC;

// Ver timeline de un deal
SELECT * FROM crm.activities 
WHERE deal_id = 'uuid' 
ORDER BY performed_at DESC;
```

---

## 📱 UI Components a Crear

### Dashboard Kanban de Deals

```tsx
<DealsKanban>
  <Column stage="Prospección" count={3} value="$50K">
    <DealCard deal={deal1} />
    <DealCard deal={deal2} />
  </Column>
  <Column stage="Calificación" count={5} value="$120K">
    <DealCard deal={deal3} />
    <DealCard deal={deal4} />
  </Column>
  // Drag & drop entre stages
</DealsKanban>
```

### Lista de Empresas

```tsx
<CompaniesTable>
  <Column>Empresa</Column>
  <Column>Contactos</Column>
  <Column>Deals Activos</Column>
  <Column>Revenue Total</Column>
  <Column>Tickets Abiertos</Column>
</CompaniesTable>
```

### Detalle de Empresa con Tabs

```tsx
<CompanyDetail companyId={id}>
  <Tabs>
    <Tab name="Contactos">
      <ContactsList companyId={id} />
    </Tab>
    <Tab name="Negocios">
      <DealsList companyId={id} />
    </Tab>
    <Tab name="Tickets">
      <TicketsList companyId={id} />
    </Tab>
    <Tab name="Cotizaciones">
      <QuotesList companyId={id} />
    </Tab>
    <Tab name="Timeline">
      <ActivityTimeline companyId={id} />
    </Tab>
  </Tabs>
</CompanyDetail>
```

### Sistema de Tickets con Prioridades

```tsx
<TicketsBoard>
  <Filter priority="urgent" color="red">
    <TicketCard status="open" sla="2h restantes" />
  </Filter>
  <Filter priority="high" color="orange">
    <TicketCard status="in_progress" />
  </Filter>
  // Grid de tickets con códigos de color
</TicketsBoard>
```

### Compositor de Cotizaciones

```tsx
<QuoteBuilder>
  <SelectContact />
  <SelectCompany />
  
  <ProductSelector>
    <AddProduct product="Firma Electrónica" qty={10} />
    <AddProduct product="Verificación ID" qty={5} />
  </ProductSelector>
  
  <Totals>
    Subtotal: $1,150
    Tax (19%): $218.50
    Total: $1,368.50
  </Totals>
  
  <SendQuote /> {/* Email con PDF adjunto */}
</QuoteBuilder>
```

---

## 🔢 Métricas Disponibles

### Dashboard Overview

```typescript
const stats = await crm.get_stats(organizationId);

{
  total_contacts: 156,
  total_companies: 42,
  new_contacts: 24,        // Últimos 7 días
  active_deals: 18,
  open_tickets: 12,
  deals_value: 500000,     // Valor total de deals activos
  unread_emails: 8
}
```

### Por Empresa

```typescript
const companyStats = await crm.get_company_stats(companyId);

{
  contact_count: 5,
  active_deals: 3,
  open_tickets: 2,
  total_revenue: 180000    // Deals ganados
}
```

---

## 🚀 Ventajas vs HubSpot

| Feature | HubSpot | TuPatrimonio CRM |
|---------|---------|------------------|
| Contactos | ✅ | ✅ |
| Empresas | ✅ | ✅ |
| Deals | ✅ | ✅ |
| Tickets | ✅ | ✅ |
| Productos | ✅ | ✅ |
| Cotizaciones | ✅ | ✅ |
| **Multi-tenant** | ❌ No | ✅ **Sí** |
| **Vendible como servicio** | ❌ No | ✅ **Sí** |
| **Límites por plan** | ✅ | ✅ |
| **API completa** | ✅ | ✅ (futuro) |
| **Costo** | $$$$ Alto | $ Tu margen |

---

## 📋 Próximos Pasos

### Aplicar Migración

```sql
-- En Supabase SQL Editor:
-- Ejecutar: supabase/migrations/20251112202031_crm-base.sql
```

### Implementar UI (Orden recomendado)

**Semana 1: Empresas**
1. Lista de empresas
2. Crear/editar empresa
3. Detalle de empresa con tabs
4. Vincular contactos a empresas

**Semana 2: Tickets**
5. Lista de tickets con filtros
6. Crear ticket
7. Detalle de ticket con timeline
8. Sistema de asignación y SLA

**Semana 3: Productos y Cotizaciones**
9. Catálogo de productos
10. Compositor de cotizaciones
11. Envío de cotizaciones por email
12. Tracking de aceptación

**Semana 4: Integraciones**
13. Vincular deals con quotes
14. Timeline unificado
15. Reportes y analytics
16. Testing completo

---

## 🎯 Resultado Final

Un **CRM tan completo como HubSpot** pero:

✅ Multi-tenant (cada cliente tiene su CRM aislado)  
✅ Vendible como servicio B2B  
✅ Totalmente personalizable  
✅ Con tu propio branding  
✅ Con tus propios márgenes  

**TuPatrimonio Platform** será el primer usuario del sistema (dogfooding).

---

**Última actualización**: 12 de Noviembre 2024

