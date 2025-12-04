import { checkApplicationAccess } from '@/lib/access/check-application-access'
import { AccessDenied } from '@/components/access-denied'

export default async function CRMLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Verificar acceso a CRM
  const hasAccess = await checkApplicationAccess('crm_sales')

  if (!hasAccess) {
    return (
      <AccessDenied 
        applicationName="CRM Sales"
        reason="Esta aplicación no está disponible para tu organización o plan actual."
        showUpgrade={true}
      />
    )
  }

  return <>{children}</>
}





