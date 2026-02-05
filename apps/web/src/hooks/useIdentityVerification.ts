// =====================================================
// Hook: useIdentityVerification
// Description: Hook para gestionar verificaciones de identidad con Veriff
// =====================================================

import { useState, useCallback } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type {
  CreateVerificationSessionParams,
  CreateVerificationResponse,
  VerificationSessionFull,
  PreviousVerification,
} from '@/types/identity-verification';

export function useIdentityVerification() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClientComponentClient();

  /**
   * Crear una nueva sesión de verificación
   */
  const createSession = useCallback(
    async (
      params: CreateVerificationSessionParams
    ): Promise<CreateVerificationResponse | null> => {
      setLoading(true);
      setError(null);

      try {
        const { data, error: invokeError } = await supabase.functions.invoke(
          'identity-verification/create',
          {
            body: params,
          }
        );

        if (invokeError) throw invokeError;

        return data;
      } catch (err: any) {
        console.error('Error creando sesión de verificación:', err);
        setError(err.message || 'Error al crear sesión de verificación');
        return null;
      } finally {
        setLoading(false);
      }
    },
    [supabase]
  );

  /**
   * Obtener sesión completa con todos los datos
   */
  const getSessionFull = useCallback(
    async (sessionId: string): Promise<VerificationSessionFull | null> => {
      setLoading(true);
      setError(null);

      try {
        const { data, error: rpcError } = await supabase.rpc(
          'identity_verifications.get_verification_session_full',
          { p_session_id: sessionId }
        );

        if (rpcError) throw rpcError;

        return data;
      } catch (err: any) {
        console.error('Error obteniendo sesión:', err);
        setError(err.message || 'Error al obtener sesión');
        return null;
      } finally {
        setLoading(false);
      }
    },
    [supabase]
  );

  /**
   * Verificar si una sesión es válida (aprobada y no expirada)
   */
  const isSessionValid = useCallback(
    async (sessionId: string): Promise<boolean> => {
      try {
        const { data, error: rpcError } = await supabase.rpc(
          'identity_verifications.is_verification_valid',
          { p_session_id: sessionId }
        );

        if (rpcError) throw rpcError;

        return data || false;
      } catch (err: any) {
        console.error('Error verificando sesión:', err);
        return false;
      }
    },
    [supabase]
  );

  /**
   * Buscar verificaciones previas de un sujeto
   */
  const findPreviousVerifications = useCallback(
    async (
      organizationId: string,
      subjectIdentifier?: string,
      subjectEmail?: string,
      onlyApproved: boolean = true
    ): Promise<PreviousVerification[]> => {
      setLoading(true);
      setError(null);

      try {
        const { data, error: rpcError } = await supabase.rpc(
          'identity_verifications.find_previous_verifications',
          {
            p_organization_id: organizationId,
            p_subject_identifier: subjectIdentifier || null,
            p_subject_email: subjectEmail || null,
            p_only_approved: onlyApproved,
            p_limit: 10,
          }
        );

        if (rpcError) throw rpcError;

        return data || [];
      } catch (err: any) {
        console.error('Error buscando verificaciones previas:', err);
        setError(err.message || 'Error al buscar verificaciones');
        return [];
      } finally {
        setLoading(false);
      }
    },
    [supabase]
  );

  /**
   * Obtener estadísticas de verificaciones
   */
  const getStats = useCallback(
    async (
      organizationId: string,
      startDate?: Date,
      endDate?: Date
    ): Promise<any> => {
      setLoading(true);
      setError(null);

      try {
        const { data, error: rpcError } = await supabase.rpc(
          'identity_verifications.get_verification_stats',
          {
            p_organization_id: organizationId,
            p_start_date: startDate?.toISOString() || null,
            p_end_date: endDate?.toISOString() || null,
          }
        );

        if (rpcError) throw rpcError;

        return data;
      } catch (err: any) {
        console.error('Error obteniendo estadísticas:', err);
        setError(err.message || 'Error al obtener estadísticas');
        return null;
      } finally {
        setLoading(false);
      }
    },
    [supabase]
  );

  return {
    loading,
    error,
    createSession,
    getSessionFull,
    isSessionValid,
    findPreviousVerifications,
    getStats,
  };
}
