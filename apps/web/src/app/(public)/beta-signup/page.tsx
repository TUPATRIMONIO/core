import { BetaSignupForm } from '@/components/forms/BetaSignupForm';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Únete al Beta - TuPatrimonio',
  description: 'Sé de los primeros en acceder a la nueva plataforma de TuPatrimonio',
  robots: 'noindex, nofollow', // No indexar esta página (es para iframe)
};

export default function BetaSignupPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="w-full max-w-md">
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800">
          <BetaSignupForm embedded={true} />
        </div>
      </div>
    </div>
  );
}
