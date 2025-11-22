import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { CreateCompanyForm } from '@/components/crm/CreateCompanyForm';

export default async function NewCompanyPage() {
  return (
    <div className="container mx-auto py-8 space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard/crm/companies">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Nueva Empresa</h1>
            <p className="text-muted-foreground mt-2">
              Crea una nueva empresa en tu CRM
            </p>
          </div>
        </div>
      </div>

      <CreateCompanyForm />
    </div>
  );
}

