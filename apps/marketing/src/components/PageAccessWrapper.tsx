/**
 * Componente Wrapper para Control de Acceso a Páginas
 * 
 * Proporciona protección automática de páginas basada en:
 * - Estado de publicación (público, borrador, privado)  
 * - Rol de usuario
 * - Configuración SEO
 */

'use client';

import React, { Suspense } from 'react';
import { usePageAccess } from '@/hooks/usePageAccess';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, Eye, EyeOff, Search, Clock } from 'lucide-react';

interface PageAccessWrapperProps {
  children: React.ReactNode;
  /** Ruta específica a verificar. Si no se proporciona, usa la ruta actual */
  routePath?: string;
  /** Página personalizada para mostrar cuando no hay acceso */
  fallbackComponent?: React.ComponentType;
  /** Si debe mostrar indicadores de estado para administradores */
  showAdminIndicators?: boolean;
  /** Si debe redirigir automáticamente en lugar de mostrar fallback */
  autoRedirect?: boolean;
  /** Página de destino para redirecciones (default: 404) */
  redirectTo?: string;
}

/**
 * Componente de carga personalizable
 */
function LoadingSpinner({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center py-8 ${className}`}>
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--tp-buttons)]"></div>
      <span className="ml-3 text-gray-600">Verificando acceso...</span>
    </div>
  );
}

/**
 * Componente de acceso denegado
 */
function AccessDenied({ 
  pageConfig, 
  userRole,
  FallbackComponent 
}: { 
  pageConfig: any; 
  userRole: string;
  FallbackComponent?: React.ComponentType;
}) {
  if (FallbackComponent) {
    return <FallbackComponent />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-[var(--tp-background-light)] to-white flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-6">
          <Shield className="h-8 w-8 text-gray-400" />
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Página no disponible
        </h1>
        
        <p className="text-gray-600 mb-8">
          {pageConfig?.status === 'draft' 
            ? 'Esta página está en desarrollo y no está disponible públicamente.'
            : pageConfig?.status === 'private'
            ? 'Esta página requiere permisos especiales para acceder.'
            : 'Lo sentimos, esta página no está disponible en este momento.'
          }
        </p>

        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-center space-x-4 text-sm text-gray-500">
            <div className="flex items-center">
              <Clock className="h-4 w-4 mr-1" />
              Estado: {pageConfig?.status || 'No definido'}
            </div>
            {userRole !== 'public' && (
              <div className="flex items-center">
                <Shield className="h-4 w-4 mr-1" />
                Tu rol: {userRole}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-3">
          <button
            onClick={() => window.history.back()}
            className="w-full bg-[var(--tp-buttons)] hover:bg-[var(--tp-buttons-hover)] text-white font-medium py-3 px-6 rounded-lg transition-colors"
          >
            Volver atrás
          </button>
          
          <a
            href="/"
            className="block w-full border border-[var(--tp-buttons)] text-[var(--tp-buttons)] hover:bg-[var(--tp-buttons)] hover:text-white font-medium py-3 px-6 rounded-lg transition-colors"
          >
            Ir al inicio
          </a>
        </div>
      </div>
    </div>
  );
}

/**
 * Indicadores de estado para administradores
 */
function AdminStatusIndicators({ pageConfig, userRole }: { pageConfig: any; userRole: string }) {
  if (!['admin', 'super_admin'].includes(userRole)) {
    return null;
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'public': return 'bg-green-100 text-green-800 border-green-200';
      case 'draft': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'private': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="fixed top-4 right-4 z-50 max-w-sm">
      <Alert className={`${getStatusColor(pageConfig.status)} border backdrop-blur-sm`}>
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1">
            <Shield className="h-4 w-4" />
            <span className="text-xs font-medium">
              {pageConfig.status.toUpperCase()}
            </span>
          </div>
          
          <div className="flex items-center space-x-1">
            {pageConfig.seo_index ? (
              <Search className="h-4 w-4 text-green-600" />
            ) : (
              <EyeOff className="h-4 w-4 text-gray-400" />
            )}
            <span className="text-xs">
              {pageConfig.seo_index ? 'Indexable' : 'No Index'}
            </span>
          </div>
        </div>
        
        <AlertDescription className="text-xs mt-1">
          Roles permitidos: {pageConfig.allowed_roles?.join(', ') || 'Ninguno'}
        </AlertDescription>
      </Alert>
    </div>
  );
}

/**
 * Componente principal PageAccessWrapper
 */
export function PageAccessWrapper({
  children,
  routePath,
  fallbackComponent: FallbackComponent,
  showAdminIndicators = true,
  autoRedirect = false,
  redirectTo = '/404'
}: PageAccessWrapperProps) {
  const {
    isLoading,
    hasAccess,
    pageConfig,
    userRole,
    error
  } = usePageAccess({
    redirectTo404: autoRedirect,
    showLoadingState: true
  });

  // Mostrar loading spinner mientras verifica acceso
  if (isLoading) {
    return <LoadingSpinner />;
  }

  // Si hay error pero queremos ser conservadores, mostrar contenido
  if (error && hasAccess) {
    console.warn('PageAccessWrapper error but allowing access:', error);
  }

  // Si no tiene acceso, mostrar página de acceso denegado
  if (!hasAccess) {
    return (
      <AccessDenied 
        pageConfig={pageConfig}
        userRole={userRole}
        FallbackComponent={FallbackComponent}
      />
    );
  }

  // Usuario tiene acceso, renderizar contenido con indicadores opcionales
  return (
    <>
      {showAdminIndicators && (
        <AdminStatusIndicators 
          pageConfig={pageConfig} 
          userRole={userRole} 
        />
      )}
      {children}
    </>
  );
}

/**
 * HOC para proteger páginas automáticamente
 */
export function withPageAccess<T extends object>(
  Component: React.ComponentType<T>,
  options?: Omit<PageAccessWrapperProps, 'children'>
) {
  return function ProtectedPage(props: T) {
    return (
      <PageAccessWrapper {...options}>
        <Component {...props} />
      </PageAccessWrapper>
    );
  };
}

/**
 * Wrapper específico para páginas de blog
 */
export function BlogPageWrapper({ 
  children, 
  slug,
  showAdminControls = true 
}: { 
  children: React.ReactNode; 
  slug?: string;
  showAdminControls?: boolean;
}) {
  const routePath = slug ? `/blog/${slug}` : '/blog';
  
  return (
    <PageAccessWrapper 
      routePath={routePath}
      showAdminIndicators={showAdminControls}
      autoRedirect={false}
    >
      {children}
    </PageAccessWrapper>
  );
}

/**
 * Wrapper específico para páginas de país
 */
export function CountryPageWrapper({ 
  children, 
  countryCode,
  pageType = 'home',
  showAdminControls = true 
}: { 
  children: React.ReactNode; 
  countryCode: string;
  pageType?: string;
  showAdminControls?: boolean;
}) {
  const routePath = pageType === 'home' 
    ? `/${countryCode}` 
    : `/${countryCode}/${pageType}`;
  
  return (
    <PageAccessWrapper 
      routePath={routePath}
      showAdminIndicators={showAdminControls}
      autoRedirect={false}
    >
      {children}
    </PageAccessWrapper>
  );
}

export default PageAccessWrapper;
