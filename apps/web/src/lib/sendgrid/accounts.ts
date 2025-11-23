/**
 * Gestión de Cuentas SendGrid por Organización
 * 
 * Funciones para crear, actualizar y obtener cuentas SendGrid
 * con encriptación de API keys
 */

import { createServiceRoleClient } from '@/lib/supabase/server';
import { encryptToJson, decryptFromJson } from '@/lib/crypto';
import type { SendGridAccount, SendGridAccountInput } from './types';
import sgMail from '@sendgrid/mail';

/**
 * Obtiene la cuenta SendGrid activa de una organización
 * 
 * @param organizationId - ID de la organización
 * @returns Cuenta SendGrid con API key desencriptada o null
 */
export async function getSendGridAccount(
  organizationId: string
): Promise<SendGridAccount | null> {
  const supabase = createServiceRoleClient();

  const { data, error } = await supabase
    .from('sendgrid_accounts')
    .select('*')
    .eq('organization_id', organizationId)
    .eq('is_active', true)
    .single();

  if (error || !data) {
    return null;
  }

  // Desencriptar API key
  try {
    const decryptedApiKey = decryptFromJson(data.api_key);
    return {
      ...data,
      api_key: decryptedApiKey,
    };
  } catch (error) {
    console.error('Error al desencriptar API key de SendGrid:', error);
    return null;
  }
}

/**
 * Verifica una API key de SendGrid haciendo una llamada de prueba
 * 
 * @param apiKey - API key de SendGrid (texto plano)
 * @returns true si la API key es válida, false en caso contrario
 */
export async function verifySendGridApiKey(apiKey: string): Promise<boolean> {
  try {
    // Configurar API key temporalmente
    sgMail.setApiKey(apiKey);

    // Hacer una llamada de prueba a la API de SendGrid
    // Usamos la API de validación de email o simplemente verificamos la conexión
    const response = await fetch('https://api.sendgrid.com/v3/user/profile', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    return response.ok;
  } catch (error) {
    console.error('Error al verificar API key de SendGrid:', error);
    return false;
  }
}

/**
 * Crea o actualiza una cuenta SendGrid para una organización
 * 
 * @param organizationId - ID de la organización
 * @param input - Datos de la cuenta SendGrid
 * @param userId - ID del usuario que crea/actualiza
 * @returns Cuenta SendGrid creada/actualizada
 */
export async function upsertSendGridAccount(
  organizationId: string,
  input: SendGridAccountInput,
  userId: string
): Promise<{ success: boolean; data?: SendGridAccount; error?: string }> {
  // Verificar API key antes de guardar
  const isValid = await verifySendGridApiKey(input.api_key);
  if (!isValid) {
    return {
      success: false,
      error: 'La API key de SendGrid no es válida. Por favor, verifica que sea correcta.',
    };
  }

  const supabase = createServiceRoleClient();

  // Encriptar API key antes de guardar
  const encryptedApiKey = encryptToJson(input.api_key);

  // Verificar si ya existe una cuenta para esta organización
  const { data: existing } = await supabase
    .from('sendgrid_accounts')
    .select('id')
    .eq('organization_id', organizationId)
    .single();

  if (existing) {
    // Actualizar cuenta existente
    const { data, error } = await supabase
      .from('sendgrid_accounts')
      .update({
        api_key: encryptedApiKey,
        from_email: input.from_email,
        from_name: input.from_name,
        verified_at: new Date().toISOString(),
        last_verified_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing.id)
      .select()
      .single();

    if (error) {
      return {
        success: false,
        error: error.message || 'Error al actualizar cuenta SendGrid',
      };
    }

    // Desencriptar API key para retornar
    const decryptedApiKey = decryptFromJson(data.api_key);
    return {
      success: true,
      data: {
        ...data,
        api_key: decryptedApiKey,
      },
    };
  } else {
    // Crear nueva cuenta
    const { data, error } = await supabase
      .from('sendgrid_accounts')
      .insert({
        organization_id: organizationId,
        api_key: encryptedApiKey,
        from_email: input.from_email,
        from_name: input.from_name,
        is_active: true,
        verified_at: new Date().toISOString(),
        last_verified_at: new Date().toISOString(),
        created_by: userId,
      })
      .select()
      .single();

    if (error) {
      return {
        success: false,
        error: error.message || 'Error al crear cuenta SendGrid',
      };
    }

    // Desencriptar API key para retornar
    const decryptedApiKey = decryptFromJson(data.api_key);
    return {
      success: true,
      data: {
        ...data,
        api_key: decryptedApiKey,
      },
    };
  }
}

/**
 * Verifica si una organización tiene cuenta SendGrid configurada
 * 
 * @param organizationId - ID de la organización
 * @returns true si tiene cuenta configurada y activa
 */
export async function hasSendGridAccount(organizationId: string): Promise<boolean> {
  const account = await getSendGridAccount(organizationId);
  return account !== null;
}

