export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { redirect } from 'next/navigation';
import { requireRole } from '@/lib/auth/user';
import {
  createFlashcardDeckAction,
  setFlashcardDeckPublishedAction,
} from '@/lib/actions/learning/flashcards';
import {
  listFlashcardDecksForManager,
  listManageableFlashcardClasses,
} from '@/lib/db/queries/flashcards';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BookMarked } from 'lucide-react';

type Props = {
  searchParams: Promise<{ error?: string }>;
};

export default async function TeacherFlashcardsPage({ searchParams }: Props) {
  const user = await requireRole(['teacher', 'admin', 'school_admin']);
  const { error } = await searchParams;

  const [classes, decks] = await Promise.all([
    listManageableFlashcardClasses(user.id, user.platformRole),
    listFlashcardDecksForManager(user.id, user.platformRole),
  ]);

  return (
    <section className="flex-1">
      <div className="mx-auto w-full max-w-4xl space-y-6">
        <div>
          <h1 className="text-xl lg:text-2xl font-medium text-[#1f2937] tracking-tight">
            Flashcards
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Create decks, add cards, and publish them to students.
          </p>
        </div>

        {error && (
          <div className="rounded-xl border border-[#b64b29] px-4 py-2 text-sm text-[#b64b29]">
            {error}
          </div>
        )}

        <Card className="rounded-2xl border border-[#e5e7eb]">
          <CardHeader>
            <CardTitle>Create new deck</CardTitle>
          </CardHeader>
          <CardContent>
            <form
              action={async (formData) => {
                'use server';
                const result = await createFlashcardDeckAction(formData);
                if (result.error) {
                  redirect(
                    `/dashboard/teacher/learning/flashcards?error=${encodeURIComponent(result.error)}`
                  );
                }
                if (!result.deckId) {
                  redirect(
                    '/dashboard/teacher/learning/flashcards?error=Failed%20to%20create%20deck'
                  );
                }
                redirect(`/dashboard/teacher/learning/flashcards/${result.deckId}`);
              }}
              className="grid grid-cols-1 gap-3"
            >
              <div>
                <label className="text-sm font-medium text-[#1f2937]">
                  Title <span className="text-[#b64b29]">*</span>
                </label>
                <input
                  type="text"
                  name="title"
                  required
                  className="mt-1 w-full rounded-xl border border-[#e5e7eb] px-3 py-2 text-sm"
                  placeholder="e.g. Week 5 Vocabulary"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-[#1f2937]">Description</label>
                <textarea
                  name="description"
                  rows={3}
                  className="mt-1 w-full rounded-xl border border-[#e5e7eb] px-3 py-2 text-sm"
                  placeholder="Optional note for students."
                />
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-[#1f2937]">Scope</label>
                  <select
                    name="scope"
                    defaultValue="class"
                    className="mt-1 w-full rounded-xl border border-[#e5e7eb] bg-white px-3 py-2 text-sm"
                  >
                    <option value="class">Class</option>
                    <option value="global">Global</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-[#1f2937]">Class (for class scope)</label>
                  <select
                    name="classId"
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
                className="rounded-full bg-[#7daf41] text-white hover:bg-[#6b9a39]"
              >
                Create deck
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border border-[#e5e7eb]">
          <CardHeader>
            <CardTitle>Your decks</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {decks.length === 0 ? (
              <div className="rounded-xl border border-dashed border-[#e5e7eb] p-6 text-center">
                <BookMarked className="mx-auto h-6 w-6 text-muted-foreground" />
                <p className="mt-2 text-sm text-muted-foreground">No decks yet.</p>
              </div>
            ) : (
              decks.map((deck) => (
                <div key={deck.id} className="rounded-xl border border-[#e5e7eb] bg-white p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-medium text-[#1f2937]">{deck.title}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {deck.cardCount} cards ·{' '}
                        {deck.scope === 'global' ? 'Global' : deck.className ?? 'Class deck'}
                      </p>
                      <p className="text-xs mt-1">
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 ${
                            deck.isPublished ? 'bg-[#7daf41] text-white' : 'bg-[#429ead] text-white'
                          }`}
                        >
                          {deck.isPublished ? 'Published' : 'Draft'}
                        </span>
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        asChild
                        size="sm"
                        className="rounded-full bg-[#429ead] text-white hover:bg-[#36899a]"
                      >
                        <Link href={`/dashboard/teacher/learning/flashcards/${deck.id}`}>
                          Manage
                        </Link>
                      </Button>
                      <form
                        action={async () => {
                          'use server';
                          const result = await setFlashcardDeckPublishedAction(
                            deck.id,
                            !deck.isPublished
                          );
                          if (result.error) {
                            redirect(
                              `/dashboard/teacher/learning/flashcards?error=${encodeURIComponent(result.error)}`
                            );
                          }
                        }}
                      >
                        <Button
                          type="submit"
                          size="sm"
                          className="rounded-full"
                          style={{
                            backgroundColor: deck.isPublished ? '#b64b29' : '#7daf41',
                            color: '#ffffff',
                          }}
                        >
                          {deck.isPublished ? 'Unpublish' : 'Publish'}
                        </Button>
                      </form>
                    </div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

