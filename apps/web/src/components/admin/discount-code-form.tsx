"use client";

import { useMemo, useState } from 'react';
import { CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Save } from 'lucide-react';

const PRODUCT_TYPES = [
  { value: 'credits', label: 'Créditos' },
  { value: 'electronic_signature', label: 'Firma electrónica' },
  { value: 'electronic_signature_resend', label: 'Reenvío firma' },
  { value: 'notary_service', label: 'Servicio notarial' },
  { value: 'company_modification', label: 'Modificación de empresa' },
  { value: 'advisory', label: 'Asesoría' },
  { value: 'subscription', label: 'Suscripción' },
];

type DiscountCodeFormData = {
  code?: string | null;
  description?: string | null;
  type?: 'percentage' | 'fixed_amount';
  value?: number | null;
  currency?: string | null;
  min_purchase_amount?: number | null;
  max_discount_amount?: number | null;
  usage_limit_type?: 'single_use' | 'per_user' | 'global_limit' | 'unlimited';
  max_uses?: number | null;
  valid_from?: string | null;
  valid_until?: string | null;
  is_active?: boolean;
  product_types?: string[] | null;
  allowed_user_ids?: string[] | null;
  allowed_organization_ids?: string[] | null;
  allowed_user_emails?: string[];
};

interface DiscountCodeFormProps {
  initialData?: DiscountCodeFormData | null;
  action: (formData: FormData) => void;
}

