'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  LayoutDashboard, 
  FileText, 
  FolderOpen, 
  Image, 
  Settings 
} from 'lucide-react'
import { cn } from '@/lib/utils'

const menuItems = [
  {
    title: 'Dashboard',
    href: '/admin/dashboard',
    icon: LayoutDashboard,
  },
  {
    title: 'Posts',
    href: '/admin/blog',
    icon: FileText,
  },
  {
    title: 'Categorías',
    href: '/admin/blog/categories',
    icon: FolderOpen,
  },
  {
    title: 'Media',
    href: '/admin/media',
    icon: Image,
  },
  {
    title: 'Configuración',
    href: '/admin/settings',
    icon: Settings,
  },
]

export default function AdminSidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-64 bg-white border-r min-h-screen p-6">
      <div className="mb-8">
        <h2 className="text-xl font-bold text-[var(--tp-brand)]">
          TuPatrimonio
        </h2>
        <p className="text-sm text-gray-500">Panel de Administración</p>
      </div>

      <nav className="space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon
          // Verificación más específica para evitar que /admin/blog y /admin/blog/categories estén activos al mismo tiempo
          const isActive = pathname === item.href || 
            (pathname.startsWith(item.href + '/') && 
             // Si es /admin/blog, solo activar si no es una subruta específica como categories
             !(item.href === '/admin/blog' && pathname.includes('/categories')))
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-md transition-colors',
                isActive
                  ? 'bg-[var(--tp-brand)] text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              )}
            >
              <Icon className="w-5 h-5" />
              <span>{item.title}</span>
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}

