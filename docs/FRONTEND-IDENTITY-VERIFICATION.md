# Verificación de Identidad - Guía Frontend

## 📦 Componentes Creados

He creado todo lo necesario para usar verificaciones de identidad desde el frontend:

### 1. Types (`types/identity-verification.ts`)
Todos los tipos TypeScript necesarios

### 2. Hook (`hooks/useIdentityVerification.ts`)
Hook personalizado con todas las operaciones

### 3. Componentes
- `VerifyIdentityButton` - Botón para iniciar verificación
- `VerificationStatusCard` - Card para mostrar estado
- `SignerVerificationPanel` - Panel completo para firmantes

---

## 🚀 Uso Rápido

### Ejemplo 1: Botón Simple

```tsx
import { VerifyIdentityButton } from '@/components/signing/VerifyIdentityButton';
import { useOrganization } from '@/hooks/useOrganization';

export function MyComponent() {
  const { organization } = useOrganization();

  return (
    <VerifyIdentityButton
      params={{
        organizationId: organization.id,
        purpose: 'fes_signing',
        subjectIdentifier: '12345678-9', // RUT
        subjectEmail: 'usuario@ejemplo.com',
        subjectName: 'Juan Pérez',
        subjectPhone: '+56912345678',
      }}
      onVerificationStarted={(sessionId, url) => {
        console.log('Sesión creada:', sessionId);
        // El usuario será redirigido automáticamente a Veriff
      }}
    />
  );
}
```

### Ejemplo 2: Mostrar Estado con Badge

```tsx
// Si el usuario ya está verificado
<VerifyIdentityButton
  params={{ /* ... */ }}
  isVerified={true}
  verifiedAt="2026-02-05T18:00:00Z"
/>
// Esto mostrará un badge verde "Identidad Verificada"
```

### Ejemplo 3: Card de Estado (con Auto-Refresh)

```tsx
import { VerificationStatusCard } from '@/components/signing/VerificationStatusCard';

export function VerificationStatus({ sessionId }: { sessionId: string }) {
  return (
    <VerificationStatusCard
      sessionId={sessionId}
      autoRefresh={true}           // Actualiza automáticamente cada 5 segundos
      refreshInterval={5000}        // mientras esté "en progreso"
      onStatusChange={(status) => {
        if (status === 'approved') {
          console.log('¡Verificación aprobada!');
          // Aquí puedes hacer algo, como habilitar el botón de firma
        }
      }}
    />
  );
}
```

### Ejemplo 4: Panel Completo para Firmante

```tsx
import { SignerVerificationPanel } from '@/components/signing/SignerVerificationPanel';

export function SignerDetails({ signer, documentId }) {
  const { organization } = useOrganization();

  return (
    <div className="space-y-4">
      <h2>Firmante: {signer.full_name}</h2>
      
      <SignerVerificationPanel
        signer={signer}
        organizationId={organization.id}
        documentId={documentId}
        purpose="fes_signing"
        requireVerification={true}  // Si es obligatorio
        onVerificationComplete={(sessionId) => {
          console.log('Verificación completada:', sessionId);
          // Habilitar botón de firma, etc.
        }}
      />
    </div>
  );
}
```

---

## 🔧 Usar el Hook Directamente

Si necesitas más control, usa el hook directamente:

