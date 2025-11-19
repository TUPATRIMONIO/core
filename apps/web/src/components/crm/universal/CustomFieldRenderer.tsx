'use client';

/**
 * CustomFieldRenderer
 * Renderiza el valor de un custom field según su tipo
 */

import { EntityProperty, PropertyType } from '@/types/crm';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, XCircle, FileIcon, Link as LinkIcon } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface CustomFieldRendererProps {
  property: EntityProperty;
  value: any;
  className?: string;
}

export function CustomFieldRenderer({
  property,
  value,
  className = ''
}: CustomFieldRendererProps) {
  // Si no hay valor, mostrar placeholder
  if (value === null || value === undefined || value === '') {
    return (
      <span className={`text-muted-foreground text-sm ${className}`}>
        —
      </span>
    );
  }

  const renderValue = () => {
    switch (property.property_type) {
      case 'text':
        return <span className="text-sm">{value}</span>;

      case 'number':
        return <span className="text-sm font-medium">{Number(value).toLocaleString('es-ES')}</span>;

      case 'date':
        try {
          const date = new Date(value);
          return (
            <span className="text-sm">
              {format(date, 'dd MMM yyyy', { locale: es })}
            </span>
          );
        } catch {
          return <span className="text-sm">{value}</span>;
        }

      case 'boolean':
        return value ? (
          <div className="flex items-center gap-1 text-green-600">
            <CheckCircle2 className="w-4 h-4" />
            <span className="text-sm">Sí</span>
          </div>
        ) : (
          <div className="flex items-center gap-1 text-red-600">
            <XCircle className="w-4 h-4" />
            <span className="text-sm">No</span>
          </div>
        );

      case 'single_select':
        return (
          <Badge variant="secondary" className="font-normal">
            {value}
          </Badge>
        );

      case 'multi_select':
        const values = Array.isArray(value) ? value : [value];
        return (
          <div className="flex flex-wrap gap-1">
            {values.map((val, idx) => (
              <Badge key={idx} variant="secondary" className="font-normal">
                {val}
              </Badge>
            ))}
          </div>
        );

      case 'user':
        // Aquí se podría hacer un fetch del usuario o pasar los datos populados
        return (
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-[var(--tp-buttons)] text-white flex items-center justify-center text-xs font-medium">
              {value?.first_name?.[0] || value?.email?.[0] || '?'}
            </div>
            <span className="text-sm">
              {value?.full_name || value?.email || value}
            </span>
          </div>
        );

      case 'contact':
      case 'company':
        return (
          <span className="text-sm font-medium text-[var(--tp-buttons)]">
            {value?.name || value?.full_name || value}
          </span>
        );

      case 'file':
        return (
          <a
            href={value}
            target="_blank"
            rel="noopener noreferrer nofollow"
            className="flex items-center gap-2 text-sm text-[var(--tp-buttons)] hover:underline"
          >
            <FileIcon className="w-4 h-4" />
            <span>Ver archivo</span>
          </a>
        );

      case 'url':
        return (
          <a
            href={value}
            target="_blank"
            rel="noopener noreferrer nofollow"
            className="flex items-center gap-1 text-sm text-[var(--tp-buttons)] hover:underline"
          >
            <LinkIcon className="w-3 h-3" />
            <span className="max-w-xs truncate">{value}</span>
          </a>
        );

      default:
        return <span className="text-sm">{String(value)}</span>;
    }
  };

  return (
    <div className={className}>
      {renderValue()}
    </div>
  );
}


