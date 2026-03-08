import { NextResponse } from 'next/server';
import { requireApiRole } from '@/lib/auth/api-auth';
import { getCalendarEventsForStudent } from '@/lib/schedule/calendar-events';
import { parseAndValidateDateRange } from '@/lib/api/validate-date-range';

export async function GET(request: Request) {
  const auth = await requireApiRole(['student']);
  if (auth.response) return auth.response;
  const user = auth.user;

  const { searchParams } = new URL(request.url);
  const startStr = searchParams.get('start');
  const endStr = searchParams.get('end');

  const parsed = parseAndValidateDateRange(startStr, endStr);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const { start, end } = parsed;
  const events = await getCalendarEventsForStudent(user.id, start, end);
  return NextResponse.json(
    events.map((e) => ({
      ...e,
      startsAt: e.startsAt.toISOString(),
      endsAt: e.endsAt.toISOString(),
    }))
  );
}
