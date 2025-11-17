/**
 * FolderSidebar Component
 * Sidebar con carpetas tipo Gmail (Inbox, Sent, Archived, Custom)
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { 
  Inbox, 
  Send, 
  Archive, 
  AlertOctagon, 
  Trash2,
  Folder,
  Plus,
  ChevronLeft,
  ChevronRight,
  Menu
} from 'lucide-react';

interface FolderItem {
  id: string;
  name: string;
  type: 'system' | 'custom';
  icon: string;
  color: string;
  sort_order: number;
  unread_count?: number;
}

const ICON_MAP: Record<string, any> = {
  'Inbox': Inbox,
  'Send': Send,
  'Archive': Archive,
  'AlertOctagon': AlertOctagon,
  'Trash2': Trash2,
  'Folder': Folder
};

export function FolderSidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [folders, setFolders] = useState<FolderItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  const currentFolder = searchParams.get('folder') || 'Inbox';

  useEffect(() => {
    loadFolders();
  }, []);

  async function loadFolders() {
    try {
      setIsLoading(true);
      const response = await fetch('/api/crm/folders');
      
      if (!response.ok) {
        throw new Error('Failed to load folders');
      }

      const { data } = await response.json();
      setFolders(data || []);
    } catch (error) {
      console.error('Error loading folders:', error);
    } finally {
      setIsLoading(false);
    }
  }

  const isActive = (folderName: string) => {
    return currentFolder === folderName;
  };

  const navigateToFolder = (folderName: string) => {
    // Mantener todos los query params excepto folder
    const params = new URLSearchParams(searchParams.toString());
    
    if (folderName === 'Inbox') {
      params.delete('folder'); // Inbox es el default
    } else {
      params.set('folder', folderName);
    }
    
    // Actualizar URL sin navegar (mantiene todos los filtros)
    const newUrl = params.toString() 
      ? `/dashboard/crm/inbox?${params.toString()}`
      : '/dashboard/crm/inbox';
    
    router.push(newUrl);
  };

  if (isLoading) {
    return (
      <div className={`${isCollapsed ? 'w-16' : 'w-64'} border-r border-border p-2 transition-all duration-200`}>
        <p className="text-sm text-gray-500">...</p>
      </div>
    );
  }

  return (
    <div className={`${isCollapsed ? 'w-16' : 'w-64'} border-r border-border p-2 space-y-1 transition-all duration-200 relative`}>
      {/* Botón de colapsar */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="mb-2 w-full justify-center"
      >
        {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
      </Button>

      {!isCollapsed && (
        <div className="mb-4">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-2">
            Carpetas
          </h3>
        </div>
      )}

      {folders.map(folder => {
        const IconComponent = ICON_MAP[folder.icon] || Folder;
        const active = isActive(folder.name);

        return (
          <button
            key={folder.id}
            onClick={() => navigateToFolder(folder.name)}
            title={isCollapsed ? folder.name : undefined}
            className={`
              w-full flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} px-3 py-2 rounded-lg text-sm transition-colors
              ${active 
                ? 'bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-medium' 
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
              }
            `}
          >
            {isCollapsed ? (
              <div className="relative">
                <IconComponent 
                  className="w-5 h-5" 
                  style={{ color: active ? undefined : folder.color }}
                />
                {folder.unread_count && folder.unread_count > 0 && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full"></span>
                )}
              </div>
            ) : (
              <>
                <div className="flex items-center gap-3">
                  <IconComponent 
                    className="w-4 h-4" 
                    style={{ color: active ? undefined : folder.color }}
                  />
                  <span>{folder.name}</span>
                </div>

                {folder.unread_count && folder.unread_count > 0 && (
                  <span className="px-2 py-0.5 text-xs bg-blue-500 text-white rounded-full">
                    {folder.unread_count}
                  </span>
                )}
              </>
            )}
          </button>
        );
      })}

      {/* Botón Nueva Carpeta */}
      {!isCollapsed && (
        <div className="mt-6 pt-4 border-t border-border">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-gray-600 dark:text-gray-400"
            onClick={() => {
              const name = prompt('Nombre de la carpeta:');
              if (name) createFolder(name);
            }}
          >
            <Plus className="w-4 h-4 mr-2" />
            Nueva Carpeta
          </Button>
        </div>
      )}
    </div>
  );

  async function createFolder(name: string) {
    try {
      const response = await fetch('/api/crm/folders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name })
      });

      if (!response.ok) throw new Error('Failed to create folder');

      loadFolders(); // Recargar lista
    } catch (error) {
      console.error('Error creating folder:', error);
      alert('No se pudo crear la carpeta');
    }
  }
}

