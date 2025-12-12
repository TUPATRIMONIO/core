import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createOrder, ProductType } from '@/lib/checkout/core';
import { getAvailablePackages } from '@/lib/credits/packages';
import { getCurrencyForCountry, getLocalizedPrice } from '@/lib/stripe/checkout';

/**
 * POST /api/checkout/create
 * Crea una nueva orden desde cualquier producto/servicio
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Verificar autenticación
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }
    
    // Obtener organización del usuario
    const { data: activeOrg } = await supabase.rpc('get_user_active_organization', {
      user_id: user.id
    });
    
    if (!activeOrg || activeOrg.length === 0) {
      return NextResponse.json(
        { error: 'No se encontró organización activa' },
        { status: 400 }
      );
    }
    
    const orgId = activeOrg[0].organization_id;
    
    // Obtener país de la organización
    const { data: org } = await supabase
      .from('organizations')
      .select('country')
      .eq('id', orgId)
      .single();
    
    if (!org) {
      return NextResponse.json(
        { error: 'Organización no encontrada' },
        { status: 400 }
      );
    }
    
    const countryCode = org.country || 'US';
    const currency = getCurrencyForCountry(countryCode);
    
    // Parsear body
    const body = await request.json();
    const { productType, productId, metadata } = body;
    
    if (!productType) {
      return NextResponse.json(
        { error: 'productType es requerido' },
        { status: 400 }
      );
    }
    
    // Validar productType
    const validProductTypes: ProductType[] = [
      'credits',
      'electronic_signature',
      'electronic_signature_resend',
      'notary_service',
      'company_modification',
      'advisory',
      'subscription',
    ];
    
    if (!validProductTypes.includes(productType as ProductType)) {
      return NextResponse.json(
        { error: `productType inválido. Debe ser uno de: ${validProductTypes.join(', ')}` },
        { status: 400 }
      );
    }
    
    // Obtener datos del producto según el tipo
    let productData: Record<string, any> = {};
    let amount = 0;
    
    if (productType === 'credits') {
      if (!productId) {
        return NextResponse.json(
          { error: 'productId es requerido para compra de créditos' },
          { status: 400 }
        );
      }
      
      // Obtener paquete de créditos
      const packages = await getAvailablePackages(countryCode);
      const selectedPackage = packages.find((pkg: any) => pkg.id === productId);
      
      if (!selectedPackage) {
        return NextResponse.json(
          { error: 'Paquete de créditos no encontrado' },
          { status: 404 }
        );
      }
      
      amount = getLocalizedPrice(selectedPackage, countryCode);
      productData = {
        package_id: selectedPackage.id,
        name: selectedPackage.name,
        description: selectedPackage.description,
        credits_amount: selectedPackage.credits_amount,
        price_usd: selectedPackage.price_usd,
        localized_price: amount,
        currency,
      };
    } else {
      // Para otros tipos de productos, se espera que vengan en metadata
      // Permitimos amount=0 para servicios gratuitos
      if (metadata?.amount === undefined || metadata?.amount === null) {
        return NextResponse.json(
          { error: 'amount es requerido en metadata para este tipo de producto' },
          { status: 400 }
        );
      }
      
      amount = metadata.amount;
      productData = {
        ...metadata,
        product_id: productId,
      };
    }
    
    // Crear orden
    const order = await createOrder({
      orgId,
      productType: productType as ProductType,
      productId: productId || undefined,
      productData,
      amount,
      currency,
      metadata: metadata || {},
      expiresInHours: 24, // 24 horas por defecto
    });
    
    // Construir URL de checkout
    const checkoutUrl = `/checkout/${order.id}`;
    
    return NextResponse.json({
      orderId: order.id,
      orderNumber: order.order_number,
      checkoutUrl,
      status: order.status,
      amount: order.amount,
      currency: order.currency,
      expiresAt: order.expires_at,
    });
  } catch (error: any) {
    console.error('Error creando orden:', error);
    return NextResponse.json(
      { error: error.message || 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

