export const dynamic = 'force-dynamic';

import { getLocale } from 'next-intl/server';
import { requireAuth } from '@/lib/auth/user';
import { getQuizResultsForStudentProfile } from '@/lib/db/queries/quizzes';
import { ProfileCard } from './profile-card';
import { StudentAssessmentsSection } from '../students/StudentAssessmentsSection';
import { MonthlyReportCard } from '../students/MonthlyReportCard';

function formatRole(role: string | null): string {
  if (!role) return 'User';
  if (role === 'school_admin') return 'School Admin';
  return role.charAt(0).toUpperCase() + role.slice(1);
}

export default async function ProfilePage() {
  const user = await requireAuth();
  const isStudent = user.platformRole === 'student';
  const assessments = isStudent ? await getQuizResultsForStudentProfile(user.id) : null;
  const locale = await getLocale();
  const withLocalePrefix = (path: string) =>
    `/${locale}${path.startsWith('/') ? path : `/${path}`}`;

  return (
    <section className="flex-1 p-4 lg:p-8">
      <div className="mx-auto max-w-2xl">
        <h1 className="mb-6 text-lg font-medium lg:text-2xl">Profile</h1>
        <ProfileCard
          user={{
            id: user.id,
            name: user.name,
            email: user.email,
            avatarUrl: user.avatarUrl ?? undefined,
          }}
          roleLabel={formatRole(user.platformRole)}
        />
        {isStudent && (
          <>
            <MonthlyReportCard studentId={user.id} studentName={user.name ?? user.email} />
            {assessments && (
              <StudentAssessmentsSection
                data={assessments}
                studentId={user.id}
                viewerRole="student"
                quizLinkBase={withLocalePrefix('/learning')}
              />
            )}
          </>
        )}
      </div>
    </section>
  );
}
