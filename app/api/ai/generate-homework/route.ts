import { NextResponse } from 'next/server';
import { requireApiRole } from '@/lib/auth/api-auth';
import { generateHomeworkWithOpenAI } from '@/lib/ai/generate-homework';

const TASK_COUNT_MIN = 1;
const TASK_COUNT_MAX = 10;

const vocabItemSchema = (v: unknown) => {
  if (!v || typeof v !== 'object') return null;
  const o = v as Record<string, unknown>;
  return {
    word: typeof o.word === 'string' ? o.word.trim() : '',
    translation: typeof o.translation === 'string' ? o.translation.trim() : undefined,
    definition: typeof o.definition === 'string' ? o.definition.trim() : undefined,
    example: typeof o.example === 'string' ? o.example.trim() : undefined,
    pronunciation: typeof o.pronunciation === 'string' ? o.pronunciation.trim() : undefined,
  };
};

const readingSchema = (v: unknown) => {
  if (!v || typeof v !== 'object') return null;
  const o = v as Record<string, unknown>;
  const title = typeof o.title === 'string' ? o.title.trim() : undefined;
  const passage = typeof o.passage === 'string' ? o.passage.trim() : undefined;
  if (!passage) return null;
  return { title, passage };
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

  const topic =
    typeof raw.topic === 'string' && raw.topic.trim().length > 0 ? raw.topic.trim() : null;
  const level =
    typeof raw.level === 'string' && raw.level.trim().length > 0 ? raw.level.trim() : null;
  const studentLanguage =
    typeof raw.studentLanguage === 'string' && raw.studentLanguage.trim().length > 0
      ? raw.studentLanguage.trim()
      : null;

  const rawCount = raw.taskCount;
  const taskCount =
    typeof rawCount === 'number' ? rawCount : Number(rawCount);
  const countValid =
    rawCount == null ||
    rawCount === '' ||
    (!Number.isNaN(taskCount) &&
      Number.isInteger(taskCount) &&
      taskCount >= TASK_COUNT_MIN &&
      taskCount <= TASK_COUNT_MAX);

  const notes =
    raw.notes == null || raw.notes === ''
      ? undefined
      : typeof raw.notes === 'string'
        ? raw.notes.trim()
        : undefined;

  let vocabItems:
    | Array<{
        word: string;
        translation?: string;
        definition?: string;
        example?: string;
        pronunciation?: string;
      }>
    | undefined;
  if (Array.isArray(raw.vocabItems)) {
    vocabItems = raw.vocabItems
      .map(vocabItemSchema)
      .filter((v): v is NonNullable<typeof v> => v !== null && v.word.length > 0);
    if (vocabItems.length === 0) vocabItems = undefined;
  }

  let reading: { title?: string; passage: string } | undefined;
  if (raw.reading) {
    const r = readingSchema(raw.reading);
    if (r) reading = r;
  }

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
  if (!countValid) {
    return NextResponse.json(
      {
        success: false,
        error: `Task count must be between ${TASK_COUNT_MIN} and ${TASK_COUNT_MAX}`,
      },
      { status: 400 }
    );
  }

  const result = await generateHomeworkWithOpenAI({
    topic,
    level,
    studentLanguage,
    taskCount: rawCount != null && rawCount !== '' ? taskCount : undefined,
    notes,
    vocabItems,
    reading,
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
      instructions: result.instructions,
      tasks: result.tasks,
      teacherNotes: result.teacherNotes,
    },
  });
}
