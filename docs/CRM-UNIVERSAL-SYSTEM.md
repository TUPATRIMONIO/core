# Sistema CRM Universal Configurable

**Fecha:** 17 Noviembre 2025  
**Estado:** ✅ Implementado (Base de datos + API + Componentes básicos)

---

## 🎯 Descripción General

El Sistema CRM Universal permite al **organization owner** configurar completamente el CRM según sus necesidades:

- **Pipelines personalizables** con etapas configurables
- **Propiedades personalizadas** (custom fields) para cada tipo de entidad
- **Permisos granulares** por pipeline y por etapa
- **Email-to-Ticket automático** con actualización de tickets existentes
- **Sistema reutilizable** aplicable a: tickets, contactos, empresas, negocios, productos y cotizaciones

---

## 🏗️ Arquitectura

### Nuevas Tablas en Base de Datos

```sql
crm.entity_properties      -- Propiedades personalizables por entidad
crm.pipeline_stages         -- Etapas estructuradas de pipelines
crm.pipeline_permissions    -- Permisos granulares por usuario
```

### Columnas Agregadas

Todas las entidades del CRM ahora tienen:
- `pipeline_id` - Pipeline al que pertenecen
- `stage_id` - Etapa actual en el pipeline  
- `source_email_thread_id` (solo tickets) - Email que originó el ticket

---

## 📊 Tipos de Propiedades Disponibles

El organization owner puede crear propiedades de estos tipos:

| Tipo | Descripción | Uso |
|------|-------------|-----|
| `text` | Texto libre | Notas, descripciones |
| `number` | Número | Cantidades, scores |
| `date` | Fecha | Fechas importantes |
| `boolean` | Sí/No | Flags, estados binarios |
| `single_select` | Lista única | Categorías |
| `multi_select` | Lista múltiple | Tags, intereses |
| `user` | Usuario de la org | Asignaciones |
| `contact` | Contacto del CRM | Relaciones |
| `company` | Empresa del CRM | Relaciones |
| `file` | Archivo adjunto | Documentos |
| `url` | Enlace web | Referencias |

---

## 🔐 Sistema de Permisos

### Niveles de Acceso

1. **Organization Owner** (level >= 8)
   - Puede crear/editar/eliminar pipelines
   - Puede crear/editar/eliminar propiedades custom
   - Acceso total a todo

2. **Admin** (level >= 7)
   - Puede gestionar stages de pipelines
   - Puede asignar permisos a usuarios
   - Acceso a configuración

3. **Usuario Normal**
   - Solo accede a pipelines con permisos asignados
   - Solo puede mover items entre stages permitidos

### Permisos por Pipeline

Cada usuario puede tener permisos específicos por pipeline:

```typescript
{
  can_view: boolean,      // Ver items del pipeline
  can_create: boolean,    // Crear nuevos items
  can_edit: boolean,      // Editar items
  can_delete: boolean,    // Eliminar items
  allowed_stages: []      // Array de slugs de stages permitidos
}
```

---

## 🔄 Email-to-Ticket Automático

### Funcionamiento

1. **Email entrante** → Sistema detecta dirección de organización
2. **Verificar thread:**
   - Si existe ticket con `source_email_thread_id` → **Actualizar ticket**
   - Si es nuevo → **Crear ticket automático**
3. **Asignar a pipeline:**
   - Busca pipeline por defecto para entity_type='ticket'
   - Coloca en primera etapa (display_order=0)
4. **Crear actividad** en timeline del ticket

### Configuración

El trigger `crm.handle_incoming_email()` se ejecuta automáticamente al insertar en `crm.emails`.

---

## 📡 API Endpoints

### Pipelines

```
GET    /api/crm/pipelines                    # Listar pipelines
POST   /api/crm/pipelines                    # Crear pipeline
GET    /api/crm/pipelines/[id]               # Ver pipeline
PATCH  /api/crm/pipelines/[id]               # Actualizar pipeline
DELETE /api/crm/pipelines/[id]               # Eliminar pipeline

GET    /api/crm/pipelines/[id]/stages        # Listar stages
POST   /api/crm/pipelines/[id]/stages        # Crear stage
PATCH  /api/crm/pipelines/[id]/stages/[stageId]  # Actualizar stage
DELETE /api/crm/pipelines/[id]/stages/[stageId]  # Eliminar stage

GET    /api/crm/pipelines/[id]/permissions   # Listar permisos
POST   /api/crm/pipelines/[id]/permissions   # Asignar permiso
PATCH  /api/crm/pipelines/[id]/permissions/[userId]  # Actualizar permiso
DELETE /api/crm/pipelines/[id]/permissions/[userId]  # Revocar permiso
```

### Entity Properties

```
GET    /api/crm/entity-properties            # Listar propiedades
       ?entity_type=ticket                   # Filtrar por tipo
       ?is_visible=true                      # Solo visibles
POST   /api/crm/entity-properties            # Crear propiedad
GET    /api/crm/entity-properties/[id]       # Ver propiedad
PATCH  /api/crm/entity-properties/[id]       # Actualizar propiedad
DELETE /api/crm/entity-properties/[id]       # Eliminar propiedad
```

