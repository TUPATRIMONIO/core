/**
 * Dashboard Sidebar Colapsable
 * Menú principal del dashboard con opción de colapsar
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { 
  LayoutDashboard, 
  FileText, 
  Globe, 
  Users, 
  Mail,
  Building2,
  Briefcase,
  Ticket,
  Package,
  FileCheck,
  Settings,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

interface DashboardSidebarProps {
  canCRM: boolean;
  isAdmin: boolean;
  crmStats: any;
}

export function DashboardSidebar({ canCRM, isAdmin, crmStats }: DashboardSidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <aside className={`${isCollapsed ? 'w-16' : 'w-64'} flex-shrink-0 relative transition-all duration-200`}>
      {/* Botón de colapsar */}
      <div className="mb-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="w-full justify-center"
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 w-4" />}
        </Button>
      </div>

      <nav className="space-y-1 pr-2">
        <Link
          href="/dashboard"
          title={isCollapsed ? "Inicio" : undefined}
          className="flex items-center px-4 py-2 text-foreground hover:bg-accent rounded-lg transition-colors"
        >
          <LayoutDashboard className="h-4 w-4 mr-3" />
          {!isCollapsed && "Inicio"}
        </Link>

        {canCRM && (
          <>
            {!isCollapsed && (
              <div className="mt-4 mb-2">
                <div className="px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  CRM
                </div>
              </div>
            )}
            
            <Link
              href="/dashboard/crm"
              title={isCollapsed ? "Dashboard CRM" : undefined}
              className="flex items-center px-4 py-2 text-foreground hover:bg-accent rounded-lg transition-colors"
            >
              <LayoutDashboard className="h-4 w-4 mr-3" />
              {!isCollapsed && "Dashboard CRM"}
            </Link>

            <Link
              href="/dashboard/crm/contacts"
              title={isCollapsed ? "Contactos" : undefined}
              className="flex items-center px-4 py-2 text-foreground hover:bg-accent rounded-lg transition-colors"
            >
              <Users className="h-4 w-4 mr-3" />
              {!isCollapsed && "Contactos"}
              {!isCollapsed && crmStats && crmStats.new_contacts > 0 && (
                <span className="ml-auto px-2 py-0.5 text-xs bg-[var(--tp-brand)] text-white rounded-full">
                  {crmStats.new_contacts}
                </span>
              )}
            </Link>

            <Link
              href="/dashboard/crm/companies"
              title={isCollapsed ? "Empresas" : undefined}
              className="flex items-center px-4 py-2 text-foreground hover:bg-accent rounded-lg transition-colors"
            >
              <Building2 className="h-4 w-4 mr-3" />
              {!isCollapsed && "Empresas"}
            </Link>

            <Link
              href="/dashboard/crm/deals"
              title={isCollapsed ? "Negocios" : undefined}
              className="flex items-center px-4 py-2 text-foreground hover:bg-accent rounded-lg transition-colors"
            >
              <Briefcase className="h-4 w-4 mr-3" />
              {!isCollapsed && "Negocios"}
            </Link>

            <Link
              href="/dashboard/crm/tickets"
              title={isCollapsed ? "Tickets" : undefined}
              className="flex items-center px-4 py-2 text-foreground hover:bg-accent rounded-lg transition-colors"
            >
              <Ticket className="h-4 w-4 mr-3" />
              {!isCollapsed && "Tickets"}
              {!isCollapsed && crmStats && crmStats.open_tickets > 0 && (
                <span className="ml-auto px-2 py-0.5 text-xs bg-orange-500 text-white rounded-full">
                  {crmStats.open_tickets}
                </span>
              )}
            </Link>

            <Link
              href="/dashboard/crm/products"
              title={isCollapsed ? "Productos" : undefined}
              className="flex items-center px-4 py-2 text-foreground hover:bg-accent rounded-lg transition-colors"
            >
              <Package className="h-4 w-4 mr-3" />
              {!isCollapsed && "Productos"}
            </Link>

            <Link
              href="/dashboard/crm/quotes"
              title={isCollapsed ? "Cotizaciones" : undefined}
              className="flex items-center px-4 py-2 text-foreground hover:bg-accent rounded-lg transition-colors"
            >
              <FileCheck className="h-4 w-4 mr-3" />
              {!isCollapsed && "Cotizaciones"}
            </Link>

            <Link
              href="/dashboard/crm/inbox"
              title={isCollapsed ? "Inbox" : undefined}
              className="flex items-center px-4 py-2 text-foreground hover:bg-accent rounded-lg transition-colors"
            >
              <Mail className="h-4 w-4 mr-3" />
              {!isCollapsed && "Inbox"}
              {!isCollapsed && crmStats && crmStats.unread_emails > 0 && (
                <span className="ml-auto px-2 py-0.5 text-xs bg-blue-500 text-white rounded-full">
                  {crmStats.unread_emails}
                </span>
              )}
            </Link>

            {!isCollapsed && (
              <div className="mt-4 mb-2">
                <div className="px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Configuración
                </div>
              </div>
            )}

            <Link
              href="/dashboard/crm/settings/email-accounts"
              title={isCollapsed ? "Cuentas de Email" : undefined}
              className="flex items-center px-4 py-2 text-foreground hover:bg-accent rounded-lg transition-colors"
            >
              <Settings className="h-4 w-4 mr-3" />
              {!isCollapsed && "Cuentas de Email"}
            </Link>
          </>
        )}

        {isAdmin && (
          <>
            {!isCollapsed && (
              <div className="mt-4 mb-2">
                <div className="px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Administración
                </div>
              </div>
            )}

            <div className="space-y-1">
              <Link
                href="/dashboard/blog"
                title={isCollapsed ? "Blog" : undefined}
                className="flex items-center px-4 py-2 text-foreground hover:bg-accent rounded-lg transition-colors"
              >
                <FileText className="h-4 w-4 mr-3" />
                {!isCollapsed && "Blog"}
              </Link>
              {!isCollapsed && (
                <>
                  <Link
                    href="/dashboard/blog/categories"
                    className="flex items-center px-4 py-2 pl-11 text-sm text-muted-foreground hover:bg-accent rounded-lg transition-colors"
                  >
                    Categorías
                  </Link>
                  <Link
                    href="/dashboard/blog/media"
                    className="flex items-center px-4 py-2 pl-11 text-sm text-muted-foreground hover:bg-accent rounded-lg transition-colors"
                  >
                    Galería
                  </Link>
                </>
              )}
            </div>

            <Link
              href="/dashboard/pages"
              title={isCollapsed ? "Páginas" : undefined}
              className="flex items-center px-4 py-2 text-foreground hover:bg-accent rounded-lg transition-colors"
            >
              <Globe className="h-4 w-4 mr-3" />
              {!isCollapsed && "Páginas"}
            </Link>

            <Link
              href="/dashboard/users"
              title={isCollapsed ? "Usuarios" : undefined}
              className="flex items-center px-4 py-2 text-foreground hover:bg-accent rounded-lg transition-colors"
            >
              <Users className="h-4 w-4 mr-3" />
              {!isCollapsed && "Usuarios"}
            </Link>
          </>
        )}
      </nav>
    </aside>
  );
}
