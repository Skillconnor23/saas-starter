'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { AddQuestionModal } from './AddQuestionModal';

type AddQuestionButtonProps = {
  quizId: string;
};

export function AddQuestionButton({ quizId }: AddQuestionButtonProps) {
  const [open, setOpen] = useState(false);
  const t = useTranslations('quizzes.addQuestion');
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full rounded-full bg-[#7daf41] px-4 py-2 text-sm font-medium text-white hover:border-[#7daf41] hover:bg-[#6c9b38] transition-colors"
      >
        {t('title')}
      </button>
      {open && (
        <AddQuestionModal
          quizId={quizId}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
