import Link from "next/link";
import { PageHeader } from "@/components/admin/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/admin/empty-state";
import { FeedbackFilters } from "@/components/admin/FeedbackFilters";
import { getFeedbackList } from "@/app/actions/feedback";
import { ChevronLeft, ChevronRight, MessageSquareText } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PageProps {
  searchParams: Promise<{
    page?: string;
    status?: "pending" | "reviewing" | "resolved" | "rejected";
    type?: "error" | "improvement";
  }>;
}

const ITEMS_PER_PAGE = 20;

function getStatusBadge(status: string) {
  const styles: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800",
    reviewing: "bg-blue-100 text-blue-800",
    resolved: "bg-green-100 text-green-800",
    rejected: "bg-red-100 text-red-800",
  };

  const labels: Record<string, string> = {
    pending: "Pendiente",
    reviewing: "En revisión",
    resolved: "Resuelto",
    rejected: "Rechazado",
  };

  return (
    <Badge className={styles[status] || "bg-gray-100 text-gray-800"}>
      {labels[status] || status}
    </Badge>
  );
}

function getTypeLabel(type: string) {
  return type === "error" ? "Error" : "Mejora";
}

export default async function FeedbackPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);
  const offset = (page - 1) * ITEMS_PER_PAGE;

  const { items, total } = await getFeedbackList({
    status: params.status,
    type: params.type,
    limit: ITEMS_PER_PAGE,
    offset,
  });

  const totalPages = Math.max(1, Math.ceil(total / ITEMS_PER_PAGE));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Feedback"
        description="Revisa los errores y mejoras reportadas por los usuarios."
        icon={MessageSquareText}
      />

      <Card>
        <CardContent className="space-y-6 pt-6">
          <FeedbackFilters />

          {items.length === 0 ? (
            <EmptyState
              icon={MessageSquareText}
              title="Sin feedback por ahora"
              description="Cuando alguien reporte un error o una mejora, aparecerá aquí."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Título</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Usuario</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item: any) => (
                  <TableRow key={item.id}>
                    <TableCell>{getTypeLabel(item.type)}</TableCell>
                    <TableCell className="font-medium">{item.title}</TableCell>
                    <TableCell>{getStatusBadge(item.status)}</TableCell>
                    <TableCell>{item.user_display || "Usuario autenticado"}</TableCell>
                    <TableCell>
                      {new Date(item.created_at).toLocaleDateString("es-CL", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/admin/feedback/${item.id}`}>Ver</Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {items.length > 0 && (
            <div className="flex items-center justify-between">
              {page <= 1 ? (
                <Button variant="outline" size="sm" disabled>
                  <ChevronLeft className="mr-2 h-4 w-4" />
                  Anterior
                </Button>
              ) : (
                <Button variant="outline" size="sm" asChild>
                  <Link
                    href={`/admin/feedback?page=${page - 1}${params.status ? `&status=${params.status}` : ""}${params.type ? `&type=${params.type}` : ""}`}
                  >
                    <ChevronLeft className="mr-2 h-4 w-4" />
                    Anterior
                  </Link>
                </Button>
              )}
              <span className="text-sm text-muted-foreground">
                Página {page} de {totalPages}
              </span>
              {page >= totalPages ? (
                <Button variant="outline" size="sm" disabled>
                  Siguiente
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <Button variant="outline" size="sm" asChild>
                  <Link
                    href={`/admin/feedback?page=${page + 1}${params.status ? `&status=${params.status}` : ""}${params.type ? `&type=${params.type}` : ""}`}
                  >
                    Siguiente
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
