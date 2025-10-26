'use client'

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { CheckCircle, Loader2, AlertCircle } from "lucide-react";
import { createClient } from '@/lib/supabase/client';
import { trackEvent } from '@/lib/analytics';

interface WaitlistFormProps {
  country: 'cl' | 'co' | 'mx';
  source?: string; // Para tracking de dónde viene el lead
  className?: string;
}

export default function WaitlistForm({ country, source = 'homepage', className = '' }: WaitlistFormProps) {
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [company, setCompany] = useState('');
  const [useCase, setUseCase] = useState<'personal' | 'business'>('personal');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');

  const countryLabels = {
    cl: 'Chile',
    co: 'Colombia', 
    mx: 'México'
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const supabase = createClient();
      
      const { data, error } = await supabase
        .from('marketing.waitlist_subscribers')
        .insert({
          email: email.trim(),
          first_name: firstName.trim() || null,
          company: company.trim() || null,
          use_case: useCase,
          referral_source: `${source}_${country}`,
          ip_address: null, // Se puede agregar detección de IP
          user_agent: typeof window !== 'undefined' ? window.navigator.userAgent : null,
          status: 'active'
        });

      if (error) {
        if (error.code === '23505') { // Duplicate email
          setError('Este email ya está en nuestra lista de espera');
        } else {
          setError('Hubo un error al registrarte. Inténtalo nuevamente.');
        }
        console.error('Waitlist error:', error);
        return;
      }

      setIsSuccess(true);
      
      // Track successful submission
      trackEvent('form_submit', {
        form_name: 'waitlist',
        country: country,
        use_case: useCase,
        source: source,
        has_company: !!company.trim()
      });
      
      // Reset form
      setEmail('');
      setFirstName('');
      setCompany('');
      
    } catch (error) {
      setError('Error de conexión. Verifica tu internet e inténtalo nuevamente.');
      console.error('Waitlist submission error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className={`bg-green-50 border border-green-200 rounded-xl p-6 text-center ${className}`}>
        <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-4" />
        <h3 className="text-lg font-bold text-green-900 mb-2">
          ¡Listo! Ya estás en la lista
        </h3>
        <p className="text-green-700 mb-4">
          Te notificaremos cuando lancemos TuPatrimonio en {countryLabels[country]}
        </p>
        <div className="text-sm text-green-600">
          🎁 Acceso prioritario garantizado
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className={`space-y-4 ${className}`}>
      <div className="text-center mb-6">
        <h3 className="text-xl font-bold text-gray-900 mb-2">
          Únete a la Lista de Espera - {countryLabels[country]}
        </h3>
        <p className="text-gray-600">
          Sé de los primeros en acceder cuando lancemos en {countryLabels[country]}
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <span className="text-red-700 text-sm">{error}</span>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email *
          </label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={`tu@email.${country === 'cl' ? 'cl' : country === 'mx' ? 'mx' : 'co'}`}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--tp-buttons)] focus:border-transparent"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nombre
          </label>
          <input
            type="text"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            placeholder="Tu nombre"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--tp-buttons)] focus:border-transparent"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Empresa (opcional)
        </label>
        <input
          type="text"
          value={company}
          onChange={(e) => setCompany(e.target.value)}
          placeholder="Nombre de tu empresa"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--tp-buttons)] focus:border-transparent"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          ¿Cómo usarás TuPatrimonio?
        </label>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setUseCase('personal')}
            className={`p-3 border rounded-lg text-left transition-colors ${
              useCase === 'personal'
                ? 'border-[var(--tp-buttons)] bg-[var(--tp-buttons)]/5 text-[var(--tp-buttons)]'
                : 'border-gray-300 text-gray-600 hover:border-gray-400'
            }`}
          >
            <div className="font-medium">Personal</div>
            <div className="text-xs">Freelance, uso individual</div>
          </button>
          <button
            type="button"
            onClick={() => setUseCase('business')}
            className={`p-3 border rounded-lg text-left transition-colors ${
              useCase === 'business'
                ? 'border-[var(--tp-buttons)] bg-[var(--tp-buttons)]/5 text-[var(--tp-buttons)]'
                : 'border-gray-300 text-gray-600 hover:border-gray-400'
            }`}
          >
            <div className="font-medium">Empresarial</div>
            <div className="text-xs">Equipos, organizaciones</div>
          </button>
        </div>
      </div>

      <Button
        type="submit"
        disabled={!email || isLoading}
        className="w-full bg-[var(--tp-buttons)] hover:bg-[var(--tp-buttons-hover)] disabled:opacity-50"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Registrando...
          </>
        ) : (
          `Unirse a Lista de Espera - ${countryLabels[country]}`
        )}
      </Button>

      <p className="text-xs text-gray-500 text-center">
        Al registrarte aceptas nuestros términos y condiciones. 
        No spam, solo actualizaciones importantes.
      </p>
    </form>
  );
}
