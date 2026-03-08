'use server';

import { PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { getUser } from '@/lib/db/queries';
import { getR2, getR2Bucket } from '@/lib/r2';
import { db } from '@/lib/db/drizzle';
import {
  curriculumFiles,
  curriculumWeeks,
  curriculumWeekFiles,
} from '@/lib/db/schema';
import { eq, and, inArray } from 'drizzle-orm';
import { teacherAssignedToClass } from '@/lib/db/queries/education';
import {
  CURRICULUM_UPLOAD_MAX_BYTES,
  CURRICULUM_UPLOAD_ALLOWED,
} from '@/lib/upload/constants';
import { validateUpload, sanitizeStorageFilename } from '@/lib/upload/validate';

const uploadSchema = z.object({
  classId: z.string().uuid(),
  title: z.string().max(500).optional().nullable(),
  tag: z.string().max(100).optional().nullable(),
  weekNumber: z.coerce.number().int().min(1).max(52).optional().nullable(),
});

export type UploadCurriculumFileResult =
  | { success: true }
  | { success: false; error: string };

export async function uploadCurriculumFileAction(
  formData: FormData
): Promise<UploadCurriculumFileResult> {
  const user = await getUser();
  if (!user) return { success: false, error: 'Not signed in.' };
  if (user.platformRole !== 'teacher') return { success: false, error: 'Teachers only.' };

  const file = formData.get('file') as File | null;
  if (!file || !(file instanceof File)) return { success: false, error: 'File is required.' };

  const buffer = Buffer.from(await file.arrayBuffer());
  const validation = validateUpload(
    buffer,
    file.type || 'application/octet-stream',
    file.name || '',
    CURRICULUM_UPLOAD_ALLOWED,
    CURRICULUM_UPLOAD_MAX_BYTES
  );
  if (!validation.ok) return { success: false, error: validation.error };

  const parsed = uploadSchema.safeParse({
    classId: formData.get('classId'),
    title: formData.get('title') || undefined,
    tag: formData.get('tag') || undefined,
    weekNumber: formData.get('weekNumber') || undefined,
  });
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message ?? 'Validation failed.' };
  }

  const assigned = await teacherAssignedToClass(user.id, parsed.data.classId);
  if (!assigned) return { success: false, error: 'You do not have access to this class.' };

  try {
    const bucket = getR2Bucket();
    const client = getR2();
    const safeName = sanitizeStorageFilename(file.name || 'file');
    const key = `curriculum/${parsed.data.classId}/${Date.now()}-${safeName}`;

    await client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: buffer,
        ContentType: file.type,
      })
    );

    await db.insert(curriculumFiles).values({
      classId: parsed.data.classId,
      uploaderUserId: user.id,
      title: parsed.data.title ?? null,
      originalFilename: file.name,
      storagePath: key,
      mimeType: file.type,
      sizeBytes: file.size,
      tag: parsed.data.tag ?? null,
      weekNumber: parsed.data.weekNumber ?? null,
      updatedAt: new Date(),
    });
  } catch (err) {
    console.error('Curriculum upload error:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Upload failed.',
    };
  }

  revalidatePath('/dashboard/teacher/curriculum/materials');
  revalidatePath('/dashboard/teacher/curriculum/planner');
  return { success: true };
}

export type GetDownloadUrlResult =
  | { success: true; url: string }
  | { success: false; error: string };

/** Returns a URL to the download API route (server-validated, no presigner needed). */
export async function getCurriculumFileDownloadUrl(
  fileId: string
): Promise<GetDownloadUrlResult> {
  const user = await getUser();
  if (!user) return { success: false, error: 'Not signed in.' };
  if (user.platformRole !== 'teacher') return { success: false, error: 'Teachers only.' };

  const [file] = await db
    .select()
    .from(curriculumFiles)
    .where(eq(curriculumFiles.id, fileId))
    .limit(1);
  if (!file) return { success: false, error: 'File not found.' };

  const assigned = await teacherAssignedToClass(user.id, file.classId);
  if (!assigned) return { success: false, error: 'You do not have access to this file.' };

  return { success: true, url: `/api/curriculum/download?fileId=${fileId}` };
}

export type DeleteCurriculumFileResult =
  | { success: true }
  | { success: false; error: string };

export async function deleteCurriculumFileAction(
  formData: FormData
): Promise<DeleteCurriculumFileResult> {
  const user = await getUser();
  if (!user) return { success: false, error: 'Not signed in.' };
  if (user.platformRole !== 'teacher') return { success: false, error: 'Teachers only.' };

  const fileId = formData.get('fileId');
  if (typeof fileId !== 'string' || !fileId) return { success: false, error: 'File ID required.' };

  const [file] = await db
    .select()
    .from(curriculumFiles)
    .where(eq(curriculumFiles.id, fileId))
    .limit(1);
  if (!file) return { success: false, error: 'File not found.' };

  const assigned = await teacherAssignedToClass(user.id, file.classId);
  if (!assigned) return { success: false, error: 'You do not have access to this file.' };

  try {
    const client = getR2();
    const bucket = getR2Bucket();
    await client.send(
      new DeleteObjectCommand({ Bucket: bucket, Key: file.storagePath })
    );
  } catch {
    // Continue to delete row even if storage delete fails
  }

  await db.delete(curriculumFiles).where(eq(curriculumFiles.id, fileId));

  revalidatePath('/dashboard/teacher/curriculum/materials');
  revalidatePath('/dashboard/teacher/curriculum/planner');
  return { success: true };
}

