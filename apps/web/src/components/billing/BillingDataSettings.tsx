'use client';

import { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle2, Info } from 'lucide-react';

interface BillingData {
  document_type?: 'boleta_electronica' | 'factura_electronica';
  tax_id?: string;
  name?: string;
  giro?: string;
  address?: string;
  city?: string;
  state?: string;
}

interface BillingDataSettingsProps {
  countryCode?: string;
}

/**
 * Valida formato de RUT chileno (XX.XXX.XXX-X)
 */
function validateChileanRUT(rut: string): boolean {
  if (!rut) return false;
  
  const cleanRut = rut.replace(/\./g, '').replace(/-/g, '');
  
  if (cleanRut.length < 8 || cleanRut.length > 9) return false;
  
  const rutRegex = /^[0-9]+[0-9kK]$/;
  if (!rutRegex.test(cleanRut)) return false;
  
  return true;
}

export default function BillingDataSettings({ countryCode = 'CL' }: BillingDataSettingsProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [documentType, setDocumentType] = useState<'boleta_electronica' | 'factura_electronica'>('boleta_electronica');
  const [taxId, setTaxId] = useState('');
  const [name, setName] = useState('');
  const [giro, setGiro] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isChile = countryCode === 'CL';
  const taxIdLabel = isChile ? 'RUT' : 'Tax ID';

  // Cargar configuración existente
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const response = await fetch('/api/billing/settings');
        if (response.ok) {
          const data = await response.json();
          if (data.billing_data) {
            setDocumentType(data.billing_data.document_type || 'boleta_electronica');
            setTaxId(data.billing_data.tax_id || '');
            setName(data.billing_data.name || '');
            setGiro(data.billing_data.giro || '');
            setAddress(data.billing_data.address || '');
            setCity(data.billing_data.city || '');
            setState(data.billing_data.state || '');
          }
        }
      } catch (err) {
        console.error('Error cargando configuración:', err);
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(false);
    
    const newErrors: Record<string, string> = {};

    // Validar Tax ID/RUT
    if (taxId.trim() && isChile && !validateChileanRUT(taxId)) {
      newErrors.taxId = 'RUT inválido. Formato: XX.XXX.XXX-X';
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      setSaving(false);
      return;
    }

    try {
      const billingData: BillingData = {
        document_type: documentType,
        ...(taxId.trim() && { tax_id: taxId.trim() }),
        ...(name.trim() && { name: name.trim() }),
        ...(giro.trim() && { giro: giro.trim() }),
        ...(address.trim() && { address: address.trim() }),
        ...(city.trim() && { city: city.trim() }),
        ...(state.trim() && { state: state.trim() }),
      };

      const response = await fetch('/api/billing/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ billing_data: billingData }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Error guardando configuración');
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || 'Error guardando configuración');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Datos de Facturación</CardTitle>
        <CardDescription>
          Configura tus datos por defecto para emisión de documentos tributarios
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {success && (
          <Alert>
            <CheckCircle2 className="h-4 w-4" />
            <AlertDescription>Configuración guardada exitosamente</AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Estos datos se usarán como valores por defecto al realizar pagos con Transbank.
            Podrás editarlos en cada compra si es necesario.
          </AlertDescription>
        </Alert>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="default-document-type">Tipo de Documento Preferido</Label>
            <Select value={documentType} onValueChange={(value: 'boleta_electronica' | 'factura_electronica') => setDocumentType(value)}>
              <SelectTrigger id="default-document-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="boleta_electronica">Boleta Electrónica</SelectItem>
                <SelectItem value="factura_electronica">Factura Electrónica</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="settings-tax-id">
              {taxIdLabel} {isChile && '(Formato: XX.XXX.XXX-X)'}
            </Label>
            <Input
              id="settings-tax-id"
              value={taxId}
              onChange={(e) => setTaxId(e.target.value)}
              placeholder={isChile ? '12.345.678-9' : 'Tax ID'}
              className={errors.taxId ? 'border-red-500' : ''}
            />
            {errors.taxId && (
              <p className="text-sm text-red-500">{errors.taxId}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="settings-name">Nombre o Razón Social</Label>
            <Input
              id="settings-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nombre completo o razón social"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="settings-giro">Giro o Actividad Económica</Label>
            <Input
              id="settings-giro"
              value={giro}
              onChange={(e) => setGiro(e.target.value)}
              placeholder="Ej: Servicios Digitales"
            />
            <p className="text-xs text-muted-foreground">
              Requerido para facturas electrónicas
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="settings-address">Dirección</Label>
            <Input
              id="settings-address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Calle y número"
            />
            <p className="text-xs text-muted-foreground">
              Requerido para facturas electrónicas
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="settings-city">Ciudad / Comuna</Label>
              <Input
                id="settings-city"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Santiago"
              />
              <p className="text-xs text-muted-foreground">
                Requerido para facturas electrónicas
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="settings-state">Región / Estado</Label>
              <Input
                id="settings-state"
                value={state}
                onChange={(e) => setState(e.target.value)}
                placeholder="Región Metropolitana"
              />
            </div>
          </div>
        </div>

        <Button
          onClick={handleSave}
          disabled={saving}
          className="w-full bg-[var(--tp-buttons)] hover:bg-[var(--tp-buttons-hover)]"
        >
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Guardando...
            </>
          ) : (
            'Guardar Configuración'
          )}
        </Button>
      </CardContent>
    </Card>
  );
}








