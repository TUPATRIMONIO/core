'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Ticket, Package, Building2, User } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { CreateTicketForm } from './CreateTicketForm';

export type AssociationType = 'order' | 'organization' | 'user';

interface AssociationInfo {
  type: AssociationType;
  id: string;
  label: string;
  sublabel?: string;
}

interface CreateTicketDialogProps {
  association: AssociationInfo;
  trigger?: React.ReactNode;
}

export function CreateTicketDialog({ association, trigger }: CreateTicketDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const getAssociationIcon = () => {
    switch (association.type) {
      case 'order':
        return <Package className="h-5 w-5 text-blue-500" />;
      case 'organization':
        return <Building2 className="h-5 w-5 text-purple-500" />;
      case 'user':
        return <User className="h-5 w-5 text-green-500" />;
    }
  };

  const getAssociationLabel = () => {
    switch (association.type) {
      case 'order':
        return 'Pedido';
      case 'organization':
        return 'Organización';
      case 'user':
        return 'Usuario';
    }
  };

  const getAssociationParam = () => {
    switch (association.type) {
      case 'order':
        return { orderId: association.id };
      case 'organization':
        return { organizationId: association.id };
      case 'user':
        return { userId: association.id };
    }
  };

  const handleSuccess = () => {
    setOpen(false);
    router.refresh();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <Ticket className="h-4 w-4 mr-2" />
            Crear Ticket
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[650px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Ticket className="h-5 w-5" />
            Crear Ticket
          </DialogTitle>
          <DialogDescription>
            <div className="flex items-center gap-2 mt-2 p-3 rounded-lg bg-muted/50 border border-dashed">
              {getAssociationIcon()}
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">
                    {getAssociationLabel()}
                  </Badge>
                  <span className="font-medium text-foreground">{association.label}</span>
                </div>
                {association.sublabel && (
                  <p className="text-xs text-muted-foreground mt-0.5">{association.sublabel}</p>
                )}
              </div>
            </div>
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4">
          <CreateTicketForm 
            initialAssociations={getAssociationParam()}
            onSuccess={handleSuccess}
            onCancel={() => setOpen(false)}
            isInDialog={true}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
