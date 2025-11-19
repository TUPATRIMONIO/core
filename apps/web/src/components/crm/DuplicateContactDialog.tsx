/**
 * Dialog de Contacto Duplicado
 * Muestra opciones amigables cuando se detecta un email duplicado
 */

'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertCircle, Eye, X } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface DuplicateContact {
  id: string;
  full_name: string | null;
  email: string;
  company_name?: string | null;
  job_title?: string | null;
  status?: string;
}

interface DuplicateContactDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contact: DuplicateContact;
}

export default function DuplicateContactDialog({
  open,
  onOpenChange,
  contact
}: DuplicateContactDialogProps) {
  const router = useRouter();

  const handleViewContact = () => {
    router.push(`/dashboard/crm/contacts/${contact.id}`);
  };

  const handleClose = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/20">
              <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-500" />
            </div>
            <DialogTitle className="text-xl">
              Este contacto ya existe
            </DialogTitle>
          </div>
          <DialogDescription className="text-base pt-2">
            Ya tienes un contacto registrado con el correo{' '}
            <span className="font-semibold text-gray-900 dark:text-gray-100">
              {contact.email}
            </span>
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 p-4 space-y-2">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="font-medium text-gray-900 dark:text-gray-100">
                  {contact.full_name || 'Sin nombre'}
                </p>
                {contact.company_name && (
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {contact.company_name}
                    {contact.job_title && ` • ${contact.job_title}`}
                  </p>
                )}
                <p className="text-sm text-gray-500 dark:text-gray-500">
                  {contact.email}
                </p>
              </div>
              {contact.status && (
                <span className="inline-flex items-center rounded-full bg-blue-100 dark:bg-blue-900/30 px-2.5 py-0.5 text-xs font-medium text-blue-800 dark:text-blue-400">
                  {contact.status === 'lead' && 'Lead'}
                  {contact.status === 'qualified' && 'Calificado'}
                  {contact.status === 'customer' && 'Cliente'}
                  {contact.status === 'inactive' && 'Inactivo'}
                </span>
              )}
            </div>
          </div>

          <p className="text-sm text-gray-600 dark:text-gray-400 mt-4">
            Para mantener tu CRM organizado, cada correo electrónico solo puede estar asociado a un contacto. 
            Puedes ver el contacto existente o cancelar esta acción.
          </p>
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            className="w-full sm:w-auto"
          >
            <X className="w-4 h-4 mr-2" />
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleViewContact}
            className="w-full sm:w-auto bg-[var(--tp-buttons)] hover:bg-[var(--tp-buttons-hover)]"
          >
            <Eye className="w-4 h-4 mr-2" />
            Ver Contacto Existente
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


