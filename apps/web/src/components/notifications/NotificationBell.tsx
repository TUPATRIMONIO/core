'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Bell } from 'lucide-react';
import { NotificationsList } from './NotificationsList';

interface NotificationBellProps {
  orgId: string;
  userId: string;
}

export function NotificationBell({ orgId, userId }: NotificationBellProps) {
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    loadUnreadCount();
    
    // Suscribirse a cambios en tiempo real
    const supabase = createClient();
    const channel = supabase
      .channel('notifications-count')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `organization_id=eq.${orgId}`,
        },
        () => {
          loadUnreadCount();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [orgId]);

  async function loadUnreadCount() {
    try {
      const supabase = createClient();
      
      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', orgId)
        .or(`user_id.is.null,user_id.eq.${userId}`)
        .eq('status', 'unread');

      if (error) throw error;

      setUnreadCount(count || 0);
    } catch (error: any) {
      console.error('Error loading unread count:', error);
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0" align="end">
        <NotificationsList orgId={orgId} userId={userId} limit={10} />
      </PopoverContent>
    </Popover>
  );
}

