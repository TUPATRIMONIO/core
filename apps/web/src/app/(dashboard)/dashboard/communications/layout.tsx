import { checkApplicationAccess } from '@/lib/access/check-application-access'
import { AccessDenied } from '@/components/access-denied'

export default async function CommunicationsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Verificar acceso a Communications/Marketing
  // Usamos marketing_site como la app que habilita esta sección
  const hasAccess = await checkApplicationAccess('marketing_site')

  if (!hasAccess) {
    return (
      <AccessDenied 
        applicationName="Communications"
        reason="Esta aplicación no está disponible para tu organización o plan actual."
        showUpgrade={true}
      />
    )
  }

  return <>{children}</>
}
