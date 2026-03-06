export const dynamic = 'force-dynamic';

import { createClassAction } from '@/lib/actions/education';
import { requirePermission } from '@/lib/auth/permissions';
import { CreateClassForm } from './create-class-form';

export default async function NewClassPage() {
  await requirePermission('classes:write');
  return (
    <section className="flex-1 p-4 lg:p-8">
      <h1 className="text-lg lg:text-2xl font-medium mb-6">Create class</h1>
      <CreateClassForm action={createClassAction} />
    </section>
  );
}
