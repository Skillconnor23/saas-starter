'use client';

import Link from 'next/link';
import { useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { Check, RotateCcw, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { saveFlashcardResultAction } from '@/lib/actions/learning/flashcards';

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
  const t = useTranslations('learning');
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [attempted, setAttempted] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [isPending, startTransition] = useTransition();

  const current = cards[index] ?? null;
  const finished = cards.length > 0 && index >= cards.length;
  const accuracy = attempted > 0 ? Math.round((correct / attempted) * 100) : null;
  const progressLabel = t('cardOf', {
    current: Math.min(index + 1, cards.length),
    total: cards.length,
  });

  if (cards.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-[#e5e7eb] bg-white p-8 text-center">
        <p className="text-sm text-muted-foreground">{emptyMessage}</p>
        <Button asChild variant="secondary" className="mt-4 rounded-full">
          <Link href={backHref}>{t('back')}</Link>
        </Button>
      </div>
    );
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
          <p className="text-sm font-medium text-[#1f2937]">{progressLabel}</p>
        </div>
        <Button asChild variant="ghost" size="sm" className="rounded-full">
          <Link href={backHref}>{t('back')}</Link>
        </Button>
      </div>

      {finished ? (
        <div className="rounded-2xl border border-[#e5e7eb] bg-white p-6 text-center">
          <p className="text-sm text-muted-foreground">{t('sessionComplete')}</p>
          <p className="mt-1 text-2xl font-semibold text-[#1f2937]">
            {accuracy != null ? `${accuracy}%` : '—'}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            {t('correctOutOf', { correct, attempted })}
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
              {t('studyAgain')}
            </Button>
            <Button asChild variant="secondary" className="rounded-full">
              <Link href={backHref}>{t('done')}</Link>
            </Button>
          </div>
        </div>
      ) : current ? (
        <Flashcard
          word={current.front}
          definition={current.back}
          example={current.example}
          revealed={revealed}
          onToggle={() => setRevealed((v) => !v)}
          onAnswer={(isCorrect) => handleGrade(isCorrect ? 'correct' : 'incorrect')}
          disabled={isPending}
          wrongAriaLabel={t('wrongAria')}
          correctAriaLabel={t('correctAria')}
        />
      ) : null}
    </div>
  );
}

type FlashcardProps = {
  word: string;
  definition: string;
  example?: string | null;
  revealed: boolean;
  onToggle: () => void;
  onAnswer: (correct: boolean) => void;
  disabled?: boolean;
};

function Flashcard({
  word,
  definition,
  example,
  revealed,
  onToggle,
  onAnswer,
  disabled = false,
  wrongAriaLabel,
  correctAriaLabel,
}: FlashcardProps & { wrongAriaLabel: string; correctAriaLabel: string }) {
  return (
    <div className="w-full max-w-3xl mx-auto px-6 py-10">
      <div
        role="button"
        tabIndex={0}
        onClick={() => {
          if (!disabled) onToggle();
        }}
        onKeyDown={(e) => {
          if (disabled) return;
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onToggle();
          }
        }}
        className="w-full min-h-[380px] rounded-3xl shadow-xl transition-all duration-300 flex items-center justify-center text-center cursor-pointer px-10 py-14"
        style={{
          backgroundColor: revealed ? '#429ead' : '#7daf41',
        }}
      >
        {!revealed ? (
          <h2 className="text-5xl font-semibold text-white tracking-tight break-words">{word}</h2>
        ) : (
          <div className="space-y-6 text-white max-w-2xl">
            <p className="text-3xl font-medium leading-snug break-words">{definition}</p>
            {example && <p className="text-base opacity-90">{example}</p>}
          </div>
        )}
      </div>

      <div className="flex justify-center gap-8 mt-8">
        <button
          type="button"
          disabled={disabled}
          onClick={(e) => {
            e.stopPropagation();
            onAnswer(false);
          }}
          className="w-16 h-16 rounded-full flex items-center justify-center shadow-lg transition hover:scale-110 disabled:opacity-60"
          style={{ backgroundColor: '#b64b29' }}
          aria-label={wrongAriaLabel}
        >
          <X className="w-7 h-7 text-white" />
        </button>

        <button
          type="button"
          disabled={disabled}
          onClick={(e) => {
            e.stopPropagation();
            onAnswer(true);
          }}
          className="w-16 h-16 rounded-full flex items-center justify-center shadow-lg transition hover:scale-110 disabled:opacity-60"
          style={{ backgroundColor: '#7daf41' }}
          aria-label={correctAriaLabel}
        >
          <Check className="w-7 h-7 text-white" />
        </button>
      </div>
    </div>
  );
}

