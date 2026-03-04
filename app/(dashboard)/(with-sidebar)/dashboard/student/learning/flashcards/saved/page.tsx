export const dynamic = 'force-dynamic';

import { getTranslations } from 'next-intl/server';
import { requireRole } from '@/lib/auth/user';
import { FlashcardStudyClient } from '@/components/learning/FlashcardStudyClient';
import { listSavedFlashcardsForStudent } from '@/lib/db/queries/flashcards';

export default async function SavedWordsFlashcardPage() {
  const t = await getTranslations('learning');
  const user = await requireRole(['student']);
  const savedCards = await listSavedFlashcardsForStudent(user.id);

  return (
    <section className="flex-1">
      <div className="mx-auto w-full max-w-2xl space-y-4">
        <h1 className="text-xl lg:text-2xl font-medium text-[#1f2937] tracking-tight">
          {t('mySavedWords')}
        </h1>
        <p className="text-sm text-muted-foreground">
          {t('mySavedWordsPageSubtitle')}
        </p>
        <FlashcardStudyClient
          deckTitle={t('mySavedWords')}
          cards={savedCards.map((card) => ({
            id: card.cardId,
            deckId: card.deckId,
            front: card.front,
            back: card.back,
            example: card.example,
            isSaved: true,
          }))}
          backHref="/dashboard/student/learning?tab=flashcards"
          emptyMessage={t('emptySaved')}
        />
      </div>
    </section>
  );
}

