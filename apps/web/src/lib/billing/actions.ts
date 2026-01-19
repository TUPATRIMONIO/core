'use server';

import { createClient } from '@/lib/supabase/server';
import { createSetupIntent } from '@/lib/stripe/payment-methods';
import { attachPaymentMethod } from '@/lib/stripe/payment-methods';
import { purchasePackage } from '@/lib/credits/packages';
import { getBalance, getCreditAccount } from '@/lib/credits/core';
import { getAvailablePackages } from '@/lib/credits/packages';
import { getCurrencyForCountry, getLocalizedProductPrice } from '@/lib/pricing/countries';

/**
 * Helper: Obtiene o crea organización para el usuario
 */
async function getOrCreateOrganization(userId: string, userEmail: string) {
  const supabase = await createClient();
  
  // Intentar obtener la organización activa del usuario usando la función RPC
  const { data: activeOrg } = await supabase.rpc('get_user_active_organization', {
    user_id: userId
  });
  
  if (activeOrg && activeOrg.length > 0) {
    return activeOrg[0].organization_id;
  }
  
  // Si no tiene organización, intentar crearla
  const { data: orgId, error: createError } = await supabase.rpc('create_personal_organization', {
    user_id: userId,
    user_email: userEmail,
    user_first_name: null
  });
  
  // Si hay error al crear, verificar si ya existe usando la función RPC
  if (createError) {
    const { data: retryActiveOrg } = await supabase.rpc('get_user_active_organization', {
      user_id: userId
    });
    
    if (retryActiveOrg && retryActiveOrg.length > 0) {
      return retryActiveOrg[0].organization_id;
    }
    
    // Si aún no hay organización, lanzar el error original
    throw new Error(`No organization found and failed to create: ${createError.message || 'Unknown error'}`);
  }
  
  if (!orgId) {
    throw new Error('Failed to create organization: No ID returned');
  }
  
  return orgId;
}

/**
 * Crea un SetupIntent para guardar método de pago
 */
export async function createSetupIntentAction() {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('Unauthorized');
  }
  
  const { data: orgUser } = await supabase
    .from('organization_users')
    .select('organization_id')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .single();
  
  if (!orgUser) {
    throw new Error('No organization found');
  }
  
  const setupIntent = await createSetupIntent(orgUser.organization_id);
  
  return {
    client_secret: setupIntent.client_secret,
    setup_intent_id: setupIntent.id,
  };
}

/**
 * Guarda un método de pago después de completar SetupIntent
 */
export async function savePaymentMethodAction(
  paymentMethodId: string,
  setAsDefault = false
) {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('Unauthorized');
  }
  
  const { data: orgUser } = await supabase
    .from('organization_users')
    .select('organization_id')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .single();
  
  if (!orgUser) {
    throw new Error('No organization found');
  }
  
  const method = await attachPaymentMethod(
    orgUser.organization_id,
    paymentMethodId,
    setAsDefault
  );
  
  return method;
}

/**
 * Compra un paquete de créditos
 */
export async function purchaseCreditsAction(
  packageId: string,
  paymentMethodId: string
) {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('Unauthorized');
  }
  
  const { data: orgUser } = await supabase
    .from('organization_users')
    .select('organization_id')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .single();
  
  if (!orgUser) {
    throw new Error('No organization found');
  }
  
  const result = await purchasePackage(
    orgUser.organization_id,
    packageId,
    paymentMethodId
  );
  
  return result;
}

/**
 * Actualiza configuración de auto-recarga
 */
export async function updateAutoRechargeSettingsAction(
  enabled: boolean,
  threshold?: number,
  amount?: number,
  paymentMethodId?: string
) {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('Unauthorized');
  }
  
  const { data: orgUser } = await supabase
    .from('organization_users')
    .select('organization_id')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .single();
  
  if (!orgUser) {
    throw new Error('No organization found');
  }
  
  const updates: any = {
    auto_recharge_enabled: enabled,
    updated_at: new Date().toISOString(),
  };
  
  if (threshold !== undefined) {
    updates.auto_recharge_threshold = threshold;
  }
  
  if (amount !== undefined) {
    updates.auto_recharge_amount = amount;
  }
  
  if (paymentMethodId !== undefined) {
    updates.auto_recharge_payment_method_id = paymentMethodId;
  }
  
  const { data, error } = await supabase
    .from('credit_accounts')
    .update(updates)
    .eq('organization_id', orgUser.organization_id)
    .select()
    .single();
  
  if (error) {
    throw new Error(`Error updating auto-recharge settings: ${error.message}`);
  }
  
  return data;
}

