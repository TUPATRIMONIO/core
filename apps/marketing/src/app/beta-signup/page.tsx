import { BetaSignupForm } from '@/components/forms/BetaSignupForm';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Únete al Beta - TuPatrimonio',
  description: 'Sé de los primeros en acceder a la nueva plataforma de TuPatrimonio',
  robots: 'noindex, nofollow', // No indexar esta página (es para iframe)
};

export default function BetaSignupPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-transparent">
      <div className="w-full max-w-md mx-auto p-4">
         {/* Removed background and container styling to be purely transparent for iframe */}
         <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg dark:border-[var(--border)] dark:bg-[var(--card)]">
          <BetaSignupForm embedded={true} />
        </div>
      </div>
    </div>
  );
}