```tsx
import { useIdentityVerification } from '@/hooks/useIdentityVerification';

export function MyCustomComponent() {
  const {
    loading,
    error,
    createSession,
    getSessionFull,
    isSessionValid,
    findPreviousVerifications,
  } = useIdentityVerification();

  const handleStartVerification = async () => {
    const response = await createSession({
      organizationId: 'org-uuid',
      purpose: 'fes_signing',
      subjectIdentifier: '12345678-9',
      subjectEmail: 'user@example.com',
      subjectName: 'Juan Pérez',
    });

    if (response) {
      // Redirigir al usuario
      window.location.href = response.verificationUrl;
    }
  };

  const checkIfVerified = async (sessionId: string) => {
    const isValid = await isSessionValid(sessionId);
    if (isValid) {
      console.log('Usuario verificado correctamente');
    }
  };

  const findPrevious = async () => {
    const previous = await findPreviousVerifications(
      'org-uuid',
      '12345678-9', // RUT
      undefined,
      true // solo aprobadas
    );
    
    console.log(`Encontradas ${previous.length} verificaciones previas`);
  };

  return (
    <div>
      <button onClick={handleStartVerification} disabled={loading}>
        {loading ? 'Creando...' : 'Verificar Identidad'}
      </button>
      
      {error && <p className="text-red-500">{error}</p>}
    </div>
  );
}
```

---

## 🎯 Integración en Flujo de Firmas

### Paso 1: Verificar antes de mostrar documento

```tsx
'use client';

import { useEffect, useState } from 'react';
import { useIdentityVerification } from '@/hooks/useIdentityVerification';
import { SignerVerificationPanel } from '@/components/signing/SignerVerificationPanel';

export function SigningFlow({ document, signer }) {
  const [canSign, setCanSign] = useState(false);
  const { isSessionValid } = useIdentityVerification();

  useEffect(() => {
    checkVerification();
  }, [signer.identity_verification_id]);

  const checkVerification = async () => {
    if (signer.identity_verification_id) {
      const isValid = await isSessionValid(signer.identity_verification_id);
      setCanSign(isValid);
    }
  };

  // Si no puede firmar, mostrar panel de verificación
  if (!canSign) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-6">
          Verificación de Identidad Requerida
        </h1>
        
        <SignerVerificationPanel
          signer={signer}
          organizationId={document.organization_id}
          documentId={document.id}
          purpose="fes_signing"
          requireVerification={true}
          onVerificationComplete={() => {
            setCanSign(true);
          }}
        />
      </div>
    );
  }

  // Si puede firmar, mostrar el documento
  return (
    <div>
      <h1>Documento listo para firmar</h1>
      {/* Tu componente de firma aquí */}
    </div>
  );
}
```

### Paso 2: Vincular verificación al firmar

```tsx
// Después de que el usuario firme, vincular la verificación
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

async function handleSign(signerId: string, verificationSessionId: string) {
  const supabase = createClientComponentClient();
  
  // Vincular verificación al firmante
  await supabase.rpc('signing.link_verification_to_signer', {
    p_signer_id: signerId,
    p_verification_session_id: verificationSessionId,
  });
  
  console.log('Verificación vinculada al firmante');
}
```

---

## 📊 Página de Dashboard de Verificaciones

Ejemplo de cómo crear una página para ver todas las verificaciones:

```tsx
'use client';

import { useEffect, useState } from 'react';
import { useIdentityVerification } from '@/hooks/useIdentityVerification';
import { useOrganization } from '@/hooks/useOrganization';
import { VerificationStatusCard } from '@/components/signing/VerificationStatusCard';

export default function VerificationsPage() {
  const { organization } = useOrganization();
  const { getStats } = useIdentityVerification();
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    const data = await getStats(organization.id);
    setStats(data);
  };

  if (!stats) return <div>Cargando...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Verificaciones de Identidad</h1>

      {/* Estadísticas */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-lg border p-4">
          <p className="text-sm text-muted-foreground">Total</p>
          <p className="text-2xl font-bold">{stats.total_sessions}</p>
        </div>
        <div className="rounded-lg border p-4">
          <p className="text-sm text-muted-foreground">Aprobadas</p>
          <p className="text-2xl font-bold text-green-600">{stats.approved}</p>
        </div>
        <div className="rounded-lg border p-4">
          <p className="text-sm text-muted-foreground">Rechazadas</p>
          <p className="text-2xl font-bold text-red-600">{stats.declined}</p>
        </div>
        <div className="rounded-lg border p-4">
          <p className="text-sm text-muted-foreground">Pendientes</p>
          <p className="text-2xl font-bold text-blue-600">{stats.pending}</p>
        </div>
      </div>

      {/* Por propósito */}
      <div className="rounded-lg border p-4">
        <h2 className="text-lg font-semibold mb-4">Por Propósito</h2>
        <div className="space-y-2">
          {Object.entries(stats.by_purpose || {}).map(([purpose, count]: [string, any]) => (
            <div key={purpose} className="flex justify-between">
              <span className="capitalize">{purpose.replace('_', ' ')}</span>
              <span className="font-bold">{count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Score promedio */}
      {stats.avg_risk_score && (
        <div className="rounded-lg border p-4">
          <h2 className="text-lg font-semibold mb-2">Score de Riesgo Promedio</h2>
          <p className="text-3xl font-bold">{stats.avg_risk_score.toFixed(1)}%</p>
        </div>
      )}
    </div>
  );
}
```

