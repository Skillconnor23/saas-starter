'use server';

import { PutObjectCommand } from '@aws-sdk/client-s3';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { redirectWithLocale } from '@/lib/i18n/redirect';
import { getUser } from '@/lib/db/queries';
import { getR2, getR2Bucket, getR2PublicBaseUrl } from '@/lib/r2';
import {
  listHomeworkForStudent,
  getHomeworkWithSubmission,
  listHomeworkForAdmin,
  listSubmissionsForHomework,
  getHomeworkById,
  createHomework,
  upsertHomeworkSubmission,
  updateHomeworkSubmissionFeedback,
} from '@/lib/db/queries/homework';
import { canPostToClassroom } from '@/lib/auth/classroom';
import { studentEnrolledInClass } from '@/lib/db/queries/education';
import { listClassesForTeacher } from '@/lib/db/queries/education';
import { listClasses } from '@/lib/db/queries/education';
import { can } from '@/lib/auth/permissions';
import type { PlatformRole } from '@/lib/db/schema';

/** Allowed MIME types for student submissions: images + audio. */
const SUBMISSION_ALLOWED_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'audio/mpeg',
  'audio/mp3',
  'audio/m4a',
  'audio/x-m4a',
  'audio/wav',
  'audio/wave',
] as const;

/** Allowed for teacher worksheet (images, PDF, common docs). */
const WORKSHEET_ALLOWED_TYPES = [
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/webp',
] as const;

const MAX_SUBMISSION_FILE_SIZE = 20 * 1024 * 1024; // 20 MB
const MAX_WORKSHEET_SIZE = 20 * 1024 * 1024; // 20 MB

export type UploadHomeworkFileResult =
  | { success: true; url: string }
  | { success: false; error: string };

export async function uploadHomeworkSubmissionFileAction(
  _prev: unknown,
  formData: FormData
): Promise<UploadHomeworkFileResult> {
  const user = await getUser();
  if (!user) return { success: false, error: 'Not signed in.' };

  const file = formData.get('file') as File | null;
  if (!file || !file.size) {
    return { success: false, error: 'No file provided.' };
  }
  if (file.size > MAX_SUBMISSION_FILE_SIZE) {
    return { success: false, error: 'File too large (max 20 MB).' };
  }
  const allowed = [...SUBMISSION_ALLOWED_TYPES];
  if (!allowed.includes(file.type as (typeof allowed)[number])) {
    return {
      success: false,
      error: 'Invalid file type. Allowed: images (JPG, PNG, WebP) and audio (MP3, M4A, WAV).',
    };
  }

  try {
    const bucket = getR2Bucket();
    const baseUrl = getR2PublicBaseUrl();
    const client = getR2();
    const buffer = Buffer.from(await file.arrayBuffer());
    const key = `homework/submissions/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;

    await client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: buffer,
        ContentType: file.type,
      })
    );

    const publicUrl = `${baseUrl}/${key}`;
    return { success: true, url: publicUrl };
  } catch (err) {
    console.error('Homework upload error:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Upload failed.',
    };
  }
}

export async function uploadHomeworkWorksheetAction(
  _prev: unknown,
  formData: FormData
): Promise<UploadHomeworkFileResult> {
  const user = await getUser();
  if (!user) return { success: false, error: 'Not signed in.' };
  if (!canCreateHomework(user)) {
    return { success: false, error: 'Not allowed to create homework.' };
  }

  const file = formData.get('file') as File | null;
  if (!file || !file.size) {
    return { success: false, error: 'No file provided.' };
  }
  if (file.size > MAX_WORKSHEET_SIZE) {
    return { success: false, error: 'File too large (max 20 MB).' };
  }
  const allowed = [...WORKSHEET_ALLOWED_TYPES];
  if (!allowed.includes(file.type as (typeof allowed)[number])) {
    return {
      success: false,
      error: 'Invalid file type. Allowed: images (PNG, JPG, WebP) and PDF.',
    };
  }

  try {
    const bucket = getR2Bucket();
    const baseUrl = getR2PublicBaseUrl();
    const client = getR2();
    const buffer = Buffer.from(await file.arrayBuffer());
    const key = `homework/worksheets/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;

    await client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: buffer,
        ContentType: file.type,
      })
    );

    const publicUrl = `${baseUrl}/${key}`;
    return { success: true, url: publicUrl };
  } catch (err) {
    console.error('Worksheet upload error:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Upload failed.',
    };
  }
}

