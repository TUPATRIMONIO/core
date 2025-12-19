import { checkApplicationAccess } from '@/lib/access/check-application-access'
import { AccessDenied } from '@/components/access-denied'

export default async function SigningLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Verificar acceso a Firma Electrónica
  const hasAccess = await checkApplicationAccess('signatures')

  if (!hasAccess) {
    return (
      <AccessDenied 
        applicationName="Firma Electrónica"
        reason="Esta aplicación no está disponible para tu organización o plan actual."
        showUpgrade={true}
      />
    )
  }

  return <>{children}</>
}
