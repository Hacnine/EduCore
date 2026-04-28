'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, CheckCheck, Loader2, BookOpen, Award, ClipboardList, MessageSquare } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useNotifications, useMarkNotificationRead, useMarkAllNotificationsRead } from '@/hooks/useNotifications';
import { useAppSelector } from '@/store';
import { cn } from '@/lib/utils';

const typeIcon: Record<string, React.ElementType> = {
  COURSE_UPDATE: BookOpen,
  CERTIFICATE_ISSUED: Award,
  ASSIGNMENT_GRADED: ClipboardList,
  NEW_MESSAGE: MessageSquare,
};

export default function NotificationsPage() {
  const router = useRouter();
  const { user } = useAppSelector((s) => s.auth);
  const { data: notifications, isLoading } = useNotifications();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();

  useEffect(() => {
    if (!user) router.replace('/auth/login');
  }, [user, router]);

  if (!user) return null;

  const unreadCount = notifications?.filter((n) => !n.isRead).length ?? 0;

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-10 max-w-2xl">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">Notifications</h1>
            {unreadCount > 0 && (
              <Badge className="rounded-full">{unreadCount}</Badge>
            )}
          </div>
          {unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => markAllRead.mutate()}
              disabled={markAllRead.isPending}
            >
              {markAllRead.isPending ? (
                <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
              ) : (
                <CheckCheck className="mr-2 h-3.5 w-3.5" />
              )}
              Mark all read
            </Button>
          )}
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-20 w-full rounded-lg" />
            ))}
          </div>
        ) : !notifications?.length ? (
          <div className="text-center py-20">
            <Bell className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground">You have no notifications yet.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map((n) => {
              const Icon = typeIcon[n.type] ?? Bell;
              return (
                <Card
                  key={n.id}
                  className={cn(
                    'flex items-start gap-4 p-4 cursor-pointer hover:bg-muted/40 transition-colors',
                    !n.isRead && 'border-primary/40 bg-primary/5',
                  )}
                  onClick={() => {
                    if (!n.isRead) markRead.mutate(n.id);
                    if (n.link) router.push(n.link);
                  }}
                >
                  <div className={cn('rounded-full p-2 mt-0.5', n.isRead ? 'bg-muted' : 'bg-primary/10')}>
                    <Icon className={cn('h-4 w-4', n.isRead ? 'text-muted-foreground' : 'text-primary')} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={cn('text-sm font-medium', !n.isRead && 'text-foreground')}>{n.title}</p>
                    <p className="text-sm text-muted-foreground mt-0.5">{n.message}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                  {!n.isRead && (
                    <div className="h-2 w-2 rounded-full bg-primary mt-2 shrink-0" />
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
