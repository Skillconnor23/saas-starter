export const dynamic = 'force-dynamic';

import { requireRole } from '@/lib/auth/user';
import { StudentQuizList } from '@/components/learning/StudentQuizList';

export default async function LearningPage() {
  const user = await requireRole(['student']);

  return (
    <section className="flex-1">
      <StudentQuizList studentUserId={user.id} showIntro />
    </section>
  );
}
