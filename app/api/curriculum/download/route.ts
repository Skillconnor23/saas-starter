import { GetObjectCommand } from '@aws-sdk/client-s3';
import { NextResponse } from 'next/server';
import { requireApiRole } from '@/lib/auth/api-auth';
import { getR2, getR2Bucket } from '@/lib/r2';
import { db } from '@/lib/db/drizzle';
import { curriculumFiles } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { teacherAssignedToClass } from '@/lib/db/queries/education';

export async function GET(req: Request) {
  try {
    const auth = await requireApiRole(['teacher']);
    if (auth.response) return auth.response;
    const user = auth.user;

    const { searchParams } = new URL(req.url);
    const fileId = searchParams.get('fileId');
    if (!fileId) {
      return NextResponse.json({ error: 'fileId required' }, { status: 400 });
    }

    const [file] = await db
      .select()
      .from(curriculumFiles)
      .where(eq(curriculumFiles.id, fileId))
      .limit(1);
    if (!file) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    const assigned = await teacherAssignedToClass(user.id, file.classId);
    if (!assigned) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const client = getR2();
    const bucket = getR2Bucket();
    const obj = await client.send(
      new GetObjectCommand({ Bucket: bucket, Key: file.storagePath })
    );

    if (!obj.Body) {
      return NextResponse.json({ error: 'File not available' }, { status: 404 });
    }

    const contentType = file.mimeType || 'application/octet-stream';
    const filename = file.originalFilename.replace(/[^a-zA-Z0-9.-]/g, '_');

    return new NextResponse(obj.Body as ReadableStream, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (err) {
    console.error('Curriculum download error:', err);
    return NextResponse.json({ error: 'Download failed' }, { status: 500 });
  }
}
