'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { requireRole } from '@/lib/auth/user';
import {
  createFlashcardCard,
  createFlashcardDeck,
  deleteFlashcardCard,
  getFlashcardCardById,
  getFlashcardDeckById,
  isFlashcardDeckVisibleToStudent,
  isFlashcardSavedByStudent,
  listManageableFlashcardClasses,
  recordFlashcardStudyEvent,
  removeFlashcardSaveForStudent,
  saveFlashcardForStudent,
  setFlashcardDeckPublished,
  teacherCanManageFlashcardDeck,
  updateFlashcardCard,
  updateFlashcardDeck,
} from '@/lib/db/queries/flashcards';
import type { PlatformRole } from '@/lib/db/schema';

const deckSchema = z
  .object({
    title: z.string().trim().min(1, 'Title is required').max(120),
    description: z.string().trim().max(500).optional(),
    scope: z.enum(['class', 'global']),
    classId: z.string().uuid().optional(),
  })
  .superRefine((value, ctx) => {
    if (value.scope === 'class' && !value.classId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Class is required for class decks.',
        path: ['classId'],
      });
    }
  });

const cardSchema = z.object({
  front: z.string().trim().min(1, 'Front text is required').max(500),
  back: z.string().trim().min(1, 'Back text is required').max(500),
  example: z.string().trim().max(700).optional(),
});

const studyEventSchema = z.object({
  deckId: z.string().uuid(),
  cardId: z.string().uuid(),
  result: z.enum(['correct', 'incorrect']),
});

const saveCardSchema = z.object({
  cardId: z.string().uuid(),
});

async function canManageDeck(
  user: { id: number; platformRole: PlatformRole },
  deckId: string
): Promise<boolean> {
  if (user.platformRole === 'teacher') {
    return teacherCanManageFlashcardDeck(deckId, user.id);
  }
  return user.platformRole === 'admin' || user.platformRole === 'school_admin';
}

async function canUseClassForDeck(
  user: { id: number; platformRole: PlatformRole },
  classId: string
): Promise<boolean> {
  const manageable = await listManageableFlashcardClasses(user.id, user.platformRole);
  return manageable.some((row) => row.id === classId);
}

export async function createFlashcardDeckAction(
  formData: FormData
): Promise<{ error?: string; deckId?: string }> {
  const user = await requireRole(['teacher', 'admin', 'school_admin']);
  const parsed = deckSchema.safeParse({
    title: formData.get('title'),
    description: formData.get('description') || undefined,
    scope: formData.get('scope') || 'class',
    classId: formData.get('classId') || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? 'Invalid deck data.' };
  }

  if (parsed.data.scope === 'class' && parsed.data.classId) {
    const allowed = await canUseClassForDeck(user, parsed.data.classId);
    if (!allowed) return { error: 'You cannot assign a deck to this class.' };
  }

  const deck = await createFlashcardDeck({
    title: parsed.data.title,
    description: parsed.data.description ?? null,
    createdByUserId: user.id,
    scope: parsed.data.scope,
    classId: parsed.data.classId ?? null,
  });

  revalidatePath('/dashboard/teacher/learning/flashcards');
  return { deckId: deck.id };
}

export async function updateFlashcardDeckAction(
  deckId: string,
  formData: FormData
): Promise<{ error?: string }> {
  const user = await requireRole(['teacher', 'admin', 'school_admin']);
  const allowed = await canManageDeck(user, deckId);
  if (!allowed) return { error: 'You cannot edit this deck.' };

  const parsed = deckSchema.safeParse({
    title: formData.get('title'),
    description: formData.get('description') || undefined,
    scope: formData.get('scope') || 'class',
    classId: formData.get('classId') || undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? 'Invalid deck data.' };
  }

  if (parsed.data.scope === 'class' && parsed.data.classId) {
    const classAllowed = await canUseClassForDeck(user, parsed.data.classId);
    if (!classAllowed) return { error: 'You cannot assign this class.' };
  }

  const updated = await updateFlashcardDeck(deckId, {
    title: parsed.data.title,
    description: parsed.data.description ?? null,
    scope: parsed.data.scope,
    classId: parsed.data.classId ?? null,
  });
  if (!updated) return { error: 'Deck not found.' };

  revalidatePath('/dashboard/teacher/learning/flashcards');
  revalidatePath(`/dashboard/teacher/learning/flashcards/${deckId}`);
  revalidatePath('/dashboard/student/learning');
  revalidatePath(`/dashboard/student/learning/flashcards/${deckId}`);
  return {};
}

export async function setFlashcardDeckPublishedAction(
  deckId: string,
  isPublished: boolean
): Promise<{ error?: string }> {
  const user = await requireRole(['teacher', 'admin', 'school_admin']);
  const allowed = await canManageDeck(user, deckId);
  if (!allowed) return { error: 'You cannot publish this deck.' };

  const updated = await setFlashcardDeckPublished(deckId, isPublished);
  if (!updated) return { error: 'Deck not found.' };

  revalidatePath('/dashboard/teacher/learning/flashcards');
  revalidatePath(`/dashboard/teacher/learning/flashcards/${deckId}`);
  revalidatePath('/dashboard/student/learning');
  revalidatePath(`/dashboard/student/learning/flashcards/${deckId}`);
  return {};
}

