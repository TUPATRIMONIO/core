"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { respondToFeedback, FeedbackStatus } from "@/app/actions/feedback";
import { toast } from "sonner";

const STATUS_OPTIONS: { value: FeedbackStatus; label: string }[] = [
  { value: "pending", label: "Pendiente" },
  { value: "reviewing", label: "En revisión" },
  { value: "resolved", label: "Resuelto" },
  { value: "rejected", label: "Rechazado" },
];

interface FeedbackResponseFormProps {
  feedbackId: string;
  initialStatus: FeedbackStatus;
  initialResponse?: string | null;
}

export function FeedbackResponseForm({
  feedbackId,
  initialStatus,
  initialResponse,
}: FeedbackResponseFormProps) {
  const [status, setStatus] = React.useState<FeedbackStatus>(initialStatus);
  const [response, setResponse] = React.useState(initialResponse ?? "");
  const [isPending, startTransition] = React.useTransition();

  const handleSave = () => {
    if (!response.trim()) {
      toast.error("Escribe una respuesta antes de guardar.");
      return;
    }

    startTransition(async () => {
      const result = await respondToFeedback({
        id: feedbackId,
        status,
        adminResponse: response.trim(),
      });

      if (result?.success) {
        toast.success("Respuesta guardada.");
        return;
      }

      toast.error(result?.error || "No pudimos guardar los cambios.");
    });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Estado</Label>
        <Select value={status} onValueChange={(value) => setStatus(value as FeedbackStatus)}>
          <SelectTrigger className="w-[220px]">
            <SelectValue placeholder="Selecciona estado" />
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
        <Label>Respuesta al usuario</Label>
        <Textarea
          value={response}
          onChange={(event) => setResponse(event.target.value)}
          className="min-h-[140px]"
          placeholder="Escribe una respuesta clara y empática."
          disabled={isPending}
        />
      </div>

      <Button onClick={handleSave} disabled={isPending}>
        {isPending ? "Guardando..." : "Guardar respuesta"}
      </Button>
    </div>
  );
}
