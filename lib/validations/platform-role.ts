import { z } from 'zod';
import { platformRoleEnum } from '@/lib/db/schema';

export const platformRoleSchema = z.enum(platformRoleEnum);

export type PlatformRoleInput = z.infer<typeof platformRoleSchema>;

/** Only 'student' - for self-service onboarding. Elevated roles are invitation-only. */
export const selfServePlatformRoleSchema = z.literal('student');