export async function addFlashcardCardAction(
  deckId: string,
  formData: FormData
): Promise<{ error?: string }> {
  const user = await requireRole(['teacher', 'admin', 'school_admin']);
  const allowed = await canManageDeck(user, deckId);
  if (!allowed) return { error: 'You cannot edit cards in this deck.' };

  const parsed = cardSchema.safeParse({
    front: formData.get('front'),
    back: formData.get('back'),
    example: formData.get('example') || undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? 'Invalid card data.' };
  }

  await createFlashcardCard({
    deckId,
    front: parsed.data.front,
    back: parsed.data.back,
    example: parsed.data.example ?? null,
  });

  revalidatePath(`/dashboard/teacher/learning/flashcards/${deckId}`);
  revalidatePath('/dashboard/teacher/learning/flashcards');
  revalidatePath('/dashboard/student/learning');
  revalidatePath(`/dashboard/student/learning/flashcards/${deckId}`);
  return {};
}

export async function updateFlashcardCardAction(
  deckId: string,
  cardId: string,
  formData: FormData
): Promise<{ error?: string }> {
  const user = await requireRole(['teacher', 'admin', 'school_admin']);
  const allowed = await canManageDeck(user, deckId);
  if (!allowed) return { error: 'You cannot edit this card.' };

  const parsed = cardSchema.safeParse({
    front: formData.get('front'),
    back: formData.get('back'),
    example: formData.get('example') || undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? 'Invalid card data.' };
  }

  const card = await getFlashcardCardById(cardId);
  if (!card) return { error: 'Card not found.' };
  if (card.deckId !== deckId) return { error: 'Card/deck mismatch.' };

  const updated = await updateFlashcardCard(cardId, {
    front: parsed.data.front,
    back: parsed.data.back,
    example: parsed.data.example ?? null,
  });
  if (!updated) return { error: 'Card not found.' };

  revalidatePath(`/dashboard/teacher/learning/flashcards/${deckId}`);
  revalidatePath('/dashboard/teacher/learning/flashcards');
  revalidatePath('/dashboard/student/learning');
  revalidatePath(`/dashboard/student/learning/flashcards/${deckId}`);
  return {};
}

export async function deleteFlashcardCardAction(
  deckId: string,
  cardId: string
): Promise<{ error?: string }> {
  const user = await requireRole(['teacher', 'admin', 'school_admin']);
  const allowed = await canManageDeck(user, deckId);
  if (!allowed) return { error: 'You cannot remove this card.' };

  const card = await getFlashcardCardById(cardId);
  if (!card) return { error: 'Card not found.' };
  if (card.deckId !== deckId) return { error: 'Card/deck mismatch.' };

  const deleted = await deleteFlashcardCard(cardId);
  if (!deleted) return { error: 'Card not found.' };

  revalidatePath(`/dashboard/teacher/learning/flashcards/${deckId}`);
  revalidatePath('/dashboard/teacher/learning/flashcards');
  revalidatePath('/dashboard/student/learning');
  revalidatePath(`/dashboard/student/learning/flashcards/${deckId}`);
  revalidatePath('/dashboard/student/learning/flashcards/saved');
  return {};
}

export async function saveFlashcardResultAction(payload: {
  deckId: string;
  cardId: string;
  result: 'correct' | 'incorrect';
}): Promise<{ error?: string }> {
  const user = await requireRole(['student']);
  const parsed = studyEventSchema.safeParse(payload);
  if (!parsed.success) {
    return { error: 'Invalid study payload.' };
  }

  const card = await getFlashcardCardById(parsed.data.cardId);
  if (!card) return { error: 'Card not found.' };
  if (card.deckId !== parsed.data.deckId) return { error: 'Card/deck mismatch.' };

  const deckVisible = await isFlashcardDeckVisibleToStudent(user.id, parsed.data.deckId);
  const saved = await isFlashcardSavedByStudent(user.id, parsed.data.cardId);
  if (!deckVisible && !saved) {
    return { error: 'You do not have access to this deck.' };
  }

  await recordFlashcardStudyEvent({
    studentUserId: user.id,
    deckId: card.deckId,
    cardId: card.id,
    result: parsed.data.result,
  });

  revalidatePath('/dashboard/student/learning');
  return {};
}

export async function saveFlashcardToMyWordsAction(payload: {
  cardId: string;
}): Promise<{ error?: string }> {
  const user = await requireRole(['student']);
  const parsed = saveCardSchema.safeParse(payload);
  if (!parsed.success) return { error: 'Invalid card payload.' };

  const card = await getFlashcardCardById(parsed.data.cardId);
  if (!card) return { error: 'Card not found.' };

  const visible = await isFlashcardDeckVisibleToStudent(user.id, card.deckId);
  const alreadySaved = await isFlashcardSavedByStudent(user.id, card.id);
  if (!visible && !alreadySaved) return { error: 'Card is not available to save.' };

  await saveFlashcardForStudent(user.id, parsed.data.cardId);
  revalidatePath('/dashboard/student/learning');
  revalidatePath('/dashboard/student/learning/flashcards/saved');
  revalidatePath(`/dashboard/student/learning/flashcards/${card.deckId}`);
  return {};
}

export async function removeFlashcardFromMyWordsAction(payload: {
  cardId: string;
}): Promise<{ error?: string }> {
  const user = await requireRole(['student']);
  const parsed = saveCardSchema.safeParse(payload);
  if (!parsed.success) return { error: 'Invalid card payload.' };

  await removeFlashcardSaveForStudent(user.id, parsed.data.cardId);
  revalidatePath('/dashboard/student/learning');
  revalidatePath('/dashboard/student/learning/flashcards/saved');

  const card = await getFlashcardCardById(parsed.data.cardId);
  if (card) {
    revalidatePath(`/dashboard/student/learning/flashcards/${card.deckId}`);
  }
  return {};
}

export async function getEditableFlashcardDeckForTeacherAction(deckId: string) {
  const user = await requireRole(['teacher', 'admin', 'school_admin']);
  const deck = await getFlashcardDeckById(deckId);
  if (!deck) return null;

  const allowed = await canManageDeck(user, deckId);
  if (!allowed) return null;
  return deck;
}

