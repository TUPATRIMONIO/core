import { createClient } from '@/lib/supabase/server';
import { transbankClient } from './client';

/**
 * Lista tarjetas OneClick guardadas de una organización
 */
export async function listOneclickCards(orgId: string) {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('payment_methods')
    .select('*')
    .eq('organization_id', orgId)
    .eq('provider', 'transbank')
    .eq('type', 'transbank_oneclick')
    .is('deleted_at', null)
    .order('is_default', { ascending: false })
    .order('created_at', { ascending: false });
  
  if (error) {
    throw new Error(`Error listing OneClick cards: ${error.message}`);
  }
  
  return data || [];
}

/**
 * Marca una tarjeta OneClick como predeterminada
 */
export async function setDefaultOneclickCard(orgId: string, cardId: string) {
  const supabase = await createClient();
  
  // Verificar que la tarjeta pertenece a la organización
  const { data: card, error: cardError } = await supabase
    .from('payment_methods')
    .select('*')
    .eq('id', cardId)
    .eq('organization_id', orgId)
    .eq('provider', 'transbank')
    .eq('type', 'transbank_oneclick')
    .is('deleted_at', null)
    .single();
  
  if (cardError || !card) {
    throw new Error('Tarjeta OneClick no encontrada');
  }
  
  // Quitar default de otras tarjetas
  await supabase
    .from('payment_methods')
    .update({ is_default: false })
    .eq('organization_id', orgId)
    .eq('provider', 'transbank')
    .eq('type', 'transbank_oneclick')
    .is('deleted_at', null);
  
  // Marcar esta tarjeta como default
  const { data: updatedCard, error: updateError } = await supabase
    .from('payment_methods')
    .update({ 
      is_default: true,
      updated_at: new Date().toISOString(),
    })
    .eq('id', cardId)
    .select()
    .single();
  
  if (updateError) {
    throw new Error(`Error marcando tarjeta como predeterminada: ${updateError.message}`);
  }
  
  return updatedCard;
}

/**
 * Elimina una tarjeta OneClick (eliminación real en Transbank + soft delete en BD)
 */
export async function deleteOneclickCard(orgId: string, cardId: string) {
  const supabase = await createClient();
  
  // Obtener información de la tarjeta
  const { data: card, error: cardError } = await supabase
    .from('payment_methods')
    .select('*')
    .eq('id', cardId)
    .eq('organization_id', orgId)
    .eq('provider', 'transbank')
    .eq('type', 'transbank_oneclick')
    .is('deleted_at', null)
    .single();
  
  if (cardError || !card) {
    throw new Error('Tarjeta OneClick no encontrada');
  }
  
  const tbkUser = card.provider_payment_method_id;
  const username = card.metadata?.username;
  
  if (!tbkUser || !username) {
    throw new Error('Información incompleta de la tarjeta');
  }
  
  // Intentar eliminar en Transbank primero
  try {
    await transbankClient.removeOneclickInscription({
      tbk_user: tbkUser,
      username: username as string,
    });
    console.log('✅ Tarjeta eliminada en Transbank:', { tbkUser, username });
  } catch (transbankError: any) {
    console.error('⚠️ Error eliminando tarjeta en Transbank:', transbankError);
    // Continuar con el soft delete en BD aunque falle en Transbank
    // Esto puede pasar si la tarjeta ya fue eliminada o hay un problema de red
  }
  
  // Hacer soft delete en BD
  const { data: deletedCard, error: deleteError } = await supabase
    .from('payment_methods')
    .update({ 
      deleted_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', cardId)
    .select()
    .single();
  
  if (deleteError) {
    throw new Error(`Error eliminando tarjeta: ${deleteError.message}`);
  }
  
  return deletedCard;
}

/**
 * Guarda una tarjeta OneClick después de completar la inscripción
 */
export async function saveOneclickCard(
  orgId: string,
  tbkUser: string,
  username: string,
  cardData: {
    authorization_code: string;
    card_type?: string;
    card_number?: string;
  },
  setAsDefault = false
) {
  const supabase = await createClient();
  
  // Verificar si ya existe una tarjeta con este tbkUser
  const { data: existingCard } = await supabase
    .from('payment_methods')
    .select('id')
    .eq('organization_id', orgId)
    .eq('provider', 'transbank')
    .eq('provider_payment_method_id', tbkUser)
    .is('deleted_at', null)
    .single();
  
  if (existingCard) {
    // Actualizar tarjeta existente
    const { data: updatedCard, error: updateError } = await supabase
      .from('payment_methods')
      .update({
        last4: cardData.card_number || null,
        brand: cardData.card_type || null,
        metadata: {
          username,
          authorization_code: cardData.authorization_code,
          card_type: cardData.card_type,
          card_number: cardData.card_number,
        },
        updated_at: new Date().toISOString(),
      })
      .eq('id', existingCard.id)
      .select()
      .single();
    
    if (updateError) {
      throw new Error(`Error actualizando tarjeta: ${updateError.message}`);
    }
    
    return updatedCard;
  }
  
  // Verificar si hay otras tarjetas para determinar si debe ser default
  const { data: existingMethods } = await supabase
    .from('payment_methods')
    .select('is_default')
    .eq('organization_id', orgId)
    .eq('provider', 'transbank')
    .eq('type', 'transbank_oneclick')
    .is('deleted_at', null);
  
  const shouldBeDefault = setAsDefault || (existingMethods?.length === 0);
  
  // Si debe ser default, quitar default de otras tarjetas
  if (shouldBeDefault && existingMethods && existingMethods.length > 0) {
    await supabase
      .from('payment_methods')
      .update({ is_default: false })
      .eq('organization_id', orgId)
      .eq('provider', 'transbank')
      .eq('type', 'transbank_oneclick')
      .is('deleted_at', null);
  }
  
  // Crear nueva tarjeta
  const { data: newCard, error: insertError } = await supabase
    .from('payment_methods')
    .insert({
      organization_id: orgId,
      type: 'transbank_oneclick',
      provider: 'transbank',
      provider_payment_method_id: tbkUser,
      is_default: shouldBeDefault,
      last4: cardData.card_number || null,
      brand: cardData.card_type || null,
      metadata: {
        username,
        authorization_code: cardData.authorization_code,
        card_type: cardData.card_type,
        card_number: cardData.card_number,
      },
    })
    .select()
    .single();
  
  if (insertError) {
    throw new Error(`Error guardando tarjeta: ${insertError.message}`);
  }
  
  return newCard;
}

