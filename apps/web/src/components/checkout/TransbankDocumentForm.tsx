'use client';

import { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info } from 'lucide-react';

export interface BillingData {
  document_type: 'boleta_electronica' | 'factura_electronica';
  tax_id: string;
  name: string;
  giro?: string;
  address?: string;
  city?: string;
  state?: string;
}

interface TransbankDocumentFormProps {
  countryCode?: string;
  defaultData?: Partial<BillingData>;
  onDataChange: (data: BillingData | null) => void;
}

/**
 * Valida formato de RUT chileno (XX.XXX.XXX-X)
 */
function validateChileanRUT(rut: string): boolean {
  if (!rut) return false;
  
  // Limpiar formato
  const cleanRut = rut.replace(/\./g, '').replace(/-/g, '');
  
  // Debe tener 8-9 dígitos + 1 dígito verificador
  if (cleanRut.length < 8 || cleanRut.length > 9) return false;
  
  // Validar formato básico (números + K o dígito)
  const rutRegex = /^[0-9]+[0-9kK]$/;
  if (!rutRegex.test(cleanRut)) return false;
  
  return true;
}

export default function TransbankDocumentForm({
  countryCode = 'CL',
  defaultData,
  onDataChange,
}: TransbankDocumentFormProps) {
  const [documentType, setDocumentType] = useState<'boleta_electronica' | 'factura_electronica'>(
    defaultData?.document_type || 'boleta_electronica'
  );
  const [taxId, setTaxId] = useState(defaultData?.tax_id || '');
  const [name, setName] = useState(defaultData?.name || '');
  const [giro, setGiro] = useState(defaultData?.giro || '');
  const [address, setAddress] = useState(defaultData?.address || '');
  const [city, setCity] = useState(defaultData?.city || '');
  const [state, setState] = useState(defaultData?.state || '');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  // Cargar datos desde configuración si no se proporcionan
  useEffect(() => {
    const loadSettings = async () => {
      if (defaultData) {
        setLoading(false);
        return;
      }

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
  }, [defaultData]);

  const isChile = countryCode === 'CL';
  const taxIdLabel = isChile ? 'RUT' : 'Tax ID';
  const requiresFullData = documentType === 'factura_electronica';

  // Validar y notificar cambios (solo cuando no está cargando)
  useEffect(() => {
    if (loading) return;
    const newErrors: Record<string, string> = {};

    // Validar Tax ID/RUT (requerido siempre)
    if (!taxId.trim()) {
      newErrors.taxId = `${taxIdLabel} es requerido`;
    } else if (isChile && !validateChileanRUT(taxId)) {
      newErrors.taxId = 'RUT inválido. Formato: XX.XXX.XXX-X';
    }

    // Validar Nombre/Razón Social (requerido siempre)
    if (!name.trim()) {
      newErrors.name = 'Nombre o Razón Social es requerido';
    }

    // Validar campos adicionales para factura
    if (requiresFullData) {
      if (!giro.trim()) {
        newErrors.giro = 'Giro es requerido para facturas';
      }
      if (!address.trim()) {
        newErrors.address = 'Dirección es requerida para facturas';
      }
      if (!city.trim()) {
        newErrors.city = 'Ciudad es requerida para facturas';
      }
    }

    setErrors(newErrors);

    // Si no hay errores, enviar datos
    if (Object.keys(newErrors).length === 0 && taxId.trim() && name.trim()) {
      const billingData: BillingData = {
        document_type: documentType,
        tax_id: taxId.trim(),
        name: name.trim(),
        ...(requiresFullData && {
          giro: giro.trim(),
          address: address.trim(),
          city: city.trim(),
          state: state.trim() || undefined,
        }),
      };
      onDataChange(billingData);
    } else {
      onDataChange(null);
    }
  }, [documentType, taxId, name, giro, address, city, state, isChile, taxIdLabel, requiresFullData, onDataChange, loading]);

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-sm text-muted-foreground">Cargando configuración...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tipo de Documento</CardTitle>
        <CardDescription>
          Selecciona el tipo de documento tributario que necesitas
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Selector de tipo de documento */}
        <div className="space-y-2">
          <Label htmlFor="document-type">Tipo de Documento</Label>
          <Select value={documentType} onValueChange={(value: 'boleta_electronica' | 'factura_electronica') => setDocumentType(value)}>
            <SelectTrigger id="document-type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="boleta_electronica">Boleta Electrónica</SelectItem>
              <SelectItem value="factura_electronica">Factura Electrónica</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Información sobre diferencias */}
        {documentType === 'boleta_electronica' && (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              La boleta electrónica es para consumidores finales. Solo requiere {taxIdLabel} y nombre.
            </AlertDescription>
          </Alert>
        )}

        {documentType === 'factura_electronica' && (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              La factura electrónica es para empresas. Requiere datos completos incluyendo giro y dirección.
            </AlertDescription>
          </Alert>
        )}

        {/* Campos comunes */}
        <div className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label htmlFor="tax-id">
              {taxIdLabel} {isChile && '(Formato: XX.XXX.XXX-X)'}
            </Label>
            <Input
              id="tax-id"
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
            <Label htmlFor="name">Nombre o Razón Social</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nombre completo o razón social"
              className={errors.name ? 'border-red-500' : ''}
            />
            {errors.name && (
              <p className="text-sm text-red-500">{errors.name}</p>
            )}
          </div>
        </div>

        {/* Campos adicionales solo para factura */}
        {requiresFullData && (
          <div className="space-y-4 pt-2 border-t">
            <div className="space-y-2">
              <Label htmlFor="giro">Giro o Actividad Económica</Label>
              <Input
                id="giro"
                value={giro}
                onChange={(e) => setGiro(e.target.value)}
                placeholder="Ej: Servicios Digitales"
                className={errors.giro ? 'border-red-500' : ''}
              />
              {errors.giro && (
                <p className="text-sm text-red-500">{errors.giro}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Dirección</Label>
              <Input
                id="address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Calle y número"
                className={errors.address ? 'border-red-500' : ''}
              />
              {errors.address && (
                <p className="text-sm text-red-500">{errors.address}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">Ciudad / Comuna</Label>
                <Input
                  id="city"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Santiago"
                  className={errors.city ? 'border-red-500' : ''}
                />
                {errors.city && (
                  <p className="text-sm text-red-500">{errors.city}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="state">Región / Estado (Opcional)</Label>
                <Input
                  id="state"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  placeholder="Región Metropolitana"
                />
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

