'use client';

/**
 * CustomFieldsSection
 * Sección completa para mostrar y editar custom fields de una entidad
 */

import { useState, useEffect } from 'react';
import { EntityProperty, EntityType } from '@/types/crm';
import { CustomFieldForm } from './CustomFieldForm';
import { CustomFieldRenderer } from './CustomFieldRenderer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Pencil, Save, X } from 'lucide-react';
import { useToast } from '@/hooks/useToast';

interface CustomFieldsSectionProps {
  entityType: EntityType;
  organizationId: string;
  customFields: Record<string, any>;
  onSave?: (customFields: Record<string, any>) => Promise<void>;
  onChange?: (customFields: Record<string, any>) => void; // Para cambios pendientes
  readOnly?: boolean;
  className?: string;
}

export function CustomFieldsSection({
  entityType,
  organizationId,
  customFields,
  onSave,
  onChange,
  readOnly = false,
  className = ''
}: CustomFieldsSectionProps) {
  const [properties, setProperties] = useState<EntityProperty[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editedFields, setEditedFields] = useState<Record<string, any>>(customFields);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  // Decidir si usar sistema de cambios pendientes o guardado inmediato
  const usePendingChanges = !!onChange;

  useEffect(() => {
    fetchProperties();
  }, [entityType, organizationId]);

  useEffect(() => {
    setEditedFields(customFields);
  }, [customFields]);

  const fetchProperties = async () => {
    try {
      const response = await fetch(
        `/api/crm/entity-properties?entity_type=${entityType}&is_visible=true`
      );
      if (!response.ok) throw new Error('Error fetching properties');
      const data = await response.json();
      setProperties(data);
    } catch (error) {
      console.error('Error fetching properties:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar las propiedades personalizadas',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    // Validar campos requeridos
    const missingRequired = properties
      .filter(p => p.is_required)
      .find(p => !editedFields[p.property_key] || editedFields[p.property_key] === '');

    if (missingRequired) {
      toast({
        title: 'Campos requeridos',
        description: `El campo "${missingRequired.property_name}" es obligatorio`,
        variant: 'destructive'
      });
      return;
    }

    if (usePendingChanges && onChange) {
      // Usar sistema de cambios pendientes
      onChange(editedFields);
      setIsEditing(false);
    } else if (onSave) {
      // Guardar inmediatamente (modo legacy)
      setSaving(true);
      try {
        await onSave(editedFields);
        setIsEditing(false);
        toast({
          title: 'Guardado',
          description: 'Los cambios se guardaron correctamente',
        });
      } catch (error) {
        console.error('Error saving custom fields:', error);
        toast({
          title: 'Error',
          description: 'No se pudieron guardar los cambios',
          variant: 'destructive'
        });
      } finally {
        setSaving(false);
      }
    }
  };

  const handleCancel = () => {
    setEditedFields(customFields);
    setIsEditing(false);
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Propiedades Personalizadas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-4">
            Cargando...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (properties.length === 0) {
    return null; // No mostrar la sección si no hay propiedades
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Propiedades Personalizadas</CardTitle>
            <CardDescription>
              Información adicional específica de tu organización
            </CardDescription>
          </div>
          {!readOnly && !isEditing && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(true)}
            >
              <Pencil className="w-4 h-4 mr-2" />
              Editar
            </Button>
          )}
          {isEditing && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCancel}
                disabled={saving}
              >
                <X className="w-4 h-4 mr-2" />
                Cancelar
              </Button>
              <Button
                size="sm"
                onClick={handleSave}
                disabled={saving}
              >
                <Save className="w-4 h-4 mr-2" />
                {saving ? 'Guardando...' : 'Guardar'}
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {properties.map((property) => (
            <div key={property.id}>
              {isEditing ? (
                <CustomFieldForm
                  property={property}
                  value={editedFields[property.property_key]}
                  onChange={(value) => {
                    setEditedFields({
                      ...editedFields,
                      [property.property_key]: value
                    });
                  }}
                  disabled={saving}
                />
              ) : (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    {property.property_name}
                  </label>
                  <div className="mt-1">
                    <CustomFieldRenderer
                      property={property}
                      value={customFields[property.property_key]}
                    />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

