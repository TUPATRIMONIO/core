"use client";

import * as React from "react";
import { Search, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { searchEntities, fetchEntities, AssociationType } from "@/app/actions/crm/associations";
import { toast } from "sonner";

interface AssociationSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: AssociationType;
  onSelect: (id: string, source: string, item?: any) => Promise<void>;
}

const PAGE_SIZE = 10;

export function AssociationSelector({
  open,
  onOpenChange,
  type,
  onSelect,
}: AssociationSelectorProps) {
  const [query, setQuery] = React.useState("");
  const [results, setResults] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [associating, setAssociating] = React.useState<string | null>(null);
  const [page, setPage] = React.useState(0);
  const [total, setTotal] = React.useState(0);
  const [isSearchMode, setIsSearchMode] = React.useState(false);

  // Load initial data when modal opens
  React.useEffect(() => {
    if (open && !query.trim()) {
      loadPage(0);
    }
  }, [open, type]);

  // Search with debounce
  React.useEffect(() => {
    if (!query.trim()) {
      setIsSearchMode(false);
      if (open) {
        loadPage(page);
      }
      return;
    }

    setIsSearchMode(true);
    const timer = setTimeout(async () => {
      setLoading(true);
      const res = await searchEntities(type, query);
      setLoading(false);

      if (res.success) {
        setResults(res.data || []);
      } else {
        toast.error("Error buscando elementos");
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [query, type]);

  const loadPage = async (pageNum: number) => {
    setLoading(true);
    const res = await fetchEntities(type, pageNum);
    setLoading(false);

    if (res.success) {
      setResults(res.data || []);
      setTotal(res.total || 0);
      setPage(pageNum);
    } else {
      toast.error("Error cargando elementos");
    }
  };

  const handleSelect = async (id: string, source: string, item?: any) => {
    setAssociating(id);
    try {
      await onSelect(id, source, item);
      onOpenChange(false);
      setQuery("");
      setResults([]);
      setPage(0);
    } catch (error) {
      console.error(error);
      toast.error("Error al asociar");
    } finally {
      setAssociating(null);
    }
  };

  const getTitle = () => {
    switch (type) {
      case "contact": return "Asociar Contacto";
      case "company": return "Asociar Empresa";
      case "order": return "Asociar Pedido";
    }
  };

  const renderItem = (item: any) => {
    const getSourceBadge = () => {
      if (item.source === "platform") {
        return (
          <span className="ml-auto px-1.5 py-0.5 text-[10px] font-medium rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
            Plataforma
          </span>
        );
      }
      if (item.source === "crm") {
        return (
          <span className="ml-auto px-1.5 py-0.5 text-[10px] font-medium rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
            CRM
          </span>
        );
      }
      return null;
    };

    return (
      <div className="flex items-center gap-3 w-full">
        {item.avatar && (
          <img src={item.avatar} alt="" className="h-8 w-8 rounded-full object-cover flex-shrink-0" />
        )}
        <div className="flex flex-col min-w-0 flex-1">
          <span className="font-medium truncate">{item.top_text}</span>
          <span className="text-xs text-muted-foreground truncate">{item.sub_text}</span>
        </div>
        {getSourceBadge()}
      </div>
    );
  };

  const totalPages = Math.ceil(total / PAGE_SIZE);
  const canPrev = page > 0;
  const canNext = page < totalPages - 1;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle>{getTitle()}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-4">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9"
              autoFocus
            />
          </div>
          
          <div className="h-[350px] border rounded-md overflow-hidden flex flex-col">
            <div className="flex-1 overflow-y-auto p-2">
              {loading ? (
                <div className="flex items-center justify-center h-20 text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  Cargando...
                </div>
              ) : results.length === 0 ? (
                <div className="flex items-center justify-center h-20 text-muted-foreground text-sm">
                  {query ? "No se encontraron resultados" : "No hay datos disponibles"}
                </div>
              ) : (
                <div className="space-y-1">
                  {results.map((item) => (
                    <Button
                      key={item.id}
                      variant="ghost"
                      className="w-full justify-start h-auto py-2 px-3"
                      onClick={() => handleSelect(item.id, item.source, item)}
                      disabled={!!associating}
                    >
                      {associating === item.id ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <div className="w-4 mr-2" />
                      )}
                      {renderItem(item)}
                    </Button>
                  ))}
                </div>
              )}
            </div>

            {/* Pagination footer - only show when not in search mode */}
            {!isSearchMode && totalPages > 1 && (
              <div className="flex items-center justify-between px-3 py-2 border-t bg-muted/30">
                <span className="text-xs text-muted-foreground">
                  Página {page + 1} de {totalPages} ({total} total)
                </span>
                <div className="flex gap-1">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => loadPage(page - 1)}
                    disabled={!canPrev || loading}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => loadPage(page + 1)}
                    disabled={!canNext || loading}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

