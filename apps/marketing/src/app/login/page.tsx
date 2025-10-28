import type { Metadata } from 'next';
import { CTAWithAuth } from '@/components/CTAWithAuth';

export const metadata: Metadata = {
  title: 'Iniciar Sesión - TuPatrimonio | Accede a tu Cuenta',
  description: 'Inicia sesión en TuPatrimonio y gestiona tus servicios legales digitales desde cualquier lugar.',
  keywords: ['login', 'iniciar sesión', 'tupatrimonio', 'acceso', 'cuenta'],
};

export default function LoginPage() {
  return (
    <CTAWithAuth
      redirectUrl="https://app.tupatrimonio.app/login"
      title="Accede a tu Cuenta"
      description="Continúa gestionando tus trámites legales de forma simple y segura"
      ctaText="Iniciar Sesión"
      showAutoRedirect={true}
      benefits={[
        'Acceso seguro con autenticación de dos factores',
        'Gestiona todos tus documentos en un solo lugar',
        'Historial completo de transacciones',
        'Soporte técnico prioritario para clientes premium',
        'Actualizaciones en tiempo real',
        'Compatible con todos tus dispositivos',
      ]}
    />
  );
}
