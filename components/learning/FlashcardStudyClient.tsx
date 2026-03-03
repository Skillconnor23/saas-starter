'use client';

import Link from 'next/link';
import { useState, useTransition } from 'react';
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
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [attempted, setAttempted] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [isPending, startTransition] = useTransition();

  const current = cards[index] ?? null;
  const finished = cards.length > 0 && index >= cards.length;
  const accuracy = attempted > 0 ? Math.round((correct / attempted) * 100) : null;
  const progressLabel = `${Math.min(index + 1, cards.length)} of ${cards.length}`;

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

  function handleGrade(result: 'correct' | 'incorrect') {
    if (!current) return;
    const cardId = current.id;
    const deckId = current.deckId;

    setAttempted((value) => value + 1);
    if (result === 'correct') setCorrect((value) => value + 1);
    setFlipped(false);
    setIndex((value) => value + 1);

    startTransition(async () => {
      await saveFlashcardResultAction({ deckId, cardId, result });
    });
  }

  function handleWrong(e: React.MouseEvent<HTMLButtonElement>) {
    e.stopPropagation();
    handleGrade('incorrect');
  }

  function handleCorrect(e: React.MouseEvent<HTMLButtonElement>) {
    e.stopPropagation();
    handleGrade('correct');
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
                setFlipped(false);
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
        <Flashcard
          word={current.front}
          definition={current.back}
          example={current.example}
          flipped={flipped}
          onFlip={() => setFlipped((v) => !v)}
          onCorrect={handleCorrect}
          onWrong={handleWrong}
          disabled={isPending}
        />
      ) : null}
    </div>
  );
}

type FlashcardProps = {
  word: string;
  definition: string;
  example?: string | null;
  flipped: boolean;
  onFlip: () => void;
  onCorrect: (e: React.MouseEvent<HTMLButtonElement>) => void;
  onWrong: (e: React.MouseEvent<HTMLButtonElement>) => void;
  disabled?: boolean;
};

function Flashcard({
  word,
  definition,
  example,
  flipped,
  onFlip,
  onCorrect,
  onWrong,
  disabled = false,
}: FlashcardProps) {
  return (
    <div className="w-full flex justify-center">
      <div className="w-full max-w-2xl" style={{ perspective: '1200px' }}>
        <div
          role="button"
          tabIndex={0}
          onClick={() => {
            if (!disabled) onFlip();
          }}
          onKeyDown={(e) => {
            if (disabled) return;
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onFlip();
            }
          }}
          className="relative h-[360px] w-full cursor-pointer select-none transition-transform duration-300 hover:scale-[1.01]"
        >
          <div
            className="relative h-full w-full transition-transform duration-500 ease-out"
            style={{
              transformStyle: 'preserve-3d',
              transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
            }}
          >
            <div
              className="absolute inset-0 rounded-3xl shadow-2xl bg-gradient-to-br from-emerald-500 to-green-600"
              style={{ backfaceVisibility: 'hidden' }}
            >
              <FaceContent text={word} onWrong={onWrong} onCorrect={onCorrect} />
            </div>

            <div
              className="absolute inset-0 rounded-3xl shadow-2xl bg-gradient-to-br from-blue-500 to-indigo-600"
              style={{
                transform: 'rotateY(180deg)',
                transformStyle: 'preserve-3d',
                backfaceVisibility: 'hidden',
              }}
            >
              <FaceContent
                text={definition}
                example={example}
                onWrong={onWrong}
                onCorrect={onCorrect}
              />
            </div>
          </div>

          <div className="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 text-white/80 text-sm">
            Click card to flip
          </div>
        </div>
      </div>
    </div>
  );
}

function FaceContent({
  text,
  example,
  onWrong,
  onCorrect,
}: {
  text: string;
  example?: string | null;
  onWrong: (e: React.MouseEvent<HTMLButtonElement>) => void;
  onCorrect: (e: React.MouseEvent<HTMLButtonElement>) => void;
}) {
  return (
    <div className="relative h-full w-full flex items-center justify-center px-10">
      <div className="text-center">
        <div className="text-white text-3xl md:text-4xl font-semibold leading-tight break-words">
          {text}
        </div>
        {example && <p className="mt-3 text-white/90 text-base">{example}</p>}
      </div>

      <div className="absolute bottom-5 right-5 flex gap-3">
        <IconButton ariaLabel="Wrong" onClick={onWrong}>
          <X size={22} className="text-white" />
        </IconButton>
        <IconButton ariaLabel="Correct" onClick={onCorrect}>
          <Check size={22} className="text-white" />
        </IconButton>
      </div>
    </div>
  );
}

function IconButton({
  children,
  onClick,
  ariaLabel,
}: {
  children: React.ReactNode;
  onClick: (e: React.MouseEvent<HTMLButtonElement>) => void;
  ariaLabel: string;
}) {
  return (
    <button
      aria-label={ariaLabel}
      onClick={onClick}
      className="h-11 w-11 rounded-full bg-white/15 backdrop-blur border border-white/20 shadow-lg flex items-center justify-center transition hover:bg-white/25 hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-white/50"
      type="button"
    >
      {children}
    </button>
  );
}

