'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { addQuestionMcqAction } from '@/lib/actions/quizzes';

type AddQuestionModalProps = {
  quizId: string;
  onClose: () => void;
};

export function AddQuestionModal({ quizId, onClose }: AddQuestionModalProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const t = useTranslations('quizzes.addQuestion');

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setPending(true);
    const form = e.currentTarget;
    const formData = new FormData(form);
    const result = await addQuestionMcqAction(quizId, formData);
    setPending(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    router.refresh();
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg rounded-2xl border border-gray-200 bg-white p-6 shadow-lg">
        <h3 className="text-lg font-medium text-[#1f2937] mb-4">{t('title')}</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-medium text-[#1f2937]">
              {t('promptLabel')} <span className="text-red-500">*</span>
            </label>
            <textarea
              name="prompt"
              required
              rows={3}
              className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
              placeholder={t('promptPlaceholder')}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-[#1f2937]">
              {t('optionsLabel')}
            </label>
            {['A', 'B', 'C', 'D'].map((letter, i) => (
              <div key={letter} className="flex items-center gap-3">
                <span className="w-6 text-sm font-medium text-muted-foreground">
                  {letter}.
                </span>
                <input
                  name={`option${letter}`}
                  className="flex-1 rounded-full border border-gray-200 px-3 py-2 text-sm"
                  placeholder={t('optionPlaceholder', { letter })}
                />
                <label className="flex items-center gap-1 text-sm whitespace-nowrap">
                  <input
                    type="radio"
                    name="correctIndex"
                    value={i}
                    required
                    className="rounded-full"
                  />
                  {t('correctLabel')}
                </label>
              </div>
            ))}
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-2 justify-end pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              className="rounded-full"
            >
              {t('cancel')}
            </Button>
            <Button
              type="submit"
              disabled={pending}
              className="rounded-full bg-[#7daf41] text-white hover:border-[#7daf41] hover:bg-[#6c9b38]"
            >
              {pending ? t('saving') : t('saveQuestion')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
