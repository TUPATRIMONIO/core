"use client";

import * as React from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { submitFeedback } from "@/app/actions/feedback";

interface FeedbackDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type FeedbackType = "error" | "improvement";

export function FeedbackDialog({ open, onOpenChange }: FeedbackDialogProps) {
  const [feedbackType, setFeedbackType] = React.useState<FeedbackType | "">("");
  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [isAuthenticated, setIsAuthenticated] = React.useState(false);
  const [isSubmitting, startTransition] = React.useTransition();

  React.useEffect(() => {
    const checkUser = async () => {
      const supabase = createClient();
      const { data } = await supabase.auth.getUser();
      setIsAuthenticated(!!data?.user);
    };

    if (open) {
      checkUser();
    }
  }, [open]);

  const resetForm = () => {
    setFeedbackType("");
    setTitle("");
    setDescription("");
    setEmail("");
  };

  const handleSubmit = () => {
    if (!feedbackType) {
      toast.error("Elige si es un error o una mejora.");
      return;
    }

    if (title.trim().length < 3) {
      toast.error("Cuéntanos un título breve (mínimo 3 caracteres).");
      return;
    }

    if (description.trim().length < 10) {
      toast.error("Necesitamos un poco más de detalle (mínimo 10 caracteres).");
      return;
    }

    if (!isAuthenticated && !email.trim()) {
      toast.error("Déjanos un correo para poder ayudarte.");
      return;
    }

    startTransition(async () => {
      const result = await submitFeedback({
        type: feedbackType,
        title: title.trim(),
        description: description.trim(),
        userEmail: isAuthenticated ? undefined : email.trim(),
        url: typeof window !== "undefined" ? window.location.href : undefined,
        userAgent: typeof navigator !== "undefined" ? navigator.userAgent : undefined,
      });

      if (result?.success) {
        toast.success("¡Gracias! Tu mensaje ya está en revisión.");
        resetForm();
        onOpenChange(false);
        return;
      }

      toast.error(result?.error || "No pudimos enviar tu mensaje. Inténtalo otra vez.");
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Cuéntanos tu idea</DialogTitle>
          <DialogDescription>
            Si encontraste un error o tienes una mejora, estamos aquí para escucharte.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Tipo de mensaje</Label>
            <Select value={feedbackType} onValueChange={(value) => setFeedbackType(value as FeedbackType)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona una opción" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="error">Encontré un error</SelectItem>
                <SelectItem value="improvement">Tengo una mejora</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="feedback-title">Título</Label>
            <Input
              id="feedback-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Ej: No puedo finalizar mi solicitud"
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="feedback-description">Detalle</Label>
            <Textarea
              id="feedback-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Cuéntanos qué estabas haciendo y qué esperabas ver."
              className="min-h-[120px]"
              disabled={isSubmitting}
            />
          </div>

          {!isAuthenticated && (
            <div className="space-y-2">
              <Label htmlFor="feedback-email">Tu correo</Label>
              <Input
                id="feedback-email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="tu@correo.com"
                type="email"
                disabled={isSubmitting}
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? "Enviando..." : "Enviar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
