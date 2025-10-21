"use client";

import { useFormStatus } from "react-dom";
import { type ComponentProps, useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "../alert";
import { AlertTriangle } from "lucide-react";

interface ActionState {
  message?: string;
}

type Props = Omit<ComponentProps<typeof Button>, 'formAction'> & {
  pendingText?: string;
  formAction: (prevState: ActionState | null, formData: FormData) => Promise<ActionState>;
  errorMessage?: string;
};

const initialState: ActionState = {
  message: "",
};

export function SubmitButton({ children, formAction, errorMessage, pendingText = "Submitting...", ...props }: Props) {
  const { pending, action } = useFormStatus();
  const [state, internalFormAction] = useActionState(formAction, initialState);

  const isPending = pending && action === internalFormAction;

  return (
    <div className="flex flex-col gap-y-4 w-full">
      {Boolean(errorMessage || state?.message) && (
        <Alert variant="destructive" className="w-full">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {errorMessage || state?.message}
          </AlertDescription>
        </Alert>
      )}
      <div>
        <Button {...props} type="submit" aria-disabled={pending} formAction={internalFormAction}>
          {isPending ? pendingText : children}
        </Button>
      </div>
    </div>
  );
}