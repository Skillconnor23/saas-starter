import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/user';
import { getCalendarEventsForStudent } from '@/lib/schedule/calendar-events';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: Request) {
  const user = await requireRole(['student']);
  const { searchParams } = new URL(request.url);
  const startStr = searchParams.get('start');
  const endStr = searchParams.get('end');

  if (!startStr || !endStr) {
    return NextResponse.json({ error: 'Missing start or end' }, { status: 400 });
  }

  const start = new Date(startStr);
  const end = new Date(endStr);

  const events = await getCalendarEventsForStudent(user.id, start, end);
  return NextResponse.json(
    events.map((e) => ({
      ...e,
      startsAt: e.startsAt.toISOString(),
      endsAt: e.endsAt.toISOString(),
    }))
  );
}
