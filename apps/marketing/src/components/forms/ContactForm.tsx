'use client'

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { CheckCircle, Loader2, AlertCircle, Send } from "lucide-react";
import { createClient } from '@/lib/supabase/client';

interface ContactFormProps {
  formType?: 'general' | 'demo' | 'support' | 'sales' | 'partnership';
  title?: string;
  description?: string;
  className?: string;
}

export default function ContactForm({ 
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
        .from('contact_messages')
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
      <div className={`bg-green-50 border border-green-200 rounded-xl p-8 text-center ${className}`}>
        <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-green-900 mb-2">
          ¡Mensaje Enviado!
        </h3>
        <p className="text-green-700 mb-4">
          Gracias por contactarnos. Nuestro equipo se pondrá en contacto contigo en menos de 24 horas.
        </p>
        <div className="text-sm text-green-600">
          📧 Recibirás confirmación por email
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-xl shadow-sm border p-8 ${className}`}>
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">{title}</h2>
        <p className="text-gray-600">{description}</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-2 mb-6">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <span className="text-red-700 text-sm">{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre completo *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Tu nombre"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--tp-buttons)] focus:border-transparent"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email *
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@email.com"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--tp-buttons)] focus:border-transparent"
            />
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Empresa
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
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Asunto
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder={formLabels[formType]}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--tp-buttons)] focus:border-transparent"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Mensaje *
          </label>
          <textarea
            required
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Cuéntanos en qué podemos ayudarte..."
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--tp-buttons)] focus:border-transparent"
          />
        </div>

        <Button
          type="submit"
          disabled={!name || !email || !message || isLoading}
          className="w-full bg-[var(--tp-buttons)] hover:bg-[var(--tp-buttons-hover)] disabled:opacity-50"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Enviando mensaje...
            </>
          ) : (
            <>
              <Send className="w-4 h-4 mr-2" />
              Enviar Mensaje
            </>
          )}
        </Button>

        <p className="text-xs text-gray-500 text-center">
          Al enviar este formulario aceptas nuestros términos y política de privacidad.
        </p>
      </form>
    </div>
  );
}
