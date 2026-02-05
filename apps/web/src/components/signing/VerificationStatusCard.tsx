'use client';

// =====================================================
// Component: VerificationStatusCard
// Description: Card que muestra el estado de una verificación de identidad
// =====================================================

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import { useIdentityVerification } from '@/hooks/useIdentityVerification';
import type { VerificationSessionStatus } from '@/types/identity-verification';

interface VerificationStatusCardProps {
  sessionId: string;
  autoRefresh?: boolean;
  refreshInterval?: number; // milliseconds
  onStatusChange?: (status: VerificationSessionStatus) => void;
}

const statusConfig: Record<
  VerificationSessionStatus,
  {
    label: string;
    variant: 'default' | 'secondary' | 'destructive' | 'outline';
    icon: any;
    color: string;
  }
> = {
  pending: {
    label: 'Pendiente',
    variant: 'secondary',
    icon: Clock,
    color: 'text-gray-500',
  },
  started: {
    label: 'En Progreso',
    variant: 'default',
    icon: RefreshCw,
    color: 'text-blue-500',
  },
  submitted: {
    label: 'Enviado',
    variant: 'default',
    icon: Clock,
    color: 'text-blue-500',
  },
  approved: {
    label: 'Aprobado',
    variant: 'default',
    icon: CheckCircle2,
    color: 'text-green-500',
  },
  declined: {
    label: 'Rechazado',
    variant: 'destructive',
    icon: XCircle,
    color: 'text-red-500',
  },
  expired: {
    label: 'Expirado',
    variant: 'secondary',
    icon: AlertTriangle,
    color: 'text-orange-500',
  },
  abandoned: {
    label: 'Abandonado',
    variant: 'outline',
    icon: XCircle,
    color: 'text-gray-500',
  },
  resubmission_requested: {
    label: 'Requiere Reenvío',
    variant: 'destructive',
    icon: AlertTriangle,
    color: 'text-orange-500',
  },
};

export function VerificationStatusCard({
  sessionId,
  autoRefresh = false,
  refreshInterval = 5000,
  onStatusChange,
}: VerificationStatusCardProps) {
  const { getSessionFull, loading } = useIdentityVerification();
  const [session, setSession] = useState<any>(null);
  const [lastChecked, setLastChecked] = useState<Date>(new Date());

  const fetchSession = async () => {
    const data = await getSessionFull(sessionId);
    if (data) {
      setSession(data.session);
      setLastChecked(new Date());

      if (onStatusChange && data.session.status !== session?.status) {
        onStatusChange(data.session.status);
      }
    }
  };

  useEffect(() => {
    fetchSession();
  }, [sessionId]);

  // Auto-refresh mientras está en progreso
  useEffect(() => {
    if (!autoRefresh || !session) return;

    const isInProgress = ['pending', 'started', 'submitted'].includes(session.status);

    if (isInProgress) {
      const interval = setInterval(fetchSession, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, session?.status, refreshInterval]);

  if (!session) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center text-muted-foreground">
            <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
            Cargando verificación...
          </div>
        </CardContent>
      </Card>
    );
  }

  const config = statusConfig[session.status as VerificationSessionStatus];
  const Icon = config.icon;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">Verificación de Identidad</CardTitle>
            <CardDescription>
              {session.subject_name || session.subject_email}
            </CardDescription>
          </div>
          <Badge variant={config.variant}>
            <Icon className={`mr-1 h-3 w-3 ${config.color}`} />
            {config.label}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Información del sujeto */}
        <div className="grid gap-2 text-sm">
          {session.subject_identifier && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">RUT/DNI:</span>
              <span className="font-medium">{session.subject_identifier}</span>
            </div>
          )}
          {session.subject_email && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Email:</span>
              <span className="font-medium">{session.subject_email}</span>
            </div>
          )}
          {session.subject_phone && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Teléfono:</span>
              <span className="font-medium">{session.subject_phone}</span>
            </div>
          )}
        </div>

        {/* Fechas importantes */}
        <div className="space-y-1 text-sm">
          <div className="flex justify-between text-muted-foreground">
            <span>Creado:</span>
            <span>{new Date(session.created_at).toLocaleString()}</span>
          </div>

          {session.verified_at && (
            <div className="flex justify-between text-green-600">
              <span>Verificado:</span>
              <span>{new Date(session.verified_at).toLocaleString()}</span>
            </div>
          )}

          {session.expires_at && (
            <div className="flex justify-between text-muted-foreground">
              <span>Expira:</span>
              <span>{new Date(session.expires_at).toLocaleString()}</span>
            </div>
          )}

          {autoRefresh && (
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Última actualización:</span>
              <span>{lastChecked.toLocaleTimeString()}</span>
            </div>
          )}
        </div>

        {/* Risk Score */}
        {session.risk_score !== null && (
          <div className="rounded-md bg-muted p-3">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">Score de Riesgo:</span>
              <span
                className={`font-bold ${
                  session.risk_score < 30
                    ? 'text-green-600'
                    : session.risk_score < 70
                      ? 'text-orange-600'
                      : 'text-red-600'
                }`}
              >
                {session.risk_score.toFixed(1)}%
              </span>
            </div>
          </div>
        )}

        {/* Razón de decisión */}
        {session.decision_reason && (
          <div className="rounded-md border p-3">
            <p className="text-sm font-medium mb-1">Razón:</p>
            <p className="text-sm text-muted-foreground">{session.decision_reason}</p>
          </div>
        )}

        {/* Botones de acción */}
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchSession} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>

          {session.verification_url && session.status !== 'approved' && (
            <Button
              variant="default"
              size="sm"
              onClick={() => window.open(session.verification_url, '_blank')}
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              Ir a Verificación
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
