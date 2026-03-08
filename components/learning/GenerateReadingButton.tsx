'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { GenerateReadingModal } from './GenerateReadingModal';
import { Sparkles } from 'lucide-react';

type Props = {
  classes: { id: string; name: string }[];
  label?: string;
};

export function GenerateReadingButton({ classes, label = 'Generate with AI' }: Props) {
  const [open, setOpen] = useState(false);

  if (classes.length === 0) return null;

  return (
    <>
      <Button
        type="button"
        variant="outline"
        onClick={() => setOpen(true)}
        className="min-h-10 rounded-full border-[#429ead] text-[#429ead] hover:bg-[#429ead]/10 hover:text-[#429ead]"
      >
        <Sparkles className="mr-2 h-4 w-4" />
        {label}
      </Button>
      {open && <GenerateReadingModal classes={classes} onClose={() => setOpen(false)} />}
    </>
  );
}
