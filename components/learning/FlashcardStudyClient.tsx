'use client';

import Link from 'next/link';
import { useMemo, useState, useTransition } from 'react';
import { Bookmark, BookmarkCheck, Check, RotateCcw, X } from 'lucide-react';
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
          <div className="mx-auto w-full max-w-2xl">
            <div
              role="button"
              tabIndex={0}
              onClick={() => {
                if (!revealed) setRevealed(true);
              }}
              onKeyDown={(event) => {
                if (revealed) return;
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  setRevealed(true);
                }
              }}
              className={`relative flex min-h-[360px] cursor-pointer select-none flex-col items-center justify-center overflow-hidden rounded-3xl px-6 py-10 text-center shadow-[0_18px_45px_rgba(0,0,0,0.2)] transition-all duration-500 ease-out hover:scale-[1.01] ${
                revealed
                  ? 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white'
                  : 'bg-gradient-to-br from-emerald-500 to-green-600 text-white'
              }`}
              aria-label={revealed ? 'Flashcard revealed' : 'Flashcard front. Press Enter or Space to reveal.'}
            >
              {revealed && (
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    void handleSaveToggle();
                  }}
                  disabled={isSavingWord}
                  aria-label={currentIsSaved ? 'Remove from saved words' : 'Save to my words'}
                  className="absolute right-4 top-4 inline-flex h-11 w-11 items-center justify-center rounded-full bg-white/95 text-[#1f2937] shadow-[0_8px_24px_rgba(0,0,0,0.2)] transition-transform duration-200 hover:scale-105 active:scale-95 disabled:opacity-70"
                >
                  {currentIsSaved ? (
                    <BookmarkCheck className="h-5 w-5 text-[#7daf41]" />
                  ) : (
                    <Bookmark className="h-5 w-5 text-[#b64b29]" />
                  )}
                </button>
              )}

              {!revealed ? (
                <>
                  <p className="text-xs uppercase tracking-[0.2em] text-white/85">Vocabulary</p>
                  <p className="mt-5 text-4xl font-bold leading-tight sm:text-5xl break-words">
                    {current.front}
                  </p>
                </>
              ) : (
                <div className="max-w-xl space-y-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-white/85">Definition</p>
                  <p className="text-3xl font-semibold leading-snug sm:text-4xl break-words">
                    {current.back}
                  </p>
                  {current.example && (
                    <p className="mx-auto max-w-lg text-base text-white/95 sm:text-lg">
                      {current.example}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          {revealed && (
            <div className="flex items-center justify-center gap-5 pt-1">
              <button
                type="button"
                onClick={() => handleGrade('correct')}
                disabled={isPending}
                aria-label="Mark correct"
                className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-white text-[#7daf41] shadow-[0_8px_24px_rgba(0,0,0,0.15)] transition-transform duration-200 hover:scale-105 active:scale-95 disabled:opacity-60"
              >
                <Check className="h-7 w-7" />
              </button>
              <button
                type="button"
                onClick={() => handleGrade('incorrect')}
                disabled={isPending}
                aria-label="Mark wrong"
                className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-white text-[#b64b29] shadow-[0_8px_24px_rgba(0,0,0,0.15)] transition-transform duration-200 hover:scale-105 active:scale-95 disabled:opacity-60"
              >
                <X className="h-7 w-7" />
              </button>
            </div>
          )}
        </>
      ) : null}
    </div>
  );
}

