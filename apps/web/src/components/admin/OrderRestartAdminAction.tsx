'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { RestartOrderAdminModal } from './RestartOrderAdminModal';
import { useRouter } from 'next/navigation';

interface OrderRestartAdminActionProps {
  order: any;
}

export function OrderRestartAdminAction({ order }: OrderRestartAdminActionProps) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  // Solo mostrar si tiene documento de firma
  if (!order.signing_document) return null;

  return (
    <>
      <Button 
        variant="outline" 
        size="sm" 
        onClick={() => setOpen(true)}
        className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
      >
        <RefreshCw className="h-4 w-4 mr-2" />
        Rehacer Pedido
      </Button>

      <RestartOrderAdminModal
        order={order}
        open={open}
        onOpenChange={setOpen}
        onSuccess={() => {
          router.refresh();
        }}
      />
    </>
  );
}




