"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { addUserTicketMessage } from "@/app/actions/support-tickets";
import { toast } from "sonner";

interface SupportTicketReplyFormProps {
  ticketId: string;
}

export function SupportTicketReplyForm({ ticketId }: SupportTicketReplyFormProps) {
  const [message, setMessage] = React.useState("");
  const [isPending, startTransition] = React.useTransition();

  const handleSend = () => {
    if (message.trim().length < 2) {
      toast.error("Escribe un mensaje antes de enviar.");
      return;
    }

    startTransition(async () => {
      const result = await addUserTicketMessage({
        ticketId,
        message: message.trim(),
      });

      if (result?.success) {
        setMessage("");
        toast.success("Mensaje enviado.");
        return;
      }

      toast.error(result?.error || "No pudimos enviar tu mensaje.");
    });
  };

  return (
    <div className="space-y-3">
      <Textarea
        value={message}
        onChange={(event) => setMessage(event.target.value)}
        placeholder="Escribe tu respuesta..."
        className="min-h-[140px]"
        disabled={isPending}
      />
      <Button onClick={handleSend} disabled={isPending}>
        {isPending ? "Enviando..." : "Enviar respuesta"}
      </Button>
    </div>
  );
}
