'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info } from 'lucide-react';

export interface BasicBillingData {
  tax_id: string;
  name: string;
  email?: string;
}

interface BillingDataFormProps {
  countryCode?: string;
  defaultData?: BasicBillingData;
  onDataChange: (data: BasicBillingData | null) => void;
  title?: string;
  description?: string;
  hideAlert?: boolean;
}

function validateChileanRUT(rut: string): boolean {
  const cleanRut = rut.replace(/[.-]/g, '');
  const rutRegex = /^[0-9]+[0-9kK]{1}$/;
  
  if (!rutRegex.test(cleanRut)) return false;
  
  return true;
}

export default function BillingDataForm({
  countryCode = 'CL',
  defaultData,
  onDataChange,
  title = 'Datos de Facturación',
  description = 'Necesitamos tus datos para generar el documento tributario',
  hideAlert = false,
}: BillingDataFormProps) {
  const [taxId, setTaxId] = useState(defaultData?.tax_id || '');
  const [name, setName] = useState(defaultData?.name || '');
  const [email, setEmail] = useState(defaultData?.email || '');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(!defaultData);
  const lastSentDataRef = useRef<string>('');
  const initializedRef = useRef(false);

  const isChile = countryCode === 'CL';
  const taxIdLabel = isChile ? 'RUT' : 'Tax ID';

  // Cargar datos desde configuración si no se proporcionan (solo una vez)
  useEffect(() => {
    if (initializedRef.current) return;
    
    const loadSettings = async () => {
      if (defaultData) {
        setLoading(false);
        initializedRef.current = true;
        return;
      }

      try {
        const response = await fetch('/api/billing/settings');
        if (response.ok) {
          const data = await response.json();
          if (data.billing_data) {
            setTaxId(data.billing_data.tax_id || '');
            setName(data.billing_data.name || '');
            setEmail(data.billing_data.email || '');
          }
        }
      } catch (err) {
        console.error('Error cargando configuración:', err);
      } finally {
        setLoading(false);
        initializedRef.current = true;
      }
    };

    loadSettings();
  }, [defaultData]);

  // Callback estable para notificar cambios
  const notifyChange = useCallback((data: BasicBillingData | null) => {
    const dataStr = data ? JSON.stringify(data) : '';
    if (dataStr !== lastSentDataRef.current) {
      lastSentDataRef.current = dataStr;
      onDataChange(data);
    }
  }, [onDataChange]);

  // Validar y notificar cambios cuando los valores cambian
  useEffect(() => {
    if (loading) return;
    
    const newErrors: Record<string, string> = {};

    // Validar Tax ID/RUT (requerido)
    if (!taxId.trim()) {
      newErrors.taxId = `${taxIdLabel} es requerido`;
    } else if (isChile && !validateChileanRUT(taxId)) {
      newErrors.taxId = 'RUT inválido. Formato: XX.XXX.XXX-X';
    }

    // Validar Nombre/Razón Social (requerido)
    if (!name.trim()) {
      newErrors.name = 'Nombre o Razón Social es requerido';
    }

    setErrors(newErrors);

    // Si no hay errores, enviar datos
    if (Object.keys(newErrors).length === 0 && taxId.trim() && name.trim()) {
      const billingData: BasicBillingData = {
        tax_id: taxId.trim(),
        name: name.trim(),
        ...(email.trim() && { email: email.trim() }),
      };
      notifyChange(billingData);
    } else {
      notifyChange(null);
    }
  }, [taxId, name, email, isChile, taxIdLabel, loading, notifyChange]);

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
        <CardTitle>{title}</CardTitle>
        <CardDescription>
          {description}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!hideAlert && (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Estos datos se guardarán para futuras compras. Con Stripe se genera automáticamente un Invoice.
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-2">
          <Label htmlFor="tax-id">{taxIdLabel} *</Label>
          <Input
            id="tax-id"
            value={taxId}
            onChange={(e) => setTaxId(e.target.value)}
            placeholder={isChile ? '12.345.678-9' : 'TAX123456'}
            className={errors.taxId ? 'border-red-500' : ''}
          />
          {errors.taxId && (
            <p className="text-sm text-red-500">{errors.taxId}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="name">Nombre o Razón Social *</Label>
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

        <div className="space-y-2">
          <Label htmlFor="email">Email (opcional)</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="email@ejemplo.com"
          />
        </div>
      </CardContent>
    </Card>
  );
}
