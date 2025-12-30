'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CheckCircle2, Loader2, AlertCircle } from 'lucide-react';

interface BetaSignupFormProps {
  onSuccess?: () => void;
  embedded?: boolean;
}

export function BetaSignupForm({ onSuccess, embedded = false }: BetaSignupFormProps) {
  const [formData, setFormData] = useState({
    email: '',
    first_name: '',
    last_name: '',
    company: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await fetch('/api/beta/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al enviar el formulario');
      }

      setSuccess(true);
      setFormData({
        email: '',
        first_name: '',
        last_name: '',
        company: '',
      });

      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error inesperado');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setSuccess(false);
    setError(null);
  };

  if (success) {
    return (
      <div className={`flex flex-col items-center justify-center ${embedded ? 'p-6' : 'p-8'} text-center w-full`}>
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
          <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
        </div>
        <h3 className="mb-2 text-xl font-semibold text-gray-900 dark:text-gray-100">
          ¡Bienvenido al Beta!
        </h3>
        <p className="mb-6 text-sm text-gray-600 dark:text-gray-400">
          Te contactaremos pronto con acceso exclusivo a la nueva plataforma.
        </p>
        <Button
          onClick={handleReset}
          variant="outline"
          size="sm"
          className="text-sm"
        >
          Registrar otro usuario
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className={`space-y-4 ${embedded ? 'p-6' : 'p-8'} w-full`}>
      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Únete al Beta
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Sé de los primeros en acceder a nuestra nueva plataforma
        </p>
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-800 dark:bg-red-900/20">
          <AlertCircle className="mt-0.5 h-4 w-4 text-red-600 dark:text-red-400" />
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      <div className="space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor="email" className="text-sm font-medium">
            Email <span className="text-red-500">*</span>
          </Label>
          <Input
            id="email"
            type="email"
            placeholder="tu@email.com"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
            disabled={loading}
            className="w-full"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="first_name" className="text-sm font-medium">
              Nombre
            </Label>
            <Input
              id="first_name"
              type="text"
              placeholder="Juan"
              value={formData.first_name}
              onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
              disabled={loading}
              maxLength={50}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="last_name" className="text-sm font-medium">
              Apellido
            </Label>
            <Input
              id="last_name"
              type="text"
              placeholder="Pérez"
              value={formData.last_name}
              onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
              disabled={loading}
              maxLength={50}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="company" className="text-sm font-medium">
            Empresa (opcional)
          </Label>
          <Input
            id="company"
            type="text"
            placeholder="Tu Empresa S.A."
            value={formData.company}
            onChange={(e) => setFormData({ ...formData, company: e.target.value })}
            disabled={loading}
            maxLength={100}
          />
        </div>
      </div>

      <Button
        type="submit"
        className="w-full"
        disabled={loading || !formData.email}
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Enviando...
          </>
        ) : (
          'Solicitar Acceso al Beta'
        )}
      </Button>

      <p className="text-center text-xs text-gray-500 dark:text-gray-400">
        Al registrarte, aceptas recibir comunicaciones sobre el beta de TuPatrimonio
      </p>
    </form>
  );
}