---

## 🔔 Notificaciones con Toast

Ejemplo usando toast notifications:

```tsx
import { toast } from 'sonner';
import { useIdentityVerification } from '@/hooks/useIdentityVerification';

export function VerificationWithToast() {
  const { createSession } = useIdentityVerification();

  const handleVerify = async () => {
    toast.promise(
      createSession({
        organizationId: 'org-uuid',
        purpose: 'fes_signing',
        subjectIdentifier: '12345678-9',
        subjectEmail: 'user@example.com',
        subjectName: 'Juan Pérez',
      }),
      {
        loading: 'Creando sesión de verificación...',
        success: (response) => {
          if (response) {
            setTimeout(() => {
              window.location.href = response.verificationUrl;
            }, 500);
            return '¡Redirigiendo a Veriff!';
          }
          return 'Sesión creada';
        },
        error: 'Error al crear sesión',
      }
    );
  };

  return <button onClick={handleVerify}>Verificar</button>;
}
```

---

## 🎨 Personalizaciones

### Cambiar Estilos del Botón

```tsx
<VerifyIdentityButton
  params={{ /* ... */ }}
  variant="outline"     // default | outline | secondary
  size="lg"             // default | sm | lg
  className="w-full"    // Clases adicionales
/>
```

### Deshabilitar Botón Condicionalmente

```tsx
<VerifyIdentityButton
  params={{ /* ... */ }}
  disabled={!rut || !email}  // Tu lógica aquí
/>
```

---

## 🐛 Manejo de Errores

```tsx
const { error, createSession } = useIdentityVerification();

const handleVerify = async () => {
  const response = await createSession({ /* ... */ });
  
  if (error) {
    // Mostrar error al usuario
    console.error('Error:', error);
    return;
  }
  
  // Continuar...
};

// El error se limpia automáticamente en el próximo intento
```

---

## ✅ Checklist de Integración

- [ ] Importar tipos de `@/types/identity-verification`
- [ ] Importar hook `useIdentityVerification`
- [ ] Importar componentes necesarios
- [ ] Obtener `organizationId` actual
- [ ] Definir el `purpose` correcto
- [ ] Pasar datos del usuario (RUT, email, nombre)
- [ ] Manejar el callback `onVerificationStarted`
- [ ] Manejar cambios de estado si es necesario
- [ ] Vincular verificación al finalizar proceso
- [ ] Probar flujo completo end-to-end

---

## 📚 Próximos Pasos

1. **Probar en desarrollo**: Crea una página de prueba con los componentes
2. **Integrar en firmas**: Agregar al flujo de FES
3. **Crear dashboard**: Panel para ver todas las verificaciones
4. **Agregar notificaciones**: Email/WhatsApp cuando se complete verificación

---

¿Tienes dudas? Consulta [`docs/IDENTITY-VERIFICATIONS.md`](./IDENTITY-VERIFICATIONS.md) para más detalles técnicos.
