import Link from "next/link";
import { PageHeader } from "@/components/admin/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/admin/empty-state";
import { SupportTicketFilters } from "@/components/admin/SupportTicketFilters";
import { getAdminSupportTickets } from "@/app/actions/support-tickets";
import { Ticket, ChevronLeft, ChevronRight } from "lucide-react";

interface PageProps {
  searchParams: Promise<{ page?: string; status?: "open" | "pending" | "resolved" | "closed" }>;
}

const ITEMS_PER_PAGE = 20;

function getStatusBadge(status: string) {
  const styles: Record<string, string> = {
    open: "bg-blue-100 text-blue-800",
    pending: "bg-yellow-100 text-yellow-800",
    resolved: "bg-green-100 text-green-800",
    closed: "bg-gray-100 text-gray-800",
  };

  const labels: Record<string, string> = {
    open: "Abierto",
    pending: "Pendiente",
    resolved: "Resuelto",
    closed: "Cerrado",
  };

  return (
    <Badge className={styles[status] || "bg-gray-100 text-gray-800"}>
      {labels[status] || status}
    </Badge>
  );
}

export default async function AdminSupportTicketsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);
  const offset = (page - 1) * ITEMS_PER_PAGE;

  const { items, total } = await getAdminSupportTickets({
    status: params.status,
    limit: ITEMS_PER_PAGE,
    offset,
  });

  const totalPages = Math.max(1, Math.ceil(total / ITEMS_PER_PAGE));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tickets de soporte"
        description="Gestiona las conversaciones con usuarios."
        icon={Ticket}
      />

      <Card>
        <CardContent className="space-y-6 pt-6">
          <SupportTicketFilters />

          {items.length === 0 ? (
            <EmptyState
              icon={Ticket}
              title="Sin tickets por ahora"
              description="Cuando alguien nos escriba, aparecerá aquí."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ticket</TableHead>
                  <TableHead>Asunto</TableHead>
                  <TableHead>Usuario</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((ticket: any) => (
                  <TableRow key={ticket.id}>
                    <TableCell className="font-medium">{ticket.ticket_number}</TableCell>
                    <TableCell>{ticket.subject}</TableCell>
                    <TableCell>{ticket.user_display || "Usuario"}</TableCell>
                    <TableCell>{getStatusBadge(ticket.status)}</TableCell>
                    <TableCell>
                      {new Date(ticket.created_at).toLocaleDateString("es-CL", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/admin/support/tickets/${ticket.id}`}>Ver</Link>
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
                    href={`/admin/support/tickets?page=${page - 1}${params.status ? `&status=${params.status}` : ""}`}
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
                    href={`/admin/support/tickets?page=${page + 1}${params.status ? `&status=${params.status}` : ""}`}
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
