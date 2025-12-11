'use client';

import { useState } from 'react';
import { Plus, X, ChevronRight, ChevronDown, User, Building2, Package, Ticket, LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export interface AssociatedItem {
  id: string;
  name: string;
  subtext?: string;
  href?: string;
  avatar?: string | null;
  metadata?: Record<string, any>;
}

export interface AssociationSection {
  id: string;
  title: string;
  type: 'contact' | 'company' | 'order' | 'ticket' | 'organization' | 'user' | 'application';
  items: AssociatedItem[];
  canAdd?: boolean;
  canRemove?: boolean;
  icon?: LucideIcon;
  iconColor?: string;
  iconBgColor?: string;
}

interface AssociationsPanelProps {
  sections: AssociationSection[];
  onAddToSection?: (sectionId: string, sectionType: string) => void;
  onRemoveItem?: (sectionId: string, itemId: string) => void;
  isLoading?: boolean;
  title?: string;
}

const defaultIconConfig: Record<string, { icon: LucideIcon; color: string; bgColor: string }> = {
  contact: { icon: User, color: 'text-blue-500', bgColor: 'bg-blue-100 dark:bg-blue-900/30' },
  user: { icon: User, color: 'text-blue-500', bgColor: 'bg-blue-100 dark:bg-blue-900/30' },
  company: { icon: Building2, color: 'text-purple-500', bgColor: 'bg-purple-100 dark:bg-purple-900/30' },
  organization: { icon: Building2, color: 'text-purple-500', bgColor: 'bg-purple-100 dark:bg-purple-900/30' },
  order: { icon: Package, color: 'text-orange-500', bgColor: 'bg-orange-100 dark:bg-orange-900/30' },
  ticket: { icon: Ticket, color: 'text-green-500', bgColor: 'bg-green-100 dark:bg-green-900/30' },
  application: { icon: Package, color: 'text-cyan-500', bgColor: 'bg-cyan-100 dark:bg-cyan-900/30' },
};

/**
 * A reusable panel component for displaying and managing entity associations.
 * Can be used for tickets, contacts, organizations, orders, etc.
 */
export function AssociationsPanel({
  sections,
  onAddToSection,
  onRemoveItem,
  isLoading = false,
  title = 'Asociaciones',
}: AssociationsPanelProps) {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>(
    sections.reduce((acc, section) => ({ ...acc, [section.id]: true }), {})
  );

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => ({ ...prev, [sectionId]: !prev[sectionId] }));
  };

  const getIconForType = (section: AssociationSection, avatar?: string | null) => {
    if (avatar) {
      return <img src={avatar} alt="" className="h-8 w-8 rounded-full object-cover" />;
    }

    const config = defaultIconConfig[section.type] || defaultIconConfig.contact;
    const IconComponent = section.icon || config.icon;
    const colorClass = section.iconColor || config.color;
    const bgColorClass = section.iconBgColor || config.bgColor;

    return (
      <IconComponent 
        className={`h-8 w-8 ${colorClass} ${bgColorClass} p-1.5 rounded-full`} 
      />
    );
  };

  if (sections.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      {title && (
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide px-1">
          {title}
        </h3>
      )}

      {sections.map((section) => (
        <div 
          key={section.id} 
          className="border rounded-lg bg-card text-card-foreground shadow-sm"
        >
          {/* Section Header */}
          <div className="flex items-center justify-between p-3 border-b bg-muted/20">
            <button
              onClick={() => toggleSection(section.id)}
              className="flex items-center gap-2 font-medium text-sm hover:text-primary transition-colors"
            >
              {expandedSections[section.id] ? (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              )}
              {section.title} ({section.items.length})
            </button>

            {section.canAdd !== false && onAddToSection && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-950/50"
                onClick={(e) => {
                  e.stopPropagation();
                  onAddToSection(section.id, section.type);
                }}
                disabled={isLoading}
              >
                <Plus className="h-3 w-3 mr-1" />
                Agregar
              </Button>
            )}
          </div>

          {/* Section Items */}
          {expandedSections[section.id] && (
            <div className="p-2 space-y-2">
              {section.items.length === 0 ? (
                <div className="text-center py-4 text-xs text-muted-foreground bg-muted/10 rounded-md border border-dashed">
                  No hay {section.title.toLowerCase()} asociados
                </div>
              ) : (
                section.items.map((item) => (
                  <div
                    key={item.id}
                    className="group flex items-start gap-3 p-2 rounded-md hover:bg-muted/50 transition-colors border border-transparent hover:border-border"
                  >
                    <div className="mt-0.5">
                      {getIconForType(section, item.avatar)}
                    </div>
                    <div className="flex-1 min-w-0">
                      {item.href ? (
                        <Link
                          href={item.href}
                          className="text-sm font-medium text-foreground hover:text-blue-600 hover:underline truncate block"
                        >
                          {item.name}
                        </Link>
                      ) : (
                        <div className="text-sm font-medium text-foreground truncate">
                          {item.name}
                        </div>
                      )}
                      {item.subtext && (
                        <div className="text-xs text-muted-foreground truncate">
                          {item.subtext}
                        </div>
                      )}
                    </div>
                    {section.canRemove !== false && onRemoveItem && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                        onClick={() => onRemoveItem(section.id, item.id)}
                        disabled={isLoading}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default AssociationsPanel;
