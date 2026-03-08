import { NextResponse } from 'next/server';
import { getTeamForUser } from '@/lib/db/queries';

export async function GET() {
  const team = await getTeamForUser();
  if (!team) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return NextResponse.json(team);
}
