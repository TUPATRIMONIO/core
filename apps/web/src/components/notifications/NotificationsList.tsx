'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bell, Check, X, ExternalLink } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface Notification {
  id: string;
  type: string;
  status: 'unread' | 'read' | 'archived';
  title: string;
  message: string;
  action_url?: string;
  action_label?: string;
  created_at: string;
  read_at?: string;
}

interface NotificationsListProps {
  orgId: string;
  userId: string;
  limit?: number;
}

export function NotificationsList({ orgId, userId, limit = 10 }: NotificationsListProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    loadNotifications();
    
    // Suscribirse a cambios en tiempo real
    const supabase = createClient();
    const channel = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `organization_id=eq.${orgId}`,
        },
        () => {
          loadNotifications();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [orgId]);

  async function loadNotifications() {
    try {
      const supabase = createClient();
      
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('organization_id', orgId)
        .or(`user_id.is.null,user_id.eq.${userId}`)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      setNotifications(data || []);
      setUnreadCount(data?.filter(n => n.status === 'unread').length || 0);
    } catch (error: any) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  }

  async function markAsRead(notificationId: string) {
    try {
      const supabase = createClient();
      
      const { error } = await supabase
        .from('notifications')
        .update({ status: 'read', read_at: new Date().toISOString() })
        .eq('id', notificationId);

      if (error) throw error;

      // Actualizar estado local
      setNotifications(prev =>
        prev.map(n =>
          n.id === notificationId
            ? { ...n, status: 'read' as const, read_at: new Date().toISOString() }
            : n
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error: any) {
      console.error('Error marking notification as read:', error);
    }
  }

  async function markAllAsRead() {
    try {
      const supabase = createClient();
      
      const { error } = await supabase.rpc('mark_all_notifications_read', {
        org_id_param: orgId,
        user_id_param: userId,
      });

      if (error) throw error;

      // Actualizar estado local
      setNotifications(prev =>
        prev.map(n => ({ ...n, status: 'read' as const, read_at: new Date().toISOString() }))
      );
      setUnreadCount(0);
    } catch (error: any) {
      console.error('Error marking all as read:', error);
    }
  }

  function getNotificationIcon(type: string) {
    switch (type) {
      case 'credits_added':
      case 'payment_succeeded':
      case 'auto_recharge_executed':
        return '✅';
      case 'credits_low':
      case 'payment_failed':
      case 'auto_recharge_failed':
        return '⚠️';
      case 'subscription_cancelled':
        return '❌';
      default:
        return 'ℹ️';
    }
  }

  function getNotificationColor(type: string) {
    switch (type) {
      case 'credits_added':
      case 'payment_succeeded':
      case 'auto_recharge_executed':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'credits_low':
      case 'payment_failed':
      case 'auto_recharge_failed':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'subscription_cancelled':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notificaciones
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Cargando notificaciones...</p>
        </CardContent>
      </Card>
    );
  }

  if (notifications.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notificaciones
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No hay notificaciones</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notificaciones
            {unreadCount > 0 && (
              <Badge variant="destructive" className="ml-2">
                {unreadCount}
              </Badge>
            )}
          </CardTitle>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={markAllAsRead}
              className="text-xs"
            >
              Marcar todas como leídas
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className={`p-3 rounded-lg border ${
              notification.status === 'unread'
                ? 'bg-[var(--tp-background-light)] dark:bg-[var(--tp-background-dark)] border-[var(--tp-buttons-20)]'
                : 'bg-background border-border'
            }`}
          >
            <div className="flex items-start gap-3">
              <div className="text-xl">{getNotificationIcon(notification.type)}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium text-sm">{notification.title}</p>
                      <Badge
                        variant="outline"
                        className={`text-xs ${getNotificationColor(notification.type)}`}
                      >
                        {notification.type.replace(/_/g, ' ')}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      {notification.message}
                    </p>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(notification.created_at), {
                          addSuffix: true,
                          locale: es,
                        })}
                      </span>
                      {notification.action_url && notification.action_label && (
                        <a
                          href={notification.action_url}
                          className="text-xs text-[var(--tp-buttons)] hover:underline flex items-center gap-1"
                          onClick={() => markAsRead(notification.id)}
                        >
                          {notification.action_label}
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </div>
                  </div>
                  {notification.status === 'unread' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => markAsRead(notification.id)}
                      className="h-6 w-6 p-0"
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

