"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { createSupportTicket } from "@/app/actions/support-tickets";

export function SupportTicketForm() {
  const router = useRouter();
  const [subject, setSubject] = React.useState("");
  const [message, setMessage] = React.useState("");
  const [isPending, startTransition] = React.useTransition();

  const handleSubmit = () => {
    if (subject.trim().length < 3) {
      toast.error("Escribe un asunto más claro.");
      return;
    }

    if (message.trim().length < 10) {
      toast.error("Cuéntanos un poco más para poder ayudarte.");
      return;
    }

    startTransition(async () => {
      const result = await createSupportTicket({
        subject: subject.trim(),
        message: message.trim(),
      });

      if (result?.success && result.ticketId) {
        toast.success("Tu ticket fue creado. Ya lo estamos revisando.");
        router.push(`/dashboard/support/tickets/${result.ticketId}`);
        return;
      }

      toast.error(result?.error || "No pudimos crear el ticket.");
    });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="ticket-subject">Asunto</Label>
        <Input
          id="ticket-subject"
          value={subject}
          onChange={(event) => setSubject(event.target.value)}
          placeholder="Ej: Necesito ayuda con mi solicitud"
          disabled={isPending}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="ticket-message">Mensaje</Label>
        <Textarea
          id="ticket-message"
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          placeholder="Cuéntanos qué está pasando y cómo te gustaría resolverlo."
          className="min-h-[160px]"
          disabled={isPending}
        />
      </div>

      <Button onClick={handleSubmit} disabled={isPending}>
        {isPending ? "Creando..." : "Crear ticket"}
      </Button>
    </div>
  );
}
