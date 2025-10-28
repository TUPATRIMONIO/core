import type { Metadata } from 'next';
import { CTAWithAuth } from '@/components/CTAWithAuth';

export const metadata: Metadata = {
  title: 'Regístrate Gratis - TuPatrimonio | Crea tu Cuenta',
  description: 'Crea tu cuenta gratis en TuPatrimonio y accede a servicios legales digitales: firma electrónica, verificación de identidad y más.',
  keywords: ['registro', 'crear cuenta', 'tupatrimonio', 'gratis', 'sign up'],
};

export default function RegistrarsePage() {
  return (
    <CTAWithAuth
      redirectUrl="https://app.tupatrimonio.app/signup"
      title="Crea tu Cuenta Gratis"
      description="Accede a todos nuestros servicios legales digitales sin costo inicial"
      ctaText="Registrarse Ahora"
      showAutoRedirect={true}
      benefits={[
        'Firma electrónica con validez legal en toda Latinoamérica',
        'Verificación de identidad rápida y segura',
        'Gestión de documentos en la nube',
        'Sin permanencia ni costos ocultos',
        'Soporte por WhatsApp y email',
        'Primeros 30 días de prueba premium gratis',
      ]}
    />
  );
}

