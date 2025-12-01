/**
 * Autenticación para el servicio invoicing
 * Soporta tanto usuarios autenticados como API Keys
 */

import { createClient } from '@/lib/supabase/server';
import { validateApiKey } from './api-keys';
import { NextRequest } from 'next/server';

export interface AuthResult {
  authenticated: boolean;
  organizationId?: string;
  userId?: string;
  authType?: 'user' | 'api_key';
  permissions?: Record<string, any>;
}

/**
 * Autentica una petición (usuario o API key)
 */
export async function authenticateRequest(request: NextRequest): Promise<AuthResult> {
  // Intentar autenticación por API Key primero
  const apiKey = request.headers.get('X-API-Key') || request.headers.get('Authorization')?.replace('Bearer ', '');
  
  if (apiKey) {
    const keyValidation = await validateApiKey(apiKey);
    if (keyValidation.valid) {
      return {
        authenticated: true,
        organizationId: keyValidation.organizationId,
        authType: 'api_key',
        permissions: keyValidation.permissions,
      };
    }
  }

  // Intentar autenticación por usuario
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { authenticated: false };
  }

  // Obtener organización activa del usuario
  const { data: activeOrg } = await supabase.rpc('get_user_active_organization', {
    user_id: user.id,
  });

  if (!activeOrg || activeOrg.length === 0) {
    return { authenticated: false };
  }

  return {
    authenticated: true,
    organizationId: activeOrg[0].organization_id,
    userId: user.id,
    authType: 'user',
  };
}

