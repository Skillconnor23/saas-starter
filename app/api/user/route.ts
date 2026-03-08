import { NextResponse } from 'next/server';
import { requireApiAuth } from '@/lib/auth/api-auth';
import { toSafeUserDto } from '@/lib/dto/safe-user';

export async function GET() {
  const auth = await requireApiAuth();
  if (auth.response) return auth.response;
  const dto = toSafeUserDto(auth.user);
  return NextResponse.json(dto);
}
