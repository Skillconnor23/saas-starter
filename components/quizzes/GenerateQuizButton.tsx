'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { GenerateQuizModal } from './GenerateQuizModal';
import { Sparkles } from 'lucide-react';

type Props = {
  quizId: string;
  label: string;
};

export function GenerateQuizButton({ quizId, label }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        type="button"
        variant="outline"
        onClick={() => setOpen(true)}
        className="rounded-full border-[#429ead] text-[#429ead] hover:bg-[#429ead]/10"
      >
        <Sparkles className="mr-2 h-4 w-4" />
        {label}
      </Button>
      {open && (
        <GenerateQuizModal quizId={quizId} onClose={() => setOpen(false)} />
      )}
    </>
  );
}
