'use client'

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Icon } from "@tupatrimonio/ui";
import { CheckCircle, Loader2, AlertCircle, Mail } from "lucide-react";
import { createClient } from '@/lib/supabase/client';

interface WaitlistFormProps {
  source: string;
  useCase?: 'personal' | 'business';
  className?: string;
}

export function WaitlistForm({ source, useCase = 'business', className = '' }: WaitlistFormProps) {
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const supabase = createClient();
      
      const { error: insertError } = await supabase
        .from('waitlist_subscribers')
        .insert({
          email: email.trim(),
          first_name: firstName.trim() || null,
          use_case: useCase,
          referral_source: source,
          user_agent: typeof window !== 'undefined' ? window.navigator.userAgent : null,
          status: 'active'
        });

      if (insertError) {
        if (insertError.code === '23505') { 
          setError('Este email ya está en nuestra lista 👍');
        } else {
          setError('Algo salió mal. ¿Puedes intentarlo de nuevo?');
        }
        console.error('Waitlist error:', insertError);
        return;
      }

      setIsSuccess(true);
      
      // Reset form
      setEmail('');
      setFirstName('');
      
    } catch (error) {
      setError('Error de conexión. Verifica tu internet.');
      console.error('Waitlist submission error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className={`bg-green-50 dark:bg-green-950/20 border-2 border-green-500 dark:border-green-600 rounded-xl p-8 text-center max-w-md mx-auto ${className}`}>
        <div className="mb-4">
          <Icon icon={CheckCircle} size="lg" className="text-green-600 dark:text-green-400 mx-auto" />
        </div>
        <h3 className="text-xl font-bold text-green-900 dark:text-green-100 mb-2">
          ¡Listo! Ya estás en la lista
        </h3>
        <p className="text-green-700 dark:text-green-300">
          Te avisaremos en cuanto esté disponible. ¡Gracias por tu interés!
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className={`max-w-md mx-auto ${className}`}>
      {error && (
        <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-center gap-2 mb-4">
          <Icon icon={AlertCircle} size="sm" className="text-red-600 dark:text-red-400" />
          <span className="text-red-700 dark:text-red-300 text-sm">{error}</span>
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Email *
          </label>
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
              <Icon icon={Mail} size="sm" className="text-muted-foreground" />
            </div>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@email.com"
              className="w-full pl-10 pr-4 py-3 bg-background border-2 border-border rounded-xl focus:ring-2 focus:ring-[var(--tp-brand)] focus:border-[var(--tp-brand)] transition-all text-foreground placeholder:text-muted-foreground"
            />
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Nombre (opcional)
          </label>
          <input
            type="text"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            placeholder="¿Cómo te llamas?"
            className="w-full px-4 py-3 bg-background border-2 border-border rounded-xl focus:ring-2 focus:ring-[var(--tp-brand)] focus:border-[var(--tp-brand)] transition-all text-foreground placeholder:text-muted-foreground"
          />
        </div>
      </div>

      <Button
        type="submit"
        disabled={!email || isLoading}
        className="w-full mt-6 bg-gradient-to-r from-[var(--tp-brand)] to-[var(--tp-brand-light)] hover:from-[var(--tp-brand-dark)] hover:to-[var(--tp-brand)] text-white py-6 text-base font-semibold shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
      >
        {isLoading ? (
          <div className="flex items-center justify-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Registrando...</span>
          </div>
        ) : (
          'Avisarme cuando esté lista'
        )}
      </Button>

      <p className="text-xs text-muted-foreground text-center mt-4">
        Sin spam. Solo te avisaremos cuando esté lista.
      </p>
    </form>
  );
}

