import { Sidebar } from '@/components/layout/sidebar'
import { TopMenu } from '@/components/layout/top-menu'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className="md:pl-64">
        <TopMenu />
        <main className="p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
