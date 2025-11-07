'use client'

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { CheckCircle, Loader2, AlertCircle, Send } from "lucide-react";
import { createClient } from '@/lib/supabase/client';
import { trackEvent } from '@/lib/analytics';

interface ContactFormProps {
  formType?: 'general' | 'demo' | 'support' | 'sales' | 'partnership';
  title?: string;
  description?: string;
  className?: string;
}

export function ContactForm({ 
  formType = 'general', 
  title = "Contáctanos",
  description = "Déjanos un mensaje y te responderemos en menos de 24 horas",
  className = '' 
}: ContactFormProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');

  const formLabels = {
    general: 'Consulta General',
    demo: 'Solicitud de Demo',
    support: 'Soporte Técnico',
    sales: 'Consulta Comercial',
    partnership: 'Propuesta de Partnership'
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const supabase = createClient();
      
      const { data, error } = await supabase
        .from('marketing.contact_messages')
        .insert({
          name: name.trim(),
          email: email.trim(),
          company: company.trim() || null,
          subject: subject.trim() || formLabels[formType],
          message: message.trim(),
          form_type: formType,
          status: 'new',
          ip_address: null, // Se puede agregar detección de IP
        });

      if (error) {
        setError('Hubo un error al enviar tu mensaje. Inténtalo nuevamente.');
        console.error('Contact form error:', error);
        return;
      }

      setIsSuccess(true);
      
      // Track successful submission
      trackEvent('form_submit', {
        form_name: 'contact',
        form_type: formType,
        has_company: !!company.trim(),
        has_subject: !!subject.trim()
      });
      
      // Reset form
      setName('');
      setEmail('');
      setCompany('');
      setSubject('');
      setMessage('');
      
    } catch (error) {
      setError('Error de conexión. Verifica tu internet e inténtalo nuevamente.');
      console.error('Contact form submission error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className={`bg-[var(--tp-success-light)] dark:bg-[var(--tp-success-light)] border border-[var(--tp-success-border)] rounded-xl p-8 text-center ${className}`}>
        <CheckCircle className="w-12 h-12 text-[var(--tp-success)] mx-auto mb-4" />
        <h3 className="text-xl font-bold text-foreground mb-2">
          ¡Mensaje Enviado!
        </h3>
        <p className="text-muted-foreground mb-4">
          Gracias por contactarnos. Nuestro equipo se pondrá en contacto contigo en menos de 24 horas.
        </p>
        <div className="text-sm text-[var(--tp-success)]">
          📧 Recibirás confirmación por email
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      {error && (
        <div className="bg-[var(--tp-error-light)] dark:bg-[var(--tp-error-light)] border border-[var(--tp-error-border)] rounded-lg p-4 flex items-center gap-2 mb-6">
          <AlertCircle className="w-5 h-5 text-[var(--tp-error)]" />
          <span className="text-foreground text-sm">{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Nombre completo *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Tu nombre"
              className="w-full px-4 py-3 bg-background border border-input rounded-lg 
                       focus:ring-2 focus:ring-[var(--tp-brand)] focus:border-transparent 
                       text-foreground placeholder:text-muted-foreground
                       transition-all duration-200"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Email *
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@email.com"
              className="w-full px-4 py-3 bg-background border border-input rounded-lg 
                       focus:ring-2 focus:ring-[var(--tp-brand)] focus:border-transparent 
                       text-foreground placeholder:text-muted-foreground
                       transition-all duration-200"
            />
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Empresa
            </label>
            <input
              type="text"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="Nombre de tu empresa"
              className="w-full px-4 py-3 bg-background border border-input rounded-lg 
                       focus:ring-2 focus:ring-[var(--tp-brand)] focus:border-transparent 
                       text-foreground placeholder:text-muted-foreground
                       transition-all duration-200"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Asunto
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder={formLabels[formType]}
              className="w-full px-4 py-3 bg-background border border-input rounded-lg 
                       focus:ring-2 focus:ring-[var(--tp-brand)] focus:border-transparent 
                       text-foreground placeholder:text-muted-foreground
                       transition-all duration-200"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Mensaje *
          </label>
          <textarea
            required
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Cuéntanos en qué podemos ayudarte..."
            rows={5}
            className="w-full px-4 py-3 bg-background border border-input rounded-lg 
                     focus:ring-2 focus:ring-[var(--tp-brand)] focus:border-transparent 
                     text-foreground placeholder:text-muted-foreground
                     transition-all duration-200 resize-none"
          />
        </div>

        <Button
          type="submit"
          disabled={!name || !email || !message || isLoading}
          className="w-full bg-[var(--tp-brand)] hover:bg-[var(--tp-brand-light)] 
                   text-white dark:text-white
                   disabled:opacity-50 disabled:cursor-not-allowed
                   h-12 text-base font-medium
                   shadow-lg hover:shadow-xl transition-all"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Enviando mensaje...
            </>
          ) : (
            <>
              <Send className="w-5 h-5 mr-2" />
              Enviar Mensaje
            </>
          )}
        </Button>

        <p className="text-xs text-muted-foreground text-center pt-2">
          Al enviar este formulario aceptas nuestros términos y política de privacidad.
        </p>
      </form>
    </div>
  );
}