---

## 🎨 Componentes React

### Componentes Básicos Implementados

```typescript
// Renderizar valor de custom field
<CustomFieldRenderer 
  property={entityProperty}
  value={customFields.tipo_usuario}
/>

// Formulario para editar custom field
<CustomFieldForm
  property={entityProperty}
  value={customFields.tipo_usuario}
  onChange={(value) => handleChange('tipo_usuario', value)}
/>
```

### Próximos Componentes

Los siguientes componentes están especificados pero requieren implementación completa:

- `EntityPropertiesManager` - Gestionar propiedades custom
- `PipelineManager` - Gestionar pipelines y stages
- `EntityKanbanBoard` - Vista Kanban con drag & drop
- `EntityListView` - Vista de listado con filtros

---

## 🚀 Pipelines por Defecto

El sistema crea automáticamente estos pipelines:

### Tickets: "Soporte Técnico"
1. Nuevo
2. En Progreso
3. Esperando Cliente
4. Resuelto ✅
5. Cerrado ✅

### Contacts: "Lifecycle de Contacto"
1. Lead (10%)
2. MQL (25%)
3. SQL (50%)
4. Cliente (100%) ✅
5. Promotor (100%) ✅

### Companies: "B2B Journey"
1. Prospecto (10%)
2. Calificación (30%)
3. Partner (70%)
4. Cliente (100%) ✅

---

## ✨ Propiedades por Defecto

### Tickets
- **Tipo de Usuario**: Free, Premium, Enterprise
- **Urgencia**: Baja, Media, Alta, Crítica
- **Canal**: Email, WhatsApp, Teléfono, Web, Chat

### Contacts
- **Fuente**: Referido, Web, Evento, Redes Sociales, Email Marketing, Otro
- **Intereses**: (multi-select) Servicios Legales, Firma Electrónica, Notaría, Consultoría, Otros

### Deals
- **Razón de Pérdida**: Precio, Competencia, Timing, Sin Presupuesto, Otro

---

## 💾 Uso de Custom Fields

### Guardar Valores

Los custom fields se almacenan en el campo JSONB `custom_fields` de cada entidad:

```typescript
// Ejemplo: Ticket con custom fields
{
  id: "...",
  subject: "Problema con facturación",
  custom_fields: {
    tipo_usuario: "Enterprise",
    urgencia: "Alta",
    canal: "Email"
  }
}
```

### Validación

- Si `is_required = true`, el frontend debe validar antes de guardar
- El campo `property_key` es la clave en el JSONB
- Los tipos se validan en el frontend (fecha válida, número válido, etc.)

---

## 🔍 Consultas Útiles

### Obtener propiedades de una entidad

```sql
SELECT * FROM crm.get_entity_properties(
  'org-uuid',
  'ticket'
);
```

### Obtener stages de un pipeline

```sql
SELECT * FROM crm.get_pipeline_stages('pipeline-uuid');
```

### Verificar permisos de usuario

```sql
SELECT crm.user_can_access_pipeline(
  'user-uuid',
  'pipeline-uuid',
  'edit'  -- 'view', 'create', 'edit', 'delete'
);
```

---

## 🎯 Próximos Pasos

### Implementación Completa Requiere

1. **Componentes de UI completos:**
   - EntityKanbanBoard con drag & drop (react-beautiful-dnd)
   - EntityListView con filtros avanzados
   - EntityPropertiesManager con CRUD completo
   - PipelineManager con gestión visual de stages

2. **Páginas de configuración:**
   - `/dashboard/crm/settings/pipelines` - Gestión de pipelines
   - `/dashboard/crm/settings/properties` - Gestión de propiedades

3. **Actualización de páginas existentes:**
   - Agregar toggle Listado/Kanban
   - Mostrar custom properties en formularios
   - Filtrar por custom properties

4. **Replicar a otras entidades:**
   - Aplicar mismo sistema a contacts, companies, deals, products, quotes

---

## 📝 Notas Importantes

### Limitaciones Actuales

- **Límite de 50** custom properties por entity_type
- **Límite de 10** pipelines por entity_type
- **Límite de 20** stages por pipeline
- File upload requiere integración con Supabase Storage
- Selectors de user/contact/company requieren autocompletado

### Consideraciones de Performance

- Custom fields están indexados con GIN en JSONB
- Pipelines y properties se cachean (cambian poco)
- Stages ordenados por `display_order`
- RLS policies optimizadas con índices

---

## 🤝 Contribuir

Para agregar nuevos tipos de propiedades:

1. Agregar al ENUM `crm.property_type` en migración
2. Actualizar TypeScript type `PropertyType` en `crm.ts`
3. Agregar caso en `CustomFieldRenderer.tsx`
4. Agregar caso en `CustomFieldForm.tsx`

---

**Documentación completa del CRM:** [`/docs/CRM-COMPLETO.md`](./CRM-COMPLETO.md)  
**Arquitectura de schemas:** [`/docs/schemas/ARCHITECTURE-SCHEMAS.md`](./schemas/ARCHITECTURE-SCHEMAS.md)


