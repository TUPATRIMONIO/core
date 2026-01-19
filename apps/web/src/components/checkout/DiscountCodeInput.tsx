import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Loader2, Tag, CheckCircle2 } from 'lucide-react';

interface DiscountCodeInputProps {
  orderId: string;
  order: {
    amount: number;
    original_amount?: number | null;
    discount_amount?: number | null;
    discount_code_id?: string | null;
    metadata?: Record<string, any>;
  };
  onApplied: (payload: {
    order: {
      amount: number;
      original_amount?: number | null;
      discount_amount?: number | null;
      discount_code_id?: string | null;
      metadata?: Record<string, any>;
    };
    discount: {
      code: string;
      type: string;
      value: number;
      original_amount: number;
      discount_amount: number;
      final_amount: number;
    };
  }) => void;
}

export default function DiscountCodeInput({ orderId, order, onApplied }: DiscountCodeInputProps) {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const existingCode = order?.metadata?.discount_code?.code;
    if (existingCode) {
      setCode(existingCode);
    }
  }, [order?.metadata?.discount_code?.code]);

  const handleApply = async () => {
    setError(null);
    setSuccess(null);

    if (!code.trim()) {
      setError('Ingresa un código para continuar');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/discounts/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: code.trim(),
          orderId,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'No pudimos aplicar el código');
      }

      setSuccess('Código aplicado correctamente');
      onApplied(data);
    } catch (err: any) {
      setError(err.message || 'No pudimos aplicar el código');
    } finally {
      setLoading(false);
    }
  };

  const hasDiscount = Number(order?.discount_amount || 0) > 0;
  const appliedCode = order?.metadata?.discount_code?.code;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-muted-foreground">Código de descuento</h3>
        {hasDiscount && appliedCode && (
          <Badge variant="outline" className="gap-1">
            <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
            {appliedCode}
          </Badge>
        )}
      </div>

      <div className="flex gap-2">
        <Input
          placeholder="Ej: TRANQUILIDAD10"
          value={code}
          onChange={(event) => setCode(event.target.value.toUpperCase())}
          className="bg-white"
        />
        <Button
          type="button"
          onClick={handleApply}
          disabled={loading}
          className="bg-[var(--tp-buttons)] hover:bg-[var(--tp-buttons-hover)]"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Tag className="h-4 w-4" />}
          <span className="ml-2">Aplicar</span>
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="border-green-200 bg-green-50 text-green-700">
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}

