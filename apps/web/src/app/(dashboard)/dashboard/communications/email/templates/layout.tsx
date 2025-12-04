import { checkApplicationAccess } from '@/lib/access/check-application-access'
import { AccessDenied } from '@/components/access-denied'

export default async function TemplatesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Verificar acceso a Email Marketing
  const hasAccess = await checkApplicationAccess('email_marketing')

  if (!hasAccess) {
    return (
      <AccessDenied 
        applicationName="Email Marketing"
        reason="Esta aplicación no está disponible para tu organización o plan actual."
        showUpgrade={true}
      />
    )
  }

  return <>{children}</>
}





