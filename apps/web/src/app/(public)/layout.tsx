import { Toaster } from 'sonner';
import { OrganizationProvider } from '@/providers/OrganizationProvider';
import { GlobalCountryProvider } from '@/providers/GlobalCountryProvider';

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <OrganizationProvider>
      <GlobalCountryProvider>
        {children}
        <Toaster />
      </GlobalCountryProvider>
    </OrganizationProvider>
  );
}
