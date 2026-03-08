import Link from 'next/link';
import { getClassesForHomeworkCreate } from '@/lib/actions/homework';
import { CreateHomeworkForm } from './create-homework-form';
import { GenerateHomeworkButton } from '@/components/learning/GenerateHomeworkButton';

export const dynamic = 'force-dynamic';

export default async function CreateHomeworkPage() {
  const classes = await getClassesForHomeworkCreate();

  return (
    <section className="flex-1">
      <div className="mb-6">
        <Link
          href="/dashboard/homework"
          className="text-sm text-muted-foreground hover:text-[#1f2937]"
        >
          ← Back
        </Link>
      </div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-lg lg:text-2xl font-medium text-[#1f2937]">
          Create homework
        </h1>
        <GenerateHomeworkButton classes={classes} label="Generate with AI" />
      </div>
      <CreateHomeworkForm classes={classes} />
    </section>
  );
}
