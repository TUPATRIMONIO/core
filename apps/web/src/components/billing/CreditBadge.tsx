'use client';

import { useCreditsBalance } from '@/hooks/billing/useCredits';
import { useOrganization } from '@/hooks/useOrganization';
import { Coins, PlusCircle } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface CreditBadgeProps {
  className?: string;
}

export function CreditBadge({ className }: CreditBadgeProps) {
  const { activeOrganization } = useOrganization();
  const { balance, loading } = useCreditsBalance(activeOrganization?.id || '');

  if (!activeOrganization) return null;

  return (
    <div className={cn("flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20", className)}>
      <Coins className="h-4 w-4 text-primary" />
      {loading ? (
        <span className="text-sm font-medium animate-pulse">...</span>
      ) : (
        <span className="text-sm font-medium">
          {balance?.toLocaleString() ?? 0}
          <span className="hidden sm:inline ml-1">créditos</span>
        </span>
      )}
      <Link 
        href="/billing/purchase-credits" 
        className="ml-1 text-primary hover:text-primary/80 transition-colors"
        title="Comprar más créditos"
      >
        <PlusCircle className="h-4 w-4" />
      </Link>
    </div>
  );
}
