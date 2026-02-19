'use client';

// =====================================================
// Page: Admin - Identity Verifications List
// Description: Lista de todas las verificaciones (solo platform admins)
// =====================================================

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { CheckCircle2, XCircle, Clock, Eye, Search, RefreshCw, Loader2, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import type { VerificationSession } from '@/types/identity-verification';

const statusConfig: Record<string, { label: string; icon: any; color: string }> = {
  pending: { label: 'Pendiente', icon: Clock, color: 'bg-gray-100 text-gray-800' },
  started: { label: 'En Progreso', icon: Clock, color: 'bg-blue-100 text-blue-800' },
  submitted: { label: 'Enviado', icon: Clock, color: 'bg-blue-100 text-blue-800' },
  approved: { label: 'Aprobado', icon: CheckCircle2, color: 'bg-green-100 text-green-800' },
  declined: { label: 'Rechazado', icon: XCircle, color: 'bg-red-100 text-red-800' },
  expired: { label: 'Expirado', icon: XCircle, color: 'bg-orange-100 text-orange-800' },
  abandoned: { label: 'Abandonado', icon: XCircle, color: 'bg-gray-100 text-gray-800' },
  resubmission_requested: { label: 'Requiere Reenvío', icon: XCircle, color: 'bg-orange-100 text-orange-800' },
};

export default function AdminVerificationsPage() {
  const router = useRouter();
  const [verifications, setVerifications] = useState<VerificationSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [purposeFilter, setPurposeFilter] = useState<string>('all');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkRefreshing, setBulkRefreshing] = useState(false);
  
  // Nuevo estado para búsqueda por ID
  const [lookupId, setLookupId] = useState('');
  const [lookingUp, setLookingUp] = useState(false);

  const loadVerifications = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (purposeFilter !== 'all') params.set('purpose', purposeFilter);

      const response = await fetch(`/api/admin/verifications?${params}`);
      const result = await response.json();

      if (!response.ok) throw new Error(result.error);

      setVerifications(result.data || []);
    } catch (error) {
      console.error('Error cargando verificaciones:', error);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, purposeFilter]);

  useEffect(() => {
    loadVerifications();
  }, [loadVerifications]);

  const filteredVerifications = verifications.filter((v) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      v.subject_name?.toLowerCase().includes(term) ||
      v.subject_email?.toLowerCase().includes(term) ||
      v.subject_identifier?.toLowerCase().includes(term) ||
      v.provider_session_id?.toLowerCase().includes(term)
    );
  });

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(filteredVerifications.filter(v => v.provider_session_id).map(v => v.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    const newSelected = new Set(selectedIds);
    if (checked) newSelected.add(id); else newSelected.delete(id);
    setSelectedIds(newSelected);
  };

  const bulkRefreshFromVeriff = async () => {
    if (selectedIds.size === 0) return;
    setBulkRefreshing(true);
    let successCount = 0;
    let errorCount = 0;

    try {
      for (const sessionId of Array.from(selectedIds)) {
        try {
          const res = await fetch(`/api/verifications/${sessionId}/refresh`, { method: 'POST' });
          if (res.ok) successCount++; else errorCount++;
          await new Promise(resolve => setTimeout(resolve, 500));
        } catch { errorCount++; }
      }

      toast.success(`Refresh completado: ${successCount} exitosas, ${errorCount} errores`);
      await loadVerifications();
      setSelectedIds(new Set());
    } catch {
      toast.error('Error al refrescar verificaciones');
    } finally {
      setBulkRefreshing(false);
    }
  };

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lookupId.trim()) return;

    setLookingUp(true);
    try {
      const response = await fetch('/api/admin/verifications/lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ veriffSessionId: lookupId.trim() }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Error al buscar verificación');
      }

      if (result.found) {
        if (result.source === 'veriff') {
          toast.success('Verificación importada exitosamente desde Veriff');
        } else {
          toast.info('Verificación encontrada en base de datos local');
        }
        // Redirigir al detalle
        router.push(`/admin/verifications/${result.sessionId}`);
      } else {
        toast.error('No se encontró la verificación en Veriff ni en local');
      }
    } catch (error: any) {
      console.error('Error en lookup:', error);
      toast.error(error.message || 'Error al buscar verificación');
    } finally {
      setLookingUp(false);
    }
  };

  return (
    <div className="py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">Verificaciones de Identidad</h1>
          <p className="text-muted-foreground">
            Administración de todas las verificaciones de todas las organizaciones
          </p>
        </div>
        
        {/* Buscador por ID (Lookup) */}
        <Card className="w-full md:w-auto min-w-[350px]">
          <CardContent className="p-4">
            <form onSubmit={handleLookup} className="flex gap-2">
              <div className="relative flex-1">
                <Input 
                  placeholder="Pegar Veriff Session ID..." 
                  value={lookupId}
                  onChange={(e) => setLookupId(e.target.value)}
                  disabled={lookingUp}
                  className="pr-8"
                />
              </div>
              <Button type="submit" disabled={lookingUp || !lookupId.trim()}>
                {lookingUp ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
              </Button>
            </form>
            <p className="text-xs text-muted-foreground mt-2">
              Busca en BD local o importa desde Veriff automáticamente
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <label className="text-sm font-medium">Buscar</label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Nombre, email, RUT, Session ID..." value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)} className="pl-8" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Estado</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="approved">Aprobado</SelectItem>
                  <SelectItem value="declined">Rechazado</SelectItem>
                  <SelectItem value="pending">Pendiente</SelectItem>
                  <SelectItem value="started">En Progreso</SelectItem>
                  <SelectItem value="submitted">Enviado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Propósito</label>
              <Select value={purposeFilter} onValueChange={setPurposeFilter}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="fes_signing">FES - Firma Simple</SelectItem>
                  <SelectItem value="fea_signing">FEA - Firma Avanzada</SelectItem>
                  <SelectItem value="kyc_onboarding">KYC Onboarding</SelectItem>
                  <SelectItem value="document_notary">Notarial</SelectItem>
                  <SelectItem value="general">General</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex gap-2 mt-4 justify-between items-center">
            <div className="flex gap-2">
              <Button variant="outline" onClick={loadVerifications} disabled={loading}>Actualizar</Button>
              <Button variant="ghost" onClick={() => { setSearchTerm(''); setStatusFilter('all'); setPurposeFilter('all'); }}>
                Limpiar filtros
              </Button>
            </div>
            
            {selectedIds.size > 0 && (
              <Button onClick={bulkRefreshFromVeriff} disabled={bulkRefreshing} variant="outline">
                <RefreshCw className={`mr-2 h-4 w-4 ${bulkRefreshing ? 'animate-spin' : ''}`} />
                Refrescar ({selectedIds.size})
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Total</p><p className="text-2xl font-bold">{verifications.length}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Aprobadas</p><p className="text-2xl font-bold text-green-600">{verifications.filter(v => v.status === 'approved').length}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Rechazadas</p><p className="text-2xl font-bold text-red-600">{verifications.filter(v => v.status === 'declined').length}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Pendientes</p><p className="text-2xl font-bold text-blue-600">{verifications.filter(v => ['pending', 'started', 'submitted'].includes(v.status)).length}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Importadas</p><p className="text-2xl font-bold text-purple-600">{verifications.filter(v => v.metadata?.imported || v.metadata?.auto_synced).length}</p></CardContent></Card>
      </div>

      {/* Tabla */}
      <Card>
        <CardHeader>
          <CardTitle>Verificaciones ({filteredVerifications.length})</CardTitle>
          <CardDescription>Click en una fila para ver detalles completos y evidencia</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : filteredVerifications.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p className="text-lg font-medium mb-2">No hay verificaciones</p>
              <p className="text-sm">Usa el buscador superior para importar una nueva</p>
            </div>
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[40px]">
                      <input type="checkbox"
                        checked={selectedIds.size > 0 && selectedIds.size === filteredVerifications.filter(v => v.provider_session_id).length}
                        onChange={(e) => handleSelectAll(e.target.checked)} className="cursor-pointer" />
                    </TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Sujeto</TableHead>
                    <TableHead>RUT/DNI</TableHead>
                    <TableHead>Propósito</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredVerifications.map((v) => {
                    const cfg = statusConfig[v.status] || statusConfig.pending;
                    const Icon = cfg.icon;
                    return (
                      <TableRow key={v.id} className="hover:bg-muted/50">
                        <TableCell>
                          {v.provider_session_id && (
                            <input type="checkbox" checked={selectedIds.has(v.id)}
                              onChange={(e) => handleSelectOne(v.id, e.target.checked)} className="cursor-pointer" />
                          )}
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {new Date(v.created_at).toLocaleDateString()}<br />
                          <span className="text-muted-foreground">{new Date(v.created_at).toLocaleTimeString()}</span>
                        </TableCell>
                        <TableCell>
                          <p className="font-medium">{v.subject_name || '-'}</p>
                          <p className="text-xs text-muted-foreground">{v.subject_email}</p>
                        </TableCell>
                        <TableCell className="font-mono text-sm">{v.subject_identifier || '-'}</TableCell>
                        <TableCell><span className="text-xs capitalize">{v.purpose.replace('_', ' ')}</span></TableCell>
                        <TableCell>
                          <Badge variant="outline" className={cfg.color}><Icon className="mr-1 h-3 w-3" />{cfg.label}</Badge>
                          {(v.metadata?.imported || v.metadata?.auto_synced) && <Badge variant="outline" className="ml-2 bg-purple-100 text-purple-800">Auto</Badge>}
                        </TableCell>
                        <TableCell>
                          {v.risk_score !== null ? (
                            <span className={`font-bold ${v.risk_score < 30 ? 'text-green-600' : v.risk_score < 70 ? 'text-orange-600' : 'text-red-600'}`}>
                              {v.risk_score.toFixed(1)}%
                            </span>
                          ) : <span className="text-muted-foreground">-</span>}
                        </TableCell>
                        <TableCell className="text-right">
                          <Link href={`/admin/verifications/${v.id}`}>
                            <Button variant="ghost" size="sm"><Eye className="h-4 w-4" /></Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
