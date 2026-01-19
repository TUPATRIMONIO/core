"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { addAdminTicketMessage, SupportTicketStatus } from "@/app/actions/support-tickets";
import { toast } from "sonner";

const STATUS_OPTIONS: { value: SupportTicketStatus; label: string }[] = [
  { value: "open", label: "Abierto" },
  { value: "pending", label: "Pendiente" },
  { value: "resolved", label: "Resuelto" },
  { value: "closed", label: "Cerrado" },
];

interface SupportTicketAdminReplyFormProps {
  ticketId: string;
  initialStatus: SupportTicketStatus;
}

export function SupportTicketAdminReplyForm({
  ticketId,
  initialStatus,
}: SupportTicketAdminReplyFormProps) {
  const [status, setStatus] = React.useState<SupportTicketStatus>(initialStatus);
  const [message, setMessage] = React.useState("");
  const [isPending, startTransition] = React.useTransition();

  const handleSend = () => {
    if (message.trim().length < 2) {
      toast.error("Escribe un mensaje antes de enviar.");
      return;
    }

    startTransition(async () => {
      const result = await addAdminTicketMessage({
        ticketId,
        message: message.trim(),
        status,
      });

      if (result?.success) {
        setMessage("");
        toast.success("Respuesta enviada al usuario.");
        return;
      }

      toast.error(result?.error || "No pudimos enviar la respuesta.");
    });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Estado</Label>
        <Select value={status} onValueChange={(value) => setStatus(value as SupportTicketStatus)}>
          <SelectTrigger className="w-[220px]">
            <SelectValue placeholder="Estado del ticket" />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Respuesta</Label>
        <Textarea
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          placeholder="Escribe una respuesta clara y empática."
          className="min-h-[160px]"
          disabled={isPending}
        />
      </div>

      <Button onClick={handleSend} disabled={isPending}>
        {isPending ? "Enviando..." : "Enviar respuesta"}
      </Button>
    </div>
  );
}
