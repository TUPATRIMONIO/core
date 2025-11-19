# Quick Start - Sistema CRM Universal

¡El Sistema CRM Universal está listo para usar! 🎉

---

## ✅ Lo que ya funciona

### 1. Backend Completo (100%)
- ✅ Base de datos con 3 nuevas tablas
- ✅ 12 API endpoints funcionales
- ✅ Email-to-Ticket automático operativo
- ✅ Pipelines y propiedades por defecto creados
- ✅ Sistema de permisos granulares

### 2. Componentes Reutilizables (100%)
- ✅ `CustomFieldRenderer` - Muestra valores
- ✅ `CustomFieldForm` - Edita valores  
- ✅ `CustomFieldsSection` - Sección completa
- ✅ `PipelineStageSelector` - Selector de etapas

### 3. Hooks Personalizados (100%)
- ✅ `useEntityProperties` - Carga propiedades
- ✅ `usePipeline` - Carga pipeline y stages

---

## 🚀 Cómo Usar (3 Pasos)

### Paso 1: Agregar Custom Fields a una Página

En cualquier página de detalle (tickets, contacts, etc.):

```typescript
import { CustomFieldsSection } from '@/components/crm/universal/CustomFieldsSection';

// En tu componente
<CustomFieldsSection
  entityType="ticket"
  organizationId={ticket.organization_id}
  customFields={ticket.custom_fields || {}}
  onSave={async (customFields) => {
    await fetch(`/api/crm/tickets/${ticket.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ custom_fields: customFields })
    });
  }}
/>
```

**Resultado:** El usuario puede ver y editar todas las propiedades personalizadas que has configurado.

---

### Paso 2: Agregar Selector de Etapas

```typescript
import { PipelineStageSelector } from '@/components/crm/universal/PipelineStageSelector';

