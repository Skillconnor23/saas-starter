import { NextResponse } from 'next/server';
import { requireApiAuth } from '@/lib/auth/api-auth';
import {
  getNotifications,
  getUnseenNotificationCount,
  getUnseenMessageNotificationCount,
} from '@/lib/db/queries/notifications';

export async function GET() {
  const auth = await requireApiAuth();
  if (auth.response) return auth.response;

  const [notifications, unseenCount, unseenMessageCount] = await Promise.all([
    getNotifications(auth.user.id, 20),
    getUnseenNotificationCount(auth.user.id),
    getUnseenMessageNotificationCount(auth.user.id),
  ]);

  return NextResponse.json({
    notifications,
    unseenCount,
    unseenMessageCount,
  });
}
