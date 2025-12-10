"use client";

import { useState } from "react";
import { Plus, X, Building2, User, Package, ChevronRight, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export interface AssociatedItem {
  id: string;
  name: string;
  subtext?: string;
  href?: string;
  type: "contact" | "company" | "order";
  avatar?: string | null;
  metadata?: Record<string, any>;
}

interface AssociationListProps {
  title: string;
  items: AssociatedItem[];
  type: "contact" | "company" | "order";
  onAdd?: () => void;
  onRemove?: (id: string) => void;
  isLoading?: boolean;
}

export function AssociationList({
  title,
  items,
  type,
  onAdd,
  onRemove,
  isLoading = false,
}: AssociationListProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  const getTypeIcon = (itemType: string, avatar?: string | null) => {
    if (avatar) {
      return <img src={avatar} alt="" className="h-8 w-8 rounded-full object-cover" />;
    }
    switch (itemType) {
      case "contact":
        return <User className="h-8 w-8 text-blue-500 bg-blue-100 dark:bg-blue-900/30 p-1.5 rounded-full" />;
      case "company":
        return <Building2 className="h-8 w-8 text-purple-500 bg-purple-100 dark:bg-purple-900/30 p-1.5 rounded-full" />;
      case "order":
        return <Package className="h-8 w-8 text-orange-500 bg-orange-100 dark:bg-orange-900/30 p-1.5 rounded-full" />;
      default:
        return <Package className="h-8 w-8 text-gray-500 bg-gray-100 p-1.5 rounded-full" />;
    }
  };

  return (
    <div className="border rounded-lg bg-card text-card-foreground shadow-sm mb-4">
      <div className="flex items-center justify-between p-3 border-b bg-muted/20">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2 font-medium text-sm hover:text-primary transition-colors"
        >
          {isExpanded ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          )}
          {title} ({items.length})
        </button>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-950/50"
          onClick={(e) => {
            e.stopPropagation();
            onAdd?.();
          }}
          disabled={isLoading}
        >
          <Plus className="h-3 w-3 mr-1" />
          Agregar
        </Button>
      </div>

      {isExpanded && (
        <div className="p-2 space-y-2">
          {items.length === 0 ? (
            <div className="text-center py-4 text-xs text-muted-foreground bg-muted/10 rounded-md border border-dashed">
              No hay {title.toLowerCase()} asociados
            </div>
          ) : (
            items.map((item) => (
              <div
                key={item.id}
                className="group flex items-start gap-3 p-2 rounded-md hover:bg-muted/50 transition-colors border border-transparent hover:border-border"
              >
                <div className="mt-0.5">{getTypeIcon(item.type, item.avatar)}</div>
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
                {onRemove && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                    onClick={() => onRemove(item.id)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </div>
            ))
          )}
          {items.length > 3 && (
            <Button
              variant="link"
              size="sm"
              className="w-full text-xs text-muted-foreground h-auto py-1"
            >
              Ver todos ({items.length})
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
