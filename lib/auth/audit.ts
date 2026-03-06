import { db } from '@/lib/db/drizzle';
import { auditLogs } from '@/lib/db/schema';
import type { AuditLogAction } from '@/lib/db/schema';

export async function createAuditLog(params: {
  action: AuditLogAction;
  userId?: number | null;
  metadata?: Record<string, unknown>;
  ipAddress?: string | null;
}) {
  await db.insert(auditLogs).values({
    action: params.action,
    userId: params.userId ?? null,
    metadata: params.metadata ?? null,
    ipAddress: params.ipAddress ?? null,
  });
}
