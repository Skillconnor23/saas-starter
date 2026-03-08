import type { SafeUserDto } from '@/lib/dto/safe-user';

/** Fetcher for /api/user. Returns null on 401 (unauthenticated). */
export async function userFetcher(url: string): Promise<SafeUserDto | null> {
  const res = await fetch(url);
  if (res.status === 401) return null;
  if (!res.ok) throw new Error('Failed to fetch user');
  const data = await res.json();
  return data as SafeUserDto | null;
}
