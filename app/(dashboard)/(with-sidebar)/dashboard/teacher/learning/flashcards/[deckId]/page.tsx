export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { redirect } from 'next/navigation';
import { redirectWithLocale } from '@/lib/i18n/redirect';
import { ArrowLeft } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { requireRole } from '@/lib/auth/user';
import {
  addFlashcardCardAction,
  deleteFlashcardCardAction,
  setFlashcardDeckPublishedAction,
  updateFlashcardCardAction,
  updateFlashcardDeckAction,
} from '@/lib/actions/learning/flashcards';
import {
  getFlashcardDeckWithCards,
  listManageableFlashcardClasses,
  teacherCanManageFlashcardDeck,
} from '@/lib/db/queries/flashcards';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { GenerateVocabButton } from '@/components/learning/GenerateVocabButton';

type Props = {
  params: Promise<{ deckId: string }>;
  searchParams: Promise<{ error?: string }>;
};

export default async function TeacherFlashcardDeckDetailPage({
  params,
  searchParams,
}: Props) {
  const user = await requireRole(['teacher', 'admin', 'school_admin']);
  const { deckId } = await params;
  const { error } = await searchParams;
  const t = await getTranslations('teacher.flashcards');

  const [deckWithCards, classes] = await Promise.all([
    getFlashcardDeckWithCards(deckId),
    listManageableFlashcardClasses(user.id, user.platformRole),
  ]);

  if (!deckWithCards) {
    await redirectWithLocale('/dashboard/teacher/learning/flashcards');
  }

  if (
    user.platformRole === 'teacher' &&
    !(await teacherCanManageFlashcardDeck(deckId, user.id))
  ) {
    await redirectWithLocale('/dashboard/teacher/learning/flashcards');
  }

  const deck = deckWithCards!;
  const path = `/dashboard/teacher/learning/flashcards/${deckId}`;

  return (
    <section className="flex-1">
      <div className="mx-auto w-full max-w-4xl space-y-6">
        <Button variant="ghost" size="sm" asChild className="rounded-full">
          <Link href="/dashboard/teacher/learning/flashcards">
            <ArrowLeft className="mr-1 h-4 w-4" />
            {t('backToFlashcards')}
          </Link>
        </Button>

        <div>
          <h1 className="text-xl lg:text-2xl font-medium text-[#1f2937] tracking-tight">
            {deck.deck.title}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {t('cardsInDeck', { count: deck.cards.length })}
          </p>
        </div>

        {error && (
          <div className="rounded-xl border border-[#b64b29] px-4 py-2 text-sm text-[#b64b29]">
            {error}
          </div>
        )}

        <Card className="rounded-2xl border border-[#e5e7eb]">
          <CardHeader>
            <CardTitle>{t('deckDetails')}</CardTitle>
          </CardHeader>
          <CardContent>
            <form
              action={async (formData) => {
                'use server';
                const result = await updateFlashcardDeckAction(deckId, formData);
                if (result.error) {
                  redirect(`${path}?error=${encodeURIComponent(result.error)}`);
                }
                redirect(path);
              }}
              className="space-y-3"
            >
              <div>
                <label className="text-sm font-medium text-[#1f2937]">
                  {t('titleLabel')} <span className="text-[#b64b29]">*</span>
                </label>
                <input
                  name="title"
                  defaultValue={deck.deck.title}
                  required
                  className="mt-1 w-full rounded-xl border border-[#e5e7eb] px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-[#1f2937]">{t('descriptionLabel')}</label>
                <textarea
                  name="description"
                  rows={3}
                  defaultValue={deck.deck.description ?? ''}
                  className="mt-1 w-full rounded-xl border border-[#e5e7eb] px-3 py-2 text-sm"
                />
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-[#1f2937]">{t('scopeLabel')}</label>
                  <select
                    name="scope"
                    defaultValue={deck.deck.scope}
                    className="mt-1 w-full rounded-xl border border-[#e5e7eb] bg-white px-3 py-2 text-sm"
                  >
                    <option value="class">{t('scopeClass')}</option>
                    <option value="global">{t('global')}</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-[#1f2937]">{t('scopeClass')}</label>
                  <select
                    name="classId"
                    defaultValue={deck.deck.classId ?? ''}
                    className="mt-1 w-full rounded-xl border border-[#e5e7eb] bg-white px-3 py-2 text-sm"
                  >
                    <option value="">{t('selectClass')}</option>
                    {classes.map((row) => (
                      <option key={row.id} value={row.id}>
                        {row.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <Button
                type="submit"
                className="rounded-full bg-[#429ead] text-white hover:bg-[#36899a]"
              >
                {t('saveDeck')}
              </Button>
            </form>

            <form
              action={async () => {
                'use server';
                const result = await setFlashcardDeckPublishedAction(
                  deckId,
                  !deck.deck.isPublished
                );
                if (result.error) {
                  redirect(`${path}?error=${encodeURIComponent(result.error)}`);
                }
                redirect(path);
              }}
              className="mt-3"
            >
              <Button
                type="submit"
                className="rounded-full text-white"
                style={{
                  backgroundColor: deck.deck.isPublished ? '#b64b29' : '#7daf41',
                }}
              >
                {deck.deck.isPublished ? t('unpublish') : t('publish')}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border border-[#e5e7eb]">
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <CardTitle>{t('addCard')}</CardTitle>
              <GenerateVocabButton
                deckId={deckId}
                label={t('generateWithAI')}
              />
            </div>
          </CardHeader>
          <CardContent>
            <form
              action={async (formData) => {
                'use server';
                const result = await addFlashcardCardAction(deckId, formData);
                if (result.error) {
                  redirect(`${path}?error=${encodeURIComponent(result.error)}`);
                }
                redirect(path);
              }}
              className="space-y-3"
            >
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-[#1f2937]">
                    {t('frontLabel')} <span className="text-[#b64b29]">*</span>
                  </label>
                  <input
                    name="front"
                    required
                    className="mt-1 w-full rounded-xl border border-[#e5e7eb] px-3 py-2 text-sm"
                    placeholder={t('frontPlaceholder')}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-[#1f2937]">
                    {t('backLabel')} <span className="text-[#b64b29]">*</span>
                  </label>
                  <input
                    name="back"
                    required
                    className="mt-1 w-full rounded-xl border border-[#e5e7eb] px-3 py-2 text-sm"
                    placeholder={t('backPlaceholder')}
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-[#1f2937]">{t('exampleLabel')}</label>
                <textarea
                  name="example"
                  rows={2}
                  className="mt-1 w-full rounded-xl border border-[#e5e7eb] px-3 py-2 text-sm"
                  placeholder={t('examplePlaceholder')}
                />
              </div>
              <Button
                type="submit"
                className="rounded-full bg-[#7daf41] text-white hover:bg-[#6b9a39]"
              >
                {t('addCardButton')}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border border-[#e5e7eb]">
          <CardHeader>
            <CardTitle>{t('cards')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {deck.cards.length === 0 ? (
              <div className="rounded-xl border border-dashed border-[#e5e7eb] p-5 text-center">
                <p className="text-sm text-muted-foreground">{t('noCardsYet')}</p>
              </div>
            ) : (
              deck.cards.map((card) => (
                <div key={card.id} className="rounded-xl border border-[#e5e7eb] p-4">
                  <form
                    action={async (formData) => {
                      'use server';
                      const result = await updateFlashcardCardAction(deckId, card.id, formData);
                      if (result.error) {
                        redirect(`${path}?error=${encodeURIComponent(result.error)}`);
                      }
                      redirect(path);
                    }}
                    className="space-y-3"
                  >
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div>
                        <label className="text-xs font-medium text-muted-foreground">{t('frontLabel')}</label>
                        <input
                          name="front"
                          required
                          defaultValue={card.front}
                          className="mt-1 w-full rounded-xl border border-[#e5e7eb] px-3 py-2 text-sm"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-muted-foreground">{t('backLabel')}</label>
                        <input
                          name="back"
                          required
                          defaultValue={card.back}
                          className="mt-1 w-full rounded-xl border border-[#e5e7eb] px-3 py-2 text-sm"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground">{t('exampleLabel')}</label>
                      <textarea
                        name="example"
                        defaultValue={card.example ?? ''}
                        rows={2}
                        className="mt-1 w-full rounded-xl border border-[#e5e7eb] px-3 py-2 text-sm"
                      />
                    </div>
                    <Button
                      type="submit"
                      size="sm"
                      className="rounded-full bg-[#429ead] text-white hover:bg-[#36899a]"
                    >
                      {t('saveCard')}
                    </Button>
                  </form>
                  <form
                    action={async () => {
                      'use server';
                      const result = await deleteFlashcardCardAction(deckId, card.id);
                      if (result.error) {
                        redirect(`${path}?error=${encodeURIComponent(result.error)}`);
                      }
                      redirect(path);
                    }}
                    className="mt-2"
                  >
                    <Button
                      type="submit"
                      size="sm"
                      className="rounded-full text-white"
                      style={{ backgroundColor: 'var(--accent-brown, #b64b29)' }}
                    >
                      {t('remove')}
                    </Button>
                  </form>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