function canCreateHomework(user: { platformRole: string | null }): boolean {
  const role = user.platformRole as PlatformRole | null;
  if (!role) return false;
  if (role === 'admin' || role === 'school_admin') return can(user, 'classes:write');
  if (role === 'teacher') return true;
  return false;
}

function canAccessHomeworkAdmin(user: { platformRole: string | null }): boolean {
  const role = user.platformRole as PlatformRole | null;
  if (!role) return false;
  return role === 'admin' || role === 'school_admin' || role === 'teacher';
}

export async function getStudentHomeworkList() {
  const user = await getUser();
  if (!user) return null;
  if (user.platformRole !== 'student') return null;
  return listHomeworkForStudent(user.id);
}

export async function getStudentHomeworkDetail(homeworkId: string) {
  const user = await getUser();
  if (!user) return null;
  if (user.platformRole !== 'student') return null;
  return getHomeworkWithSubmission(homeworkId, user.id);
}

export async function getAdminHomeworkList() {
  const user = await getUser();
  if (!user || !canAccessHomeworkAdmin(user)) return null;
  let classIds: string[] | undefined;
  if (user.platformRole === 'teacher') {
    const classes = await listClassesForTeacher(user.id);
    classIds = classes.map((c) => c.id);
  }
  return listHomeworkForAdmin(classIds);
}

export async function getAdminHomeworkDetail(homeworkId: string) {
  const user = await getUser();
  if (!user || !canAccessHomeworkAdmin(user)) return null;
  const row = await getHomeworkById(homeworkId);
  if (!row) return null;
  if (user.platformRole === 'teacher') {
    const canPost = await canPostToClassroom(user, row.hw.classId);
    if (!canPost) return null;
  }
  const submissions = await listSubmissionsForHomework(homeworkId);
  return { ...row, submissions };
}

const createHomeworkSchema = z.object({
  classId: z.string().uuid(),
  title: z.string().min(1).max(500),
  instructions: z.string().max(5000).optional().nullable(),
  dueDate: z.string().datetime().optional().nullable(),
  attachmentUrl: z.string().url().optional().nullable(),
});

export type CreateHomeworkFromDraftPayload = {
  title: string;
  instructions: string;
};

export async function createHomeworkFromDraftAction(
  classId: string,
  draft: CreateHomeworkFromDraftPayload
): Promise<{ error?: string }> {
  const user = await getUser();
  if (!user) return { error: 'Not signed in.' };
  if (!canCreateHomework(user)) return { error: 'Not allowed to create homework.' };

  const canPost = await canPostToClassroom(user, classId);
  if (!canPost) return { error: 'You do not have permission to create homework for this class.' };

  if (!draft.title?.trim() || !draft.instructions?.trim()) {
    return { error: 'Title and instructions are required.' };
  }

  await createHomework({
    classId,
    title: draft.title.trim(),
    instructions: draft.instructions.trim(),
    dueDate: null,
    attachmentUrl: null,
    createdByUserId: user.id,
  });

  revalidatePath('/dashboard/homework');
  revalidatePath('/dashboard/student/homework');
  await redirectWithLocale('/dashboard/homework');
  return { error: undefined }; // unreachable; redirect throws
}

export type CreateHomeworkResult = { success: true } | { success: false; error: string };

export async function createHomeworkAction(
  _prev: unknown,
  formData: FormData
): Promise<CreateHomeworkResult> {
  const user = await getUser();
  if (!user) return { success: false, error: 'Not signed in.' };
  if (!canCreateHomework(user)) return { success: false, error: 'Not allowed to create homework.' };

  const parsed = createHomeworkSchema.safeParse({
    classId: formData.get('classId'),
    title: formData.get('title'),
    instructions: formData.get('instructions') || undefined,
    dueDate: formData.get('dueDate') || undefined,
    attachmentUrl: formData.get('attachmentUrl') || undefined,
  });
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.errors[0]?.message ?? 'Validation failed',
    };
  }

  const canPost = await canPostToClassroom(user, parsed.data.classId);
  if (!canPost) {
    return { success: false, error: 'You do not have permission to create homework for this class.' };
  }

  const dueDate = parsed.data.dueDate ? new Date(parsed.data.dueDate) : null;
  await createHomework({
    classId: parsed.data.classId,
    title: parsed.data.title,
    instructions: parsed.data.instructions ?? null,
    dueDate,
    attachmentUrl: parsed.data.attachmentUrl ?? null,
    createdByUserId: user.id,
  });

  revalidatePath('/dashboard/homework');
  revalidatePath('/dashboard/student/homework');
  await redirectWithLocale('/dashboard/homework');
  return { success: true }; // unreachable; redirect throws
}