<PipelineStageSelector
  pipelineId={ticket.pipeline_id!}
  currentStageId={ticket.stage_id}
  onChange={async (stageId) => {
    await fetch(`/api/crm/tickets/${ticket.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ stage_id: stageId })
    });
  }}
/>
```

**Resultado:** El usuario puede mover el item entre etapas del pipeline.

---

### Paso 3: Usar en Formularios

```typescript
'use client';

import { useEntityProperties } from '@/hooks/useEntityProperties';
import { CustomFieldForm } from '@/components/crm/universal/CustomFieldForm';

export function MyForm() {
  const [customFields, setCustomFields] = useState({});
  
  const { properties, loading } = useEntityProperties({
    entityType: 'ticket',
    visibleOnly: true
  });

  return (
    <form>
      {/* Campos normales */}
      
      {/* Custom fields dinámicos */}
      {!loading && properties.map(property => (
        <CustomFieldForm
          key={property.id}
          property={property}
          value={customFields[property.property_key]}
          onChange={(value) => {
            setCustomFields({
              ...customFields,
              [property.property_key]: value
            });
          }}
        />
      ))}
    </form>
  );
}
```

**Resultado:** Formulario dinámico que se adapta a las propiedades configuradas.

---

## 📧 Email-to-Ticket (Ya Funciona)

Cuando llegue un email a tu organización:

1. **Email nuevo** → Se crea ticket automático
   - Asignado al pipeline por defecto
   - En la primera etapa
   - Con contacto vinculado

2. **Reply en thread** → Se actualiza ticket existente
   - Se agrega nota en descripción
   - Se crea actividad en timeline

---

## 🎯 Configurar el Sistema

### Crear Nuevas Propiedades

```bash
POST /api/crm/entity-properties
{
  "entity_type": "ticket",
  "property_name": "Nivel de Criticidad",
  "property_key": "nivel_criticidad",
  "property_type": "single_select",
  "options": ["Bajo", "Medio", "Alto", "Crítico"],
  "is_required": true,
  "is_visible": true
}
```

### Crear Nuevo Pipeline

```bash
POST /api/crm/pipelines
{
  "name": "Mi Pipeline Custom",
  "entity_type": "ticket",
  "color": "#8b5cf6",
  "stages": [
    { "name": "Nuevo", "slug": "nuevo", "color": "#3b82f6", "display_order": 0 },
    { "name": "En Proceso", "slug": "en_proceso", "color": "#f59e0b", "display_order": 1 },
    { "name": "Resuelto", "slug": "resuelto", "color": "#22c55e", "display_order": 2, "is_final": true }
  ]
}
```

### Ver Propiedades Existentes

```bash
GET /api/crm/entity-properties?entity_type=ticket&is_visible=true
```

### Ver Pipelines

```bash
GET /api/crm/pipelines?entity_type=ticket&include_stages=true
```

---

## 📖 Documentación Completa

- **Sistema Completo:** [`CRM-UNIVERSAL-SYSTEM.md`](./CRM-UNIVERSAL-SYSTEM.md)
- **Estado de Implementación:** [`CRM-UNIVERSAL-STATUS.md`](./CRM-UNIVERSAL-STATUS.md)
- **Ejemplos de Integración:** [`INTEGRATION-EXAMPLE.md`](./INTEGRATION-EXAMPLE.md)

---

## 🎨 Props Disponibles

### CustomFieldsSection

```typescript
{
  entityType: 'ticket' | 'contact' | 'company' | 'deal' | 'product' | 'quote',
  organizationId: string,
  customFields: Record<string, any>,
  onSave: (customFields: Record<string, any>) => Promise<void>,
  readOnly?: boolean,
  className?: string
}
```

### PipelineStageSelector

```typescript
{
  pipelineId: string,
  currentStageId?: string,
  onChange: (stageId: string) => Promise<void>,
  disabled?: boolean,
  showBadge?: boolean,  // Solo mostrar badge sin selector
  className?: string
}
```

### CustomFieldRenderer

```typescript
{
  property: EntityProperty,
  value: any,
  className?: string
}
```

### CustomFieldForm

```typescript
{
  property: EntityProperty,
  value: any,
  onChange: (value: any) => void,
  disabled?: boolean,
  className?: string
}
```

---

## 💡 Tips Importantes

### 1. Actualizar API Routes de Entidades

Asegúrate que tus endpoints acepten `custom_fields`, `pipeline_id` y `stage_id`:

```typescript
// En tu PATCH endpoint
const { custom_fields, pipeline_id, stage_id, ...otherFields } = body;

await supabase
  .from('tickets')
  .update({
    ...otherFields,
    custom_fields,
    pipeline_id,
    stage_id
  })
  .eq('id', id);
```

### 2. Incluir en SELECT

Cuando hagas queries, incluye los campos nuevos:

```typescript
const { data } = await supabase
  .from('tickets')
  .select(`
    *,
    pipeline:pipelines(*),
    stage:pipeline_stages(*)
  `)
  .eq('id', id);
```

### 3. Validar Permisos

Para features avanzadas, valida permisos:

```typescript
const canEdit = await supabase.rpc('user_can_access_pipeline', {
  user_uuid: userId,
  p_pipeline_id: pipelineId,
  p_action: 'edit'
});
```

---

## 🎯 Próximos Pasos Opcionales

1. **Vista Kanban** - Implementar drag & drop con `@hello-pangea/dnd`
2. **Páginas de Config** - UI para owners gestionen pipelines/properties
3. **Filtros Avanzados** - Filtrar por custom properties
4. **Reportes** - Analytics basados en pipelines y stages
5. **Automatizaciones** - Triggers cuando item cambia de stage

---

## ✅ Checklist de Integración

En cualquier entidad que quieras usar el sistema:

- [ ] Agregar `CustomFieldsSection` en página de detalle
- [ ] Agregar `PipelineStageSelector` si aplica
- [ ] Usar `useEntityProperties` en formularios
- [ ] Actualizar API route para aceptar campos nuevos
- [ ] Incluir campos en SELECT queries
- [ ] Validar campos requeridos antes de guardar
- [ ] Mostrar badges de stage en listados

---

## 🆘 Troubleshooting

**No aparecen propiedades:**
- Verifica que existan para ese `entity_type`
- Chequea que `is_visible = true`
- Revisa console por errores de API

**No aparece selector de etapas:**
- Verifica que el item tenga `pipeline_id`
- Chequea que el pipeline tenga stages
- Revisa permisos del usuario

**Email-to-ticket no funciona:**
- Verifica que el trigger esté activo
- Revisa que el email tenga `direction = 'inbound'`
- Chequea logs de la función SQL

---

**¡El sistema está listo! Solo necesitas integrarlo en tus páginas. 🚀**

**Ver ejemplos completos:** [`INTEGRATION-EXAMPLE.md`](./INTEGRATION-EXAMPLE.md)


