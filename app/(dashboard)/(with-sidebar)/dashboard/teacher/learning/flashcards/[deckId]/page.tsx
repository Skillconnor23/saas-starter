export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
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

  const [deckWithCards, classes] = await Promise.all([
    getFlashcardDeckWithCards(deckId),
    listManageableFlashcardClasses(user.id, user.platformRole),
  ]);

  if (!deckWithCards) {
    redirect('/dashboard/teacher/learning/flashcards');
  }

  if (
    user.platformRole === 'teacher' &&
    !(await teacherCanManageFlashcardDeck(deckId, user.id))
  ) {
    redirect('/dashboard/teacher/learning/flashcards');
  }

  const path = `/dashboard/teacher/learning/flashcards/${deckId}`;

  return (
    <section className="flex-1">
      <div className="mx-auto w-full max-w-4xl space-y-6">
        <Button variant="ghost" size="sm" asChild className="rounded-full">
          <Link href="/dashboard/teacher/learning/flashcards">
            <ArrowLeft className="mr-1 h-4 w-4" />
            Back to Flashcards
          </Link>
        </Button>

        <div>
          <h1 className="text-xl lg:text-2xl font-medium text-[#1f2937] tracking-tight">
            {deckWithCards.deck.title}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {deckWithCards.cards.length} cards in this deck.
          </p>
        </div>

        {error && (
          <div className="rounded-xl border border-[#b64b29] px-4 py-2 text-sm text-[#b64b29]">
            {error}
          </div>
        )}

        <Card className="rounded-2xl border border-[#e5e7eb]">
          <CardHeader>
            <CardTitle>Deck details</CardTitle>
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
                  Title <span className="text-[#b64b29]">*</span>
                </label>
                <input
                  name="title"
                  defaultValue={deckWithCards.deck.title}
                  required
                  className="mt-1 w-full rounded-xl border border-[#e5e7eb] px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-[#1f2937]">Description</label>
                <textarea
                  name="description"
                  rows={3}
                  defaultValue={deckWithCards.deck.description ?? ''}
                  className="mt-1 w-full rounded-xl border border-[#e5e7eb] px-3 py-2 text-sm"
                />
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-[#1f2937]">Scope</label>
                  <select
                    name="scope"
                    defaultValue={deckWithCards.deck.scope}
                    className="mt-1 w-full rounded-xl border border-[#e5e7eb] bg-white px-3 py-2 text-sm"
                  >
                    <option value="class">Class</option>
                    <option value="global">Global</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-[#1f2937]">Class</label>
                  <select
                    name="classId"
                    defaultValue={deckWithCards.deck.classId ?? ''}
                    className="mt-1 w-full rounded-xl border border-[#e5e7eb] bg-white px-3 py-2 text-sm"
                  >
                    <option value="">Select class</option>
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
                Save deck
              </Button>
            </form>

            <form
              action={async () => {
                'use server';
                const result = await setFlashcardDeckPublishedAction(
                  deckId,
                  !deckWithCards.deck.isPublished
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
                  backgroundColor: deckWithCards.deck.isPublished ? '#b64b29' : '#7daf41',
                }}
              >
                {deckWithCards.deck.isPublished ? 'Unpublish' : 'Publish'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border border-[#e5e7eb]">
          <CardHeader>
            <CardTitle>Add card</CardTitle>
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
                    Front <span className="text-[#b64b29]">*</span>
                  </label>
                  <input
                    name="front"
                    required
                    className="mt-1 w-full rounded-xl border border-[#e5e7eb] px-3 py-2 text-sm"
                    placeholder="English word or phrase"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-[#1f2937]">
                    Back <span className="text-[#b64b29]">*</span>
                  </label>
                  <input
                    name="back"
                    required
                    className="mt-1 w-full rounded-xl border border-[#e5e7eb] px-3 py-2 text-sm"
                    placeholder="Meaning or simple definition"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-[#1f2937]">Example</label>
                <textarea
                  name="example"
                  rows={2}
                  className="mt-1 w-full rounded-xl border border-[#e5e7eb] px-3 py-2 text-sm"
                  placeholder="Optional sentence example"
                />
              </div>
              <Button
                type="submit"
                className="rounded-full bg-[#7daf41] text-white hover:bg-[#6b9a39]"
              >
                Add card
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border border-[#e5e7eb]">
          <CardHeader>
            <CardTitle>Cards</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {deckWithCards.cards.length === 0 ? (
              <div className="rounded-xl border border-dashed border-[#e5e7eb] p-5 text-center">
                <p className="text-sm text-muted-foreground">No cards yet.</p>
              </div>
            ) : (
              deckWithCards.cards.map((card) => (
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
                        <label className="text-xs font-medium text-muted-foreground">Front</label>
                        <input
                          name="front"
                          required
                          defaultValue={card.front}
                          className="mt-1 w-full rounded-xl border border-[#e5e7eb] px-3 py-2 text-sm"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-muted-foreground">Back</label>
                        <input
                          name="back"
                          required
                          defaultValue={card.back}
                          className="mt-1 w-full rounded-xl border border-[#e5e7eb] px-3 py-2 text-sm"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground">Example</label>
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
                      Save card
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
                      Remove
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

