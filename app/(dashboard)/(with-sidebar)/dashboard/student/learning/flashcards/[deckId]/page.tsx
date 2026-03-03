export const dynamic = 'force-dynamic';

import { notFound } from 'next/navigation';
import { requireRole } from '@/lib/auth/user';
import { FlashcardStudyClient } from '@/components/learning/FlashcardStudyClient';
import {
  getAssignedFlashcardDecksForStudent,
  getFlashcardDeckWithCards,
  listSavedFlashcardsForStudent,
} from '@/lib/db/queries/flashcards';

type Props = {
  params: Promise<{ deckId: string }>;
};

export default async function StudyFlashcardDeckPage({ params }: Props) {
  const user = await requireRole(['student']);
  const { deckId } = await params;

  const [assignedDecks, deckWithCards, savedCards] = await Promise.all([
    getAssignedFlashcardDecksForStudent(user.id),
    getFlashcardDeckWithCards(deckId),
    listSavedFlashcardsForStudent(user.id),
  ]);

  const assigned = assignedDecks.find((deck) => deck.id === deckId);
  if (!assigned || !deckWithCards) notFound();

  const savedCardIds = new Set(savedCards.map((row) => row.cardId));
  const cards = deckWithCards.cards.map((card) => ({
    id: card.id,
    deckId: card.deckId,
    front: card.front,
    back: card.back,
    example: card.example,
    isSaved: savedCardIds.has(card.id),
  }));

  return (
    <section className="flex-1">
      <div className="mx-auto w-full max-w-2xl space-y-4">
        <h1 className="text-xl lg:text-2xl font-medium text-[#1f2937] tracking-tight">
          {deckWithCards.deck.title}
        </h1>
        <p className="text-sm text-muted-foreground">
          Flip, self-grade, and save important words as you study.
        </p>
        <FlashcardStudyClient
          deckTitle={deckWithCards.deck.title}
          cards={cards}
          backHref="/dashboard/student/learning?tab=flashcards"
          emptyMessage="This deck has no cards yet."
        />
      </div>
    </section>
  );
}

