"use client";

import * as React from "react";
import { Search, Loader2, ChevronLeft, ChevronRight, Ticket, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
      case "ticket": return "Asociar Ticket";
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; className: string }> = {
      new: { label: "Nuevo", className: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
      open: { label: "Abierto", className: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
      pending: { label: "Pendiente", className: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400" },
      resolved: { label: "Resuelto", className: "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400" },
      closed: { label: "Cerrado", className: "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400" },
    };

    const config = statusConfig[status?.toLowerCase()] || { label: status, className: "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400" };
    
    return (
      <Badge variant="outline" className={`text-[10px] px-1.5 py-0.5 h-5 ${config.className} border-0`}>
        {config.label}
      </Badge>
    );
  };

  const parseTicketData = (topText: string, subText: string) => {
    // Para tickets, el formato es "TICK-00302 Asunto del ticket"
    const ticketMatch = topText.match(/^(TICK-\d+)\s+(.+)$/);
    if (ticketMatch) {
      return {
        ticketNumber: ticketMatch[1],
        subject: ticketMatch[2],
        status: subText,
      };
    }
    // Si no coincide el formato, devolver como está
    return {
      ticketNumber: topText.split(' ')[0] || topText,
      subject: topText,
      status: subText,
    };
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

    // Si es un ticket, usar renderizado especial
    if (type === "ticket") {
      const { ticketNumber, subject, status } = parseTicketData(item.top_text, item.sub_text);
      const isRejected = subject.toLowerCase().includes("rechazo") || subject.toLowerCase().includes("rejected");
      
      return (
        <div className="flex items-start gap-3 w-full overflow-hidden">
          <div className="flex-shrink-0">
            {isRejected ? (
              <div className="h-10 w-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
            ) : (
              <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <Ticket className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
            )}
          </div>
          <div className="flex flex-col min-w-0 flex-1 gap-1 overflow-hidden">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-sm font-bold text-foreground">{ticketNumber}</span>
              {getStatusBadge(status)}
            </div>
            <span className="text-sm text-foreground/90 leading-snug line-clamp-2 break-words text-left">{subject}</span>
          </div>
        </div>
      );
    }

    // Renderizado estándar para otros tipos
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
      <DialogContent className="sm:max-w-[600px] max-w-[95vw]">
        <DialogHeader>
          <DialogTitle>{getTitle()}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-4 overflow-hidden">
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
          
          <div className="h-[350px] border rounded-md overflow-hidden flex flex-col w-full">
            <div className="flex-1 overflow-y-auto p-2 w-full">
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
                <div className="space-y-1 w-full">
                  {results.map((item) => (
                    <Button
                      key={item.id}
                      variant="ghost"
                      className={`w-full justify-start h-auto py-3 px-3 hover:bg-accent/50 transition-all rounded-lg overflow-hidden ${
                        type === "ticket" ? "items-start" : "items-center"
                      }`}
                      onClick={() => handleSelect(item.id, item.source, item)}
                      disabled={!!associating}
                    >
                      {associating === item.id ? (
                        <Loader2 className="h-5 w-5 animate-spin mr-2 flex-shrink-0" />
                      ) : null}
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