export function DiscountCodeForm({ initialData, action }: DiscountCodeFormProps) {
  const [discountType, setDiscountType] = useState<DiscountCodeFormData['type']>(
    initialData?.type || 'percentage'
  );
  const [usageLimitType, setUsageLimitType] = useState<DiscountCodeFormData['usage_limit_type']>(
    initialData?.usage_limit_type || 'unlimited'
  );

  const initialProductTypes = useMemo(
    () => initialData?.product_types || [],
    [initialData?.product_types]
  );

  return (
    <CardContent>
      <form action={action} className="space-y-6">
        <input type="hidden" name="type" value={discountType || 'percentage'} />
        <input type="hidden" name="usage_limit_type" value={usageLimitType || 'unlimited'} />

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="code">Código</Label>
            <Input
              id="code"
              name="code"
              defaultValue={initialData?.code || ''}
              placeholder="TRANQUILIDAD10"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Descripción</Label>
            <Input
              id="description"
              name="description"
              defaultValue={initialData?.description || ''}
              placeholder="Ej: descuento para campaña de enero"
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label>Tipo de descuento</Label>
            <Select
              value={discountType || 'percentage'}
              onValueChange={(value) => setDiscountType(value as DiscountCodeFormData['type'])}
            >
              <SelectTrigger className="w-full bg-white text-gray-900 border-gray-300 dark:bg-zinc-800 dark:text-white dark:border-zinc-600">
                <SelectValue placeholder="Selecciona un tipo" />
              </SelectTrigger>
              <SelectContent className="bg-white text-gray-900 border-gray-300 dark:bg-zinc-800 dark:text-white dark:border-zinc-600">
                <SelectItem value="percentage" className="text-gray-900 dark:text-white focus:bg-gray-100 dark:focus:bg-zinc-700">
                  Porcentaje
                </SelectItem>
                <SelectItem value="fixed_amount" className="text-gray-900 dark:text-white focus:bg-gray-100 dark:focus:bg-zinc-700">
                  Monto fijo
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="value">Valor</Label>
            <Input
              id="value"
              name="value"
              type="number"
              min="0"
              step="0.01"
              defaultValue={initialData?.value ?? ''}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="currency">Moneda (solo monto fijo)</Label>
            <Input
              id="currency"
              name="currency"
              defaultValue={initialData?.currency || ''}
              placeholder="CLP"
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="min_purchase_amount">Monto mínimo</Label>
            <Input
              id="min_purchase_amount"
              name="min_purchase_amount"
              type="number"
              min="0"
              step="0.01"
              defaultValue={initialData?.min_purchase_amount ?? ''}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="max_discount_amount">Tope de descuento</Label>
            <Input
              id="max_discount_amount"
              name="max_discount_amount"
              type="number"
              min="0"
              step="0.01"
              defaultValue={initialData?.max_discount_amount ?? ''}
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label>Límite de uso</Label>
            <Select
              value={usageLimitType || 'unlimited'}
              onValueChange={(value) => setUsageLimitType(value as DiscountCodeFormData['usage_limit_type'])}
            >
              <SelectTrigger className="w-full bg-white text-gray-900 border-gray-300 dark:bg-zinc-800 dark:text-white dark:border-zinc-600">
                <SelectValue placeholder="Selecciona un límite" />
              </SelectTrigger>
              <SelectContent className="bg-white text-gray-900 border-gray-300 dark:bg-zinc-800 dark:text-white dark:border-zinc-600">
                <SelectItem value="unlimited" className="text-gray-900 dark:text-white focus:bg-gray-100 dark:focus:bg-zinc-700">
                  Sin límite
                </SelectItem>
                <SelectItem value="single_use" className="text-gray-900 dark:text-white focus:bg-gray-100 dark:focus:bg-zinc-700">
                  Un solo uso
                </SelectItem>
                <SelectItem value="per_user" className="text-gray-900 dark:text-white focus:bg-gray-100 dark:focus:bg-zinc-700">
                  Un uso por usuario
                </SelectItem>
                <SelectItem value="global_limit" className="text-gray-900 dark:text-white focus:bg-gray-100 dark:focus:bg-zinc-700">
                  Usos limitados
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="max_uses">Máximo de usos</Label>
            <Input
              id="max_uses"
              name="max_uses"
              type="number"
              min="1"
              defaultValue={initialData?.max_uses ?? ''}
            />
          </div>
          <div className="flex items-end gap-2">
            <input
              id="is_active"
              name="is_active"
              type="checkbox"
              defaultChecked={initialData?.is_active ?? true}
              className="h-4 w-4 rounded border-[var(--tp-lines-30)] bg-transparent"
            />
            <Label htmlFor="is_active">Activo</Label>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="valid_from">Válido desde</Label>
            <Input
              id="valid_from"
              name="valid_from"
              type="datetime-local"
              defaultValue={initialData?.valid_from ? initialData.valid_from.slice(0, 16) : ''}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="valid_until">Válido hasta</Label>
            <Input
              id="valid_until"
              name="valid_until"
              type="datetime-local"
              defaultValue={initialData?.valid_until ? initialData.valid_until.slice(0, 16) : ''}
            />
          </div>
        </div>

        <div className="space-y-3">
          <Label>Aplica a productos</Label>
          <div className="grid gap-2 md:grid-cols-2">
            {PRODUCT_TYPES.map((item) => (
              <label key={item.value} className="flex items-center gap-2 text-sm">
                <input
                  name="product_types"
                  value={item.value}
                  type="checkbox"
                  defaultChecked={initialProductTypes?.includes(item.value)}
                  className="h-4 w-4 rounded border-[var(--tp-lines-30)] bg-transparent"
                />
                {item.label}
              </label>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            Si no seleccionas productos, el código aplicará a todos.
          </p>
        </div>

        <div className="space-y-3 border-t pt-4">
          <Label htmlFor="allowed_user_emails">Restringir a usuarios específicos</Label>
          <Input
            id="allowed_user_emails"
            name="allowed_user_emails"
            defaultValue={initialData?.allowed_user_emails?.join(', ') || ''}
            placeholder="email1@ejemplo.com, email2@ejemplo.com"
          />
          <p className="text-xs text-muted-foreground">
            Ingresa los emails de los usuarios que pueden usar este código, separados por coma. Deja vacío para permitir a todos.
          </p>
        </div>

        <div className="flex justify-end">
          <Button type="submit" className="bg-[var(--tp-buttons)] hover:bg-[var(--tp-buttons-hover)]">
            <Save className="h-4 w-4" />
            <span className="ml-2">Guardar</span>
          </Button>
        </div>
      </form>
    </CardContent>
  );
}

