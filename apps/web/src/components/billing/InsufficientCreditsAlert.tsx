'use client';

import { useState } from 'react';
import Link from 'next/link';
import { AlertCircle, Coins, ExternalLink, Loader2, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { createClient } from '@/lib/supabase/client';

interface CreditPackage {
  id: string;
  name: string;
  credits_amount: number;
  price_usd: number;
  localized_price?: number;
  currency?: string;
  description?: string;
}

interface InsufficientCreditsAlertProps {
  /** Current credit balance */
  currentBalance: number;
  /** Required credits for the operation */
  requiredCredits: number;
  /** Optional custom message */
  message?: string;
  /** Optional callback when credits are successfully purchased */
  onCreditsAdded?: () => void;
  /** Variant: inline (for embedding) or standalone (full alert) */
  variant?: 'inline' | 'standalone';
  /** Show quick recharge dialog inline or just link to full page */
  showQuickRecharge?: boolean;
}

/**
 * Reusable component to display when user has insufficient credits.
 * Shows current balance, required amount, and provides options to recharge.
 */
export function InsufficientCreditsAlert({
  currentBalance,
  requiredCredits,
  message,
  onCreditsAdded,
  variant = 'standalone',
  showQuickRecharge = true,
}: InsufficientCreditsAlertProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [packages, setPackages] = useState<CreditPackage[]>([]);
  const [isLoadingPackages, setIsLoadingPackages] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const shortage = Math.max(0, requiredCredits - currentBalance);
  const supabase = createClient();

  const fetchPackages = async () => {
    if (packages.length > 0) return; // Already loaded
    
    setIsLoadingPackages(true);
    setError(null);
    
    try {
      const { data, error: fetchError } = await supabase
        .from('credit_packages')
        .select('*')
        .eq('is_active', true)
        .order('credits_amount', { ascending: true });
      
      if (fetchError) throw fetchError;
      setPackages(data || []);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Error al cargar paquetes';
      setError(errorMessage);
      console.error('Error fetching credit packages:', err);
    } finally {
      setIsLoadingPackages(false);
    }
  };

  const handleDialogOpen = (open: boolean) => {
    setIsDialogOpen(open);
    if (open) {
      fetchPackages();
    }
  };

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency,
      minimumFractionDigits: currency === 'CLP' ? 0 : 2,
      maximumFractionDigits: currency === 'CLP' ? 0 : 2,
    }).format(amount);
  };

  // Inline variant - minimal display for embedding in other components
  if (variant === 'inline') {
    return (
      <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-sm text-destructive space-y-2">
        <div className="flex items-start gap-2">
          <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="font-medium">Créditos insuficientes</p>
            <p className="text-xs mt-1 opacity-90">
              {message || `Necesitas ${requiredCredits} créditos pero solo tienes ${currentBalance.toFixed(1)}.`}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 pt-1">
          {showQuickRecharge ? (
            <Dialog open={isDialogOpen} onOpenChange={handleDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" variant="destructive" className="h-7 text-xs gap-1.5">
                  <Zap className="h-3 w-3" />
                  Recargar créditos
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Coins className="h-5 w-5 text-primary" />
                    Recargar Créditos
                  </DialogTitle>
                  <DialogDescription>
                    Te faltan <span className="font-semibold text-destructive">{shortage.toFixed(1)}</span> créditos. Selecciona un paquete para continuar.
                  </DialogDescription>
                </DialogHeader>
                
                {isLoadingPackages ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : error ? (
                  <div className="text-center py-6 text-destructive text-sm">
                    {error}
                  </div>
                ) : packages.length === 0 ? (
                  <div className="text-center py-6 text-muted-foreground text-sm">
                    No hay paquetes disponibles. <Link href="/billing/purchase-credits" className="text-primary underline">Ver opciones</Link>
                  </div>
                ) : (
                  <div className="grid gap-3 py-2">
                    {packages.slice(0, 3).map((pkg) => (
                      <Link
                        key={pkg.id}
                        href={`/billing/purchase-credits/${pkg.id}`}
                        className="flex items-center justify-between p-3 rounded-lg border hover:border-primary/50 hover:bg-primary/5 transition-colors group"
                      >
                        <div>
                          <p className="font-medium text-sm">{pkg.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {pkg.credits_amount.toLocaleString()} créditos
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-primary">
                            {formatCurrency(pkg.localized_price ?? pkg.price_usd, pkg.currency || 'USD')}
                          </p>
                        </div>
                      </Link>
                    ))}
                    
                    {packages.length > 3 && (
                      <Link
                        href="/billing/purchase-credits"
                        className="text-center text-sm text-primary hover:underline py-2"
                      >
                        Ver todos los paquetes →
                      </Link>
                    )}
                  </div>
                )}
              </DialogContent>
            </Dialog>
          ) : null}
          
          <Button size="sm" variant="ghost" className="h-7 text-xs gap-1.5" asChild>
            <Link href="/billing/purchase-credits">
              Ver todos
              <ExternalLink className="h-3 w-3" />
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  // Standalone variant - full alert component
  return (
    <Alert variant="destructive" className="border-destructive/50 bg-destructive/5">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Créditos insuficientes</AlertTitle>
      <AlertDescription className="mt-2 space-y-3">
        <p>
          {message || (
            <>
              Necesitas <span className="font-semibold">{requiredCredits}</span> créditos para esta operación,
              pero tu saldo actual es de <span className="font-semibold">{currentBalance.toFixed(1)}</span> créditos.
            </>
          )}
        </p>
        
        <div className="flex flex-wrap items-center gap-2">
          {showQuickRecharge ? (
            <Dialog open={isDialogOpen} onOpenChange={handleDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" variant="destructive" className="gap-2">
                  <Zap className="h-4 w-4" />
                  Recargar ahora
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Coins className="h-5 w-5 text-primary" />
                    Recargar Créditos
                  </DialogTitle>
                  <DialogDescription>
                    Te faltan <span className="font-semibold text-destructive">{shortage.toFixed(1)}</span> créditos. Selecciona un paquete para continuar.
                  </DialogDescription>
                </DialogHeader>
                
                {isLoadingPackages ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : error ? (
                  <div className="text-center py-6 text-destructive text-sm">
                    {error}
                  </div>
                ) : packages.length === 0 ? (
                  <div className="text-center py-6 text-muted-foreground text-sm">
                    No hay paquetes disponibles. <Link href="/billing/purchase-credits" className="text-primary underline">Ver opciones</Link>
                  </div>
                ) : (
                  <div className="grid gap-3 py-2">
                    {packages.slice(0, 3).map((pkg) => (
                      <Link
                        key={pkg.id}
                        href={`/billing/purchase-credits/${pkg.id}`}
                        className="flex items-center justify-between p-3 rounded-lg border hover:border-primary/50 hover:bg-primary/5 transition-colors group"
                      >
                        <div>
                          <p className="font-medium text-sm">{pkg.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {pkg.credits_amount.toLocaleString()} créditos
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-primary">
                            {formatCurrency(pkg.localized_price ?? pkg.price_usd, pkg.currency || 'USD')}
                          </p>
                        </div>
                      </Link>
                    ))}
                    
                    {packages.length > 3 && (
                      <Link
                        href="/billing/purchase-credits"
                        className="text-center text-sm text-primary hover:underline py-2"
                      >
                        Ver todos los paquetes →
                      </Link>
                    )}
                  </div>
                )}
              </DialogContent>
            </Dialog>
          ) : null}
          
          <Button size="sm" variant="outline" asChild>
            <Link href="/billing/purchase-credits" className="gap-2">
              Ver paquetes disponibles
              <ExternalLink className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
}
