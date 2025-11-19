'use client'

import { useRouter } from 'next/navigation'
import { Building2, Check } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@tupatrimonio/ui'
import { useAuthStore } from '@/stores/auth-store'

export default function SelectOrganizationPage() {
  const router = useRouter()
  const { memberships, currentOrganization, setCurrentOrganization } = useAuthStore()

  const handleSelect = (organizationId: string) => {
    const membership = memberships.find(m => m.organization_id === organizationId)
    if (membership) {
      setCurrentOrganization(membership.organization)
      router.push('/dashboard')
    }
  }

  return (
    <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <Building2 className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <CardTitle>Selecciona una organización</CardTitle>
          <CardDescription>
            Elige la organización con la que deseas trabajar
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {memberships.map((membership) => (
              <button
                key={membership.organization_id}
                onClick={() => handleSelect(membership.organization_id)}
                className="w-full flex items-center justify-between p-4 rounded-lg border hover:bg-muted transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <span className="font-medium">
                      {membership.organization.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium">{membership.organization.name}</p>
                    <p className="text-sm text-muted-foreground capitalize">
                      {membership.role.replace('org_', '')}
                    </p>
                  </div>
                </div>
                {currentOrganization?.id === membership.organization_id && (
                  <Check className="h-5 w-5 text-primary" />
                )}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
