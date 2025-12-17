'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  CheckCircle2,
  AlertCircle,
  Loader2,
  Mail,
  Plus,
  Pencil,
  Trash2,
  Star,
} from 'lucide-react';

interface SendGridAccount {
  id: string;
  from_email: string;
  from_name: string;
  is_active: boolean;
  verified_at: string | null;
  has_api_key: boolean;
}

interface SenderIdentity {
  id: string;
  purpose: 'transactional' | 'marketing';
  from_email: string;
  from_name: string;
  reply_to_email: string | null;
  is_default: boolean;
  is_active: boolean;
  created_at: string;
}

const PURPOSE_LABELS = {
  transactional: 'Transaccional',
  marketing: 'Marketing',
};

const PURPOSE_DESCRIPTIONS = {
  transactional: 'Notificaciones, pedidos, alertas del sistema',
  marketing: 'Campañas, newsletters, promociones',
};

export default function SendGridSettingsPage() {
  const [account, setAccount] = useState<SendGridAccount | null>(null);
  const [senders, setSenders] = useState<SenderIdentity[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Account form
  const [accountFormData, setAccountFormData] = useState({
    api_key: '',
    from_email: '',
    from_name: '',
  });

  // Sender form
  const [senderDialogOpen, setSenderDialogOpen] = useState(false);
  const [editingSender, setEditingSender] = useState<SenderIdentity | null>(null);
  const [senderFormData, setSenderFormData] = useState({
    purpose: 'marketing' as 'transactional' | 'marketing',
    from_email: '',
    from_name: '',
    reply_to_email: '',
    is_default: false,
  });
  const [savingSender, setSavingSender] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [accountRes, sendersRes] = await Promise.all([
        fetch('/api/communications/sendgrid/account'),
        fetch('/api/communications/sendgrid/senders'),
      ]);

      const accountData = await accountRes.json();
      const sendersData = await sendersRes.json();

      if (accountData.data) {
        setAccount(accountData.data);
        setAccountFormData({
          api_key: '',
          from_email: accountData.data.from_email || '',
          from_name: accountData.data.from_name || '',
        });
      }

      if (sendersData.data) {
        setSenders(sendersData.data);
      }
    } catch (err: any) {
      setError('Error al cargar configuración');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!accountFormData.api_key) {
      setError('Ingresa una API key para verificar');
      return;
    }

    setVerifying(true);
    setError(null);

    try {
      const response = await fetch('/api/communications/sendgrid/account/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ api_key: accountFormData.api_key }),
      });

      const data = await response.json();

      if (data.valid) {
        setSuccess('API key válida');
      } else {
        setError(data.message || 'API key inválida');
      }
    } catch (err: any) {
      setError('Error al verificar API key');
    } finally {
      setVerifying(false);
    }
  };

  const handleAccountSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/communications/sendgrid/account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(accountFormData),
      });

      const data = await response.json();

      if (data.error) {
        setError(data.error);
      } else {
        setSuccess('Cuenta SendGrid configurada exitosamente');
        await loadData();
        setAccountFormData((prev) => ({ ...prev, api_key: '' }));
      }
    } catch (err: any) {
      setError('Error al guardar cuenta SendGrid');
    } finally {
      setSaving(false);
    }
  };

  const openSenderDialog = (sender?: SenderIdentity) => {
    if (sender) {
      setEditingSender(sender);
      setSenderFormData({
        purpose: sender.purpose,
        from_email: sender.from_email,
        from_name: sender.from_name,
        reply_to_email: sender.reply_to_email || '',
        is_default: sender.is_default,
      });
    } else {
      setEditingSender(null);
      setSenderFormData({
        purpose: 'marketing',
        from_email: '',
        from_name: '',
        reply_to_email: '',
        is_default: false,
      });
    }
    setSenderDialogOpen(true);
  };

  const handleSenderSubmit = async () => {
    setSavingSender(true);
    setError(null);

    try {
      const response = await fetch('/api/communications/sendgrid/senders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(senderFormData),
      });

      const data = await response.json();

      if (data.error) {
        setError(data.error);
      } else {
        setSuccess('Remitente guardado exitosamente');
        setSenderDialogOpen(false);
        await loadData();
      }
    } catch (err: any) {
      setError('Error al guardar remitente');
    } finally {
      setSavingSender(false);
    }
  };

  const handleDeleteSender = async (senderId: string) => {
    if (!confirm('¿Estás seguro de eliminar este remitente?')) return;

    try {
      const response = await fetch(`/api/communications/sendgrid/senders?id=${senderId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.error) {
        setError(data.error);
      } else {
        setSuccess('Remitente eliminado');
        await loadData();
      }
    } catch (err: any) {
      setError('Error al eliminar remitente');
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Configuración SendGrid</h1>
        <p className="text-muted-foreground mt-2">
          Configura tu cuenta SendGrid y remitentes para enviar emails
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="bg-green-50 border-green-200">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">{success}</AlertDescription>
        </Alert>
      )}

      {/* Account Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Cuenta SendGrid
          </CardTitle>
          <CardDescription>
            Configura tu API key de SendGrid. La API key se guarda encriptada.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAccountSubmit} className="space-y-4">
            {account && account.has_api_key && (
              <Alert className="bg-green-50 border-green-200">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  Cuenta configurada y verificada el{' '}
                  {account.verified_at
                    ? new Date(account.verified_at).toLocaleDateString('es-CL')
                    : 'recientemente'}
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="api_key">API Key de SendGrid</Label>
              <div className="flex gap-2">
                <Input
                  id="api_key"
                  type="password"
                  placeholder="SG.xxxxxxxxxxxxxxxxxxxxx"
                  value={accountFormData.api_key}
                  onChange={(e) =>
                    setAccountFormData({ ...accountFormData, api_key: e.target.value })
                  }
                  required={!account?.has_api_key}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleVerify}
                  disabled={verifying || !accountFormData.api_key}
                >
                  {verifying ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Verificando...
                    </>
                  ) : (
                    'Verificar'
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                {account?.has_api_key
                  ? 'Deja en blanco para mantener la API key actual'
                  : 'Obtén tu API key desde SendGrid Settings'}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="from_email">Email Remitente (por defecto)</Label>
                <Input
                  id="from_email"
                  type="email"
                  placeholder="noreply@tudominio.com"
                  value={accountFormData.from_email}
                  onChange={(e) =>
                    setAccountFormData({ ...accountFormData, from_email: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="from_name">Nombre Remitente (por defecto)</Label>
                <Input
                  id="from_name"
                  type="text"
                  placeholder="Tu Empresa"
                  value={accountFormData.from_name}
                  onChange={(e) =>
                    setAccountFormData({ ...accountFormData, from_name: e.target.value })
                  }
                  required
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={saving}
              className="bg-[var(--tp-buttons)] hover:bg-[var(--tp-buttons-hover)]"
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                'Guardar Cuenta'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Sender Identities */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Remitentes</CardTitle>
              <CardDescription>
                Configura diferentes remitentes para transaccionales y marketing
              </CardDescription>
            </div>
            <Dialog open={senderDialogOpen} onOpenChange={setSenderDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  onClick={() => openSenderDialog()}
                  disabled={!account?.has_api_key}
                  className="bg-[var(--tp-buttons)] hover:bg-[var(--tp-buttons-hover)]"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar Remitente
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {editingSender ? 'Editar Remitente' : 'Nuevo Remitente'}
                  </DialogTitle>
                  <DialogDescription>
                    Configura una identidad de remitente para tus emails
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Propósito</Label>
                    <Select
                      value={senderFormData.purpose}
                      onValueChange={(v: 'transactional' | 'marketing') =>
                        setSenderFormData({ ...senderFormData, purpose: v })
                      }
                      disabled={!!editingSender}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="transactional">
                          Transaccional - {PURPOSE_DESCRIPTIONS.transactional}
                        </SelectItem>
                        <SelectItem value="marketing">
                          Marketing - {PURPOSE_DESCRIPTIONS.marketing}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Email Remitente</Label>
                    <Input
                      type="email"
                      placeholder="notificaciones@tudominio.com"
                      value={senderFormData.from_email}
                      onChange={(e) =>
                        setSenderFormData({ ...senderFormData, from_email: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Nombre Remitente</Label>
                    <Input
                      type="text"
                      placeholder="Mi Empresa"
                      value={senderFormData.from_name}
                      onChange={(e) =>
                        setSenderFormData({ ...senderFormData, from_name: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Email de Respuesta (opcional)</Label>
                    <Input
                      type="email"
                      placeholder="soporte@tudominio.com"
                      value={senderFormData.reply_to_email}
                      onChange={(e) =>
                        setSenderFormData({ ...senderFormData, reply_to_email: e.target.value })
                      }
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="is_default"
                      checked={senderFormData.is_default}
                      onChange={(e) =>
                        setSenderFormData({ ...senderFormData, is_default: e.target.checked })
                      }
                    />
                    <Label htmlFor="is_default">Establecer como remitente por defecto</Label>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setSenderDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleSenderSubmit}
                    disabled={savingSender || !senderFormData.from_email || !senderFormData.from_name}
                    className="bg-[var(--tp-buttons)] hover:bg-[var(--tp-buttons-hover)]"
                  >
                    {savingSender ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Guardando...
                      </>
                    ) : (
                      'Guardar'
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {!account?.has_api_key ? (
            <p className="text-muted-foreground text-sm">
              Primero configura tu cuenta SendGrid para agregar remitentes.
            </p>
          ) : senders.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              No hay remitentes configurados. Agrega uno para comenzar.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Propósito</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Reply-To</TableHead>
                  <TableHead className="w-[100px]">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {senders.map((sender) => (
                  <TableRow key={sender.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={sender.purpose === 'transactional' ? 'default' : 'secondary'}
                        >
                          {PURPOSE_LABELS[sender.purpose]}
                        </Badge>
                        {sender.is_default && (
                          <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{sender.from_email}</TableCell>
                    <TableCell>{sender.from_name}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {sender.reply_to_email || '-'}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openSenderDialog(sender)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteSender(sender.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card>
        <CardHeader>
          <CardTitle>Información</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            • <strong>Transaccional:</strong> Usa este remitente para notificaciones, confirmaciones
            de pedido, alertas del sistema.
          </p>
          <p>
            • <strong>Marketing:</strong> Usa este remitente para campañas, newsletters y
            comunicaciones promocionales.
          </p>
          <p>
            • Cada email debe estar verificado en SendGrid como Sender Identity.
          </p>
          <p>
            •{' '}
            <a
              href="https://app.sendgrid.com/settings/sender_auth"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--tp-buttons)] hover:underline"
            >
              Verificar remitentes en SendGrid
            </a>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
