/**
 * Utilidades para manejo de API Keys
 */

import crypto from 'crypto';
import { createServiceRoleClient } from '@/lib/supabase/server';

/**
 * Genera una nueva API Key
 */
export function generateApiKey(): string {
  // Generar key aleatoria de 32 bytes (64 caracteres hex)
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Genera hash SHA-256 de una API Key
 */
export function hashApiKey(key: string): string {
  return crypto.createHash('sha256').update(key).digest('hex');
}

/**
 * Valida una API Key y retorna información de la organización
 */
export async function validateApiKey(key: string): Promise<{
  valid: boolean;
  organizationId?: string;
  permissions?: Record<string, any>;
  rateLimit?: number;
}> {
  const supabase = createServiceRoleClient();
  const keyHash = hashApiKey(key);

  const { data, error } = await supabase.rpc('validate_api_key', {
    p_key_hash: keyHash,
  });

  if (error || !data || data.length === 0 || !data[0].is_valid) {
    return { valid: false };
  }

  const result = data[0];
  return {
    valid: true,
    organizationId: result.organization_id,
    permissions: result.permissions,
    rateLimit: result.rate_limit_per_minute,
  };
}

/**
 * Crea una nueva API Key para una organización
 */
export async function createApiKey(
  organizationId: string,
  name: string,
  permissions?: Record<string, any>,
  expiresAt?: Date
): Promise<{ key: string; id: string }> {
  const supabase = createServiceRoleClient();
  const key = generateApiKey();
  const keyHash = hashApiKey(key);

  const { data, error } = await supabase
    .from('api_keys')
    .insert({
      organization_id: organizationId,
      key_hash: keyHash,
      name,
      permissions: permissions || {
        documents: ['create', 'read'],
        customers: ['create', 'read'],
      },
      expires_at: expiresAt?.toISOString() || null,
    })
    .select('id')
    .single();

  if (error || !data) {
    throw new Error(`Error creando API key: ${error?.message || 'Unknown error'}`);
  }

  return { key, id: data.id };
}

