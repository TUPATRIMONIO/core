import { redirect, notFound } from 'next/navigation';
import { createClient, createServiceRoleClient } from '@/lib/supabase/server';
import { PageHeader } from '@/components/admin/page-header';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { DiscountCodeForm } from '@/components/admin/discount-code-form';

interface PageProps {
  params: Promise<{ id: string }>;
}

async function getDiscountCode(id: string) {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from('discount_codes')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) {
    return null;
  }

  // Obtener emails de usuarios permitidos
  let allowedUserEmails: string[] = [];
  if (data.allowed_user_ids && data.allowed_user_ids.length > 0) {
    const { data: users } = await supabase
      .from('users')
      .select('email')
      .in('id', data.allowed_user_ids);
    
    if (users) {
      allowedUserEmails = users.map(u => u.email).filter(Boolean);
    }
  }

  return {
    ...data,
    allowed_user_emails: allowedUserEmails,
  };
}

async function saveDiscountCode(id: string, formData: FormData) {
  'use server';

  const supabase = createServiceRoleClient();
  const authClient = await createClient();
  const { data: { user } } = await authClient.auth.getUser();

  const code = String(formData.get('code') || '').trim().toUpperCase();
  const description = String(formData.get('description') || '').trim();
  const type = String(formData.get('type') || 'percentage');
  const value = Number(formData.get('value') || 0);
  const currency = String(formData.get('currency') || '').trim().toUpperCase();
  const minPurchaseAmount = String(formData.get('min_purchase_amount') || '').trim();
  const maxDiscountAmount = String(formData.get('max_discount_amount') || '').trim();
  const usageLimitType = String(formData.get('usage_limit_type') || 'unlimited');
  const maxUses = String(formData.get('max_uses') || '').trim();
  const validFrom = String(formData.get('valid_from') || '').trim();
  const validUntil = String(formData.get('valid_until') || '').trim();
  const isActive = formData.get('is_active') === 'on';
  const productTypes = formData.getAll('product_types').map(String);
  const allowedUserEmails = String(formData.get('allowed_user_emails') || '').trim();

  // Convertir emails a user IDs
  let allowedUserIds: string[] | null = null;
  if (allowedUserEmails) {
    const emails = allowedUserEmails.split(',').map(e => e.trim().toLowerCase()).filter(Boolean);
    if (emails.length > 0) {
      const { data: users } = await supabase
        .from('users')
        .select('id, email')
        .in('email', emails);
      
      if (users && users.length > 0) {
        allowedUserIds = users.map(u => u.id);
      }
    }
  }

  const payload: Record<string, any> = {
    code,
    description: description || null,
    type,
    value,
    currency: type === 'fixed_amount' ? (currency || null) : null,
    min_purchase_amount: minPurchaseAmount ? Number(minPurchaseAmount) : null,
    max_discount_amount: maxDiscountAmount ? Number(maxDiscountAmount) : null,
    usage_limit_type: usageLimitType,
    max_uses: usageLimitType === 'global_limit' ? Number(maxUses) || null : null,
    valid_from: validFrom ? new Date(validFrom).toISOString() : null,
    valid_until: validUntil ? new Date(validUntil).toISOString() : null,
    product_types: productTypes.length > 0 ? productTypes : null,
    is_active: isActive,
    created_by: user?.id || null,
    allowed_user_ids: allowedUserIds,
  };

  if (id === 'new') {
    const { error } = await supabase
      .from('discount_codes')
      .insert(payload);

    if (error) {
      console.error('Error creating discount code:', error);
      throw new Error('Error al crear el cupón');
    }
  } else {
    const { error } = await supabase
      .from('discount_codes')
      .update(payload)
      .eq('id', id);

    if (error) {
      console.error('Error updating discount code:', error);
      throw new Error('Error al actualizar el cupón');
    }
  }

  redirect('/admin/billing/discounts');
}

export default async function DiscountCodePage({ params }: PageProps) {
  const { id } = await params;
  const isNew = id === 'new';
  const discountCode = isNew ? null : await getDiscountCode(id);

  if (!isNew && !discountCode) {
    notFound();
  }

  async function handleSave(formData: FormData) {
    'use server';
    await saveDiscountCode(id, formData);
  }

  return (
    <div className="flex flex-1 flex-col">
      <PageHeader
        title={isNew ? 'Nuevo cupón' : 'Editar cupón'}
        description={isNew ? 'Configura un nuevo código de descuento' : `Código: ${discountCode.code}`}
        actions={(
          <Button variant="outline" size="sm" asChild>
            <a href="/admin/billing/discounts">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver
            </a>
          </Button>
        )}
      />

      <div className="flex-1 px-4 pb-6">
        <Card>
          <CardHeader>
            <CardTitle>Configuración del cupón</CardTitle>
            <CardDescription>
              Define el beneficio, vigencia y límites de uso
            </CardDescription>
          </CardHeader>
          <DiscountCodeForm initialData={discountCode} action={handleSave} />
        </Card>
      </div>
    </div>
  );
}

