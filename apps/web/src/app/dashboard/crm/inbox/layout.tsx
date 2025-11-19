/**
 * Layout del Inbox
 * Incluye sidebar con carpetas tipo Gmail
 */

import { FolderSidebar } from '@/components/crm/FolderSidebar';

export default function InboxLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex gap-2 -ml-2 -mr-2 md:-mr-4">
      <FolderSidebar />
      <div className="flex-1 pl-2 pr-2">
        {children}
      </div>
    </div>
  );
}

