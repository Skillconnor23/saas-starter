import { NextResponse } from 'next/server';
import { requireApiRole } from '@/lib/auth/api-auth';
import { generateReadingWithOpenAI } from '@/lib/ai/generate-reading';

const PARAGRAPH_COUNT_MIN = 1;
const PARAGRAPH_COUNT_MAX = 5;

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

  const rawCount = raw.paragraphCount;
  const paragraphCount =
    typeof rawCount === 'number'
      ? rawCount
      : Number(rawCount);
  const countValid =
    rawCount == null ||
    rawCount === '' ||
    (!Number.isNaN(paragraphCount) &&
      Number.isInteger(paragraphCount) &&
      paragraphCount >= PARAGRAPH_COUNT_MIN &&
      paragraphCount <= PARAGRAPH_COUNT_MAX);

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
        error: `Paragraph count must be between ${PARAGRAPH_COUNT_MIN} and ${PARAGRAPH_COUNT_MAX}`,
      },
      { status: 400 }
    );
  }

  const result = await generateReadingWithOpenAI({
    topic,
    level,
    studentLanguage,
    paragraphCount: rawCount != null && rawCount !== '' ? paragraphCount : undefined,
    notes,
    vocabItems,
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
      passage: result.passage,
      glossary: result.glossary,
      questions: result.questions,
    },
  });
}
