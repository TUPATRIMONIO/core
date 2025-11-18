# Ejemplo de Integración - Sistema CRM Universal

Este documento muestra cómo integrar el Sistema CRM Universal en páginas existentes.

---

## Ejemplo 1: Mostrar Custom Fields en Página de Detalle

### Página: `/dashboard/crm/tickets/[id]/page.tsx`

```typescript
import { CustomFieldsSection } from '@/components/crm/universal/CustomFieldsSection';
import { PipelineStageSelector } from '@/components/crm/universal/PipelineStageSelector';

export default async function TicketDetailPage({ params }: { params: { id: string } }) {
  // ... código existente para obtener ticket

  const handleSaveCustomFields = async (customFields: Record<string, any>) => {
    const response = await fetch(`/api/crm/tickets/${params.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ custom_fields: customFields })
    });
    
    if (!response.ok) throw new Error('Error al guardar');
  };

  const handleStageChange = async (stageId: string) => {
    const response = await fetch(`/api/crm/tickets/${params.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stage_id: stageId })
    });
    
    if (!response.ok) throw new Error('Error al cambiar etapa');
    router.refresh(); // Recargar datos
  };

  return (
    <div className="space-y-6">
      {/* Información básica del ticket */}
      <Card>
        <CardHeader>
          <CardTitle>{ticket.subject}</CardTitle>
          <CardDescription>Ticket #{ticket.ticket_number}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Selector de etapa del pipeline */}
            {ticket.pipeline_id && (
              <div>
                <label className="text-sm font-medium">Etapa</label>
                <PipelineStageSelector
                  pipelineId={ticket.pipeline_id}
                  currentStageId={ticket.stage_id}
                  onChange={handleStageChange}
                  className="w-full mt-1"
                />
              </div>
            )}
            
            {/* Otros campos estándar */}
            <div>
              <label className="text-sm font-medium">Prioridad</label>
              <p>{ticket.priority}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Custom Fields Section */}
      <CustomFieldsSection
        entityType="ticket"
        organizationId={ticket.organization_id}
        customFields={ticket.custom_fields || {}}
        onSave={handleSaveCustomFields}
      />
    </div>
  );
}
```

---

## Ejemplo 2: Usar Hooks en Componente Cliente

### Componente: `TicketForm.tsx`

```typescript
'use client';

import { useEntityProperties } from '@/hooks/useEntityProperties';
import { usePipeline } from '@/hooks/usePipeline';
import { CustomFieldForm } from '@/components/crm/universal/CustomFieldForm';

export function TicketForm({ ticket, onSubmit }: TicketFormProps) {
  const [formData, setFormData] = useState({
    subject: ticket?.subject || '',
    description: ticket?.description || '',
    custom_fields: ticket?.custom_fields || {}
  });

  // Cargar propiedades personalizadas
  const {
    properties,
    loading: loadingProperties,
    getRequiredProperties
  } = useEntityProperties({
    entityType: 'ticket',
    visibleOnly: true
  });

  // Cargar pipeline por defecto
  const {
    pipeline,
    stages,
    getFirstStage
  } = usePipeline({
    entityType: 'ticket'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validar campos requeridos
    const missingRequired = getRequiredProperties().find(
      p => !formData.custom_fields[p.property_key]
    );
    
    if (missingRequired) {
      toast.error(`El campo "${missingRequired.property_name}" es obligatorio`);
      return;
    }

    // Si es nuevo ticket, asignar primera etapa del pipeline
    const submitData = {
      ...formData,
      pipeline_id: pipeline?.id,
      stage_id: ticket?.stage_id || getFirstStage()?.id
    };

    await onSubmit(submitData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Campos estándar */}
      <div>
        <Label>Asunto</Label>
        <Input
          value={formData.subject}
          onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
          required
        />
      </div>

      <div>
        <Label>Descripción</Label>
        <Textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          required
        />
      </div>

      {/* Custom Fields dinámicos */}
      {!loadingProperties && properties.length > 0 && (
        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold mb-4">Información Adicional</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {properties.map((property) => (
              <CustomFieldForm
                key={property.id}
                property={property}
                value={formData.custom_fields[property.property_key]}
                onChange={(value) => {
                  setFormData({
                    ...formData,
                    custom_fields: {
                      ...formData.custom_fields,
                      [property.property_key]: value
                    }
                  });
                }}
              />
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-2">
        <Button type="submit">Guardar Ticket</Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}
```

---

## Ejemplo 3: Mostrar Badge de Stage en Listado

### Componente: `TicketsList.tsx`

```typescript
'use client';

import { PipelineStageSelector } from '@/components/crm/universal/PipelineStageSelector';
import { CustomFieldRenderer } from '@/components/crm/universal/CustomFieldRenderer';
import { useEntityProperties } from '@/hooks/useEntityProperties';

export function TicketsList({ tickets }: { tickets: Ticket[] }) {
  const { properties, getProperty } = useEntityProperties({
    entityType: 'ticket',
    visibleOnly: true
  });

  const urgenciaProperty = getProperty('urgencia');
  const canalProperty = getProperty('canal');

  return (
    <div className="space-y-2">
      {tickets.map((ticket) => (
        <Card key={ticket.id} className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h3 className="font-semibold">{ticket.subject}</h3>
              <p className="text-sm text-muted-foreground">#{ticket.ticket_number}</p>
            </div>

            {/* Mostrar custom fields importantes */}
            <div className="flex items-center gap-4">
              {/* Urgencia */}
              {urgenciaProperty && ticket.custom_fields?.urgencia && (
                <CustomFieldRenderer
                  property={urgenciaProperty}
                  value={ticket.custom_fields.urgencia}
                />
              )}

              {/* Canal */}
              {canalProperty && ticket.custom_fields?.canal && (
                <CustomFieldRenderer
                  property={canalProperty}
                  value={ticket.custom_fields.canal}
                />
              )}

              {/* Stage badge */}
              {ticket.pipeline_id && (
                <PipelineStageSelector
                  pipelineId={ticket.pipeline_id}
                  currentStageId={ticket.stage_id}
                  onChange={async () => {}} // Read-only en listado
                  showBadge={true}
                  disabled={true}
                />
              )}
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
```

---

## Ejemplo 4: Crear Pipeline Programáticamente

```typescript
// Crear un pipeline personalizado
const response = await fetch('/api/crm/pipelines', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'Soporte Premium',
    entity_type: 'ticket',
    category: 'technical',
    description: 'Pipeline para clientes premium',
    color: '#8b5cf6',
    is_default: false,
    stages: [
      { name: 'Recibido', slug: 'recibido', color: '#3b82f6', display_order: 0 },
      { name: 'Análisis', slug: 'analisis', color: '#f59e0b', display_order: 1 },
      { name: 'Desarrollo', slug: 'desarrollo', color: '#8b5cf6', display_order: 2 },
      { name: 'Testing', slug: 'testing', color: '#06b6d4', display_order: 3 },
      { name: 'Completado', slug: 'completado', color: '#22c55e', display_order: 4, is_final: true }
    ]
  })
});
```

---

## Ejemplo 5: Crear Propiedad Custom Programáticamente

```typescript
// Crear una propiedad personalizada
const response = await fetch('/api/crm/entity-properties', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    entity_type: 'ticket',
    property_name: 'Nivel de SLA',
    property_key: 'nivel_sla',
    property_type: 'single_select',
    options: ['Básico', 'Estándar', 'Premium', 'Enterprise'],
    is_required: true,
    description: 'Nivel de acuerdo de servicio del cliente',
    is_visible: true
  })
});
```

---

## Ejemplo 6: Asignar Permisos de Pipeline

```typescript
// Asignar permisos a un usuario específico
const response = await fetch(`/api/crm/pipelines/${pipelineId}/permissions`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    user_id: 'user-uuid',
    can_view: true,
    can_create: true,
    can_edit: true,
    can_delete: false,
    allowed_stages: ['recibido', 'analisis'] // Solo puede mover entre estas etapas
  })
});
```

---

## Tips de Implementación

### 1. Cache de Propiedades

Las propiedades cambian raramente, considera cachearlas:

```typescript
// En layout o provider
const { properties } = useEntityProperties({
  entityType: 'ticket',
  visibleOnly: true
});

// Pasar por context para evitar re-fetching
<EntityPropertiesContext.Provider value={properties}>
  {children}
</EntityPropertiesContext.Provider>
```

### 2. Validación de Custom Fields

```typescript
const validateCustomFields = (
  customFields: Record<string, any>,
  properties: EntityProperty[]
): string | null => {
  for (const property of properties) {
    if (!property.is_required) continue;
    
    const value = customFields[property.property_key];
    if (!value || value === '') {
      return `El campo "${property.property_name}" es obligatorio`;
    }
  }
  return null;
};
```

### 3. Optimistic Updates

```typescript
const handleStageChange = async (stageId: string) => {
  // Update UI optimistically
  setTicket({ ...ticket, stage_id: stageId });
  
  try {
    await fetch(`/api/crm/tickets/${ticket.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ stage_id: stageId })
    });
  } catch (error) {
    // Revert on error
    setTicket(originalTicket);
    toast.error('Error al cambiar etapa');
  }
};
```

---

## Próximos Pasos

1. ✅ Integrar `CustomFieldsSection` en páginas de detalle
2. ✅ Agregar `PipelineStageSelector` en formularios
3. ⏳ Implementar vista Kanban (opcional)
4. ⏳ Crear páginas de configuración para owners
5. ⏳ Replicar a otras entidades (contacts, companies, etc.)


