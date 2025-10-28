'use client'

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

interface NotifyMeFormProps {
  country: string;
  className?: string;
}

export function NotifyMeForm({ country, className = '' }: NotifyMeFormProps) {
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const countryNames: Record<string, string> = {
    mx: 'México',
    co: 'Colombia',
    pe: 'Perú',
    ar: 'Argentina',
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      // TODO: Implementar integración con Supabase/API
      // Por ahora simulamos el envío
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      console.log('Notify me signup:', { email, firstName, country });
      
      setIsSuccess(true);
      setEmail('');
      setFirstName('');
    } catch (err) {
      setError('Hubo un error al procesar tu solicitud. Por favor, intenta nuevamente.');
      console.error('Error submitting notify form:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-8 h-8 text-green-600" />
        </div>
        <h3 className="text-2xl font-bold text-gray-900 mb-2">
          ¡Gracias por registrarte!
        </h3>
        <p className="text-gray-600 mb-6">
          Te notificaremos cuando estemos disponibles en {countryNames[country] || country.toUpperCase()}
        </p>
        <Button 
          variant="outline" 
          onClick={() => setIsSuccess(false)}
          className="border-[var(--tp-brand)] text-[var(--tp-brand)]"
        >
          Registrar otro correo
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className={`space-y-4 ${className}`}>
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
          <span className="text-red-700 text-sm">{error}</span>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="notify-email" className="text-base font-medium mb-2 block">
            Email *
          </Label>
          <Input
            id="notify-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tu@email.com"
            className="h-12 text-base border-2 focus:border-[var(--tp-brand)]"
            disabled={isSubmitting}
          />
        </div>

        <div>
          <Label htmlFor="notify-name" className="text-base font-medium mb-2 block">
            Nombre
          </Label>
          <Input
            id="notify-name"
            type="text"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            placeholder="Tu nombre"
            className="h-12 text-base border-2 focus:border-[var(--tp-brand)]"
            disabled={isSubmitting}
          />
        </div>
      </div>

      <Button
        type="submit"
        size="lg"
        disabled={isSubmitting}
        className="w-full bg-[var(--tp-brand)] hover:bg-[var(--tp-brand-light)] text-white h-12 text-base shadow-lg"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Registrando...
          </>
        ) : (
          <>
            Notificarme cuando esté disponible
          </>
        )}
      </Button>

      <p className="text-xs text-gray-500 text-center mt-3">
        Al registrarte, aceptas recibir notificaciones sobre el lanzamiento en {countryNames[country] || country.toUpperCase()}.
        No compartiremos tu información con terceros.
      </p>
    </form>
  );
}

