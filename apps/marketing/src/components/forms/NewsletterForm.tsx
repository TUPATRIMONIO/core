'use client'

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CheckCircle, AlertCircle, Loader2, Gift } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { trackEvent } from '@/lib/analytics';

interface NewsletterFormProps {
  className?: string;
}

export function NewsletterForm({ className = '' }: NewsletterFormProps) {
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const supabase = createClient();
      
      const { data, error } = await supabase
        .from('newsletter_subscribers')
        .insert({
          email: email.trim(),
          first_name: firstName.trim() || null,
          status: 'active',
        });

      if (error) {
        if (error.code === '23505') {
          setError('Este email ya está suscrito a nuestro newsletter');
        } else {
          setError('Hubo un error al procesar tu suscripción. Por favor, intenta nuevamente.');
        }
        console.error('Newsletter error:', error);
        return;
      }

      // Track successful submission
      trackEvent('form_submit', {
        form_name: 'newsletter',
        has_name: !!firstName.trim()
      });
      
      setIsSuccess(true);
      setEmail('');
      setFirstName('');
    } catch (err) {
      setError('Error de conexión. Verifica tu internet e inténtalo nuevamente.');
      console.error('Error submitting newsletter form:', err);
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
        <h3 className="text-2xl font-bold text-foreground mb-2">
          ¡Bienvenido a TuPatrimonio News! 🎉
        </h3>
        <p className="text-muted-foreground mb-4">
          Te has suscrito correctamente. Revisa tu email para confirmar tu suscripción.
        </p>
        <div className="inline-flex items-center gap-2 bg-[var(--tp-brand-5)] text-[var(--tp-brand)] px-4 py-3 rounded-lg">
          <Gift className="w-5 h-5" />
          <span className="font-semibold">¡15% de descuento en tu primer servicio!</span>
        </div>
        <div className="mt-6">
          <Button 
            variant="outline" 
            onClick={() => setIsSuccess(false)}
            className="border-[var(--tp-brand)] text-[var(--tp-brand)]"
          >
            Suscribir otro correo
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className={`space-y-4 ${className}`}>
      {error && (
        <div className="bg-[var(--tp-error-light)] border border-[var(--tp-error-border)] rounded-lg p-4 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-[var(--tp-error)] shrink-0" />
          <span className="text-foreground text-sm">{error}</span>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="newsletter-email" className="text-base font-medium mb-2 block">
            Correo electrónico *
          </Label>
          <Input
            id="newsletter-email"
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
          <Label htmlFor="newsletter-name" className="text-base font-medium mb-2 block">
            Nombre (opcional)
          </Label>
          <Input
            id="newsletter-name"
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
            Suscribiendo...
          </>
        ) : (
          <>
            Suscribirme Ahora
          </>
        )}
      </Button>

      <p className="text-sm text-muted-foreground/80 text-center mt-3">
        Al suscribirte aceptas recibir emails con novedades, tips y ofertas especiales.
        Puedes cancelar en cualquier momento.
      </p>
    </form>
  );
}

