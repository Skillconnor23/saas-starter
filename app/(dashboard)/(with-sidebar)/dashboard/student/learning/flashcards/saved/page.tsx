export const dynamic = 'force-dynamic';

import { requireRole } from '@/lib/auth/user';
import { FlashcardStudyClient } from '@/components/learning/FlashcardStudyClient';
import { listSavedFlashcardsForStudent } from '@/lib/db/queries/flashcards';

export default async function SavedWordsFlashcardPage() {
  const user = await requireRole(['student']);
  const savedCards = await listSavedFlashcardsForStudent(user.id);

  return (
    <section className="flex-1">
      <div className="mx-auto w-full max-w-2xl space-y-4">
        <h1 className="text-xl lg:text-2xl font-medium text-[#1f2937] tracking-tight">
          My Saved Words
        </h1>
        <p className="text-sm text-muted-foreground">
          Practice your bookmarked cards anytime.
        </p>
        <FlashcardStudyClient
          deckTitle="My Saved Words"
          cards={savedCards.map((card) => ({
            id: card.cardId,
            deckId: card.deckId,
            front: card.front,
            back: card.back,
            example: card.example,
            isSaved: true,
          }))}
          backHref="/dashboard/student/learning?tab=flashcards"
          emptyMessage="You have not saved any words yet. Open a deck and tap save on the back side."
        />
      </div>
    </section>
  );
}

