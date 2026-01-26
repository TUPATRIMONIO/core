import Link from "next/link";
import { PageHeader } from "@/components/admin/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/admin/empty-state";
import { SupportTicketReplyForm } from "@/components/support/SupportTicketReplyForm";
import { getMySupportTicketById } from "@/app/actions/support-tickets";
import { Ticket, ArrowLeft } from "lucide-react";

interface PageProps {
  params: Promise<{ id: string }>;
}

function getStatusBadge(status: string) {
  const styles: Record<string, string> = {
    new: "bg-blue-100 text-blue-800",
    open: "bg-blue-100 text-blue-800",
    in_progress: "bg-yellow-100 text-yellow-800",
    waiting: "bg-yellow-100 text-yellow-800",
    resolved: "bg-green-100 text-green-800",
    closed: "bg-gray-100 text-gray-800",
  };

  const labels: Record<string, string> = {
    new: "Nuevo",
    open: "Abierto",
    in_progress: "En progreso",
    waiting: "Pendiente",
    resolved: "Resuelto",
    closed: "Cerrado",
  };

  return (
    <Badge className={styles[status] || "bg-gray-100 text-gray-800"}>
      {labels[status] || status}
    </Badge>
  );
}

export default async function SupportTicketDetailPage({ params }: PageProps) {
  const { id } = await params;
  const { ticket, messages } = await getMySupportTicketById(id);

  if (!ticket) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Mis tickets"
          description="No encontramos este ticket."
          icon={Ticket}
        />
        <EmptyState
          icon={Ticket}
          title="Ticket no encontrado"
          description="Vuelve al listado para revisar otros tickets."
        />
        <div>
          <Button asChild variant="outline">
            <Link href="/dashboard/support/tickets">Volver al listado</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader
          title={`Ticket ${ticket.ticket_number}`}
          description={ticket.subject}
          icon={Ticket}
        />
        <Button variant="outline" asChild>
          <Link href="/dashboard/support/tickets">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            Estado {getStatusBadge(ticket.status)}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {messages.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Aún no hay mensajes en este ticket.
            </p>
          ) : (
            <div className="space-y-4">
              {messages.map((message: any) => {
                const isUser = message.sender_type === "user";
                return (
                  <div
                    key={message.id}
                    className={`rounded-lg border p-4 ${
                      isUser
                        ? "bg-[var(--tp-bg-light-10)] border-[var(--tp-lines-30)]"
                        : "bg-card"
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                      <span>{isUser ? "Tú" : "TuPatrimonio"}</span>
                      <span>
                        {new Date(message.created_at).toLocaleString("es-CL")}
                      </span>
                    </div>
                    <p className="text-sm whitespace-pre-wrap">
                      {message.message_text}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Responder</CardTitle>
        </CardHeader>
        <CardContent>
          <SupportTicketReplyForm ticketId={ticket.id} />
        </CardContent>
      </Card>
    </div>
  );
}
