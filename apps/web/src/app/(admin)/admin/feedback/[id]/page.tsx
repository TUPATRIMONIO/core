import Link from "next/link";
import { getFeedbackById } from "@/app/actions/feedback";
import { PageHeader } from "@/components/admin/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FeedbackResponseForm } from "@/components/admin/FeedbackResponseForm";
import { EmptyState } from "@/components/admin/empty-state";
import { MessageSquareText, ArrowLeft } from "lucide-react";

interface PageProps {
  params: Promise<{ id: string }>;
}

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

export default async function FeedbackDetailPage({ params }: PageProps) {
  const { id } = await params;
  const { data } = await getFeedbackById(id);

  if (!data) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Feedback"
          description="No encontramos este reporte."
          icon={MessageSquareText}
        />
        <EmptyState
          icon={MessageSquareText}
          title="Reporte no encontrado"
          description="Vuelve al listado para revisar otros reportes."
        />
        <div>
          <Button asChild variant="outline">
            <Link href="/admin/feedback">Volver al listado</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader
          title="Detalle de feedback"
          description="Revisa el contexto y responde al usuario."
          icon={MessageSquareText}
        />
        <Button variant="outline" asChild>
          <Link href="/admin/feedback">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver
          </Link>
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>{data.title}</CardTitle>
            <div className="flex flex-wrap items-center gap-2 text-sm">
              {getStatusBadge(data.status)}
              <Badge variant="outline">{getTypeLabel(data.type)}</Badge>
              <span className="text-muted-foreground">
                {new Date(data.created_at).toLocaleString("es-CL")}
              </span>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Detalle</p>
              <p className="text-sm leading-relaxed">{data.description}</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Usuario</p>
                <p className="text-sm">
                  {data.user_display || "Usuario autenticado"}
                </p>
                {data.user_id && (
                  <p className="text-xs text-muted-foreground">ID: {data.user_id}</p>
                )}
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">URL reportada</p>
                {data.url ? (
                  <a
                    href={data.url}
                    target="_blank"
                    rel="noopener noreferrer nofollow"
                    className="text-sm text-[var(--tp-buttons)] hover:underline"
                  >
                    Ver página
                  </a>
                ) : (
                  <p className="text-sm">No disponible</p>
                )}
              </div>
            </div>

            <div>
              <p className="text-sm text-muted-foreground mb-1">Ticket asociado</p>
              {data.support_ticket_id ? (
                <Link
                  href={`/admin/support/tickets/${data.support_ticket_id}`}
                  className="text-sm text-[var(--tp-buttons)] hover:underline"
                >
                  {data.support_ticket_number || "Ver ticket"}
                </Link>
              ) : (
                <p className="text-sm">Sin ticket asociado</p>
              )}
            </div>

            {data.user_agent && (
              <div>
                <p className="text-sm text-muted-foreground mb-1">User Agent</p>
                <p className="text-xs text-muted-foreground break-words">{data.user_agent}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Responder</CardTitle>
          </CardHeader>
          <CardContent>
            <FeedbackResponseForm
              feedbackId={data.id}
              initialStatus={data.status}
              initialResponse={data.admin_response}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
