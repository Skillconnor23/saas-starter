'use client';

import Link from 'next/link';
import { useMemo, useState, useTransition } from 'react';
import { Bookmark, BookmarkCheck, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  removeFlashcardFromMyWordsAction,
  saveFlashcardResultAction,
  saveFlashcardToMyWordsAction,
} from '@/lib/actions/learning/flashcards';

export type FlashcardStudyItem = {
  id: string;
  deckId: string;
  front: string;
  back: string;
  example: string | null;
  isSaved: boolean;
};

type Props = {
  deckTitle: string;
  cards: FlashcardStudyItem[];
  backHref: string;
  emptyMessage: string;
};

export function FlashcardStudyClient({
  deckTitle,
  cards,
  backHref,
  emptyMessage,
}: Props) {
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [attempted, setAttempted] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [savedCardIds, setSavedCardIds] = useState(
    () => new Set(cards.filter((card) => card.isSaved).map((card) => card.id))
  );
  const [isPending, startTransition] = useTransition();
  const [isSavingWord, startSavingWord] = useTransition();

  const current = cards[index] ?? null;
  const finished = cards.length > 0 && index >= cards.length;
  const accuracy = attempted > 0 ? Math.round((correct / attempted) * 100) : null;
  const progressLabel = `${Math.min(index + 1, cards.length)} of ${cards.length}`;

  const currentIsSaved = useMemo(
    () => (current ? savedCardIds.has(current.id) : false),
    [current, savedCardIds]
  );

  if (cards.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-[#e5e7eb] bg-white p-8 text-center">
        <p className="text-sm text-muted-foreground">{emptyMessage}</p>
        <Button asChild variant="secondary" className="mt-4 rounded-full">
          <Link href={backHref}>Back</Link>
        </Button>
      </div>
    );
  }

  async function handleSaveToggle() {
    if (!current) return;
    const cardId = current.id;
    const shouldSave = !savedCardIds.has(cardId);

    setSavedCardIds((prev) => {
      const next = new Set(prev);
      if (shouldSave) next.add(cardId);
      else next.delete(cardId);
      return next;
    });

    startSavingWord(async () => {
      if (shouldSave) {
        await saveFlashcardToMyWordsAction({ cardId });
      } else {
        await removeFlashcardFromMyWordsAction({ cardId });
      }
    });
  }

  function handleGrade(result: 'correct' | 'incorrect') {
    if (!current) return;
    const cardId = current.id;
    const deckId = current.deckId;

    setAttempted((value) => value + 1);
    if (result === 'correct') setCorrect((value) => value + 1);
    setRevealed(false);
    setIndex((value) => value + 1);

    startTransition(async () => {
      await saveFlashcardResultAction({ deckId, cardId, result });
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs text-muted-foreground">{deckTitle}</p>
          <p className="text-sm font-medium text-[#1f2937]">Card {progressLabel}</p>
        </div>
        <Button asChild variant="ghost" size="sm" className="rounded-full">
          <Link href={backHref}>Back</Link>
        </Button>
      </div>

      {finished ? (
        <div className="rounded-2xl border border-[#e5e7eb] bg-white p-6 text-center">
          <p className="text-sm text-muted-foreground">Session complete</p>
          <p className="mt-1 text-2xl font-semibold text-[#1f2937]">
            {accuracy != null ? `${accuracy}%` : '—'}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            {correct} correct out of {attempted}
          </p>
          <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-center">
            <Button
              type="button"
              onClick={() => {
                setIndex(0);
                setRevealed(false);
                setAttempted(0);
                setCorrect(0);
              }}
              className="rounded-full bg-[#7daf41] text-white hover:bg-[#6b9a39]"
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              Study again
            </Button>
            <Button asChild variant="secondary" className="rounded-full">
              <Link href={backHref}>Done</Link>
            </Button>
          </div>
        </div>
      ) : current ? (
        <>
          <div className="min-h-[280px] rounded-2xl border border-[#e5e7eb] bg-white p-5">
            {!revealed ? (
              <div className="flex h-full min-h-[240px] flex-col justify-between">
                <div className="text-center pt-6">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Front</p>
                  <p className="mt-3 text-3xl font-semibold text-[#1f2937] break-words">
                    {current.front}
                  </p>
                </div>
                <Button
                  type="button"
                  onClick={() => setRevealed(true)}
                  className="mt-4 rounded-full bg-[#429ead] text-white hover:bg-[#36899a]"
                >
                  Reveal answer
                </Button>
              </div>
            ) : (
              <div className="flex h-full min-h-[240px] flex-col justify-between">
                <div className="space-y-4">
                  <div className="text-center">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Back</p>
                    <p className="mt-2 text-2xl font-semibold text-[#1f2937] break-words">
                      {current.back}
                    </p>
                  </div>
                  {current.example && (
                    <div className="rounded-xl border border-[#e5e7eb] p-3">
                      <p className="text-xs text-muted-foreground">Example</p>
                      <p className="mt-1 text-sm text-[#1f2937]">{current.example}</p>
                    </div>
                  )}
                </div>
                <div className="mt-4 flex justify-center">
                  <Button
                    type="button"
                    variant="ghost"
                    className="rounded-full"
                    onClick={handleSaveToggle}
                    disabled={isSavingWord}
                  >
                    {currentIsSaved ? (
                      <>
                        <BookmarkCheck className="mr-2 h-4 w-4 text-[#7daf41]" />
                        Saved to My Words
                      </>
                    ) : (
                      <>
                        <Bookmark className="mr-2 h-4 w-4 text-[#b64b29]" />
                        Save to My Words
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>

          {revealed && (
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <Button
                type="button"
                onClick={() => handleGrade('correct')}
                disabled={isPending}
                className="rounded-full bg-[#7daf41] text-white hover:bg-[#6b9a39]"
              >
                I knew it
              </Button>
              <Button
                type="button"
                onClick={() => handleGrade('incorrect')}
                disabled={isPending}
                className="rounded-full"
                style={{ backgroundColor: 'var(--accent-brown, #b64b29)', color: '#ffffff' }}
              >
                I didn't
              </Button>
            </div>
          )}
        </>
      ) : null}
    </div>
  );
}

