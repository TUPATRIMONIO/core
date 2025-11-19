'use client';

/**
 * CustomFieldForm
 * Formulario para editar/crear valores de custom fields según su tipo
 */

import { EntityProperty } from '@/types/crm';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { CalendarIcon } from 'lucide-react';

interface CustomFieldFormProps {
  property: EntityProperty;
  value: any;
  onChange: (value: any) => void;
  className?: string;
  disabled?: boolean;
}

export function CustomFieldForm({
  property,
  value,
  onChange,
  className = '',
  disabled = false
}: CustomFieldFormProps) {
  const renderField = () => {
    switch (property.property_type) {
      case 'text':
        return property.description && property.description.length > 100 ? (
          <Textarea
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={property.description || `Ingresa ${property.property_name}`}
            disabled={disabled}
            rows={3}
            className="w-full"
          />
        ) : (
          <Input
            type="text"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={property.description || `Ingresa ${property.property_name}`}
            disabled={disabled}
            className="w-full"
          />
        );

      case 'number':
        return (
          <Input
            type="number"
            value={value || ''}
            onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)}
            placeholder={property.description || '0'}
            disabled={disabled}
            className="w-full"
          />
        );

      case 'date':
        return (
          <Input
            type="date"
            value={value ? value.split('T')[0] : ''}
            onChange={(e) => onChange(e.target.value ? new Date(e.target.value).toISOString() : null)}
            disabled={disabled}
            className="w-full"
          />
        );

      case 'boolean':
        return (
          <div className="flex items-center gap-2">
            <Switch
              checked={value || false}
              onCheckedChange={onChange}
              disabled={disabled}
            />
            <Label className="text-sm text-muted-foreground">
              {value ? 'Sí' : 'No'}
            </Label>
          </div>
        );

      case 'single_select':
        const options = property.options || [];
        return (
          <Select
            value={value || ''}
            onValueChange={onChange}
            disabled={disabled}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Selecciona una opción" />
            </SelectTrigger>
            <SelectContent>
              {options.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case 'multi_select':
        const multiOptions = property.options || [];
        const selectedValues = Array.isArray(value) ? value : [];
        
        return (
          <div className="space-y-2 border rounded-md p-3">
            {multiOptions.map((option) => {
              const isChecked = selectedValues.includes(option);
              return (
                <div key={option} className="flex items-center space-x-2">
                  <Checkbox
                    id={`${property.id}-${option}`}
                    checked={isChecked}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        onChange([...selectedValues, option]);
                      } else {
                        onChange(selectedValues.filter((v: string) => v !== option));
                      }
                    }}
                    disabled={disabled}
                  />
                  <Label
                    htmlFor={`${property.id}-${option}`}
                    className="text-sm font-normal cursor-pointer"
                  >
                    {option}
                  </Label>
                </div>
              );
            })}
          </div>
        );

      case 'url':
        return (
          <Input
            type="url"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder="https://ejemplo.com"
            disabled={disabled}
            className="w-full"
          />
        );

      case 'user':
      case 'contact':
      case 'company':
        // TODO: Implementar selector con autocompletado
        return (
          <div className="text-sm text-muted-foreground p-3 border rounded-md bg-muted">
            Selector de {property.property_type} (próximamente)
          </div>
        );

      case 'file':
        return (
          <div className="space-y-2">
            <Input
              type="file"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  // TODO: Implementar upload a storage
                  console.log('File selected:', file.name);
                }
              }}
              disabled={disabled}
              className="w-full"
            />
            {value && (
              <div className="text-sm text-muted-foreground">
                Archivo actual: <a href={value} target="_blank" rel="noopener noreferrer nofollow" className="text-[var(--tp-buttons)] hover:underline">Ver</a>
              </div>
            )}
          </div>
        );

      default:
        return (
          <Input
            type="text"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={property.description || ''}
            disabled={disabled}
            className="w-full"
          />
        );
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <Label htmlFor={property.id} className="text-sm font-medium">
        {property.property_name}
        {property.is_required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      {property.description && (
        <p className="text-xs text-muted-foreground">{property.description}</p>
      )}
      {renderField()}
    </div>
  );
}