export async function listCurriculumFilesForTeacherAction(classId: string) {
  const user = await getUser();
  if (!user) return { files: [] };
  if (user.platformRole !== 'teacher') return { files: [] };
  const assigned = await teacherAssignedToClass(user.id, classId);
  if (!assigned) return { files: [] };
  const { listCurriculumFilesForTeacher } = await import('@/lib/db/queries/curriculum');
  const files = await listCurriculumFilesForTeacher(user.id, classId);
  return {
    files: files.map((f) => ({
      id: f.id,
      originalFilename: f.originalFilename,
      title: f.title,
    })),
  };
}

const updateWeekSchema = z.object({
  weekId: z.string().uuid(),
  topic: z.string().max(500).optional().nullable(),
  goals: z.string().max(5000).optional().nullable(),
  notes: z.string().max(5000).optional().nullable(),
});

export type UpdateCurriculumWeekResult =
  | { success: true }
  | { success: false; error: string };

export async function updateCurriculumWeekAction(
  formData: FormData
): Promise<UpdateCurriculumWeekResult> {
  const user = await getUser();
  if (!user) return { success: false, error: 'Not signed in.' };
  if (user.platformRole !== 'teacher') return { success: false, error: 'Teachers only.' };

  const parsed = updateWeekSchema.safeParse({
    weekId: formData.get('weekId'),
    topic: formData.get('topic') || undefined,
    goals: formData.get('goals') || undefined,
    notes: formData.get('notes') || undefined,
  });
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message ?? 'Validation failed.' };
  }

  const [week] = await db
    .select()
    .from(curriculumWeeks)
    .where(eq(curriculumWeeks.id, parsed.data.weekId))
    .limit(1);
  if (!week) return { success: false, error: 'Week not found.' };

  const assigned = await teacherAssignedToClass(user.id, week.classId);
  if (!assigned) return { success: false, error: 'You do not have access to this class.' };

  await db
    .update(curriculumWeeks)
    .set({
      topic: parsed.data.topic ?? null,
      goals: parsed.data.goals ?? null,
      notes: parsed.data.notes ?? null,
      updatedAt: new Date(),
    })
    .where(eq(curriculumWeeks.id, parsed.data.weekId));

  revalidatePath('/dashboard/teacher/curriculum/planner');
  return { success: true };
}

const attachFilesSchema = z.object({
  weekId: z.string().uuid(),
  fileIds: z.array(z.string().uuid()),
});

export type AttachFilesToWeekResult =
  | { success: true }
  | { success: false; error: string };

export async function attachFilesToWeekAction(
  formData: FormData
): Promise<AttachFilesToWeekResult> {
  const user = await getUser();
  if (!user) return { success: false, error: 'Not signed in.' };
  if (user.platformRole !== 'teacher') return { success: false, error: 'Teachers only.' };

  const weekId = formData.get('weekId');
  const fileIdsRaw = formData.get('fileIds');
  let fileIds: string[] = [];
  if (typeof fileIdsRaw === 'string') {
    try {
      fileIds = JSON.parse(fileIdsRaw) as string[];
    } catch {
      return { success: false, error: 'Invalid file IDs.' };
    }
  }

  const parsed = attachFilesSchema.safeParse({ weekId, fileIds });
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message ?? 'Validation failed.' };
  }

  const [week] = await db
    .select()
    .from(curriculumWeeks)
    .where(eq(curriculumWeeks.id, parsed.data.weekId))
    .limit(1);
  if (!week) return { success: false, error: 'Week not found.' };

  const assigned = await teacherAssignedToClass(user.id, week.classId);
  if (!assigned) return { success: false, error: 'You do not have access to this class.' };

  const files = await db
    .select()
    .from(curriculumFiles)
    .where(
      and(
        inArray(curriculumFiles.id, parsed.data.fileIds),
        eq(curriculumFiles.classId, week.classId)
      )
    );
  const validFileIds = files.map((f) => f.id);

  for (const fileId of validFileIds) {
    const [existing] = await db
      .select()
      .from(curriculumWeekFiles)
      .where(
        and(
          eq(curriculumWeekFiles.weekId, parsed.data.weekId),
          eq(curriculumWeekFiles.fileId, fileId)
        )
      )
      .limit(1);
    if (!existing) {
      await db.insert(curriculumWeekFiles).values({
        weekId: parsed.data.weekId,
        fileId,
      });
    }
  }

  revalidatePath('/dashboard/teacher/curriculum/planner');
  return { success: true };
}

export type DetachFileFromWeekResult =
  | { success: true }
  | { success: false; error: string };

export async function detachFileFromWeekAction(
  formData: FormData
): Promise<DetachFileFromWeekResult> {
  const user = await getUser();
  if (!user) return { success: false, error: 'Not signed in.' };
  if (user.platformRole !== 'teacher') return { success: false, error: 'Teachers only.' };

  const weekId = formData.get('weekId');
  const fileId = formData.get('fileId');
  if (typeof weekId !== 'string' || typeof fileId !== 'string') {
    return { success: false, error: 'Week ID and File ID required.' };
  }

  const [week] = await db
    .select()
    .from(curriculumWeeks)
    .where(eq(curriculumWeeks.id, weekId))
    .limit(1);
  if (!week) return { success: false, error: 'Week not found.' };

  const assigned = await teacherAssignedToClass(user.id, week.classId);
  if (!assigned) return { success: false, error: 'You do not have access to this class.' };

  await db
    .delete(curriculumWeekFiles)
    .where(
      and(
        eq(curriculumWeekFiles.weekId, weekId),
        eq(curriculumWeekFiles.fileId, fileId)
      )
    );

  revalidatePath('/dashboard/teacher/curriculum/planner');
  return { success: true };
}
