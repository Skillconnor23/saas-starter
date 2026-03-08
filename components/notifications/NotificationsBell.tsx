'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import useSWR, { mutate } from 'swr';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  markNotificationSeenAction,
  markAllNotificationsSeenAction,
} from '@/lib/actions/notifications';
import { userFetcher } from '@/lib/fetchers';

type Notification = {
  id: string;
  type: string;
  title: string;
  body: string | null;
  href: string;
  createdAt: string;
  seenAt: string | null;
};

type NotificationsData = {
  notifications: Notification[];
  unseenCount: number;
  unseenMessageCount: number;
};

function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const sec = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (sec < 60) return 'just now';
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const d = Math.floor(hr / 24);
  if (d < 7) return `${d}d ago`;
  return date.toLocaleDateString();
}

const fetcher = (url: string) =>
  fetch(url).then(async (res) => {
    if (res.status === 401) return null;
    if (!res.ok) throw new Error('Failed to fetch');
    return res.json();
  });

/** Mark all as read and keep SWR in sync (optimistic update then revalidate). */
async function markAllReadAndRevalidate(
  currentData: NotificationsData | undefined,
  mutateFn: (data?: NotificationsData, opts?: { revalidate?: boolean }) => Promise<NotificationsData | undefined>
) {
  if (!currentData || currentData.unseenCount === 0) return;
  const nowIso = new Date().toISOString();
  const optimistic: NotificationsData = {
    notifications: currentData.notifications.map((n) => ({
      ...n,
      seenAt: n.seenAt ?? nowIso,
    })),
    unseenCount: 0,
    unseenMessageCount: 0,
  };
  void mutateFn(optimistic, { revalidate: false });
  await markAllNotificationsSeenAction();
  void mutateFn();
}

export function NotificationsBell() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { data: user } = useSWR('/api/user', userFetcher);
  const { data, mutate: mutateNotifications } = useSWR<NotificationsData>(
    user ? '/api/notifications' : null,
    fetcher
  );

  useEffect(() => setMounted(true), []);

  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      setOpen(nextOpen);
      if (nextOpen && (data?.unseenCount ?? 0) > 0) {
        void markAllReadAndRevalidate(data, mutateNotifications);
      }
    },
    [data, mutateNotifications]
  );

  async function handleNotificationClick(notification: Notification) {
    if (!notification.seenAt) {
      await markNotificationSeenAction(notification.id);
      void mutate('/api/notifications');
    }
    setOpen(false);
    router.push(notification.href);
  }

  async function handleMarkAllRead() {
    await markAllReadAndRevalidate(data, mutateNotifications);
    setOpen(false);
  }

  if (!user) return null;

  const unseenCount = data?.unseenCount ?? 0;

  const triggerButton = (
    <Button
      variant="ghost"
      size="icon"
      className="relative"
      aria-label="Notifications"
    >
      <Bell className="h-5 w-5" />
      {unseenCount > 0 && (
        <span
          className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-medium text-destructive-foreground"
          aria-hidden
        >
          {unseenCount > 99 ? '99+' : unseenCount}
        </span>
      )}
    </Button>
  );

  if (!mounted) {
    return triggerButton;
  }

  return (
    <DropdownMenu open={open} onOpenChange={handleOpenChange}>
      <DropdownMenuTrigger asChild>
        {triggerButton}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notifications</span>
          {unseenCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={handleMarkAllRead}
            >
              Mark all as read
            </Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {!data ? (
          <div className="py-4 text-center text-sm text-muted-foreground">
            Loading…
          </div>
        ) : data.notifications.length === 0 ? (
          <div className="py-6 text-center text-sm text-muted-foreground">
            No notifications yet.
          </div>
        ) : (
          data.notifications.map((n) => (
            <DropdownMenuItem
              key={n.id}
              className="flex cursor-pointer flex-col items-start gap-0.5 py-3"
              onClick={() => handleNotificationClick(n)}
            >
              <span
                className={`font-medium ${
                  !n.seenAt ? 'text-foreground' : 'text-muted-foreground'
                }`}
              >
                {n.title}
              </span>
              <span className="text-xs text-muted-foreground">
                {formatRelativeTime(n.createdAt)}
              </span>
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