/**
 * Actualiza el país de la organización del usuario
 */
export async function updateOrganizationCountryAction(countryCode: string) {
  const authSupabase = await createClient();
  
  const { data: { user } } = await authSupabase.auth.getUser();
  if (!user) {
    throw new Error('Unauthorized');
  }
  
  // Usar service role client para todas las operaciones (bypass RLS)
  const { createServiceRoleClient } = await import('@/lib/supabase/server');
  const supabase = createServiceRoleClient();
  
  // Obtener organización activa del usuario usando la función RPC
  const { data: activeOrgData, error: activeOrgError } = await supabase.rpc('get_user_active_organization', {
    user_id: user.id
  });
  
  if (activeOrgError || !activeOrgData || activeOrgData.length === 0) {
    console.error('[updateOrganizationCountryAction] Error obteniendo org activa:', activeOrgError);
    throw new Error('No active organization found');
  }
  
  const organizationId = activeOrgData[0].organization_id;
  
  // Validar código de país (ISO 3166-1 alpha-2)
  const validCountryCodes = ['US', 'CL', 'AR', 'CO', 'MX', 'PE', 'BR'];
  if (!validCountryCodes.includes(countryCode.toUpperCase())) {
    throw new Error('Código de país no válido');
  }
  
  // Actualizar país de la organización
  const { error } = await supabase
    .from('organizations')
    .update({
      country: countryCode.toUpperCase(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', organizationId);
  
  if (error) {
    console.error('[updateOrganizationCountryAction] Error actualizando país:', error);
    throw new Error(`Error actualizando país: ${error.message}`);
  }

  // Actualizar órdenes pendientes con nueva moneda/monto
  const normalizedCountry = countryCode.toUpperCase();
  const currency = await getCurrencyForCountry(normalizedCountry);
  const { data: pendingOrders } = await supabase
    .from('orders')
    .select('id, product_type, product_id, product_data, metadata, discount_code_id, amount, currency, status')
    .eq('organization_id', organizationId)
    .eq('status', 'pending_payment');

  if (Array.isArray(pendingOrders) && pendingOrders.length > 0) {
    for (const order of pendingOrders) {
      try {
        const productData = (order.product_data as Record<string, any>) || {};
        const metadata = (order.metadata as Record<string, any>) || {};
        let baseAmount: number | null = null;
        let nextProductData = productData;
        let nextMetadata = metadata;

        if (order.product_type === 'credits') {
          const packageId = order.product_id || productData.package_id || metadata.package_id;
          if (packageId) {
            const packages = await getAvailablePackages(normalizedCountry);
            const selectedPackage = packages.find((pkg: any) => pkg.id === packageId);
            if (selectedPackage) {
              baseAmount = getLocalizedProductPrice(selectedPackage, normalizedCountry);
              nextProductData = {
                ...productData,
                package_id: selectedPackage.id,
                credits_amount: selectedPackage.credits_amount,
                localized_price: baseAmount,
                currency,
              };
              nextMetadata = {
                ...metadata,
                package_id: selectedPackage.id,
                package_name: selectedPackage.name,
                credits_amount: selectedPackage.credits_amount,
                subtotal: baseAmount,
                currency,
              };
            }
          }
        } else if (order.product_type === 'electronic_signature') {
          const signersCount = Number(productData.signers_count || metadata.signers_count || 1);
          const signatureProduct = productData.signature_product || metadata.signature_product;
          const notaryProduct = productData.notary_product || metadata.notary_product;

          let signatureUnitPrice = 0;
          if (signatureProduct?.slug) {
            const { data: priceData } = await supabase.rpc('get_product_price', {
              product_slug_param: signatureProduct.slug,
              country_code_param: normalizedCountry,
            });
            signatureUnitPrice = Number(priceData || 0);
          } else if (signatureProduct?.unit_price) {
            signatureUnitPrice = Number(signatureProduct.unit_price || 0);
          }

          const signatureQuantity =
            signatureProduct?.billing_unit === 'per_signer' ? signersCount : 1;
          const signatureSubtotal = signatureUnitPrice * signatureQuantity;

          let notarySubtotal = 0;
          if (notaryProduct?.slug) {
            const { data: priceData } = await supabase.rpc('get_product_price', {
              product_slug_param: notaryProduct.slug,
              country_code_param: normalizedCountry,
            });
            notarySubtotal = Number(priceData || 0);
          } else if (notaryProduct?.unit_price) {
            notarySubtotal = Number(notaryProduct.unit_price || 0);
          }

          baseAmount = signatureSubtotal + notarySubtotal;
          nextProductData = {
            ...productData,
            signers_count: signersCount,
            signature_product: signatureProduct
              ? {
                  ...signatureProduct,
                  unit_price: signatureUnitPrice,
                  quantity: signatureQuantity,
                  subtotal: signatureSubtotal,
                }
              : signatureProduct,
            notary_product: notaryProduct
              ? {
                  ...notaryProduct,
                  unit_price: notarySubtotal,
                  quantity: notaryProduct ? 1 : 0,
                  subtotal: notarySubtotal,
                }
              : notaryProduct,
            total: baseAmount,
            currency,
          };
          nextMetadata = {
            ...metadata,
            signers_count: signersCount,
            total: baseAmount,
            currency,
          };
        } else if (order.product_type === 'notary_service' && order.product_id) {
          const { data: priceData } = await supabase.rpc('get_product_price', {
            product_slug_param: order.product_id,
            country_code_param: normalizedCountry,
          });
          baseAmount = Number(priceData || 0);
          nextProductData = {
            ...productData,
            localized_price: baseAmount,
            currency,
          };
          nextMetadata = {
            ...metadata,
            total: baseAmount,
            currency,
          };
        }

        if (baseAmount === null) {
          continue;
        }

        // Actualizar monto base y moneda
        const { error: baseUpdateError } = await supabase
          .from('orders')
          .update({
            amount: baseAmount,
            original_amount: baseAmount,
            discount_amount: 0,
            currency,
            product_data: nextProductData,
            metadata: nextMetadata,
          })
          .eq('id', order.id);

        if (baseUpdateError) {
          console.error('[updateOrganizationCountryAction] Error actualizando orden base:', baseUpdateError);
          continue;
        }

        // Re-aplicar descuento si existe
        if (order.discount_code_id) {
          const { data: discountCode } = await supabase
            .from('discount_codes')
            .select('code')
            .eq('id', order.discount_code_id)
            .single();

          if (discountCode?.code) {
            const { data: validationData } = await supabase.rpc('validate_discount_code', {
              p_code: discountCode.code,
              p_order_id: order.id,
            });

            if (validationData?.success) {
              const discountMetadata = {
                ...nextMetadata,
                discount_code: {
                  code: validationData.code,
                  type: validationData.type,
                  value: validationData.value,
                },
              };

              await supabase
                .from('orders')
                .update({
                  discount_amount: validationData.discount_amount,
                  amount: validationData.final_amount,
                  metadata: discountMetadata,
                })
                .eq('id', order.id);
            } else {
              await supabase
                .from('orders')
                .update({
                  discount_code_id: null,
                  discount_amount: 0,
                  amount: baseAmount,
                  metadata: {
                    ...nextMetadata,
                    discount_code: null,
                  },
                })
                .eq('id', order.id);
            }
          }
        }
      } catch (orderError: any) {
        console.error('[updateOrganizationCountryAction] Error actualizando orden pendiente:', orderError);
      }
    }
  }
  
  // Revalidar la página de configuración de facturación para que se actualice
  const { revalidatePath } = await import('next/cache');
  revalidatePath('/billing/settings');
  
  return { success: true };
}

/**
 * Obtiene resumen de facturación
 */
export async function getBillingOverviewAction() {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('Unauthorized');
  }
  
  // Obtener o crear organización
  const organizationId = await getOrCreateOrganization(user.id, user.email || 'test@tupatrimonio.com');
  
  // Obtener cuenta de créditos
  const account = await getCreditAccount(organizationId);
  const balance = await getBalance(organizationId);
  
  // Obtener suscripción
  const { data: subscription } = await supabase
    .from('organization_subscriptions')
    .select(`
      *,
      subscription_plans (*)
    `)
    .eq('organization_id', organizationId)
    .single();
  
  // Obtener métodos de pago
  const { data: paymentMethods } = await supabase
    .from('payment_methods')
    .select('*')
    .eq('organization_id', organizationId)
    .is('deleted_at', null)
    .order('is_default', { ascending: false });
  
  // Obtener órdenes recientes (las facturas tributarias están en invoicing.documents)
  const { data: orders } = await supabase
    .from('orders')
    .select('*')
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false })
    .limit(5);
  
  // Obtener facturas recientes desde invoicing.documents
  const { data: invoices } = await supabase
    .from('invoicing_documents')
    .select('*')
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false })
    .limit(5);
  
  return {
    account,
    balance,
    subscription,
    paymentMethods: paymentMethods || [],
    recentOrders: orders || [],
    recentInvoices: invoices || [],
  };
}

