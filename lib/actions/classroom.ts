'use server';

import { PutObjectCommand } from '@aws-sdk/client-s3';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { getUser } from '@/lib/db/queries';
import { r2 } from '@/lib/r2';
import { canPostToClassroom } from '@/lib/auth/classroom';
import {
  createClassroomPost,
  getClassById,
  getClassNotificationRecipients,
} from '@/lib/db/queries/education';
import { createNotification } from '@/lib/db/queries/notifications';
import { classroomPostTypeEnum } from '@/lib/db/schema';

const postTypeSchema = z.enum(classroomPostTypeEnum as unknown as [string, ...string[]]);

const createPostSchema = z
  .object({
    classId: z.string().uuid(),
    type: postTypeSchema,
    title: z.string().max(500).optional().nullable(),
    body: z.string().max(5000).optional().nullable(),
    fileUrl: z.string().url().optional().nullable(),
    linkUrl: z.string().url().optional().nullable(),
  })
  .refine(
    (data) => {
      const hasFile = !!data.fileUrl;
      const hasLink = !!data.linkUrl;
      // Announcements can be text-only (no file or link required)
      if (data.type === 'announcement') return true;
      return (hasFile && !hasLink) || (hasLink && !hasFile);
    },
    { message: 'Provide either a file (upload) or a link, not both and not neither.' }
  );

export type CreateClassroomPostResult =
  | { success: true }
  | { success: false; error: string };

export async function createClassroomPostAction(
  _prev: unknown,
  formData: FormData
): Promise<CreateClassroomPostResult> {
  const user = await getUser();
  if (!user) return { success: false, error: 'Not signed in.' };

  const parsed = createPostSchema.safeParse({
    classId: formData.get('classId'),
    type: formData.get('type'),
    title: formData.get('title') || undefined,
    body: formData.get('body') || undefined,
    fileUrl: formData.get('fileUrl') || undefined,
    linkUrl: formData.get('linkUrl') || undefined,
  });
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.errors[0]?.message ?? 'Validation failed',
    };
  }

  const canPost = await canPostToClassroom(user, parsed.data.classId);
  if (!canPost) {
    return { success: false, error: 'You do not have permission to post here.' };
  }

  const classExists = await getClassById(parsed.data.classId);
  if (!classExists) {
    return { success: false, error: 'Class not found.' };
  }

  await createClassroomPost({
    classId: parsed.data.classId,
    authorUserId: user.id,
    type: parsed.data.type,
    title: parsed.data.title ?? null,
    body: parsed.data.body ?? null,
    fileUrl: parsed.data.fileUrl ?? null,
    linkUrl: parsed.data.linkUrl ?? null,
  });

  const typeLabel =
    parsed.data.type.charAt(0).toUpperCase() + parsed.data.type.slice(1).replace(/_/g, ' ');
  const postTitle = parsed.data.title ?? typeLabel;
  const href = `/classroom/${parsed.data.classId}`;

  const { studentUserIds, teacherUserIds } = await getClassNotificationRecipients(
    parsed.data.classId
  );
  const recipientIds = [
    ...new Set([...studentUserIds, ...teacherUserIds]),
  ].filter((id) => id !== user.id);

  for (const recipientId of recipientIds) {
    await createNotification({
      userId: recipientId,
      type: 'classroom_post',
      title: `New ${typeLabel.toLowerCase()} in ${classExists.name}: ${postTitle}`,
      body: parsed.data.body ?? null,
      href,
      sourceType: 'classroom_post',
      sourceId: parsed.data.classId,
    });
  }

  revalidatePath(`/classroom/${parsed.data.classId}`);
  redirect(`/classroom/${parsed.data.classId}`);
}

/** Allowed MIME types: images and PDFs only. */
const ALLOWED_TYPES = [
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/jpg',
] as const;

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

export type UploadClassroomFileResult =
  | { success: true; url: string }
  | { success: false; error: string };

export async function uploadClassroomFileAction(
  _prev: unknown,
  formData: FormData
): Promise<UploadClassroomFileResult> {
  const user = await getUser();
  if (!user) return { success: false, error: 'Not signed in.' };

  const file = formData.get('file') as File | null;
  if (!file || !file.size) {
    return { success: false, error: 'No file provided.' };
  }
  if (file.size > MAX_FILE_SIZE) {
    return { success: false, error: 'File too large (max 10 MB).' };
  }
  if (!ALLOWED_TYPES.includes(file.type as (typeof ALLOWED_TYPES)[number])) {
    return {
      success: false,
      error: 'Invalid file type. Allowed: images (PNG, JPG) and PDF only.',
    };
  }

  const bucket = process.env.R2_BUCKET_NAME;
  if (!bucket) {
    return { success: false, error: 'Storage not configured.' };
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const key = `uploads/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const baseUrl = process.env.R2_PUBLIC_BASE_URL;
    if (!baseUrl) {
      return { success: false, error: 'R2_PUBLIC_BASE_URL not configured.' };
    }

    await r2.send(
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
    console.error('Upload error:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Upload failed.',
    };
  }
}
