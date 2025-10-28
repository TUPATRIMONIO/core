import type { Metadata } from 'next';
import { CTAWithAuth } from '@/components/CTAWithAuth';

export const metadata: Metadata = {
  title: 'Empieza Ahora - TuPatrimonio | Simplifica tus Trámites Legales',
  description: 'Comienza a usar TuPatrimonio hoy mismo. Firma documentos, verifica identidades y más en minutos.',
  keywords: ['empezar', 'comenzar', 'tupatrimonio', 'onboarding', 'iniciar'],
};

export default function EmpezarPage() {
  return (
    <CTAWithAuth
      redirectUrl="https://app.tupatrimonio.app/onboarding"
      title="Empieza en 3 Simples Pasos"
      description="Configura tu cuenta y empieza a usar TuPatrimonio en menos de 5 minutos"
      ctaText="Comenzar Ahora"
      showAutoRedirect={true}
      benefits={[
        '1️⃣ Crea tu cuenta con email o Google',
        '2️⃣ Verifica tu identidad de forma segura',
        '3️⃣ ¡Listo! Empieza a firmar documentos',
        '✨ Interfaz intuitiva y fácil de usar',
        '🎓 Tutoriales guiados paso a paso',
        '🚀 Soporte durante todo el proceso',
      ]}
    />
  );
}