const upsertSubmissionSchema = z.object({
  homeworkId: z.string().uuid(),
  textNote: z.string().max(5000).optional().nullable(),
  files: z.array(
    z.object({
      url: z.string().url(),
      mimeType: z.string(),
      name: z.string(),
      size: z.number(),
    })
  ),
});

export type UpsertSubmissionResult = { success: true } | { success: false; error: string };

export async function upsertHomeworkSubmissionAction(
  _prev: unknown,
  formData: FormData
): Promise<UpsertSubmissionResult> {
  const user = await getUser();
  if (!user) return { success: false, error: 'Not signed in.' };
  if (user.platformRole !== 'student') return { success: false, error: 'Students only.' };

  const filesJson = formData.get('files');
  let files: { url: string; mimeType: string; name: string; size: number }[] = [];
  if (typeof filesJson === 'string') {
    try {
      files = JSON.parse(filesJson) as typeof files;
    } catch {
      return { success: false, error: 'Invalid files data.' };
    }
  }

  const parsed = upsertSubmissionSchema.safeParse({
    homeworkId: formData.get('homeworkId'),
    textNote: formData.get('textNote') || undefined,
    files,
  });
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.errors[0]?.message ?? 'Validation failed',
    };
  }

  const hw = await getHomeworkById(parsed.data.homeworkId);
  if (!hw) return { success: false, error: 'Homework not found.' };
  const enrolled = await studentEnrolledInClass(user.id, hw.hw.classId);
  if (!enrolled) {
    return { success: false, error: 'You are not enrolled in this class.' };
  }

  await upsertHomeworkSubmission({
    homeworkId: parsed.data.homeworkId,
    studentUserId: user.id,
    textNote: parsed.data.textNote ?? null,
    files: parsed.data.files,
  });

  revalidatePath(`/dashboard/student/homework/${parsed.data.homeworkId}`);
  revalidatePath('/dashboard/student/homework');
  return { success: true };
}

const updateFeedbackSchema = z.object({
  submissionId: z.string().uuid(),
  feedback: z.string().max(5000).optional().nullable(),
  score: z.number().int().min(0).max(100).optional().nullable(),
});

export type UpdateFeedbackResult = { success: true } | { success: false; error: string };

export async function updateHomeworkFeedbackAction(
  _prev: unknown,
  formData: FormData
): Promise<UpdateFeedbackResult> {
  const user = await getUser();
  if (!user) return { success: false, error: 'Not signed in.' };
  if (!canAccessHomeworkAdmin(user)) return { success: false, error: 'Not allowed.' };

  const scoreRaw = formData.get('score');
  const parsed = updateFeedbackSchema.safeParse({
    submissionId: formData.get('submissionId'),
    feedback: formData.get('feedback') || undefined,
    score:
      scoreRaw && String(scoreRaw).trim()
        ? Number(String(scoreRaw).trim())
        : undefined,
  });
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.errors[0]?.message ?? 'Validation failed',
    };
  }

  await updateHomeworkSubmissionFeedback({
    submissionId: parsed.data.submissionId,
    feedback: parsed.data.feedback ?? null,
    score: parsed.data.score ?? null,
  });

  const homeworkId = formData.get('homeworkId') as string | null;
  if (homeworkId) {
    revalidatePath(`/dashboard/homework/${homeworkId}`);
  }
  revalidatePath('/dashboard/homework');
  return { success: true };
}

export async function getClassesForHomeworkCreate() {
  const user = await getUser();
  if (!user || !canCreateHomework(user)) return [];
  if (user.platformRole === 'teacher') {
    return listClassesForTeacher(user.id);
  }
  return listClasses();
}
