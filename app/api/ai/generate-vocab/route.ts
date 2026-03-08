import { NextResponse } from 'next/server';
import { requireApiRole } from '@/lib/auth/api-auth';
import { generateVocabWithOpenAI } from '@/lib/ai/generate-vocab';

const COUNT_MIN = 1;
const COUNT_MAX = 20;

const inputSchema = {
  topic: (v: unknown) =>
    typeof v === 'string' && v.trim().length > 0
      ? v.trim()
      : null,
  level: (v: unknown) =>
    typeof v === 'string' && v.trim().length > 0
      ? v.trim()
      : null,
  studentLanguage: (v: unknown) =>
    typeof v === 'string' && v.trim().length > 0
      ? v.trim()
      : null,
  count: (v: unknown) => {
    const n = typeof v === 'number' ? v : Number(v);
    if (Number.isNaN(n) || !Number.isInteger(n) || n < COUNT_MIN || n > COUNT_MAX) {
      return null;
    }
    return n;
  },
  notes: (v: unknown) =>
    v == null || v === '' ? undefined : typeof v === 'string' ? v.trim() : undefined,
};

export async function POST(req: Request) {
  const auth = await requireApiRole(['teacher', 'admin', 'school_admin']);
  if (auth.response) return auth.response;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { success: false, error: 'Invalid JSON body' },
      { status: 400 }
    );
  }

  if (!body || typeof body !== 'object') {
    return NextResponse.json(
      { success: false, error: 'Invalid request body' },
      { status: 400 }
    );
  }

  const raw = body as Record<string, unknown>;
  const topic = inputSchema.topic(raw.topic);
  const level = inputSchema.level(raw.level);
  const studentLanguage = inputSchema.studentLanguage(raw.studentLanguage);
  const count = inputSchema.count(raw.count);
  const notes = inputSchema.notes(raw.notes);

  if (!topic) {
    return NextResponse.json(
      { success: false, error: 'Topic is required' },
      { status: 400 }
    );
  }
  if (!level) {
    return NextResponse.json(
      { success: false, error: 'Level is required' },
      { status: 400 }
    );
  }
  if (!studentLanguage) {
    return NextResponse.json(
      { success: false, error: 'Student language is required' },
      { status: 400 }
    );
  }
  if (count === null) {
    return NextResponse.json(
      { success: false, error: `Count must be a number between ${COUNT_MIN} and ${COUNT_MAX}` },
      { status: 400 }
    );
  }

  const result = await generateVocabWithOpenAI({
    topic,
    level,
    studentLanguage,
    count,
    notes,
  });

  if ('error' in result) {
    return NextResponse.json(
      { success: false, error: result.error },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    data: {
      title: result.title,
      items: result.items,
    },
  });
}
